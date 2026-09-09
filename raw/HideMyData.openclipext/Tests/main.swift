import Foundation

var passed = 0
func check(_ condition: @autoclosure () -> Bool, _ name: String) {
    guard condition() else { fatalError("FAIL: \(name)") }
    passed += 1
    print("PASS: \(name)")
}
let engine = try Engine(url: URL(fileURLWithPath: CommandLine.arguments[1]))
check(engine.patterns.count == 43, "all 43 HideMyData patterns loaded")
let fixtures = [
    "email": "hello@example.com", "phone": "+1 202 555 0147", "IBAN": "PT50 0002 0123 1234 5678 9015 4",
    "card": "4111 1111 1111 1111", "NIF": "NIF: 123456789", "postal": "1200-195", "SSN": "123-45-6789",
    "IP": "192.0.2.10", "MAC": "00:1A:2B:3C:4D:5E", "GitHub token": "ghp_" + String(repeating: "a", count: 36),
    "Ethereum": "0x" + String(repeating: "a", count: 40), "Polish bank": "12 1234 1234 1234 1234 1234 1234",
    "Portuguese address": "Rua Exemplo 1", "Spanish address": "Calle Ejemplo 1", "PESEL": "PESEL: 12345678901"
]
for (name, value) in fixtures {
    let r = try engine.redact(value, rules: [], names: false)
    check(!r.text.contains(value) && !r.spans.isEmpty, name)
}
let repeated = try engine.redact("😀 hello@example.com\nhello@example.com", rules: [], names: false)
check(repeated.text == "😀 [REDACTED_EMAIL_1]\n[REDACTED_EMAIL_1]", "Unicode offsets and consistent tokens")
let phoneLine = try engine.redact("+1 202 555 0147.\nNext line", rules: [], names: false)
check(phoneLine.text == "[REDACTED_PHONE_1].\nNext line", "phone redaction preserves punctuation and line breaks")
let overlap = Engine.render("ABCDEFGHIJK tail", spans: [Span(range: NSRange(location: 0, length: 6), kind: "NAME"), Span(range: NSRange(location: 4, length: 7), kind: "CUSTOM")])
check(overlap.text == "[REDACTED_CUSTOM_1] tail", "overlapping ranges never leak their suffix")
let literal = try engine.redact("A+B (test) and a+b\n(test)", rules: [Rule(value: "A+B (test)", isRegex: false)], names: false)
check(literal.text == "[REDACTED_CUSTOM_1] and [REDACTED_CUSTOM_1]", "literal metacharacters, case and flexible whitespace")
let custom = try engine.redact("CLIENT-0042 and CLIENT-9999", rules: [Rule(value: #"CLIENT-\d{4}"#, isRegex: true)], names: false)
check(!custom.text.contains("CLIENT-"), "custom regex redacts every match")
let clean = try engine.redact("The meeting went well.", rules: [], names: false)
check(clean.text == "The meeting went well." && clean.spans.isEmpty, "no-match text remains unchanged")
do { _ = try Engine.regex(Rule(value: "[", isRegex: true)); fatalError("invalid regex accepted") }
catch { check(true, "invalid regex rejected") }
let zero = try Engine.matches(Engine.regex(Rule(value: "^", isRegex: true)), text: "abc", name: "zero")
check(zero.isEmpty, "zero-length matches do not claim redactions")
do { _ = try engine.redact(String(repeating: "x", count: 50001), rules: []); fatalError("oversized input accepted") }
catch { check(true, "oversized selection rejected") }
let started = Date()
do {
    _ = try Engine.matches(Engine.regex(Rule(value: "(a+)+$", isRegex: true)), text: String(repeating: "a", count: 10000) + "!", name: "custom")
    fatalError("catastrophic regex was not stopped")
} catch { check(Date().timeIntervalSince(started) < 3, "pathological regex interrupted safely") }
let names = try engine.redact("Alice Smith met Bob Johnson in London.", rules: [])
check(!names.text.contains("Alice Smith") && !names.text.contains("London"), "on-device name and place detection")
let dir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
defer { try? FileManager.default.removeItem(at: dir) }
let store = RuleStore(url: dir.appendingPathComponent("rules.json"))
let saved = Rule(value: "Private Name", isRegex: false, remembered: true)
try store.save([saved, Rule(value: "One time", isRegex: false)])
let loaded = try store.load()
check(loaded == [saved], "only explicitly remembered rules persist")
let permissions = try FileManager.default.attributesOfItem(atPath: store.url.path)[.posixPermissions] as! NSNumber
check(permissions.intValue == 0o600, "saved rules have private file permissions")
try store.save([])
let afterRemoval = try store.load()
check(afterRemoval.isEmpty, "removed saved rules stay removed")

let address = "Example RDC\n9000 N FM 1234\nSuite# 999\nExampletown TX 00000"
let before = "Hello, Alice\n\nThis is a synthetic test document.\n\n"
let after = "\n\nPlease send the sample details.\n\nThis paragraph must remain unchanged.\n\nThank you,"
for newline in ["\n", "\r\n"] {
    let sample = (before + address + after).replacingOccurrences(of: "\n", with: newline)
    for detectNames in [false, true] {
        let redacted = try engine.redact(sample, rules: [], names: detectNames)
        check(!redacted.text.contains("9000") && !redacted.text.contains("Suite#") && !redacted.text.contains("00000") && !redacted.text.contains("Example RDC"), "entire US address block, names=\(detectNames), CRLF=\(newline == "\r\n")")
        check(redacted.text.contains("Please send the sample details."), "following prose preserved")
    }
}
let blocks = try Engine.addressBlocks(before + address + after)
check(blocks.count == 1 && ((before + address + after) as NSString).substring(with: blocks[0].range) == address, "block includes facility, street, suite and city only")
let otherAddress = try engine.redact("8000 Example Street\nApt 4B\nSampletown TX 00000\n\nPlease confirm.", rules: [], names: false)
check(otherAddress.text == "[REDACTED_ADDRESS_1]\n\nPlease confirm.", "ordinary US street and apartment block")
let separated = try Engine.addressBlocks("8000 Example Street\n\nSampletown TX 00000")
check(separated.isEmpty, "blank paragraph boundary not crossed")
let prose = try engine.redact("Exampletown TX 00000\n\nPlease send the details.", rules: [], names: false)
check(prose.text.contains("\n\nPlease send the details."), "ZIP cannot eat next paragraph as a European city")
let restoreText = "😀 hello@example.com and other@example.com"
let restoreRange = (restoreText as NSString).range(of: "hello@example.com")
let restoredEmail = try engine.redact(restoreText, rules: [], names: false, restored: [restoreRange])
check(restoredEmail.text == "😀 hello@example.com and [REDACTED_EMAIL_1]", "restore only selected occurrence with Unicode prefix")
let part = (restoreText as NSString).range(of: "hello")
let partial = try engine.redact(restoreText, rules: [], names: false, restored: [part])
check(partial.text.hasPrefix("😀 hello[REDACTED_EMAIL_1]"), "partial restoration leaves rest redacted")
let fullRestore = try engine.redact(address, rules: [Rule(value: "Example RDC", isRegex: false)], names: true, restored: [NSRange(location: 0, length: address.utf16.count)])
check(fullRestore.text == address, "restoration overrides overlapping automatic and custom detectors")
let reapplied = try engine.redact(restoreText, rules: [], names: false, restored: [])
check(!reapplied.text.contains("hello@example.com"), "reset restorations reapplies detection")
print("\(passed) checks passed")

