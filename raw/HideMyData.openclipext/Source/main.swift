// SPDX-License-Identifier: GPL-3.0-only
import AppKit

// Synthetic demonstration data only. example.com and the 555-01xx phone range are placeholders.
let demo = "Contact Alice Smith at alice@example.com or +1 202 555 0147.\n\nExample RDC\n9000 N FM 1234\nSuite# 999\nExampletown TX 00000\n\nPlease send the sample details.\nCustomer reference: CLIENT-0042\nProject Bluebird is confidential."
let arguments = CommandLine.arguments
let bundle = Bundle.main

if arguments.contains("--launch") {
    let input = ProcessInfo.processInfo.environment["OPENCLIP_TEXT"] ?? String(data: FileHandle.standardInput.readDataToEndOfFile(), encoding: .utf8) ?? ""
    guard !input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, input.utf16.count <= 50000 else {
        FileHandle.standardError.write(Data("Select between 1 and 50,000 characters.\n".utf8)); exit(1)
    }
    // A unique, short-lived named pasteboard transfers text without a document file,
    // source text in argv, or replacing the user's general clipboard.
    let board = NSPasteboard.withUniqueName()
    guard board.setString(input, forType: .string) else { exit(1) }
    let config = NSWorkspace.OpenConfiguration()
    config.createsNewApplicationInstance = true
    config.arguments = ["--board", board.name.rawValue]
    config.environment = [:]
    let appURL = URL(fileURLWithPath: arguments[0]).deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    NSWorkspace.shared.openApplication(at: appURL, configuration: config) { _, error in
        if error != nil { board.releaseGlobally(); FileHandle.standardError.write(Data("Could not open HideMyData Review.\n".utf8)); exit(1) }
        // The receiving application releases the board immediately after reading it.
        exit(0)
    }
    RunLoop.main.run()
    exit(0)
}

