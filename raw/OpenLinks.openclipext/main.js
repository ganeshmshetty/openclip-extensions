function action() {
  const urls = [...new Set(openclip.input.detected.urls)];
  for (const url of urls) {
    openclip.openURL(url);
  }
}
