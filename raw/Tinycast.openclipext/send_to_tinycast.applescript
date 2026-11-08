use framework "Foundation"
use scripting additions

set selectedText to OPENCLIP_TEXT as text
if selectedText is "" then return ""

set nsText to current application's NSString's stringWithString:selectedText
set allowed to current application's NSCharacterSet's characterSetWithCharactersInString:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
set encoded to (nsText's stringByAddingPercentEncodingWithAllowedCharacters:allowed) as text
if encoded is missing value then return ""

open location "tinycast://search?fallbackText=" & encoded
return ""
