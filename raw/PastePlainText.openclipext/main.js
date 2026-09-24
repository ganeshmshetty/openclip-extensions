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

  if (openclip && openclip.paste) {
    openclip.paste(text);
  }
}
