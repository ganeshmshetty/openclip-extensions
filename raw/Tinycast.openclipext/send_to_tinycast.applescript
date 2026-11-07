use framework "Foundation"
use scripting additions

-- OpenClip provides OPENCLIP_TEXT as a property.
set selectedText to OPENCLIP_TEXT as text
if selectedText is "" then return ""

-- Copy selected text to clipboard
set the clipboard to selectedText

-- Check if Tinycast is already running
tell application "System Events"
    set isTinycastRunning to (count of (processes whose bundle identifier is "com.tinycast.app")) > 0
end tell

-- Open Tinycast palette
open location "tinycast://"

-- Delay slightly based on whether Tinycast was already running or needed a cold start
if isTinycastRunning then
    delay 0.15
else
    delay 0.6
end if

-- Paste clipboard into Tinycast search field
tell application "System Events"
    keystroke "v" using {command down}
end tell

return ""
