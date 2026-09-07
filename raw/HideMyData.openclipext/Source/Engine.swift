// SPDX-License-Identifier: GPL-3.0-only
import Foundation
import NaturalLanguage

struct Rule: Codable, Equatable {
    let value: String
    let isRegex: Bool
    var remembered: Bool = false
}
struct Span {
    var range: NSRange
    var kind: String
}
struct Redaction {
    let text: String
    let spans: [Span]
}
enum RedactionError: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let s) = self { return s }; return nil }
}
struct Engine {
    struct Pattern: Decodable { let id: String; let category: String; let regex: String }
    struct Patterns: Decodable { let patterns: [Pattern] }
    let patterns: [Pattern]
    init(url: URL) throws { patterns = try JSONDecoder().decode(Patterns.self, from: Data(contentsOf: url)).patterns }
    static func kind(_ category: String) -> String {
        if category.contains("email") { return "EMAIL" }
        if category.contains("phone") { return "PHONE" }
        if category.contains("address") { return "ADDRESS" }
        if category.contains("account") { return "ACCOUNT" }
        if category.contains("name") { return "NAME" }
        return category.uppercased()
    }
    static func regex(_ rule: Rule) throws -> NSRegularExpression {
        let pattern = rule.isRegex ? rule.value : rule.value.split(whereSeparator: { $0.isWhitespace }).map { NSRegularExpression.escapedPattern(for: String($0)) }.joined(separator: #"\s+"#)
        guard !pattern.isEmpty, pattern.utf16.count <= 2000 else { throw RedactionError.message("Enter a rule of 1–2,000 characters.") }
        do { return try NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) }
        catch { throw RedactionError.message("Invalid regular expression. Check brackets, escapes, and parentheses.") }
    }
    static func matches(_ regex: NSRegularExpression, text: String, name: String) throws -> [NSRange] {
        var ranges: [NSRange] = []
        var expired = false
        let deadline = Date().addingTimeInterval(0.3)
        regex.enumerateMatches(in: text, options: [.reportProgress], range: NSRange(location: 0, length: text.utf16.count)) { result, _, stop in
            if Date() > deadline || ranges.count > 10000 { expired = true; stop.pointee = true; return }
            if let result, result.range.length > 0 { ranges.append(result.range) }
        }
        if expired { throw RedactionError.message("The \(name) pattern took too long. Simplify the rule or select less text. No result was copied.") }
        return ranges
    }
    static func lines(_ text: String) -> [(text: String, range: NSRange)] {
        var offset = 0
        return text.components(separatedBy: "\n").map { line in
            let content = line.hasSuffix("\r") ? String(line.dropLast()) : line
            defer { offset += line.utf16.count + 1 }
            return (content, NSRange(location: offset, length: content.utf16.count))
        }
    }
    static func addressBlocks(_ text: String) throws -> [Span] {
        let rows = lines(text)
        let city = try NSRegularExpression(pattern: #"(?i)^[ \t]*[\p{L}][\p{L} .'-]{1,60},?[ \t]+(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)[ \t]+\d{5}(?:-\d{4})?[ \t]*$"#)
        let street = try NSRegularExpression(pattern: #"(?i)^[ \t]*\d{1,6}[A-Z]?[ \t]+[\p{L}\d .#/'-]{0,90}\b(?:FM|RM|CR|US|SR|I|Route|Highway|Hwy|Road|Rd|Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Parkway|Pkwy|Trail|Terrace|Place|Pl|Circle|Cir)\b[\p{L}\d .#/'-]{0,40}$"#)
        let unit = try NSRegularExpression(pattern: #"(?i)^[ \t]*(?:Suite|Ste|Unit|Apt|Apartment|Floor|Building|Bldg|Dock)[ \t]*[.#-]?[ \t]*[A-Z0-9][A-Z0-9 -]{0,20}[ \t]*$"#)
        let facility = try NSRegularExpression(pattern: #"(?i)^[ \t]*[\p{L}\d .&'-]{1,70}\b(?:RDC|DC|Warehouse|Distribution Center|Distribution Centre|Logistics Center|Logistics Centre)[ \t]*$"#)
        func has(_ re: NSRegularExpression, _ index: Int) -> Bool {
            guard rows.indices.contains(index) else { return false }
            return re.firstMatch(in: rows[index].text, range: NSRange(location: 0, length: rows[index].text.utf16.count)) != nil
        }
        var spans: [Span] = []
        for end in rows.indices where has(city, end) {
            var start = end - 1
            // Up to two explicit unit lines between the street and city.
            for _ in 0..<2 { if has(unit, start) { start -= 1 } }
            guard has(street, start) else { continue }
            if has(facility, start - 1) { start -= 1 }
            spans.append(Span(range: NSRange(location: rows[start].range.location,
                length: NSMaxRange(rows[end].range) - rows[start].range.location), kind: "ADDRESS"))
        }
        return spans
    }
    func redact(_ text: String, rules: [Rule], names: Bool = true, restored: [NSRange] = []) throws -> Redaction {
        guard text.utf16.count <= 50000 else { throw RedactionError.message("Select up to 50,000 characters at a time.") }
        var spans = try Self.addressBlocks(text)
        for pattern in patterns {
            let regex = try NSRegularExpression(pattern: pattern.regex)
            // Address regexes are line-local. A ZIP at the end of one line
            // must not consume prose from the next paragraph as a city name.
            let segments = pattern.category.contains("address") ? Self.lines(text) : [(text: text, range: NSRange(location: 0, length: text.utf16.count))]
            let ranges = try segments.flatMap { segment in
                try Self.matches(regex, text: segment.text, name: pattern.id).map {
                    NSRange(location: segment.range.location + $0.location, length: $0.length)
                }
            }
            spans += ranges.map {
                var range = $0
                if pattern.category.contains("phone") {
                    let original = text as NSString
                    while range.length > 0 {
                        let last = original.character(at: NSMaxRange(range) - 1)
                        if last >= 48 && last <= 57 { break }
                        range.length -= 1
                    }
                }
                return Span(range: range, kind: Self.kind(pattern.category))
            }
        }
        // Keep system address matches line-local too; validated blocks above
        // supply multiline coverage without crossing unrelated paragraphs.
        let addressDetector = try NSDataDetector(types: NSTextCheckingResult.CheckingType.address.rawValue)
        for line in Self.lines(text) {
            addressDetector.enumerateMatches(in: line.text, range: NSRange(location: 0, length: line.range.length)) { match, _, _ in
                if let match { spans.append(Span(range: NSRange(location: line.range.location + match.range.location, length: match.range.length), kind: "ADDRESS")) }
            }
        }
        let dateDetector = try NSDataDetector(types: NSTextCheckingResult.CheckingType.date.rawValue)
        dateDetector.enumerateMatches(in: text, range: NSRange(location: 0, length: text.utf16.count)) { match, _, _ in
            if let match { spans.append(Span(range: match.range, kind: "DATE")) }
        }
        if names {
            let tagger = NLTagger(tagSchemes: [.nameType])
            tagger.string = text
            tagger.enumerateTags(in: text.startIndex..<text.endIndex, unit: .word, scheme: .nameType, options: [.omitWhitespace, .omitPunctuation, .joinNames]) { tag, range in
                if let tag, [.personalName, .placeName, .organizationName].contains(tag) {
                    spans.append(Span(range: NSRange(range, in: text), kind: tag == .personalName ? "NAME" : tag == .placeName ? "PLACE" : "ORGANIZATION"))
                }
                return true
            }
        }
        for rule in rules {
            spans += try Self.matches(Self.regex(rule), text: text, name: "custom").map { Span(range: $0, kind: "CUSTOM") }
        }
        // Explicit review overrides restore only the selected ranges, even when
        // several detectors overlap. Other portions remain redacted.
        for exclusion in restored {
            spans = spans.flatMap { span -> [Span] in
                let overlap = NSIntersectionRange(span.range, exclusion)
                guard overlap.length > 0 else { return [span] }
                var remaining: [Span] = []
                if span.range.location < overlap.location {
                    remaining.append(Span(range: NSRange(location: span.range.location, length: overlap.location - span.range.location), kind: span.kind))
                }
                if NSMaxRange(overlap) < NSMaxRange(span.range) {
                    remaining.append(Span(range: NSRange(location: NSMaxRange(overlap), length: NSMaxRange(span.range) - NSMaxRange(overlap)), kind: span.kind))
                }
                return remaining
            }
        }
        return Self.render(text, spans: spans)
    }
    static func render(_ text: String, spans: [Span]) -> Redaction {
        // Union overlapping ranges: dropping a later overlapping range can leak its suffix.
        let sorted = spans.filter { $0.range.location >= 0 && $0.range.length > 0 && NSMaxRange($0.range) <= text.utf16.count }.sorted {
            $0.range.location == $1.range.location ? $0.range.length > $1.range.length : $0.range.location < $1.range.location
        }
        var merged: [Span] = []
        for span in sorted {
            if var last = merged.last, span.range.location < NSMaxRange(last.range) {
                if span.kind == "CUSTOM" { last.kind = "CUSTOM" }
                last.range.length = max(NSMaxRange(last.range), NSMaxRange(span.range)) - last.range.location
                merged[merged.count - 1] = last
            } else { merged.append(span) }
        }
        let original = text as NSString
        var output = "", cursor = 0
        var tokens: [String: String] = [:], counters: [String: Int] = [:]
        for span in merged {
            output += original.substring(with: NSRange(location: cursor, length: span.range.location - cursor))
            let value = original.substring(with: span.range).lowercased().split(whereSeparator: { $0.isWhitespace }).joined(separator: " ")
            let key = span.kind + ":" + value
            let token: String
            if let previous = tokens[key] { token = previous }
            else {
                counters[span.kind, default: 0] += 1
                token = "[REDACTED_\(span.kind)_\(counters[span.kind]!)]"
                tokens[key] = token
            }
            output += token
            cursor = NSMaxRange(span.range)
        }
        output += original.substring(from: cursor)
        return Redaction(text: output, spans: merged)
    }
}

struct RuleStore {
    let url: URL
    init(url override: URL? = nil) {
        url = override ?? FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("HideMyData OpenClip", isDirectory: true).appendingPathComponent("rules.json")
    }
    func load() throws -> [Rule] {
        guard FileManager.default.fileExists(atPath: url.path) else { return [] }
        do { return try JSONDecoder().decode([Rule].self, from: Data(contentsOf: url)) }
        catch { throw RedactionError.message("Saved rules could not be read. Fix rules.json before continuing.") }
    }
    func save(_ rules: [Rule]) throws {
        let folder = url.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
        try JSONEncoder().encode(rules.filter(\.remembered)).write(to: url, options: .atomic)
        try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: url.path)
    }
}
