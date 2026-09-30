// Human-facing formatting for Urlquery commands: localized strings, dates,
// error messages, and the Scan / Past Scans reports. Falls back to English
// when openclip.i18n is unavailable.

var api = require('./api.js');

// ---------------------------------------------------------------- i18n

function t(dict) {
  if (typeof openclip !== 'undefined' && openclip && typeof openclip.i18n === 'function') {
    try {
      var value = openclip.i18n(dict);
      if (typeof value === 'string' && value) return value;
    } catch (e) { /* fall through */ }
  }
  return dict.en;
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, function (match, key) {
    return values[key] != null ? String(values[key]) : match;
  });
}

function localeTag() {
  if (typeof openclip === 'undefined' || !openclip) return undefined;
  var tag = openclip.locale || openclip.language;
  if (!tag || typeof tag !== 'string') return undefined;
  return tag.replace(/_/g, '-');
}

var STRINGS = {
  errors: {
    notUrl: { en: 'Select a URL, domain or IP address first', 'zh-Hans': '请先选择一个网址、域名或 IP 地址', 'zh-Hant': '請先選取一個網址、網域或 IP 位址', fr: 'Sélectionnez d’abord une URL, un domaine ou une adresse IP', ja: 'まず URL、ドメイン、または IP アドレスを選択してください' },
    network: { en: 'Could not reach {host}', 'zh-Hans': '无法连接 {host}', 'zh-Hant': '無法連線 {host}', fr: 'Impossible de joindre {host}', ja: '{host} に接続できません' },
    unauthorized: { en: 'urlquery rejected the API key · check it in this command’s settings', 'zh-Hans': 'urlquery 拒绝了 API 密钥 · 请在此命令的设置中检查', 'zh-Hant': 'urlquery 拒絕了 API 金鑰 · 請在此命令的設定中檢查', fr: 'urlquery a refusé la clé API · vérifiez-la dans les réglages de cette commande', ja: 'urlquery が API キーを拒否しました · このコマンドの設定を確認してください' },
    forbidden: { en: 'urlquery refused this request · the report may belong to another account', 'zh-Hans': 'urlquery 拒绝了此请求 · 该报告可能属于其他账户', 'zh-Hant': 'urlquery 拒絕了此請求 · 該報告可能屬於其他帳號', fr: 'urlquery a refusé cette requête · le rapport appartient peut-être à un autre compte', ja: 'urlquery がこのリクエストを拒否しました · 別のアカウントのレポートかもしれません' },
    'rate-limited': { en: 'urlquery rate limit reached · try again in a minute', 'zh-Hans': '已达到 urlquery 速率限制 · 请一分钟后重试', 'zh-Hant': '已達到 urlquery 速率限制 · 請一分鐘後重試', fr: 'Limite de requêtes urlquery atteinte · réessayez dans une minute', ja: 'urlquery のレート制限に達しました · 1 分後にもう一度お試しください' },
    invalid: { en: 'urlquery rejected this URL', 'zh-Hans': 'urlquery 拒绝了此网址', 'zh-Hant': 'urlquery 拒絕了此網址', fr: 'urlquery a rejeté cette URL', ja: 'urlquery がこの URL を受け付けませんでした' },
    'not-found': { en: 'urlquery has no record of this', 'zh-Hans': 'urlquery 没有相关记录', 'zh-Hant': 'urlquery 沒有相關記錄', fr: 'urlquery n’a aucune trace de ceci', ja: 'urlquery に該当する記録がありません' },
    http: { en: 'urlquery error {status}', 'zh-Hans': 'urlquery 错误 {status}', 'zh-Hant': 'urlquery 錯誤 {status}', fr: 'Erreur urlquery {status}', ja: 'urlquery エラー {status}' },
    scanFailed: { en: 'urlquery could not scan {host}', 'zh-Hans': 'urlquery 无法扫描 {host}', 'zh-Hant': 'urlquery 無法掃描 {host}', fr: 'urlquery n’a pas pu analyser {host}', ja: 'urlquery は {host} をスキャンできませんでした' },
    noQueue: { en: 'urlquery accepted the URL but returned no queue ID', 'zh-Hans': 'urlquery 已接受网址，但未返回队列 ID', 'zh-Hant': 'urlquery 已接受網址，但未回傳佇列 ID', fr: 'urlquery a accepté l’URL mais n’a renvoyé aucun identifiant de file', ja: 'urlquery は URL を受け付けましたが、キュー ID を返しませんでした' },
    unknown: { en: 'Something went wrong talking to urlquery', 'zh-Hans': '与 urlquery 通信时出错', 'zh-Hant': '與 urlquery 通訊時出錯', fr: 'Un problème est survenu avec urlquery', ja: 'urlquery との通信中に問題が発生しました' }
  },
  reputation: {
    flagged: { en: 'Flagged as {verdict} · {host}', 'zh-Hans': '被标记为{verdict} · {host}', 'zh-Hant': '被標記為{verdict} · {host}', fr: 'Signalé comme {verdict} · {host}', ja: '{verdict}として報告済み · {host}' },
    clean: { en: 'No reputation alerts · {host}', 'zh-Hans': '无信誉警报 · {host}', 'zh-Hant': '無信譽警報 · {host}', fr: 'Aucune alerte de réputation · {host}', ja: '評判に関する警告なし · {host}' },
    noData: { en: 'No reputation data for {host}', 'zh-Hans': '{host} 没有信誉数据', 'zh-Hant': '{host} 沒有信譽資料', fr: 'Aucune donnée de réputation pour {host}', ja: '{host} の評判データはありません' }
  },
  verdicts: {
    malware: { en: 'malware', 'zh-Hans': '恶意软件', 'zh-Hant': '惡意軟體', fr: 'malware', ja: 'マルウェア' },
    phishing: { en: 'phishing', 'zh-Hans': '钓鱼网站', 'zh-Hant': '釣魚網站', fr: 'phishing', ja: 'フィッシング' },
    fraud: { en: 'fraud', 'zh-Hans': '欺诈', 'zh-Hant': '詐騙', fr: 'fraude', ja: '詐欺' },
    suspicious: { en: 'suspicious', 'zh-Hans': '可疑', 'zh-Hant': '可疑', fr: 'suspect', ja: '不審' },
    malicious: { en: 'malicious', 'zh-Hans': '恶意', 'zh-Hant': '惡意', fr: 'malveillant', ja: '悪意あり' }
  },
  severity: {
    critical: { en: 'Critical', 'zh-Hans': '严重', 'zh-Hant': '嚴重', fr: 'Critique', ja: '重大' },
    high: { en: 'High', 'zh-Hans': '高', 'zh-Hant': '高', fr: 'Élevée', ja: '高' },
    medium: { en: 'Medium', 'zh-Hans': '中', 'zh-Hant': '中', fr: 'Moyenne', ja: '中' },
    low: { en: 'Low', 'zh-Hans': '低', 'zh-Hant': '低', fr: 'Faible', ja: '低' },
    info: { en: 'Info', 'zh-Hans': '信息', 'zh-Hant': '資訊', fr: 'Info', ja: '情報' }
  },
  scan: {
    alertsMany: { en: '{count} alerts · {urlquery} urlquery · {ids} IDS · {analyzer} analyzer', 'zh-Hans': '{count} 条警报 · urlquery {urlquery} · IDS {ids} · 分析器 {analyzer}', 'zh-Hant': '{count} 則警報 · urlquery {urlquery} · IDS {ids} · 分析器 {analyzer}', fr: '{count} alertes · {urlquery} urlquery · {ids} IDS · {analyzer} analyseur', ja: '警告 {count} 件 · urlquery {urlquery} · IDS {ids} · アナライザー {analyzer}' },
    alertsOne: { en: '1 alert · {urlquery} urlquery · {ids} IDS · {analyzer} analyzer', 'zh-Hans': '1 条警报 · urlquery {urlquery} · IDS {ids} · 分析器 {analyzer}', 'zh-Hant': '1 則警報 · urlquery {urlquery} · IDS {ids} · 分析器 {analyzer}', fr: '1 alerte · {urlquery} urlquery · {ids} IDS · {analyzer} analyseur', ja: '警告 1 件 · urlquery {urlquery} · IDS {ids} · アナライザー {analyzer}' },
    noAlerts: { en: 'No alerts', 'zh-Hans': '无警报', 'zh-Hant': '無警報', fr: 'Aucune alerte', ja: '警告なし' },
    stillScanning: { en: 'Still scanning {host} · opening the queue page', 'zh-Hans': '仍在扫描 {host} · 正在打开队列页面', 'zh-Hant': '仍在掃描 {host} · 正在開啟佇列頁面', fr: 'Analyse de {host} en cours · ouverture de la file d’attente', ja: '{host} をスキャン中 · キューページを開きます' },
    title: { en: 'Title', 'zh-Hans': '标题', 'zh-Hant': '標題', fr: 'Titre', ja: 'タイトル' },
    ip: { en: 'IP', 'zh-Hans': 'IP', 'zh-Hant': 'IP', fr: 'IP', ja: 'IP' },
    tags: { en: 'Tags', 'zh-Hans': '标签', 'zh-Hant': '標籤', fr: 'Étiquettes', ja: 'タグ' },
    scanned: { en: 'Scanned', 'zh-Hans': '扫描时间', 'zh-Hant': '掃描時間', fr: 'Analysé', ja: 'スキャン日時' },
    alerts: { en: 'Alerts', 'zh-Hans': '警报', 'zh-Hant': '警報', fr: 'Alertes', ja: '警告' },
    report: { en: 'Report', 'zh-Hans': '报告', 'zh-Hant': '報告', fr: 'Rapport', ja: 'レポート' },
    moreAlerts: { en: '… and {count} more', 'zh-Hans': '… 还有 {count} 条', 'zh-Hant': '… 還有 {count} 則', fr: '… et {count} de plus', ja: '… 他 {count} 件' }
  },
  history: {
    headerMany: { en: '{count} past scans of {target}', 'zh-Hans': '{target} 的 {count} 次历史扫描', 'zh-Hant': '{target} 的 {count} 次歷史掃描', fr: '{count} analyses précédentes de {target}', ja: '{target} の過去のスキャン {count} 件' },
    headerOne: { en: '1 past scan of {target}', 'zh-Hans': '{target} 的 1 次历史扫描', 'zh-Hant': '{target} 的 1 次歷史掃描', fr: '1 analyse précédente de {target}', ja: '{target} の過去のスキャン 1 件' },
    headerTruncated: { en: '{total} past scans of {target} · newest {count}', 'zh-Hans': '{target} 的 {total} 次历史扫描 · 最新 {count} 次', 'zh-Hant': '{target} 的 {total} 次歷史掃描 · 最新 {count} 次', fr: '{total} analyses précédentes de {target} · les {count} plus récentes', ja: '{target} の過去のスキャン {total} 件 · 最新 {count} 件' },
    none: { en: 'No scans of {target} yet · use Scan to create one', 'zh-Hans': '{target} 尚无扫描记录 · 使用“扫描”创建一个', 'zh-Hant': '{target} 尚無掃描記錄 · 使用「掃描」建立一個', fr: 'Aucune analyse de {target} · utilisez Analyser pour en créer une', ja: '{target} のスキャンはまだありません · 「スキャン」で作成できます' },
    alertsMany: { en: '{count} alerts', 'zh-Hans': '{count} 条警报', 'zh-Hant': '{count} 則警報', fr: '{count} alertes', ja: '警告 {count} 件' },
    alertsOne: { en: '1 alert', 'zh-Hans': '1 条警报', 'zh-Hant': '1 則警報', fr: '1 alerte', ja: '警告 1 件' },
    noAlerts: { en: 'no alerts', 'zh-Hans': '无警报', 'zh-Hant': '無警報', fr: 'aucune alerte', ja: '警告なし' },
    allReports: { en: 'All reports', 'zh-Hans': '全部报告', 'zh-Hant': '全部報告', fr: 'Tous les rapports', ja: 'すべてのレポート' }
  }
};

