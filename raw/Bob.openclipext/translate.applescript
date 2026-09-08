use framework "Foundation"
use scripting additions

-- OpenClip provides OPENCLIP_TEXT. Serialize it as data, never executable code.
set selectedText to OPENCLIP_TEXT as text
if selectedText is "" then return ""
set requestBody to {action:"translateText", |text|:selectedText, windowLocation:"mouse"}
set requestObject to {|path|:"translate", body:requestBody}
set jsonData to current application's NSJSONSerialization's dataWithJSONObject:requestObject options:0 |error|:(missing value)
set requestJSON to (current application's NSString's alloc()'s initWithData:jsonData encoding:4) as text

tell application id "com.hezongyidev.Bob"
    launch
    request requestJSON
end tell

-- Bob owns the result window. Do not let OpenClip paste the API response.
return ""
