set theNote to ((current date) as string) & return & return & OPENCLIP_TEXT
tell application id "com.omnigroup.OmniFocus4"
	tell quick entry
		open
		set theTask to make new inbox task with properties {name:first paragraph of OPENCLIP_TEXT, note:theNote}
	end tell
end tell
return