// ---------------------------------------------------------------- errors

function errorMessage(error) {
  if (!api.isApiError(error)) {
    var raw = error && error.message ? String(error.message) : '';
    return raw ? t(STRINGS.errors.unknown) + ' · ' + raw : t(STRINGS.errors.unknown);
  }
  var dict = STRINGS.errors[error.code] || STRINGS.errors.unknown;
  var message = fill(t(dict), { host: api.HOST, status: error.status || '' });
  if (error.detail && (error.code === 'network' || error.code === 'invalid' || error.code === 'http')) {
    message += ' · ' + error.detail;
  }
  return message;
}

// ---------------------------------------------------------------- time

function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function toDate(value) {
  if (value == null || value === '') return null;
  var date = typeof value === 'number' ? new Date(value < 1e12 ? value * 1000 : value) : new Date(String(value));
  return isNaN(date.getTime()) ? null : date;
}

function formatAbsolute(value) {
  var date = toDate(value);
  if (!date) return String(value == null ? '' : value);
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat(localeTag(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
    }
  } catch (e) { /* fall through */ }
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) +
    ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
}

var UNITS = [
  { name: 'year', seconds: 31536000 },
  { name: 'month', seconds: 2592000 },
  { name: 'day', seconds: 86400 },
  { name: 'hour', seconds: 3600 },
  { name: 'minute', seconds: 60 },
  { name: 'second', seconds: 1 }
];

