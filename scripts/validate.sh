#!/bin/bash
# validate.sh — validate one or all OpenClip extension packages against manifest rules.
#
# Usage:
#   ./scripts/validate.sh [<path-to-extension>]
#   ./scripts/validate.sh --all
#
# Exit code: 0 = valid, 1 = invalid

set -u

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required but not installed. Install via 'brew install jq'." >&2
    exit 1
fi

validate_single() {
    local SRC_DIR="$1"
    if [ ! -d "$SRC_DIR" ]; then
        echo "Error: not a directory: $SRC_DIR" >&2
        return 1
    fi

    local MANIFEST=""
    for candidate in openclip.json manifest.json Config.json; do
        if [ -f "$SRC_DIR/$candidate" ]; then
            MANIFEST="$SRC_DIR/$candidate"
            break
        fi
    done

    if [ -z "$MANIFEST" ]; then
        echo "Error: no manifest (openclip.json/manifest.json) found in $SRC_DIR" >&2
        return 1
    fi

    if ! jq empty "$MANIFEST" >/dev/null 2>&1; then
        echo "Error: $MANIFEST is not valid JSON" >&2
        return 1
    fi

    local JQ_PROGRAM
    JQ_PROGRAM=$(cat <<'EOF'
# ---- helpers ----
def sv: if type == "string" then . else "" end;
def is_blank: (type != "string") or (length == 0) or (test("^[[:space:]]*$"));
def is_valid_text:
  if type == "string" then
    (length > 0 and (test("^[[:space:]]*$") | not))
  elif type == "object" then
    ((.en? // (to_entries | map(select(.value | type == "string" and (length > 0 and (test("^[[:space:]]*$") | not)))) | .[0]?.value) // "") != "")
  else
    false
  end;
def has_script:     ((.script? | sv | is_blank | not));
def has_scriptCode: ((.scriptCode? | sv | is_blank | not));
def has_url:        ((.url? | sv | is_blank | not));
def has_payload: has_script or has_scriptCode or has_url;
def kind: ((.type // "url") | ascii_downcase);
def known_kinds: ["url","urltemplate","js","javascript","applescript","shell","shellinline","script","scriptfile","textsnippet","snippet","text","websearch","web","search","keypress","keys","shortcut","keyboardshortcut","service","servicemenu","group","subactions"];
def is_group: ((kind == "group") or (kind == "subactions"));
def secondary_types: ["copy","paste","openURL","toast","success","none"];
def toast_styles: ["success","error","info"];

# Option metadata must be complete and unique; malformed options reject the manifest at decode.
def option_dups($p):
  ((.options? // []) as $opts
   | [ $opts[] | select(((.identifier? | sv) | is_blank) or ((.label? | is_valid_text) | not) or ((.type? | sv) | is_blank))
        | "\($p): option requires identifier, label, and type" ]
     + [ $opts | group_by(.identifier) | map(select(length > 1))
         | map("\($p): duplicate option identifier \"\(.[0].identifier)\"") ]);

# ---- per-action validation (recursive over subActions) ----
def check_action($p):
  . as $self |
  def subErrors:
    if ($self | is_group) and (($self.subActions? | type) == "array") then
      [$self.subActions
       | range(0; length) as $i
       | $self.subActions[$i] | check_action("\($p).subActions[\($i)]")]
      | add
    else [] end;
  def secondaryErrors:
    if (($self.secondary? | type) == "object") then
      [
        (($self.secondary.type? | sv) as $st |
         if ($st | is_blank) then
           "\($p): secondary requires a type (copy, paste, openURL, toast, success, or none)"
         elif (secondary_types | index($st)) == null then
           "\($p): unknown secondary type \"\($st)\" (expected copy, paste, openURL, toast, success, or none)"
         else empty end),
        (if (($self | kind) == "js" or ($self | kind) == "javascript") then
           "\($p): secondary is not supported on javascript actions; branch on openclip.input.isSecondaryClick in the script instead"
         else empty end)
      ]
    else [] end;
  def toastErrors($key):
    (($self[$key]? | type) == "object") as $present |
    if $present then
      [
        (($self[$key].style? | sv) as $ts |
         if ($ts | is_blank) then empty
         elif (toast_styles | index($ts)) == null then
           "\($p): unknown \($key).style \"\($ts)\" (expected success, error, or info)"
         else empty end)
      ]
    else [] end;
  def scriptErrors:
    if (($self.script? | sv) | is_blank | not) then
      (($self.script? | sv) as $sc |
       if ($sc | startswith("/")) or ($sc | startswith("~")) or ($sc | contains(":")) or ($sc | test("(^|/)\\.\\.(/|$)")) then
         ["\($p): script path escapes extension directory \"\($sc)\""]
       else [] end)
    else [] end;
  ($self | option_dups($p)) +
  [
    (($self.type // "url") | ascii_downcase) as $t |
    if (known_kinds | index($t)) == null then
      "\($p): unknown action type \"\($t)\""
    elif ($t == "keypress" or $t == "keys") then
      (if (($self.keyPress? | sv) | is_blank) then "\($p): missing required field keyPress" else empty end)
    elif ($t == "shortcut" or $t == "keyboardshortcut") then
      (if (($self.shortcutName? | sv) | is_blank) then "\($p): missing required field shortcutName" else empty end)
    elif ($t == "group" or $t == "subactions") then
      (if (($self.subActions? | type) != "array" or (($self.subActions // []) | length) == 0) then "\($p): group requires non-empty subActions" else empty end)
    elif ($t == "service" or $t == "servicemenu") then
      empty
    else
      (if ($self | has_payload | not) then "\($p): missing required payload (url, script, or scriptCode)" else empty end)
    end
  ] + secondaryErrors + toastErrors("toast") + toastErrors("secondaryToast") + toastErrors("secondary-toast") + scriptErrors + subErrors;

# ---- top-level ----
. as $m |
def manifest_actions:
  if (($m.actions? | type) == "array") then $m.actions
  elif (($m.action? | type) == "object") then [$m.action]
  else [] end;

[
  (if (($m.identifier? | sv) | is_blank) then "manifest: missing identifier" else empty end),
  (if (($m.identifier? | sv) | test("^[A-Za-z0-9-]+(\\.[A-Za-z0-9-]+)+$") | not) then "manifest: identifier should be reverse-DNS (e.g. com.example.name)" else empty end),
  (if (($m.name? | is_valid_text) | not) then "manifest: missing name" else empty end),
  (if (($m.capabilities? // []) | length) > 0 then "manifest: capabilities must be empty or absent (host knows none)" else empty end),
  ($m | option_dups("manifest")),
  (manifest_actions as $acts
   | if ($acts | length) == 0 then ["manifest: requires actions (array) or action (object)"]
     else [$acts | range(0; length) as $i | $acts[$i] | check_action("actions[\($i)]")] | add
     end)
]
| flatten
EOF
    )

    local ERRORS
    ERRORS="$(jq -r "$JQ_PROGRAM | .[]" "$MANIFEST" 2>/dev/null)"
    if [ -n "$ERRORS" ]; then
        echo "✗ $MANIFEST failed validation:" >&2
        printf '  %s\n' "$ERRORS" >&2
        return 1
    fi

    # Check script references
    local MISSING=""
    local real_base
    real_base="$(cd "$SRC_DIR" && pwd -P)"
    while IFS= read -r script; do
        [ -n "$script" ] || continue
        case "$script" in
            /*|~*|*:*)
                echo "✗ $MANIFEST unsafe script path: $script" >&2
                return 1
                ;;
        esac
        if [ ! -f "$SRC_DIR/$script" ]; then
            MISSING="$MISSING missing script file: $script;"
        fi
    done < <(jq -r '[.. | objects | .script?] | map(select(type == "string" and length > 0)) | unique[]' "$MANIFEST")

    if [ -n "$MISSING" ]; then
        echo "✗ $MANIFEST references missing script file(s): $MISSING" >&2
        return 1
    fi

    # Check local icon file references
    local MISSING_ICON=""
    while IFS= read -r icon; do
        [ -n "$icon" ] || continue
        case "$icon" in
            symbol\(*|symbol:*|http://*|https://*) continue ;;
        esac
        local icon_lower
        icon_lower="$(printf '%s' "$icon" | tr '[:upper:]' '[:lower:]')"
        case "$icon_lower" in
            *.png|*.jpg|*.jpeg|*.icns|*.gif|*.svg)
                if [ ! -f "$SRC_DIR/$icon" ]; then
                    MISSING_ICON="$MISSING_ICON missing icon file: $icon;"
                fi
                ;;
            *) continue ;;
        esac
    done < <(jq -r '[.. | objects | .icon?] | map(select(type == "string" and length > 0)) | unique[]' "$MANIFEST")

    if [ -n "$MISSING_ICON" ]; then
        echo "✗ $MANIFEST references missing local icon file(s): $MISSING_ICON" >&2
        return 1
    fi

    echo "✓ Valid: $(basename "$SRC_DIR") ($MANIFEST)"
    return 0
}

TARGET="${1:-}"

if [ -z "$TARGET" ] || [ "$TARGET" = "--all" ] || [ "$TARGET" = "-a" ]; then
    echo "Validating all extensions in $REPO_ROOT/raw/*.openclipext ..."
    FAILED=0
    TOTAL=0
    for pkg in "$REPO_ROOT/raw"/*.openclipext; do
        [ -d "$pkg" ] || continue
        TOTAL=$((TOTAL + 1))
        if ! validate_single "$pkg"; then
            FAILED=$((FAILED + 1))
        fi
    done
    echo "----------------------------------------"
    if [ "$FAILED" -eq 0 ]; then
        echo "✓ All $TOTAL extensions passed validation!"
        exit 0
    else
        echo "✗ $FAILED of $TOTAL extensions failed validation." >&2
        exit 1
    fi
else
    validate_single "$TARGET"
    exit $?
fi
