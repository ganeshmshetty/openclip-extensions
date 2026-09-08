set userHome to POSIX path of (path to home folder)
set scriptPath to userHome & ".openclip/extensions/RunCommand.openclipext/main.sh"

tell application "System Events"
	if not (exists file scriptPath) then
		set scriptPath to "/Users/ganesh/dev/openclip/extensions/raw/RunCommand.openclipext/main.sh"
	end if
end tell

do shell script "OPENCLIP_TEXT=" & quoted form of OPENCLIP_TEXT & " /bin/zsh " & quoted form of scriptPath
