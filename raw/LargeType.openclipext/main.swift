import Cocoa

class FullscreenOverlayWindow: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }

    override func constrainFrameRect(_ frameRect: NSRect, to screen: NSScreen?) -> NSRect {
        return frameRect
    }

    override func keyDown(with event: NSEvent) {
        if let delegate = NSApp.delegate as? AppDelegate {
            delegate.handleKeyDown(event)
        }
    }

    override func mouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }

    override func rightMouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }

    override func otherMouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }
}

class FlippedClipView: NSClipView {
    override var isFlipped: Bool { true }
}

class ClickableScrollView: NSScrollView {
    override func mouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }

    override func rightMouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }

    override func otherMouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }
}

class ClickableTextField: NSTextField {
    override var isFlipped: Bool { true }

    override func mouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }

    override func rightMouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }

    override func otherMouseDown(with event: NSEvent) {
        AppDelegate.shared?.dismissAll()
    }
}

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    static weak var shared: AppDelegate?
    var windows: [FullscreenOverlayWindow] = []
    var primaryScrollView: NSScrollView?
    let textToDisplay: String
    private var isDismissing = false

    init(text: String) {
        self.textToDisplay = text
        super.init()
        AppDelegate.shared = self
    }

    func windowDidResignKey(_ notification: Notification) {
        dismissAll()
    }

    func dismissAll() {
        guard !isDismissing else { return }
        isDismissing = true

        NSAnimationContext.runAnimationGroup({ context in
            context.duration = 0.12
            for win in self.windows {
                win.animator().alphaValue = 0.0
            }
        }, completionHandler: {
            NSApp.terminate(nil)
        })
    }

    func handleKeyDown(_ event: NSEvent) {
        if let scroll = primaryScrollView {
            let clip = scroll.contentView
            let currentY = clip.bounds.origin.y
            let docHeight = scroll.documentView?.frame.height ?? 0
            let visibleHeight = clip.bounds.height
            let maxY = max(0, docHeight - visibleHeight)

            switch event.keyCode {
            case 125: // Down Arrow
                let nextY = min(maxY, currentY + 70)
                scroll.scroll(clip, to: NSPoint(x: 0, y: nextY))
                return
            case 126: // Up Arrow
                let nextY = max(0, currentY - 70)
                scroll.scroll(clip, to: NSPoint(x: 0, y: nextY))
                return
            case 121: // Page Down
                let nextY = min(maxY, currentY + visibleHeight * 0.8)
                scroll.scroll(clip, to: NSPoint(x: 0, y: nextY))
                return
            case 116: // Page Up
                let nextY = max(0, currentY - visibleHeight * 0.8)
                scroll.scroll(clip, to: NSPoint(x: 0, y: nextY))
                return
            case 115: // Home
                scroll.scroll(clip, to: NSPoint(x: 0, y: 0))
                return
            case 119: // End
                scroll.scroll(clip, to: NSPoint(x: 0, y: maxY))
                return
            default:
                break
            }
        }

        // Any other key (Esc, Space, Return, etc.) dismisses
        dismissAll()
    }

    private func calculateBestFontSize(for text: String, availableSize: NSSize, maxFontSize: CGFloat = 140, minFontSize: CGFloat = 54) -> NSFont {
        var low: CGFloat = minFontSize
        var high: CGFloat = maxFontSize
        var bestSize: CGFloat = minFontSize

        while (high - low) > 1.0 {
            let mid = (low + high) / 2.0
            let testFont = NSFont.systemFont(ofSize: mid, weight: .bold)
            let rect = (text as NSString).boundingRect(
                with: NSSize(width: availableSize.width, height: .greatestFiniteMagnitude),
                options: [.usesLineFragmentOrigin, .usesFontLeading],
                attributes: [.font: testFont]
            )
            if rect.height <= availableSize.height && rect.width <= availableSize.width {
                bestSize = mid
                low = mid
            } else {
                high = mid
            }
        }

        let chosenSize = max(minFontSize, floor(bestSize))
        return NSFont.systemFont(ofSize: chosenSize, weight: .bold)
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let screens = NSScreen.screens
        guard !screens.isEmpty else {
            NSApp.terminate(nil)
            return
        }

        let mouseLocation = NSEvent.mouseLocation
        let primaryScreen = screens.first(where: { NSMouseInRect(mouseLocation, $0.frame, false) })
            ?? NSScreen.main
            ?? screens[0]

        for screen in screens {
            let screenFrame = screen.frame

            let win = FullscreenOverlayWindow(
                contentRect: screenFrame,
                styleMask: [.borderless, .nonactivatingPanel],
                backing: .buffered,
                defer: false
            )
            win.isOpaque = false
            win.backgroundColor = .clear
            win.level = NSWindow.Level(rawValue: Int(CGShieldingWindowLevel()))
            win.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary, .ignoresCycle]
            win.hasShadow = false
            win.delegate = self

            let container = NSVisualEffectView(frame: NSRect(origin: .zero, size: screenFrame.size))
            container.material = .fullScreenUI
            container.blendingMode = .behindWindow
            container.state = .active
            container.autoresizingMask = [.width, .height]

            let tintView = NSView(frame: container.bounds)
            tintView.wantsLayer = true
            tintView.layer?.backgroundColor = NSColor(calibratedWhite: 0.04, alpha: 0.85).cgColor
            tintView.autoresizingMask = [.width, .height]
            container.addSubview(tintView)

            if screen == primaryScreen {
                // Comfortable top distance (clears notch and menu bar comfortably)
                let marginTop: CGFloat = max(90.0, screenFrame.height * 0.10)
                let marginBottom: CGFloat = max(60.0, screenFrame.height * 0.08)
                let marginX: CGFloat = max(48.0, screenFrame.width * 0.06)

                let availableW = screenFrame.width - (marginX * 2)
                let availableH = screenFrame.height - marginTop - marginBottom
                let availableSize = NSSize(width: availableW, height: availableH)

                // Large minimum size: min 54pt, max 140pt
                let font = calculateBestFontSize(for: textToDisplay, availableSize: availableSize, maxFontSize: 140, minFontSize: 54)

                let textRect = (textToDisplay as NSString).boundingRect(
                    with: NSSize(width: availableW, height: .greatestFiniteMagnitude),
                    options: [.usesLineFragmentOrigin, .usesFontLeading],
                    attributes: [.font: font]
                )

                let textHeight = ceil(textRect.height) + 16

                let textField = ClickableTextField(wrappingLabelWithString: textToDisplay)
                textField.isEditable = false
                textField.isSelectable = false
                textField.isBezeled = false
                textField.drawsBackground = false
                textField.alignment = .center
                textField.textColor = .white
                textField.font = font
                textField.lineBreakMode = .byWordWrapping

                let textShadow = NSShadow()
                textShadow.shadowColor = NSColor.black.withAlphaComponent(0.7)
                textShadow.shadowOffset = NSSize(width: 0, height: -3)
                textShadow.shadowBlurRadius = 18
                textField.shadow = textShadow

                if textHeight <= availableH {
                    // Fits vertically -> center vertically with comfortable distance from top and bottom
                    let yPos = (screenFrame.height - textHeight) / 2.0
                    textField.frame = NSRect(x: marginX, y: yPos, width: availableW, height: textHeight)
                    container.addSubview(textField)
                } else {
                    // Exceeds display -> scrollable starting at distance from the top
                    let scrollY = marginBottom
                    let scrollH = availableH
                    let scrollView = ClickableScrollView(frame: NSRect(x: marginX, y: scrollY, width: availableW, height: scrollH))
                    scrollView.drawsBackground = false
                    scrollView.borderType = .noBorder

                    // Completely disable scrollbar indicators
                    scrollView.hasVerticalScroller = false
                    scrollView.hasHorizontalScroller = false
                    scrollView.verticalScroller = nil
                    scrollView.horizontalScroller = nil
                    scrollView.autohidesScrollers = true

                    let clip = FlippedClipView()
                    clip.frame = scrollView.bounds
                    clip.drawsBackground = false
                    scrollView.contentView = clip

                    textField.frame = NSRect(x: 0, y: 0, width: availableW, height: textHeight)
                    scrollView.documentView = textField

                    container.addSubview(scrollView)
                    self.primaryScrollView = scrollView
                }
            }

            win.contentView = container
            win.alphaValue = 0.0
            windows.append(win)

            win.makeKeyAndOrderFront(nil)
        }

        NSApp.activate(ignoringOtherApps: true)

        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.12
            for win in self.windows {
                win.animator().alphaValue = 1.0
            }
        }
    }
}

let app = NSApplication.shared
app.setActivationPolicy(.accessory)

var rawText = CommandLine.arguments.dropFirst().joined(separator: " ")
if rawText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    rawText = ProcessInfo.processInfo.environment["OPENCLIP_TEXT"] ?? ""
}
if rawText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
    rawText = NSPasteboard.general.string(forType: .string) ?? ""
}

let text = rawText.trimmingCharacters(in: .whitespacesAndNewlines)
guard !text.isEmpty else {
    exit(0)
}

let delegate = AppDelegate(text: text)
app.delegate = delegate
app.run()
