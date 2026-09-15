// Semantic Version parsing and bumping — https://semver.org (2.0.0).
//
// Pure JavaScript: this file touches no host API and no network, so it can be
// exercised directly. Everything that talks to OpenClip lives in commands.js.

// The official semver.org regular expression, without anchors.
var CORE =
  '(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)' +
  '(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?' +
  '(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?';

// Quote marks a selection commonly picks up. The backtick is built from its
// char code so no source file here contains one; some JavaScript tooling
// mis-parses a backtick inside a string literal.
var QUOTES = '"\'' + String.fromCharCode(96);
var WRAP = '[\\s' + QUOTES + ']*';
var SELECTION = new RegExp('^(' + WRAP + '[vV]?)' + CORE + '(' + WRAP + ')$');

var NUMERIC = /^\d+$/;
var LEADING_ZERO = /^0\d/;
var IDENTIFIER = /^[0-9A-Za-z-]+$/;

function SemverError(code) {
  this.name = 'SemverError';
  this.code = code;
  this.message = code;
}
SemverError.prototype = Object.create(Error.prototype);

// ---------------------------------------------------------------- parse / format

// Accepts the selection as the user made it: a `v` prefix, surrounding quotes
// and surrounding whitespace are captured and replayed by format().
function parse(selection) {
  var m = SELECTION.exec(String(selection == null ? '' : selection));
  if (!m) throw new SemverError('invalid');
  return {
    prefix: m[1],
    major: Number(m[2]),
    minor: Number(m[3]),
    patch: Number(m[4]),
    prerelease: m[5] ? m[5].split('.') : [],
    build: m[6] ? m[6].split('.') : [],
    suffix: m[7]
  };
}

function format(v) {
  var out = v.major + '.' + v.minor + '.' + v.patch;
  if (v.prerelease.length) out += '-' + v.prerelease.join('.');
  if (v.build.length) out += '+' + v.build.join('.');
  return (v.prefix || '') + out + (v.suffix || '');
}

function isPrerelease(v) {
  return v.prerelease.length > 0;
}

// ---------------------------------------------------------------- bumping

// Identifiers for a pre-release started from scratch, from the user's options:
// `rc` + `1` gives `rc.1`, an empty id gives a bare `1`.
function newPrerelease(pre) {
  var id = String((pre && pre.id) || '').replace(/^[-.\s]+/, '').replace(/[-.\s]+$/, '');
  var start = String((pre && pre.start) || '1').trim() === '0' ? '0' : '1';
  var out = [];
  if (id) {
    var parts = id.split('.');
    for (var i = 0; i < parts.length; i++) {
      // Keep only legal identifiers; a numeric one must not have leading zeros.
      if (IDENTIFIER.test(parts[i]) && !LEADING_ZERO.test(parts[i])) out.push(parts[i]);
    }
  }
  out.push(start);
  return out;
}

// Increment the right-most numeric identifier in place; when there is none,
// append the starting number (`rc` becomes `rc.1`).
function bumpPrereleaseIdentifiers(ids, pre) {
  for (var i = ids.length - 1; i >= 0; i--) {
    if (NUMERIC.test(ids[i])) {
      ids[i] = String(Number(ids[i]) + 1);
      return;
    }
  }
  ids.push(String((pre && pre.start) || '1').trim() === '0' ? '0' : '1');
}

// Rules follow semver.org precedence and match the widely used `semver`
// reference implementation:
//   major        1.2.3 -> 2.0.0     2.0.0-rc.1 -> 2.0.0     1.2.3-rc.1 -> 2.0.0
//   minor        1.2.3 -> 1.3.0     1.3.0-rc.1 -> 1.3.0
//   patch        1.2.3 -> 1.2.4     1.2.4-rc.1 -> 1.2.4
//   prerelease   1.2.3-rc.1 -> 1.2.3-rc.2    1.2.3-rc -> 1.2.3-rc.1    1.2.3 -> 1.2.4-rc.1
// A pre-release of an already released version would sort below it, so a bump
// from a release version moves to the next patch first.
// Build metadata never survives a bump: it identifies one specific build.
function inc(v, release, pre) {
  var next = {
    prefix: v.prefix,
    major: v.major,
    minor: v.minor,
    patch: v.patch,
    prerelease: v.prerelease.slice(),
    build: [],
    suffix: v.suffix
  };

  switch (release) {
    case 'major':
      if (next.minor !== 0 || next.patch !== 0 || !isPrerelease(next)) next.major += 1;
      next.minor = 0;
      next.patch = 0;
      next.prerelease = [];
      break;

    case 'minor':
      if (next.patch !== 0 || !isPrerelease(next)) next.minor += 1;
      next.patch = 0;
      next.prerelease = [];
      break;

    case 'patch':
      if (!isPrerelease(next)) next.patch += 1;
      next.prerelease = [];
      break;

    case 'prerelease':
      if (!isPrerelease(next)) {
        next.patch += 1;
        next.prerelease = newPrerelease(pre);
      } else {
        bumpPrereleaseIdentifiers(next.prerelease, pre);
      }
      break;

    default:
      throw new SemverError('unknown-release');
  }

  return next;
}

module.exports = {
  parse: parse,
  format: format,
  inc: inc,
  SemverError: SemverError
};
