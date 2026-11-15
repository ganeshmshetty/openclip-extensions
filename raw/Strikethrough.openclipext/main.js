function action() {
    const app = openclip.input.app || {};
    const bundleID = (app.bundleID || "").toLowerCase();
    const name = (app.name || "").toLowerCase();

    // Apple Pages, Keynote, Numbers
    if (bundleID.startsWith("com.apple.iwork")) {
        openclip.keyPress("-", ["command", "control"]);
    }
    // Bean, Scrivener, UpNote
    else if (bundleID.includes("scrivener") || bundleID.includes("upnote") || name === "bean" || name.startsWith("scrivener") || name === "upnote") {
        openclip.keyPress("-", ["command", "shift"]);
    }
    // Apple Notes, Bear, Notion, Craft
    else if (bundleID === "com.apple.notes" || bundleID.includes("notion") || bundleID.includes("bear") || bundleID.includes("craft")) {
        openclip.keyPress("s", ["command", "shift"]);
    }
    // Microsoft Word / Office, Google Docs, Slack, Discord, and universal default
    else {
        openclip.keyPress("x", ["command", "shift"]);
    }
}
