function getOption(id, fallback) {
  var val;
  if (typeof openclip.option === 'function') {
    val = openclip.option(id);
  } else if (openclip.options && openclip.options[id] !== undefined) {
    val = openclip.options[id];
  }
  return (val !== undefined && val !== null && val !== '') ? val : fallback;
}

function pad2(value) {
  return value < 10 ? '0' + value : String(value);
}

function offsetSuffix(date) {
  var offset = -date.getTimezoneOffset();
  var sign = offset >= 0 ? '+' : '-';
  var abs = Math.abs(offset);
  return sign + pad2(Math.floor(abs / 60)) + pad2(abs % 60);
}

// Noon keeps the chosen day stable when TickTick converts the timestamp to its own time zone.
function allDayTimestamp(date) {
  return date.getFullYear() + '-' +
    pad2(date.getMonth() + 1) + '-' +
    pad2(date.getDate()) + 'T12:00:00.000' + offsetSuffix(date);
}

function priorityValue(raw) {
  switch (String(raw || 'none').toLowerCase()) {
    case 'low': return 1;
    case 'medium': return 3;
    case 'high': return 5;
    default: return 0;
  }
}

function splitTags(raw) {
  var seen = {};
  return String(raw || '')
    .split(',')
    .map(function(tag) { return tag.trim(); })
    .filter(function(tag) {
      if (!tag) return false;
      var key = tag.toLowerCase();
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
}

function splitTitleAndNotes(text, splitNotes) {
  if (!splitNotes) {
    return { title: text, notes: '' };
  }

  var lines = text.split(/\r?\n/);
  var start = -1;
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].trim()) {
      start = i;
      break;
    }
  }
  if (start === -1) {
    return { title: '', notes: '' };
  }
  return {
    title: lines[start].trim(),
    notes: lines.slice(start + 1).join('\n').trim()
  };
}

function action(selection) {
  var text = (typeof selection === 'string'
    ? selection
    : (selection && selection.text) || (openclip.input && openclip.input.text) || ''
  ).trim();

  if (!text) {
    return;
  }

  var splitNotes = String(getOption('splitNotes', 'false')).toLowerCase() === 'true';
  var parts = splitTitleAndNotes(text, splitNotes);
  if (!parts.title) {
    return;
  }

  var params = ['title=' + encodeURIComponent(parts.title)];

  if (parts.notes) {
    params.push('content=' + encodeURIComponent(parts.notes));
  }

  var list = String(getOption('list', '')).trim();
  if (list) {
    params.push('list=' + encodeURIComponent(list));
  }

  var tags = splitTags(getOption('tags', ''));
  if (tags.length) {
    params.push('tags=' + encodeURIComponent(tags.join(',')));
  }

  var priority = priorityValue(getOption('priority', 'none'));
  if (priority > 0) {
    params.push('priority=' + priority);
  }

  var when = String(getOption('when', 'none')).toLowerCase();
  if (when === 'today' || when === 'tomorrow') {
    var date = new Date();
    if (when === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    params.push('startDate=' + encodeURIComponent(allDayTimestamp(date)));
    params.push('allDay=true');
  }

  openclip.openURL('ticktick://x-callback-url/v1/add_task?' + params.join('&'));
}

module.exports = action;
module.exports.action = action;
