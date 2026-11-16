function action() {
    const app = openclip.input.app || {};
    const bundleID = (app.bundleID || "").toLowerCase();
    const name = (app.name || "").toLowerCase();

    // Notion uses its own shortcut.
    if (bundleID.includes("notion")) {
        openclip.keyPress("s", ["command", "shift"]);
    }
    // Scrivener and Craft use Shift-Command-Minus.
    else if (bundleID.includes("scrivener") || name.startsWith("scrivener")
             || name === "craft" || bundleID.includes("lukilabs")) {
        openclip.keyPress("-", ["command", "shift"]);
    }
    // Bean and Bear use Shift-Command-U.
    else if (name === "bean" || name === "bear"
             || bundleID.includes("bean-osx") || bundleID.includes("shinyfrog")) {
        openclip.keyPress("u", ["command", "shift"]);
    }
    // Pages, Keynote, Numbers, UpNote, Notes (when assigned), and most other editors.
    else {
        openclip.keyPress("x", ["command", "shift"]);
    }
}
