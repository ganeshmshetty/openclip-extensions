// Urlquery · Scan
// Submits the selection for a fresh sandbox scan, polls until the report is
// ready, and returns a text summary (alert counts, final URL, IP, tags, top
// alerts, report link). Delivered as text, so OpenClip's "when an action
// returns text" preference decides between the result card, paste, and copy.
// A secondary click (right-click / ⇧-click) opens the report in the browser.
//
// Scans usually take 30–90 seconds and OpenClip stops async scripts after 60,
// so polling is capped: when time runs out the queue page opens in the browser
// and shows the report as soon as urlquery finishes.

var api = require('./lib/api.js');
var urls = require('./lib/url.js');
var fmt = require('./lib/format.js');

var POLL_MS = 3000;          // urlquery's own client polls every 3 s
var BUDGET_MS = 48000;       // stay well under the 60 s host watchdog
var DETAIL_RESERVE_MS = 8000; // only fetch alert details with this much time left
var ACCESS_LEVELS = { public: true, restricted: true, private: true };

function fail(error) {
  if (api.isApiError(error) && error.code === 'unauthorized') {
    openclip.requireConfiguration({ reason: fmt.errorMessage(error), missing: ['apiKey'] });
    return;
  }
  openclip.toast(fmt.errorMessage(error), 'error');
}

function accessLevel() {
  var value = api.option('access').toLowerCase();
  return ACCESS_LEVELS[value] ? value : 'public';
}

async function action(selection) {
  var parsed = urls.parse(typeof selection === 'string' ? selection : (openclip.input && openclip.input.text));
  if (!parsed) {
    openclip.toast(fmt.t(fmt.STRINGS.errors.notUrl), 'error');
    return;
  }
  var secondary = !!(openclip.input && openclip.input.isSecondaryClick);
  var started = Date.now();

  // 1. Submit
  var job;
  try {
    job = await api.submit(parsed.input, accessLevel());
  } catch (e) {
    fail(e);
    return;
  }
  var queueId = String(job.queue_id || '');
  var reportId = String(job.report_id || '');
  var status = String(job.status || '');
  if (!queueId && !reportId) {
    openclip.toast(fmt.t(fmt.STRINGS.errors.noQueue), 'error');
    return;
  }

  // 2. Poll
  try {
    while (!api.isDone(status) && !api.isFailed(status) && queueId && Date.now() - started < BUDGET_MS) {
      await api.wait(POLL_MS);
      job = await api.queueStatus(queueId);
      status = String(job.status || status);
      if (job.report_id) reportId = String(job.report_id);
    }
  } catch (e) {
    fail(e);
    return;
  }

  if (api.isFailed(status)) {
    openclip.toast(fmt.fill(fmt.t(fmt.STRINGS.errors.scanFailed), { host: parsed.display }), 'error');
    return;
  }
  if (!api.isDone(status) || !reportId) {
    // Out of time: hand over to the website, which refreshes into the report.
    openclip.toast(fmt.fill(fmt.t(fmt.STRINGS.scan.stillScanning), { host: parsed.display }), 'info');
    openclip.openURL(queueId ? api.queueURL(queueId) : api.searchURL(urls.searchQuery(parsed)));
    return;
  }

  var link = api.reportURL(reportId);
  if (secondary) {
    openclip.openURL(link);
    return;
  }

  // 3. Summarise
  var overview;
  try {
    overview = await api.reportOverview(reportId);
  } catch (e) {
    if (api.isApiError(e) && (e.code === 'not-found' || e.code === 'http')) {
      try {
        overview = await api.report(reportId);
      } catch (inner) {
        fail(inner);
        return;
      }
    } else {
      fail(e);
      return;
    }
  }

  var alerts = [];
  var counts = fmt.alertCounts(overview);
  if (counts.total > 0) {
    if (overview.sensors) {
      alerts = fmt.collectAlerts(overview);
    } else if (Date.now() - started < BUDGET_MS - DETAIL_RESERVE_MS) {
      try {
        alerts = fmt.collectAlerts(await api.report(reportId));
      } catch (e) {
        alerts = []; // the counts line and report link still tell the story
      }
    }
  }

  return fmt.scanReport(overview, alerts, link);
}

module.exports = action;
