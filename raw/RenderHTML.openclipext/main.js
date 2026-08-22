function action() {
  const text = openclip.input.text;
  if (!text || text.trim().length === 0) return;

  openclip.pasteContent({
    'public.html': text,
    'public.utf8-plain-text': text
  });
}
