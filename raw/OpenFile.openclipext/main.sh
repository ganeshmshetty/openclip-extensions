#!/bin/zsh
set -euo pipefail

# Trim, unquote, expand ~ / file://, then open a regular file (or a packaged
# document like .pages) in the default app. Plain folders are left to Reveal
# in Finder. Do not name a variable "path": zsh ties that to PATH.

text="${OPENCLIP_TEXT:-}"
text="${text#"${text%%[![:space:]]*}"}"
text="${text%"${text##*[![:space:]]}"}"

if [[ ${#text} -ge 2 ]]; then
  first="${text:0:1}"
  last="${text: -1}"
  if [[ ( "$first" == '"' && "$last" == '"' ) || ( "$first" == "'" && "$last" == "'" ) ]]; then
    text="${text:1:$(( ${#text} - 2 ))}"
    text="${text#"${text%%[![:space:]]*}"}"
    text="${text%"${text##*[![:space:]]}"}"
  fi
fi

if [[ -z "$text" ]]; then
  exit 0
fi

if [[ "$text" == file://* ]]; then
  rest="${text#file://}"
  if [[ "$rest" == localhost/* || "$rest" == localhost ]]; then
    rest="${rest#localhost}"
  elif [[ "$rest" != /* ]]; then
    # file://hostname/path → /path
    rest="/${rest#*/}"
  fi
  # Percent-decode %XX sequences (e.g. file:///Users/me/My%20File.txt)
  text="$(printf '%b' "${rest//\%/\\x}")"
fi

if [[ "$text" == "~" || "$text" == "~/"* ]]; then
  text="${HOME}${text#\~}"
fi

# Terminal copies sometimes escape spaces.
text="${text//\\ / }"

toast() {
  local kind="$1"
  local lang="${OPENCLIP_LANGUAGE:-en}"
  local msg
  case "$lang" in
    zh-Hans|zh_CN|zh-CN)
      case "$kind" in
        folder)  msg="这是一个文件夹" ;;
        *)       msg="找不到该文件" ;;
      esac
      ;;
    zh-Hant|zh_TW|zh-TW|zh_HK|zh-HK)
      case "$kind" in
        folder)  msg="這是一個檔案夾" ;;
        *)       msg="找不到該檔案" ;;
      esac
      ;;
    ja|ja_JP|ja-JP)
      case "$kind" in
        folder)  msg="これはフォルダです" ;;
        *)       msg="ファイルが見つかりません" ;;
      esac
      ;;
    fr|fr_FR|fr-FR)
      case "$kind" in
        folder)  msg="C’est un dossier" ;;
        *)       msg="Fichier introuvable" ;;
      esac
      ;;
    *)
      case "$kind" in
        folder)  msg="That path is a folder" ;;
        *)       msg="File not found" ;;
      esac
      ;;
  esac
  printf '{"type":"toast","message":"%s","style":"error"}\n' "$msg"
}

if [[ -f "$text" ]]; then
  open -- "$text"
  exit 0
fi

if [[ -d "$text" ]]; then
  base="${text##*/}"
  # Document packages (.pages, .rtfd, .app) are directories with an extension.
  if [[ "$base" == *.* && "$base" != .* ]]; then
    open -- "$text"
    exit 0
  fi
  toast folder
  exit 0
fi

toast missing
exit 0
