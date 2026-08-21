function action() {
    const bundleID = (openclip.input.app && openclip.input.app.bundleID) || "";
    
    // Apple Pages, Keynote, Numbers
    if (bundleID.startsWith("com.apple.iWork")) {
        openclip.keyPress("-", ["command", "control"]);
    } 
    // Apple Notes, Bear, Notion, Craft
    else if (bundleID === "com.apple.Notes" || bundleID.includes("notion") || bundleID.includes("bear") || bundleID.includes("craft")) {
        openclip.keyPress("s", ["command", "shift"]);
    } 
    // Microsoft Word / Office, Google Docs, Slack, Discord, and universal default
    else {
        openclip.keyPress("x", ["command", "shift"]);
    }
}