// "3 hours ago" / "in 2 days" relative to now.
function formatRelative(value, now) {
  var date = toDate(value);
  if (!date) return '';
  var nowMs = now == null ? Date.now() : now;
  var delta = Math.round((date.getTime() - nowMs) / 1000);
  var magnitude = Math.abs(delta);
  var unit = UNITS[UNITS.length - 1];
  for (var i = 0; i < UNITS.length; i++) {
    if (magnitude >= UNITS[i].seconds) { unit = UNITS[i]; break; }
  }
  var count = Math.round(magnitude / unit.seconds);
  if (count === 0) count = 1;
  var signed = delta < 0 ? -count : count;
  try {
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      return new Intl.RelativeTimeFormat(localeTag(), { numeric: 'always' }).format(signed, unit.name);
    }
  } catch (e) { /* fall through */ }
  var label = count + ' ' + unit.name + (count === 1 ? '' : 's');
  return delta < 0 ? label + ' ago' : 'in ' + label;
}

// ---------------------------------------------------------------- report data

function str(value) {
  return value == null ? '' : String(value);
}

function urlAddr(url) {
  if (!url) return '';
  if (typeof url === 'string') return url;
  return str(url.addr || url.fqdn || url.domain);
}

function alertCounts(overview) {
  var stats = (overview && overview.stats && overview.stats.alert_count) || {};
  var ids = Number(stats.ids) || 0;
  var urlquery = Number(stats.urlquery) || 0;
  var analyzer = Number(stats.analyzer) || 0;
  return { total: ids + urlquery + analyzer, ids: ids, urlquery: urlquery, analyzer: analyzer };
}

var SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

function severityLabel(severity) {
  var key = str(severity).toLowerCase();
  var dict = STRINGS.severity[key];
  return dict ? t(dict) : (key ? key.charAt(0).toUpperCase() + key.slice(1) : '');
}

function verdictLabel(verdict) {
  var key = str(verdict).toLowerCase();
  var dict = STRINGS.verdicts[key];
  return dict ? t(dict) : key;
}

// Flattens sensors.{urlquery,ids,analyzer} from a full report into one list
// of { alert, severity, verdict, sensor }, highest severity first, de-duplicated.
function collectAlerts(report) {
  var sensors = (report && report.sensors) || {};
  var out = [];
  function push(alert, fallbackSensor) {
    if (!alert) return;
    var text = str(alert.alert || alert.description || alert.trigger).trim();
    if (!text) return;
    out.push({
      alert: text,
      severity: str(alert.severity).toLowerCase(),
      verdict: str(alert.verdict).toLowerCase(),
      sensor: str(alert.sensor_name || fallbackSensor)
    });
  }
  (sensors.urlquery || []).forEach(function (a) { push(a, 'urlquery'); });
  (sensors.ids || []).forEach(function (sensor) {
    (sensor && sensor.alerts || []).forEach(function (a) { push(a, sensor.sensor_name || 'IDS'); });
  });
  (sensors.analyzer || []).forEach(function (sensor) {
    (sensor && sensor.alerts || []).forEach(function (a) { push(a, sensor.sensor_name || 'analyzer'); });
  });
  var seen = {};
  var unique = out.filter(function (a) {
    var key = a.alert.toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
  unique.sort(function (a, b) {
    var ra = SEVERITY_RANK[a.severity] != null ? SEVERITY_RANK[a.severity] : 9;
    var rb = SEVERITY_RANK[b.severity] != null ? SEVERITY_RANK[b.severity] : 9;
    return ra - rb;
  });
  return unique;
}

function ipLine(ip) {
  if (!ip || typeof ip !== 'object') return '';
  var parts = [];
  if (ip.addr) parts.push(t(STRINGS.scan.ip) + ' ' + ip.addr);
  var asn = ip.asn ? 'AS' + ip.asn : '';
  var asName = str(ip.as).trim();
  if (asn && asName) parts.push(asn + ' ' + asName);
  else if (asn || asName) parts.push(asn || asName);
  var country = str(ip.country_code || ip.country).trim();
  if (country) parts.push(country.toUpperCase());
  return parts.join(' · ');
}

var MAX_ALERT_LINES = 6;

// Text card for a finished scan: alert counts, start → final URL, title, IP,
// tags, scan time, top alerts, and the report link.
function scanReport(overview, alerts, reportLink) {
  var counts = alertCounts(overview);
  var lines = [];

  if (counts.total === 0) lines.push(t(STRINGS.scan.noAlerts));
  else lines.push(fill(t(counts.total === 1 ? STRINGS.scan.alertsOne : STRINGS.scan.alertsMany), { count: counts.total, urlquery: counts.urlquery, ids: counts.ids, analyzer: counts.analyzer }));

  var start = urlAddr(overview && overview.url);
  var finalUrl = urlAddr(overview && overview.final && overview.final.url);
  if (start && finalUrl && finalUrl !== start) lines.push(start + ' → ' + finalUrl);
  else if (start || finalUrl) lines.push(start || finalUrl);

  var title = str(overview && overview.final && overview.final.title).trim();
  if (title) lines.push(t(STRINGS.scan.title) + ': ' + title);

  var ip = ipLine(overview && overview.ip);
  if (ip) lines.push(ip);

  var tags = (overview && Array.isArray(overview.tags)) ? overview.tags.filter(Boolean) : [];
  if (tags.length) lines.push(t(STRINGS.scan.tags) + ': ' + tags.join(', '));

  if (overview && overview.date) {
    lines.push(t(STRINGS.scan.scanned) + ': ' + formatAbsolute(overview.date) + ' (' + formatRelative(overview.date) + ')');
  }

  if (alerts && alerts.length) {
    lines.push('');
    lines.push(t(STRINGS.scan.alerts) + ':');
    alerts.slice(0, MAX_ALERT_LINES).forEach(function (a) {
      var parts = [];
      var sev = severityLabel(a.severity);
      if (sev) parts.push(sev);
      parts.push(a.alert);
      if (a.verdict) parts.push(verdictLabel(a.verdict));
      if (a.sensor) parts.push(a.sensor);
      lines.push('• ' + parts.join(' · '));
    });
    if (alerts.length > MAX_ALERT_LINES) lines.push(fill(t(STRINGS.scan.moreAlerts), { count: alerts.length - MAX_ALERT_LINES }));
  }

  lines.push('');
  lines.push(t(STRINGS.scan.report) + ': ' + reportLink);
  return lines.join('\n');
}

function historyAlerts(count) {
  if (count === 0) return t(STRINGS.history.noAlerts);
  if (count === 1) return t(STRINGS.history.alertsOne);
  return fill(t(STRINGS.history.alertsMany), { count: count });
}

// Text card listing past scans of a hostname or IP, newest first. `totalHits`
// is the number urlquery matched, which can exceed the number listed.
function historyReport(target, reports, searchLink, totalHits) {
  var sorted = reports.slice().sort(function (a, b) {
    var da = toDate(a && a.date), db = toDate(b && b.date);
    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
  });
  var header = totalHits != null && totalHits > sorted.length
    ? fill(t(STRINGS.history.headerTruncated), { total: totalHits, target: target, count: sorted.length })
    : fill(t(sorted.length === 1 ? STRINGS.history.headerOne : STRINGS.history.headerMany), { count: sorted.length, target: target });
  var lines = [header];
  sorted.forEach(function (r) {
    var counts = alertCounts(r);
    var when = r && r.date ? formatAbsolute(r.date) : '';
    var scanned = urlAddr(r && r.url) || urlAddr(r && r.final && r.final.url);
    var head = [when, historyAlerts(counts.total), scanned].filter(Boolean).join(' · ');
    lines.push('• ' + head);
    var id = str(r && (r.report_id || r.id));
    if (id) lines.push('  ' + api.reportURL(id));
  });
  if (searchLink) {
    lines.push('');
    lines.push(t(STRINGS.history.allReports) + ': ' + searchLink);
  }
  return lines.join('\n');
}

module.exports = {
  t: t,
  fill: fill,
  STRINGS: STRINGS,
  errorMessage: errorMessage,
  formatAbsolute: formatAbsolute,
  formatRelative: formatRelative,
  alertCounts: alertCounts,
  collectAlerts: collectAlerts,
  severityLabel: severityLabel,
  verdictLabel: verdictLabel,
  scanReport: scanReport,
  historyReport: historyReport
};