final class ReviewController: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow!
    let source = NSTextView(), result = NSTextView()
    let entry = NSTextField(), status = NSTextField(labelWithString: "Detecting personal data…")
    let regex = NSButton(checkboxWithTitle: "Regular expression", target: nil, action: nil)
    let remember = NSButton(checkboxWithTitle: "Remember this rule", target: nil, action: nil)
    let names = NSButton(checkboxWithTitle: "Detect names, places and organizations", target: nil, action: nil)
    let ruleList = NSPopUpButton()
    var copyButton: NSButton!
    var rules: [Rule] = []
    var generation = 0
    var restored: [NSRange] = []
    var engine: Engine!
    let store = RuleStore()
    var startupError: String?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)
        let menu = NSMenu(), appMenu = NSMenu()
        let item = NSMenuItem(); item.submenu = appMenu; menu.addItem(item)
        appMenu.addItem(withTitle: "Quit HideMyData Review", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        let editItem = NSMenuItem(title: "Edit", action: nil, keyEquivalent: "")
        let edit = NSMenu(title: "Edit"); editItem.submenu = edit; menu.addItem(editItem)
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        NSApp.mainMenu = menu
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1040, height: 750), styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "HideMyData · Review redactions"
        window.minSize = NSSize(width: 900, height: 670)
        window.delegate = self; window.isReleasedWhenClosed = false
        let root = NSStackView(); root.orientation = .vertical; root.alignment = .leading; root.spacing = 12
        root.translatesAutoresizingMaskIntoConstraints = false
        window.contentView!.addSubview(root)
        NSLayoutConstraint.activate([root.leadingAnchor.constraint(equalTo: window.contentView!.leadingAnchor, constant: 24), root.trailingAnchor.constraint(equalTo: window.contentView!.trailingAnchor, constant: -24), root.topAnchor.constraint(equalTo: window.contentView!.topAnchor, constant: 22), root.bottomAnchor.constraint(equalTo: window.contentView!.bottomAnchor, constant: -22)])
        let title = NSTextField(labelWithString: "Review before you share")
        title.font = .systemFont(ofSize: 25, weight: .semibold); root.addArrangedSubview(title)
        let subtitle = NSTextField(wrappingLabelWithString: "Processed on this Mac. Automatic detection can miss details. Select missed text on the left and add a redaction.")
        subtitle.textColor = .secondaryLabelColor; root.addArrangedSubview(subtitle)
        let panels = NSStackView(); panels.orientation = .horizontal; panels.distribution = .fillEqually; panels.spacing = 16
        panels.addArrangedSubview(panel("Original · select missed text here", source))
        panels.addArrangedSubview(panel("Redacted · review and copy", result))
        root.addArrangedSubview(panels); panels.widthAnchor.constraint(equalTo: root.widthAnchor).isActive = true
        panels.heightAnchor.constraint(greaterThanOrEqualToConstant: 240).isActive = true
        let selected = button("Redact selected text", #selector(addSelected))
        let restore = button("Restore selected text", #selector(restoreSelected))
        let reset = button("Reset restorations", #selector(resetRestorations))
        let selectionRow = NSStackView(views: [selected, restore, reset]); selectionRow.spacing = 10
        names.state = .on; names.target = self; names.action = #selector(refresh)
        root.addArrangedSubview(selectionRow)
        root.addArrangedSubview(names)
        let customTitle = NSTextField(labelWithString: "Custom redaction")
        customTitle.font = .systemFont(ofSize: 14, weight: .semibold); root.addArrangedSubview(customTitle)
        entry.placeholderString = "A name, phrase, reference number, or regex pattern"
        entry.setAccessibilityLabel("Custom redaction rule")
        let add = button("Add rule", #selector(addRule))
        let entryRow = NSStackView(views: [entry, add]); entryRow.spacing = 8
        root.addArrangedSubview(entryRow); entryRow.widthAnchor.constraint(equalTo: root.widthAnchor).isActive = true
        let checks = NSStackView(views: [regex, remember]); checks.spacing = 18; root.addArrangedSubview(checks)
        let savedNote = NSTextField(labelWithString: "Remembered rules apply to future selections and are stored locally. Phrases match all occurrences, ignoring case.")
        savedNote.font = .systemFont(ofSize: 11); savedNote.textColor = .secondaryLabelColor; root.addArrangedSubview(savedNote)
        ruleList.setAccessibilityLabel("Active custom rules")
        let remove = button("Remove rule", #selector(removeRule))
        let rulesRow = NSStackView(views: [ruleList, remove]); rulesRow.spacing = 8
        root.addArrangedSubview(rulesRow); rulesRow.widthAnchor.constraint(equalTo: root.widthAnchor).isActive = true
        ruleList.setContentHuggingPriority(.defaultLow, for: .horizontal)
        status.lineBreakMode = .byWordWrapping; status.maximumNumberOfLines = 3
        status.setAccessibilityLabel("Redaction status"); root.addArrangedSubview(status)
        status.widthAnchor.constraint(equalTo: root.widthAnchor).isActive = true
        copyButton = button("Copy redacted text", #selector(copyResult)); copyButton.bezelStyle = .rounded
        copyButton.keyEquivalent = "\r"; copyButton.isEnabled = false
        let done = button("Close", #selector(closeWindow))
        let footer = NSStackView(views: [copyButton, done]); footer.spacing = 8; root.addArrangedSubview(footer)
        var input = ""
        if let index = arguments.firstIndex(of: "--board"), arguments.indices.contains(index + 1) {
            let board = NSPasteboard(name: NSPasteboard.Name(arguments[index + 1]))
            input = board.string(forType: .string) ?? ""; board.releaseGlobally()
        } else if arguments.contains("--demo") { input = demo }
        source.string = input
        do {
            guard let url = bundle.url(forResource: "patterns", withExtension: "json") else { throw RedactionError.message("Missing pattern definitions. Rebuild the extension.") }
            engine = try Engine(url: url)
            rules = arguments.contains("--demo") ? [] : try store.load()
        } catch { startupError = error.localizedDescription }
        updateRuleList()
        window.center(); window.makeKeyAndOrderFront(nil); NSApp.activate(ignoringOtherApps: true)
        refresh()
    }
    func panel(_ title: String, _ text: NSTextView) -> NSView {
        let label = NSTextField(labelWithString: title); label.font = .systemFont(ofSize: 12, weight: .medium)
        text.isEditable = false; text.isSelectable = true; text.isRichText = false
        text.font = .monospacedSystemFont(ofSize: 13, weight: .regular)
        text.textContainerInset = NSSize(width: 12, height: 12)
        text.autoresizingMask = [.width]; text.isVerticallyResizable = true
        text.textContainer?.widthTracksTextView = true
        text.setAccessibilityLabel(title)
        let scroll = NSScrollView(); scroll.hasVerticalScroller = true; scroll.borderType = .bezelBorder; scroll.documentView = text
        let stack = NSStackView(views: [label, scroll]); stack.orientation = .vertical; stack.alignment = .leading; stack.spacing = 8
        scroll.widthAnchor.constraint(equalTo: stack.widthAnchor).isActive = true
        return stack
    }
    func button(_ title: String, _ action: Selector) -> NSButton { NSButton(title: title, target: self, action: action) }
    func showError(_ message: String) { status.stringValue = message; status.textColor = .systemRed }
    func updateRuleList() {
        ruleList.removeAllItems()
        if rules.isEmpty { ruleList.addItem(withTitle: "No custom rules") }
        for rule in rules { ruleList.addItem(withTitle: "\(rule.remembered ? "Saved" : "This selection") · \(rule.isRegex ? "Regex" : "Phrase"): \(rule.value)") }
    }
    @objc func addSelected() {
        let range = source.selectedRange()
        guard range.length > 0 else { showError("Select the missed text in the Original panel first."); return }
        let value = (source.string as NSString).substring(with: range)
        add(Rule(value: value, isRegex: false, remembered: remember.state == .on))
    }
    @objc func restoreSelected() {
        let range = source.selectedRange()
        guard range.length > 0 else { showError("Select text in the Original panel to restore it."); return }
        restored.append(range)
        refresh()
    }
    @objc func resetRestorations() { restored = []; refresh() }
    @objc func addRule() { add(Rule(value: entry.stringValue.trimmingCharacters(in: .whitespacesAndNewlines), isRegex: regex.state == .on, remembered: remember.state == .on)) }
    func add(_ rule: Rule) {
        do {
            let expression = try Engine.regex(rule)
            let matches = try Engine.matches(expression, text: source.string, name: "custom")
            guard !matches.isEmpty else { showError("This rule matches no text in the current selection. Check it before adding."); return }
            if rules.contains(where: { $0.value == rule.value && $0.isRegex == rule.isRegex }) {
                restored.removeAll { excluded in matches.contains { NSIntersectionRange(excluded, $0).length > 0 } }
                refresh(); return
            }
            let next = rules + [rule]
            if rule.remembered && !arguments.contains("--demo") { try store.save(next) }
            restored.removeAll { excluded in matches.contains { NSIntersectionRange(excluded, $0).length > 0 } }
            rules = next; entry.stringValue = ""; updateRuleList(); refresh()
        } catch { showError(error.localizedDescription) }
    }
    @objc func removeRule() {
        let index = ruleList.indexOfSelectedItem
        guard rules.indices.contains(index) else { return }
        var next = rules; let removed = next.remove(at: index)
        do {
            if removed.remembered && !arguments.contains("--demo") { try store.save(next) }
            rules = next; updateRuleList(); refresh()
        } catch { showError("Could not remove the saved rule. \(error.localizedDescription)") }
    }
    @objc func refresh() {
        generation += 1; let current = generation
        copyButton.isEnabled = false; result.string = ""
        if let startupError { showError(startupError); return }
        guard !source.string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { showError("Select text in an app, then choose Redact personal data in OpenClip."); return }
        status.textColor = .secondaryLabelColor; status.stringValue = "Detecting personal data…"
        let restored = restored
        let text = source.string, rules = rules, detectNames = names.state == .on, engine = engine!
        DispatchQueue.global(qos: .userInitiated).async {
            let outcome = Result { try engine.redact(text, rules: rules, names: detectNames, restored: restored) }
            DispatchQueue.main.async {
                guard current == self.generation else { return }
                switch outcome {
                case .success(let redaction):
                    self.result.string = redaction.text
                    self.source.textStorage?.setAttributes([.font: NSFont.monospacedSystemFont(ofSize: 13, weight: .regular), .foregroundColor: NSColor.textColor], range: NSRange(location: 0, length: text.utf16.count))
                    for span in redaction.spans { self.source.textStorage?.addAttribute(.backgroundColor, value: NSColor.systemOrange.withAlphaComponent(0.23), range: span.range) }
                    self.status.stringValue = redaction.spans.isEmpty ? "No matches found. This does not mean the text is free of personal data. Add any missed details before copying." : "\(redaction.spans.count) redactions · Review the result and add any missed details before copying."
                    if !restored.isEmpty { self.status.stringValue += " · \(restored.count) manual restoration(s)." }
                    self.copyButton.isEnabled = true
                case .failure(let error): self.showError(error.localizedDescription)
                }
            }
        }
    }
    @objc func copyResult() {
        guard copyButton.isEnabled else { return }
        NSPasteboard.general.clearContents()
        if NSPasteboard.general.setString(result.string, forType: .string) {
            status.textColor = .systemGreen; status.stringValue = "Copied redacted text. Paste it into your destination app."
        } else { showError("Could not copy. Try again.") }
    }
    @objc func closeWindow() { window.close() }
    func windowWillClose(_ notification: Notification) { NSApp.terminate(nil) }
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
let delegate = ReviewController()
let app = NSApplication.shared
app.delegate = delegate
app.run()
