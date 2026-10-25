#!/bin/bash
# Open every http(s) URL in the selection in the browser picked by the action id.
emit() { # $1 style, $2 message
  local msg=${2//\\/\\\\}; msg=${msg//\"/\\\"}
  printf '{"type":"toast","style":"%s","message":"%s"}\n' "$1" "$msg"
}
lang="${OPENCLIP_LANGUAGE:-en}"
key="${OPENCLIP_ACTION_ID##*.}"
case "$key" in
  safari)     name="Safari";          ids=(com.apple.Safari com.apple.SafariTechnologyPreview) ;;
  chrome)     name="Google Chrome";   ids=(com.google.Chrome com.google.Chrome.beta com.google.Chrome.dev com.google.Chrome.canary) ;;
  chromium)   name="Chromium";        ids=(org.chromium.Chromium) ;;
  firefox)    name="Firefox";         ids=(org.mozilla.firefox org.mozilla.firefoxdeveloperedition org.mozilla.nightly) ;;
  brave)      name="Brave Browser";   ids=(com.brave.Browser com.brave.Browser.beta com.brave.Browser.nightly com.brave.Browser.dev com.brave.Browser.origin com.brave.Browser.origin.beta) ;;
  comet)      name="Comet";           ids=(ai.perplexity.comet) ;;
  dia)        name="Dia";             ids=(company.thebrowser.dia) ;;
  devonagent) name="DEVONagent Pro";  ids=(com.devon-technologies.agent) ;;
  duckduckgo) name="DuckDuckGo";      ids=(com.duckduckgo.macos.browser) ;;
  ecosia)     name="Ecosia Browser";  ids=(org.ecosia.browser) ;;
  edge)       name="Microsoft Edge";  ids=(com.microsoft.edgemac com.microsoft.edgemac.Beta com.microsoft.edgemac.Dev com.microsoft.edgemac.Canary) ;;
  helium)     name="Helium";          ids=(net.imput.helium) ;;
  icab)       name="iCab";            ids=(de.icab.iCab) ;;
  mullvad)    name="Mullvad Browser"; ids=(net.mullvad.mullvadbrowser) ;;
  opera)      name="Opera";           ids=(com.operasoftware.Opera) ;;
  orion)      name="Orion";           ids=(com.kagi.kagimacOS com.kagi.kagimacOS.RC) ;;
  quark)      name="Quark";           ids=() ;;
  tor)        name="Tor Browser";     ids=(org.torproject.torbrowser) ;;
  vivaldi)    name="Vivaldi";         ids=(com.vivaldi.Vivaldi) ;;
  waterfox)   name="Waterfox";        ids=(net.waterfox.waterfox) ;;
  zen)        name="Zen";             ids=(app.zen-browser.zen) ;;
  *) emit error "Unknown browser: $key"; exit 0 ;;
esac

# Pull out each http(s) URL and trim trailing punctuation that is usually not part of it.
# (Written for the bash 3.2 that ships with macOS, so no mapfile.)
urls=()
while IFS= read -r u; do
  [ -n "$u" ] && urls+=("$u")
done < <(printf '%s\n' "$OPENCLIP_TEXT" | grep -oiE 'https?://[^[:space:]<>"]+' | sed -E 's/[].,;:!?)'"'"'}]+$//')
if [ ${#urls[@]} -eq 0 ]; then
  case "$lang" in
    zh-Hans*) m="没有找到链接" ;; zh-Hant*) m="找不到連結" ;; ja*) m="URL が見つかりません" ;; fr*) m="Aucune URL trouvée" ;; *) m="No link found" ;;
  esac
  emit error "$m"; exit 0
fi

for id in "${ids[@]}"; do
  open -b "$id" "${urls[@]}" 2>/dev/null && exit 0
done
# Fall back to the app name in case the bundle id differs on this Mac.
open -a "$name" "${urls[@]}" 2>/dev/null && exit 0

case "$lang" in
  zh-Hans*) m="未安装 $name" ;; zh-Hant*) m="未安裝 $name" ;; ja*) m="$name がインストールされていません" ;; fr*) m="$name n'est pas installé" ;; *) m="$name isn't installed" ;;
esac
emit error "$m"
