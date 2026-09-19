set userHome to POSIX path of (path to home folder)
set scriptPath to userHome & ".openclip/extensions/Droppy.openclipext/main.sh"

tell application "System Events"
	if not (exists file scriptPath) then
		set scriptPath to userHome & "dev/openclip/extensions/raw/Droppy.openclipext/main.sh"
	end if
end tell

do shell script "OPENCLIP_ACTION_ID=\"com.openclip.droppy.send\" OPENCLIP_TEXT=" & quoted form of OPENCLIP_TEXT & " /bin/zsh " & quoted form of scriptPath

return ""
