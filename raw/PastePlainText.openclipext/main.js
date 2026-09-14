function action() {
  var pasteboard = (typeof openclip !== 'undefined' && openclip.pasteboard) ? openclip.pasteboard : null;
  var text = pasteboard ? pasteboard.text : '';

  if (!text || text.length === 0) {
    var emptyMsg = (openclip && openclip.i18n) ? openclip.i18n({
      en: 'Clipboard is empty',
      'zh-Hans': '剪贴板为空',
      'zh-Hant': '剪貼簿為空',
      ja: 'クリップボードが空です',
      fr: 'Presse-papiers vide'
    }) : 'Clipboard is empty';

    if (openclip && openclip.toast) {
      openclip.toast(emptyMsg, 'info');
    }
    return;
  }

  var isSecondary = Boolean(openclip && openclip.input && openclip.input.isSecondaryClick);

  if (isSecondary) {
    // Secondary click (Right-click or Shift-click):
    // Sanitize clipboard in place and remove all rich formatting
    pasteboard.text = text;

    var sanitizedMsg = (openclip && openclip.i18n) ? openclip.i18n({
      en: 'Clipboard converted to plain text',
      'zh-Hans': '剪贴板已转为纯文本',
      'zh-Hant': '剪貼簿已轉為純文字',
      ja: 'クリップボードをプレーンテキストに変換しました',
      fr: 'Presse-papiers converti en texte brut'
    }) : 'Clipboard converted to plain text';

    if (openclip && openclip.toast) {
      openclip.toast(sanitizedMsg, 'success');
    }
  } else {
    // Primary click:
    // Paste plain text directly into the frontmost app
    if (openclip && openclip.paste) {
      openclip.paste(text);
    }
  }
}
