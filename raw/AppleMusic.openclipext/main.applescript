set searchTerm to OPENCLIP_TEXT
set encodedTerm to do shell script "python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=\"\"))' " & quoted form of searchTerm
tell application "Music"
    activate
end tell
open location "music://music.apple.com/search?term=" & encodedTerm
