function action(sel) {
  var text = sel || openclip.input.text;
  try {
    return decodeURIComponent(text);
  } catch (e) {
    if (openclip && openclip.toast) {
      var msg = (openclip.i18n) ? openclip.i18n({
        en: 'Invalid percent-encoded input',
        'zh-Hans': '无效的百分号编码输入',
        'zh-Hant': '無效的百分比編碼輸入',
        ja: '無効なパーセントエンコード入力',
        fr: 'Entrée encodée en pourcentage invalide'
      }) : 'Invalid percent-encoded input';
      openclip.toast(msg, 'error');
    }
    return null;
  }
}

module.exports = action;
module.exports.action = action;
