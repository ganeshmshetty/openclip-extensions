// node_modules/katex/dist/katex.mjs
var SourceLocation = class _SourceLocation {
  // The + prefix indicates that these fields aren't writeable
  // Lexer holding the input string.
  // Start offset, zero-based inclusive.
  // End offset, zero-based exclusive.
  constructor(lexer, start, end) {
    this.lexer = void 0;
    this.start = void 0;
    this.end = void 0;
    this.lexer = lexer;
    this.start = start;
    this.end = end;
  }
  /**
   * Merges two `SourceLocation`s from location providers, given they are
   * provided in order of appearance.
   * - Returns the first one's location if only the first is provided.
   * - Returns a merged range of the first and the last if both are provided
   *   and their lexers match.
   * - Otherwise, returns null.
   */
  static range(first, second) {
    if (!second) {
      return first && first.loc;
    } else if (!first || !first.loc || !second.loc || first.loc.lexer !== second.loc.lexer) {
      return null;
    } else {
      return new _SourceLocation(first.loc.lexer, first.loc.start, second.loc.end);
    }
  }
};
var Token = class _Token {
  // don't expand the token
  // used in \noexpand
  constructor(text2, loc) {
    this.text = void 0;
    this.loc = void 0;
    this.noexpand = void 0;
    this.treatAsRelax = void 0;
    this.text = text2;
    this.loc = loc;
  }
  /**
   * Given a pair of tokens (this and endToken), compute a `Token` encompassing
   * the whole input range enclosed by these two.
   */
  range(endToken, text2) {
    return new _Token(text2, SourceLocation.range(this, endToken));
  }
};
var ParseError = class _ParseError {
  // Error start position based on passed-in Token or ParseNode.
  // Length of affected text based on passed-in Token or ParseNode.
  // The underlying error message without any context added.
  constructor(message, token) {
    this.name = void 0;
    this.position = void 0;
    this.length = void 0;
    this.rawMessage = void 0;
    var error = "KaTeX parse error: " + message;
    var start;
    var end;
    var loc = token && token.loc;
    if (loc && loc.start <= loc.end) {
      var input = loc.lexer.input;
      start = loc.start;
      end = loc.end;
      if (start === input.length) {
        error += " at end of input: ";
      } else {
        error += " at position " + (start + 1) + ": ";
      }
      var underlined = input.slice(start, end).replace(/[^]/g, "$&\u0332");
      var left;
      if (start > 15) {
        left = "\u2026" + input.slice(start - 15, start);
      } else {
        left = input.slice(0, start);
      }
      var right;
      if (end + 15 < input.length) {
        right = input.slice(end, end + 15) + "\u2026";
      } else {
        right = input.slice(end);
      }
      error += left + underlined + right;
    }
    var self = new Error(error);
    self.name = "ParseError";
    self.__proto__ = _ParseError.prototype;
    self.position = start;
    if (start != null && end != null) {
      self.length = end - start;
    }
    self.rawMessage = message;
    return self;
  }
};
ParseError.prototype.__proto__ = Error.prototype;
var contains = function contains2(list, elem) {
  return list.indexOf(elem) !== -1;
};
var deflt = function deflt2(setting, defaultIfUndefined) {
  return setting === void 0 ? defaultIfUndefined : setting;
};
var uppercase = /([A-Z])/g;
var hyphenate = function hyphenate2(str) {
  return str.replace(uppercase, "-$1").toLowerCase();
};
var ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  '"': "&quot;",
  "'": "&#x27;"
};
var ESCAPE_REGEX = /[&><"']/g;
function escape(text2) {
  return String(text2).replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}
var getBaseElem = function getBaseElem2(group) {
  if (group.type === "ordgroup") {
    if (group.body.length === 1) {
      return getBaseElem2(group.body[0]);
    } else {
      return group;
    }
  } else if (group.type === "color") {
    if (group.body.length === 1) {
      return getBaseElem2(group.body[0]);
    } else {
      return group;
    }
  } else if (group.type === "font") {
    return getBaseElem2(group.body);
  } else {
    return group;
  }
};
var isCharacterBox = function isCharacterBox2(group) {
  var baseElem = getBaseElem(group);
  return baseElem.type === "mathord" || baseElem.type === "textord" || baseElem.type === "atom";
};
var assert = function assert2(value) {
  if (!value) {
    throw new Error("Expected non-null, but got " + String(value));
  }
  return value;
};
var protocolFromUrl = function protocolFromUrl2(url) {
  var protocol = /^[\x00-\x20]*([^\\/#?]*?)(:|&#0*58|&#x0*3a|&colon)/i.exec(url);
  if (!protocol) {
    return "_relative";
  }
  if (protocol[2] !== ":") {
    return null;
  }
  if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*$/.test(protocol[1])) {
    return null;
  }
  return protocol[1].toLowerCase();
};
var utils = {
  contains,
  deflt,
  escape,
  hyphenate,
  getBaseElem,
  isCharacterBox,
  protocolFromUrl
};
var SETTINGS_SCHEMA = {
  displayMode: {
    type: "boolean",
    description: "Render math in display mode, which puts the math in display style (so \\int and \\sum are large, for example), and centers the math on the page on its own line.",
    cli: "-d, --display-mode"
  },
  output: {
    type: {
      enum: ["htmlAndMathml", "html", "mathml"]
    },
    description: "Determines the markup language of the output.",
    cli: "-F, --format <type>"
  },
  leqno: {
    type: "boolean",
    description: "Render display math in leqno style (left-justified tags)."
  },
  fleqn: {
    type: "boolean",
    description: "Render display math flush left."
  },
  throwOnError: {
    type: "boolean",
    default: true,
    cli: "-t, --no-throw-on-error",
    cliDescription: "Render errors (in the color given by --error-color) instead of throwing a ParseError exception when encountering an error."
  },
  errorColor: {
    type: "string",
    default: "#cc0000",
    cli: "-c, --error-color <color>",
    cliDescription: "A color string given in the format 'rgb' or 'rrggbb' (no #). This option determines the color of errors rendered by the -t option.",
    cliProcessor: (color) => "#" + color
  },
  macros: {
    type: "object",
    cli: "-m, --macro <def>",
    cliDescription: "Define custom macro of the form '\\foo:expansion' (use multiple -m arguments for multiple macros).",
    cliDefault: [],
    cliProcessor: (def, defs) => {
      defs.push(def);
      return defs;
    }
  },
  minRuleThickness: {
    type: "number",
    description: "Specifies a minimum thickness, in ems, for fraction lines, `\\sqrt` top lines, `{array}` vertical lines, `\\hline`, `\\hdashline`, `\\underline`, `\\overline`, and the borders of `\\fbox`, `\\boxed`, and `\\fcolorbox`.",
    processor: (t2) => Math.max(0, t2),
    cli: "--min-rule-thickness <size>",
    cliProcessor: parseFloat
  },
  colorIsTextColor: {
    type: "boolean",
    description: "Makes \\color behave like LaTeX's 2-argument \\textcolor, instead of LaTeX's one-argument \\color mode change.",
    cli: "-b, --color-is-text-color"
  },
  strict: {
    type: [{
      enum: ["warn", "ignore", "error"]
    }, "boolean", "function"],
    description: "Turn on strict / LaTeX faithfulness mode, which throws an error if the input uses features that are not supported by LaTeX.",
    cli: "-S, --strict",
    cliDefault: false
  },
  trust: {
    type: ["boolean", "function"],
    description: "Trust the input, enabling all HTML features such as \\url.",
    cli: "-T, --trust"
  },
  maxSize: {
    type: "number",
    default: Infinity,
    description: "If non-zero, all user-specified sizes, e.g. in \\rule{500em}{500em}, will be capped to maxSize ems. Otherwise, elements and spaces can be arbitrarily large",
    processor: (s) => Math.max(0, s),
    cli: "-s, --max-size <n>",
    cliProcessor: parseInt
  },
  maxExpand: {
    type: "number",
    default: 1e3,
    description: "Limit the number of macro expansions to the specified number, to prevent e.g. infinite macro loops. If set to Infinity, the macro expander will try to fully expand as in LaTeX.",
    processor: (n) => Math.max(0, n),
    cli: "-e, --max-expand <n>",
    cliProcessor: (n) => n === "Infinity" ? Infinity : parseInt(n)
  },
  globalGroup: {
    type: "boolean",
    cli: false
  }
};
function getDefaultValue(schema) {
  if (schema.default) {
    return schema.default;
  }
  var type = schema.type;
  var defaultType = Array.isArray(type) ? type[0] : type;
  if (typeof defaultType !== "string") {
    return defaultType.enum[0];
  }
  switch (defaultType) {
    case "boolean":
      return false;
    case "string":
      return "";
    case "number":
      return 0;
    case "object":
      return {};
  }
}
var Settings = class {
  constructor(options) {
    this.displayMode = void 0;
    this.output = void 0;
    this.leqno = void 0;
    this.fleqn = void 0;
    this.throwOnError = void 0;
    this.errorColor = void 0;
    this.macros = void 0;
    this.minRuleThickness = void 0;
    this.colorIsTextColor = void 0;
    this.strict = void 0;
    this.trust = void 0;
    this.maxSize = void 0;
    this.maxExpand = void 0;
    this.globalGroup = void 0;
    options = options || {};
    for (var prop in SETTINGS_SCHEMA) {
      if (SETTINGS_SCHEMA.hasOwnProperty(prop)) {
        var schema = SETTINGS_SCHEMA[prop];
        this[prop] = options[prop] !== void 0 ? schema.processor ? schema.processor(options[prop]) : options[prop] : getDefaultValue(schema);
      }
    }
  }
  /**
   * Report nonstrict (non-LaTeX-compatible) input.
   * Can safely not be called if `this.strict` is false in JavaScript.
   */
  reportNonstrict(errorCode, errorMsg, token) {
    var strict = this.strict;
    if (typeof strict === "function") {
      strict = strict(errorCode, errorMsg, token);
    }
    if (!strict || strict === "ignore") {
      return;
    } else if (strict === true || strict === "error") {
      throw new ParseError("LaTeX-incompatible input and strict mode is set to 'error': " + (errorMsg + " [" + errorCode + "]"), token);
    } else if (strict === "warn") {
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
    } else {
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
    }
  }
  /**
   * Check whether to apply strict (LaTeX-adhering) behavior for unusual
   * input (like `\\`).  Unlike `nonstrict`, will not throw an error;
   * instead, "error" translates to a return value of `true`, while "ignore"
   * translates to a return value of `false`.  May still print a warning:
   * "warn" prints a warning and returns `false`.
   * This is for the second category of `errorCode`s listed in the README.
   */
  useStrictBehavior(errorCode, errorMsg, token) {
    var strict = this.strict;
    if (typeof strict === "function") {
      try {
        strict = strict(errorCode, errorMsg, token);
      } catch (error) {
        strict = "error";
      }
    }
    if (!strict || strict === "ignore") {
      return false;
    } else if (strict === true || strict === "error") {
      return true;
    } else if (strict === "warn") {
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + (errorMsg + " [" + errorCode + "]"));
      return false;
    } else {
      typeof console !== "undefined" && console.warn("LaTeX-incompatible input and strict mode is set to " + ("unrecognized '" + strict + "': " + errorMsg + " [" + errorCode + "]"));
      return false;
    }
  }
  /**
   * Check whether to test potentially dangerous input, and return
   * `true` (trusted) or `false` (untrusted).  The sole argument `context`
   * should be an object with `command` field specifying the relevant LaTeX
   * command (as a string starting with `\`), and any other arguments, etc.
   * If `context` has a `url` field, a `protocol` field will automatically
   * get added by this function (changing the specified object).
   */
  isTrusted(context) {
    if (context.url && !context.protocol) {
      var protocol = utils.protocolFromUrl(context.url);
      if (protocol == null) {
        return false;
      }
      context.protocol = protocol;
    }
    var trust = typeof this.trust === "function" ? this.trust(context) : this.trust;
    return Boolean(trust);
  }
};
var Style = class {
  constructor(id, size, cramped) {
    this.id = void 0;
    this.size = void 0;
    this.cramped = void 0;
    this.id = id;
    this.size = size;
    this.cramped = cramped;
  }
  /**
   * Get the style of a superscript given a base in the current style.
   */
  sup() {
    return styles[sup[this.id]];
  }
  /**
   * Get the style of a subscript given a base in the current style.
   */
  sub() {
    return styles[sub[this.id]];
  }
  /**
   * Get the style of a fraction numerator given the fraction in the current
   * style.
   */
  fracNum() {
    return styles[fracNum[this.id]];
  }
  /**
   * Get the style of a fraction denominator given the fraction in the current
   * style.
   */
  fracDen() {
    return styles[fracDen[this.id]];
  }
  /**
   * Get the cramped version of a style (in particular, cramping a cramped style
   * doesn't change the style).
   */
  cramp() {
    return styles[cramp[this.id]];
  }
  /**
   * Get a text or display version of this style.
   */
  text() {
    return styles[text$1[this.id]];
  }
  /**
   * Return true if this style is tightly spaced (scriptstyle/scriptscriptstyle)
   */
  isTight() {
    return this.size >= 2;
  }
};
var D = 0;
var Dc = 1;
var T = 2;
var Tc = 3;
var S = 4;
var Sc = 5;
var SS = 6;
var SSc = 7;
var styles = [new Style(D, 0, false), new Style(Dc, 0, true), new Style(T, 1, false), new Style(Tc, 1, true), new Style(S, 2, false), new Style(Sc, 2, true), new Style(SS, 3, false), new Style(SSc, 3, true)];
var sup = [S, Sc, S, Sc, SS, SSc, SS, SSc];
var sub = [Sc, Sc, Sc, Sc, SSc, SSc, SSc, SSc];
var fracNum = [T, Tc, S, Sc, SS, SSc, SS, SSc];
var fracDen = [Tc, Tc, Sc, Sc, SSc, SSc, SSc, SSc];
var cramp = [Dc, Dc, Tc, Tc, Sc, Sc, SSc, SSc];
var text$1 = [D, Dc, T, Tc, T, Tc, T, Tc];
var Style$1 = {
  DISPLAY: styles[D],
  TEXT: styles[T],
  SCRIPT: styles[S],
  SCRIPTSCRIPT: styles[SS]
};
var scriptData = [{
  // Latin characters beyond the Latin-1 characters we have metrics for.
  // Needed for Czech, Hungarian and Turkish text, for example.
  name: "latin",
  blocks: [
    [256, 591],
    // Latin Extended-A and Latin Extended-B
    [768, 879]
    // Combining Diacritical marks
  ]
}, {
  // The Cyrillic script used by Russian and related languages.
  // A Cyrillic subset used to be supported as explicitly defined
  // symbols in symbols.js
  name: "cyrillic",
  blocks: [[1024, 1279]]
}, {
  // Armenian
  name: "armenian",
  blocks: [[1328, 1423]]
}, {
  // The Brahmic scripts of South and Southeast Asia
  // Devanagari (0900–097F)
  // Bengali (0980–09FF)
  // Gurmukhi (0A00–0A7F)
  // Gujarati (0A80–0AFF)
  // Oriya (0B00–0B7F)
  // Tamil (0B80–0BFF)
  // Telugu (0C00–0C7F)
  // Kannada (0C80–0CFF)
  // Malayalam (0D00–0D7F)
  // Sinhala (0D80–0DFF)
  // Thai (0E00–0E7F)
  // Lao (0E80–0EFF)
  // Tibetan (0F00–0FFF)
  // Myanmar (1000–109F)
  name: "brahmic",
  blocks: [[2304, 4255]]
}, {
  name: "georgian",
  blocks: [[4256, 4351]]
}, {
  // Chinese and Japanese.
  // The "k" in cjk is for Korean, but we've separated Korean out
  name: "cjk",
  blocks: [
    [12288, 12543],
    // CJK symbols and punctuation, Hiragana, Katakana
    [19968, 40879],
    // CJK ideograms
    [65280, 65376]
    // Fullwidth punctuation
    // TODO: add halfwidth Katakana and Romanji glyphs
  ]
}, {
  // Korean
  name: "hangul",
  blocks: [[44032, 55215]]
}];
function scriptFromCodepoint(codepoint) {
  for (var i2 = 0; i2 < scriptData.length; i2++) {
    var script = scriptData[i2];
    for (var _i6 = 0; _i6 < script.blocks.length; _i6++) {
      var block = script.blocks[_i6];
      if (codepoint >= block[0] && codepoint <= block[1]) {
        return script.name;
      }
    }
  }
  return null;
}
var allBlocks = [];
scriptData.forEach((s) => s.blocks.forEach((b) => allBlocks.push(...b)));
function supportedCodepoint(codepoint) {
  for (var i2 = 0; i2 < allBlocks.length; i2 += 2) {
    if (codepoint >= allBlocks[i2] && codepoint <= allBlocks[i2 + 1]) {
      return true;
    }
  }
  return false;
}
var hLinePad = 80;
var sqrtMain = function sqrtMain2(extraVinculum, hLinePad2) {
  return "M95," + (622 + extraVinculum + hLinePad2) + "\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl" + extraVinculum / 2.075 + " -" + extraVinculum + "\nc5.3,-9.3,12,-14,20,-14\nH400000v" + (40 + extraVinculum) + "H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM" + (834 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize1 = function sqrtSize12(extraVinculum, hLinePad2) {
  return "M263," + (601 + extraVinculum + hLinePad2) + "c0.7,0,18,39.7,52,119\nc34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120\nc340,-704.7,510.7,-1060.3,512,-1067\nl" + extraVinculum / 2.084 + " -" + extraVinculum + "\nc4.7,-7.3,11,-11,19,-11\nH40000v" + (40 + extraVinculum) + "H1012.3\ns-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232\nc-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1\ns-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26\nc-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z\nM" + (1001 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize2 = function sqrtSize22(extraVinculum, hLinePad2) {
  return "M983 " + (10 + extraVinculum + hLinePad2) + "\nl" + extraVinculum / 3.13 + " -" + extraVinculum + "\nc4,-6.7,10,-10,18,-10 H400000v" + (40 + extraVinculum) + "\nH1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7\ns-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744\nc-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30\nc26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722\nc56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5\nc53.7,-170.3,84.5,-266.8,92.5,-289.5z\nM" + (1001 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize3 = function sqrtSize32(extraVinculum, hLinePad2) {
  return "M424," + (2398 + extraVinculum + hLinePad2) + "\nc-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514\nc0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20\ns-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121\ns209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081\nl" + extraVinculum / 4.223 + " -" + extraVinculum + "c4,-6.7,10,-10,18,-10 H400000\nv" + (40 + extraVinculum) + "H1014.6\ns-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185\nc-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2z M" + (1001 + extraVinculum) + " " + hLinePad2 + "\nh400000v" + (40 + extraVinculum) + "h-400000z";
};
var sqrtSize4 = function sqrtSize42(extraVinculum, hLinePad2) {
  return "M473," + (2713 + extraVinculum + hLinePad2) + "\nc339.3,-1799.3,509.3,-2700,510,-2702 l" + extraVinculum / 5.298 + " -" + extraVinculum + "\nc3.3,-7.3,9.3,-11,18,-11 H400000v" + (40 + extraVinculum) + "H1017.7\ns-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200\nc0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26\ns76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,\n606zM" + (1001 + extraVinculum) + " " + hLinePad2 + "h400000v" + (40 + extraVinculum) + "H1017.7z";
};
var phasePath = function phasePath2(y) {
  var x = y / 2;
  return "M400000 " + y + " H0 L" + x + " 0 l65 45 L145 " + (y - 80) + " H400000z";
};
var sqrtTall = function sqrtTall2(extraVinculum, hLinePad2, viewBoxHeight) {
  var vertSegment = viewBoxHeight - 54 - hLinePad2 - extraVinculum;
  return "M702 " + (extraVinculum + hLinePad2) + "H400000" + (40 + extraVinculum) + "\nH742v" + vertSegment + "l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1\nh-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170\nc-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667\n219 661 l218 661zM702 " + hLinePad2 + "H400000v" + (40 + extraVinculum) + "H742z";
};
var sqrtPath = function sqrtPath2(size, extraVinculum, viewBoxHeight) {
  extraVinculum = 1e3 * extraVinculum;
  var path2 = "";
  switch (size) {
    case "sqrtMain":
      path2 = sqrtMain(extraVinculum, hLinePad);
      break;
    case "sqrtSize1":
      path2 = sqrtSize1(extraVinculum, hLinePad);
      break;
    case "sqrtSize2":
      path2 = sqrtSize2(extraVinculum, hLinePad);
      break;
    case "sqrtSize3":
      path2 = sqrtSize3(extraVinculum, hLinePad);
      break;
    case "sqrtSize4":
      path2 = sqrtSize4(extraVinculum, hLinePad);
      break;
    case "sqrtTall":
      path2 = sqrtTall(extraVinculum, hLinePad, viewBoxHeight);
  }
  return path2;
};
var innerPath = function innerPath2(name, height) {
  switch (name) {
    case "\u239C":
      return "M291 0 H417 V" + height + " H291z M291 0 H417 V" + height + " H291z";
    case "\u2223":
      return "M145 0 H188 V" + height + " H145z M145 0 H188 V" + height + " H145z";
    case "\u2225":
      return "M145 0 H188 V" + height + " H145z M145 0 H188 V" + height + " H145z" + ("M367 0 H410 V" + height + " H367z M367 0 H410 V" + height + " H367z");
    case "\u239F":
      return "M457 0 H583 V" + height + " H457z M457 0 H583 V" + height + " H457z";
    case "\u23A2":
      return "M319 0 H403 V" + height + " H319z M319 0 H403 V" + height + " H319z";
    case "\u23A5":
      return "M263 0 H347 V" + height + " H263z M263 0 H347 V" + height + " H263z";
    case "\u23AA":
      return "M384 0 H504 V" + height + " H384z M384 0 H504 V" + height + " H384z";
    case "\u23D0":
      return "M312 0 H355 V" + height + " H312z M312 0 H355 V" + height + " H312z";
    case "\u2016":
      return "M257 0 H300 V" + height + " H257z M257 0 H300 V" + height + " H257z" + ("M478 0 H521 V" + height + " H478z M478 0 H521 V" + height + " H478z");
    default:
      return "";
  }
};
var path = {
  // The doubleleftarrow geometry is from glyph U+21D0 in the font KaTeX Main
  doubleleftarrow: "M262 157\nl10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3\n 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28\n 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5\nc2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5\n 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87\n-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7\n-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z\nm8 0v40h399730v-40zm0 194v40h399730v-40z",
  // doublerightarrow is from glyph U+21D2 in font KaTeX Main
  doublerightarrow: "M399738 392l\n-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5\n 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88\n-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68\n-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18\n-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782\nc-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3\n-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z",
  // leftarrow is from glyph U+2190 in font KaTeX Main
  leftarrow: "M400000 241H110l3-3c68.7-52.7 113.7-120\n 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8\n-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247\nc-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208\n 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3\n 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202\n l-3-3h399890zM100 241v40h399900v-40z",
  // overbrace is from glyphs U+23A9/23A8/23A7 in font KaTeX_Size4-Regular
  leftbrace: "M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117\n-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7\n 5-6 9-10 13-.7 1-7.3 1-20 1H6z",
  leftbraceunder: "M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13\n 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688\n 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7\n-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z",
  // overgroup is from the MnSymbol package (public domain)
  leftgroup: "M400000 80\nH435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0\n 435 0h399565z",
  leftgroupunder: "M400000 262\nH435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219\n 435 219h399565z",
  // Harpoons are from glyph U+21BD in font KaTeX Main
  leftharpoon: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3\n-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5\n-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7\n-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z",
  leftharpoonplus: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5\n 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3\n-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7\n-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z\nm0 0v40h400000v-40z",
  leftharpoondown: "M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333\n 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5\n 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667\n-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z",
  leftharpoondownplus: "M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12\n 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7\n-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0\nv40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z",
  // hook is from glyph U+21A9 in font KaTeX Main
  lefthook: "M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5\n-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3\n-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21\n 71.5 23h399859zM103 281v-40h399897v40z",
  leftlinesegment: "M40 281 V428 H0 V94 H40 V241 H400000 v40z\nM40 281 V428 H0 V94 H40 V241 H400000 v40z",
  leftmapsto: "M40 281 V448H0V74H40V241H400000v40z\nM40 281 V448H0V74H40V241H400000v40z",
  // tofrom is from glyph U+21C4 in font KaTeX AMS Regular
  leftToFrom: "M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23\n-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8\nc28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3\n 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z",
  longequal: "M0 50 h400000 v40H0z m0 194h40000v40H0z\nM0 50 h400000 v40H0z m0 194h40000v40H0z",
  midbrace: "M200428 334\nc-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14\n-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7\n 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11\n 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z",
  midbraceunder: "M199572 214\nc100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14\n 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3\n 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0\n-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z",
  oiintSize1: "M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6\n-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z\nm368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8\n60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z",
  oiintSize2: "M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8\n-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z\nm502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2\nc0 110 84 276 504 276s502.4-166 502.4-276z",
  oiiintSize1: "M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6\n-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z\nm525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0\n85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z",
  oiiintSize2: "M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8\n-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z\nm770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1\nc0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z",
  rightarrow: "M0 241v40h399891c-47.3 35.3-84 78-110 128\n-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20\n 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7\n 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85\n-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n 151.7 139 205zm0 0v40h399900v-40z",
  rightbrace: "M400000 542l\n-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5\ns-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1\nc124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z",
  rightbraceunder: "M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3\n 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237\n-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z",
  rightgroup: "M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0\n 3-1 3-3v-38c-76-158-257-219-435-219H0z",
  rightgroupunder: "M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18\n 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z",
  rightharpoon: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3\n-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2\n-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58\n 69.2 92 94.5zm0 0v40h399900v-40z",
  rightharpoonplus: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11\n-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7\n 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z\nm0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z",
  rightharpoondown: "M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8\n 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5\n-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95\n-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z",
  rightharpoondownplus: "M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8\n 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3\n 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3\n-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z\nm0-194v40h400000v-40zm0 0v40h400000v-40z",
  righthook: "M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3\n 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0\n-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21\n 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z",
  rightlinesegment: "M399960 241 V94 h40 V428 h-40 V281 H0 v-40z\nM399960 241 V94 h40 V428 h-40 V281 H0 v-40z",
  rightToFrom: "M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23\n 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32\n-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142\n-167z M100 147v40h399900v-40zM0 341v40h399900v-40z",
  // twoheadleftarrow is from glyph U+219E in font KaTeX AMS Regular
  twoheadleftarrow: "M0 167c68 40\n 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69\n-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3\n-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19\n-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101\n 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z",
  twoheadrightarrow: "M400000 167\nc-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3\n 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42\n 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333\n-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70\n 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z",
  // tilde1 is a modified version of a glyph from the MnSymbol package
  tilde1: "M200 55.538c-77 0-168 73.953-177 73.953-3 0-7\n-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0\n 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0\n 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128\n-68.267.847-113-73.952-191-73.952z",
  // ditto tilde2, tilde3, & tilde4
  tilde2: "M344 55.266c-142 0-300.638 81.316-311.5 86.418\n-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9\n 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114\nc1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751\n 181.476 676 181.476c-149 0-189-126.21-332-126.21z",
  tilde3: "M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457\n-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0\n 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697\n 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696\n -338 0-409-156.573-744-156.573z",
  tilde4: "M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345\n-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409\n 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9\n 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409\n -175.236-744-175.236z",
  // vec is from glyph U+20D7 in font KaTeX Main
  vec: "M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5\n3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11\n10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63\n-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1\n-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59\nH213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359\nc-16-25.333-24-45-24-59z",
  // widehat1 is a modified version of a glyph from the MnSymbol package
  widehat1: "M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22\nc-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z",
  // ditto widehat2, widehat3, & widehat4
  widehat2: "M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
  widehat3: "M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
  widehat4: "M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z",
  // widecheck paths are all inverted versions of widehat
  widecheck1: "M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,\n-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z",
  widecheck2: "M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
  widecheck3: "M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
  widecheck4: "M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z",
  // The next ten paths support reaction arrows from the mhchem package.
  // Arrows for \ce{<-->} are offset from xAxis by 0.22ex, per mhchem in LaTeX
  // baraboveleftarrow is mostly from glyph U+2190 in font KaTeX Main
  baraboveleftarrow: "M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202\nc4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5\nc-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130\ns-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47\n121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6\ns2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11\nc0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z\nM100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z",
  // rightarrowabovebar is mostly from glyph U+2192, KaTeX Main
  rightarrowabovebar: "M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32\n-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0\n13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39\n-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5\n-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z",
  // The short left harpoon has 0.5em (i.e. 500 units) kern on the left end.
  // Ref from mhchem.sty: \rlap{\raisebox{-.22ex}{$\kern0.5em
  baraboveshortleftharpoon: "M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17\nc2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21\nc-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40\nc-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z\nM0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z",
  rightharpoonaboveshortbar: "M0,241 l0,40c399126,0,399993,0,399993,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z",
  shortbaraboveleftharpoon: "M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,\n1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,\n-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z\nM93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z",
  shortrightharpoonabovebar: "M53,241l0,40c398570,0,399437,0,399437,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z"
};
var tallDelim = function tallDelim2(label, midHeight) {
  switch (label) {
    case "lbrack":
      return "M403 1759 V84 H666 V0 H319 V1759 v" + midHeight + " v1759 h347 v-84\nH403z M403 1759 V0 H319 V1759 v" + midHeight + " v1759 h84z";
    case "rbrack":
      return "M347 1759 V0 H0 V84 H263 V1759 v" + midHeight + " v1759 H0 v84 H347z\nM347 1759 V0 H263 V1759 v" + midHeight + " v1759 h84z";
    case "vert":
      return "M145 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M188 15 H145 v585 v" + midHeight + " v585 h43z";
    case "doublevert":
      return "M145 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M188 15 H145 v585 v" + midHeight + " v585 h43z\nM367 15 v585 v" + midHeight + " v585 c2.667,10,9.667,15,21,15\nc10,0,16.667,-5,20,-15 v-585 v" + -midHeight + " v-585 c-2.667,-10,-9.667,-15,-21,-15\nc-10,0,-16.667,5,-20,15z M410 15 H367 v585 v" + midHeight + " v585 h43z";
    case "lfloor":
      return "M319 602 V0 H403 V602 v" + midHeight + " v1715 h263 v84 H319z\nMM319 602 V0 H403 V602 v" + midHeight + " v1715 H319z";
    case "rfloor":
      return "M319 602 V0 H403 V602 v" + midHeight + " v1799 H0 v-84 H319z\nMM319 602 V0 H403 V602 v" + midHeight + " v1715 H319z";
    case "lceil":
      return "M403 1759 V84 H666 V0 H319 V1759 v" + midHeight + " v602 h84z\nM403 1759 V0 H319 V1759 v" + midHeight + " v602 h84z";
    case "rceil":
      return "M347 1759 V0 H0 V84 H263 V1759 v" + midHeight + " v602 h84z\nM347 1759 V0 h-84 V1759 v" + midHeight + " v602 h84z";
    case "lparen":
      return "M863,9c0,-2,-2,-5,-6,-9c0,0,-17,0,-17,0c-12.7,0,-19.3,0.3,-20,1\nc-5.3,5.3,-10.3,11,-15,17c-242.7,294.7,-395.3,682,-458,1162c-21.3,163.3,-33.3,349,\n-36,557 l0," + (midHeight + 84) + "c0.2,6,0,26,0,60c2,159.3,10,310.7,24,454c53.3,528,210,\n949.7,470,1265c4.7,6,9.7,11.7,15,17c0.7,0.7,7,1,19,1c0,0,18,0,18,0c4,-4,6,-7,6,-9\nc0,-2.7,-3.3,-8.7,-10,-18c-135.3,-192.7,-235.5,-414.3,-300.5,-665c-65,-250.7,-102.5,\n-544.7,-112.5,-882c-2,-104,-3,-167,-3,-189\nl0,-" + (midHeight + 92) + "c0,-162.7,5.7,-314,17,-454c20.7,-272,63.7,-513,129,-723c65.3,\n-210,155.3,-396.3,270,-559c6.7,-9.3,10,-15.3,10,-18z";
    case "rparen":
      return "M76,0c-16.7,0,-25,3,-25,9c0,2,2,6.3,6,13c21.3,28.7,42.3,60.3,\n63,95c96.7,156.7,172.8,332.5,228.5,527.5c55.7,195,92.8,416.5,111.5,664.5\nc11.3,139.3,17,290.7,17,454c0,28,1.7,43,3.3,45l0," + (midHeight + 9) + "\nc-3,4,-3.3,16.7,-3.3,38c0,162,-5.7,313.7,-17,455c-18.7,248,-55.8,469.3,-111.5,664\nc-55.7,194.7,-131.8,370.3,-228.5,527c-20.7,34.7,-41.7,66.3,-63,95c-2,3.3,-4,7,-6,11\nc0,7.3,5.7,11,17,11c0,0,11,0,11,0c9.3,0,14.3,-0.3,15,-1c5.3,-5.3,10.3,-11,15,-17\nc242.7,-294.7,395.3,-681.7,458,-1161c21.3,-164.7,33.3,-350.7,36,-558\nl0,-" + (midHeight + 144) + "c-2,-159.3,-10,-310.7,-24,-454c-53.3,-528,-210,-949.7,\n-470,-1265c-4.7,-6,-9.7,-11.7,-15,-17c-0.7,-0.7,-6.7,-1,-18,-1z";
    default:
      throw new Error("Unknown stretchy delimiter.");
  }
};
var DocumentFragment = class {
  // HtmlDomNode
  // Never used; needed for satisfying interface.
  constructor(children) {
    this.children = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    this.children = children;
    this.classes = [];
    this.height = 0;
    this.depth = 0;
    this.maxFontSize = 0;
    this.style = {};
  }
  hasClass(className) {
    return utils.contains(this.classes, className);
  }
  /** Convert the fragment into a node. */
  toNode() {
    var frag = document.createDocumentFragment();
    for (var i2 = 0; i2 < this.children.length; i2++) {
      frag.appendChild(this.children[i2].toNode());
    }
    return frag;
  }
  /** Convert the fragment into HTML markup. */
  toMarkup() {
    var markup = "";
    for (var i2 = 0; i2 < this.children.length; i2++) {
      markup += this.children[i2].toMarkup();
    }
    return markup;
  }
  /**
   * Converts the math node into a string, similar to innerText. Applies to
   * MathDomNode's only.
   */
  toText() {
    var toText = (child) => child.toText();
    return this.children.map(toText).join("");
  }
};
var fontMetricsData = {
  "AMS-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "65": [0, 0.68889, 0, 0, 0.72222],
    "66": [0, 0.68889, 0, 0, 0.66667],
    "67": [0, 0.68889, 0, 0, 0.72222],
    "68": [0, 0.68889, 0, 0, 0.72222],
    "69": [0, 0.68889, 0, 0, 0.66667],
    "70": [0, 0.68889, 0, 0, 0.61111],
    "71": [0, 0.68889, 0, 0, 0.77778],
    "72": [0, 0.68889, 0, 0, 0.77778],
    "73": [0, 0.68889, 0, 0, 0.38889],
    "74": [0.16667, 0.68889, 0, 0, 0.5],
    "75": [0, 0.68889, 0, 0, 0.77778],
    "76": [0, 0.68889, 0, 0, 0.66667],
    "77": [0, 0.68889, 0, 0, 0.94445],
    "78": [0, 0.68889, 0, 0, 0.72222],
    "79": [0.16667, 0.68889, 0, 0, 0.77778],
    "80": [0, 0.68889, 0, 0, 0.61111],
    "81": [0.16667, 0.68889, 0, 0, 0.77778],
    "82": [0, 0.68889, 0, 0, 0.72222],
    "83": [0, 0.68889, 0, 0, 0.55556],
    "84": [0, 0.68889, 0, 0, 0.66667],
    "85": [0, 0.68889, 0, 0, 0.72222],
    "86": [0, 0.68889, 0, 0, 0.72222],
    "87": [0, 0.68889, 0, 0, 1],
    "88": [0, 0.68889, 0, 0, 0.72222],
    "89": [0, 0.68889, 0, 0, 0.72222],
    "90": [0, 0.68889, 0, 0, 0.66667],
    "107": [0, 0.68889, 0, 0, 0.55556],
    "160": [0, 0, 0, 0, 0.25],
    "165": [0, 0.675, 0.025, 0, 0.75],
    "174": [0.15559, 0.69224, 0, 0, 0.94666],
    "240": [0, 0.68889, 0, 0, 0.55556],
    "295": [0, 0.68889, 0, 0, 0.54028],
    "710": [0, 0.825, 0, 0, 2.33334],
    "732": [0, 0.9, 0, 0, 2.33334],
    "770": [0, 0.825, 0, 0, 2.33334],
    "771": [0, 0.9, 0, 0, 2.33334],
    "989": [0.08167, 0.58167, 0, 0, 0.77778],
    "1008": [0, 0.43056, 0.04028, 0, 0.66667],
    "8245": [0, 0.54986, 0, 0, 0.275],
    "8463": [0, 0.68889, 0, 0, 0.54028],
    "8487": [0, 0.68889, 0, 0, 0.72222],
    "8498": [0, 0.68889, 0, 0, 0.55556],
    "8502": [0, 0.68889, 0, 0, 0.66667],
    "8503": [0, 0.68889, 0, 0, 0.44445],
    "8504": [0, 0.68889, 0, 0, 0.66667],
    "8513": [0, 0.68889, 0, 0, 0.63889],
    "8592": [-0.03598, 0.46402, 0, 0, 0.5],
    "8594": [-0.03598, 0.46402, 0, 0, 0.5],
    "8602": [-0.13313, 0.36687, 0, 0, 1],
    "8603": [-0.13313, 0.36687, 0, 0, 1],
    "8606": [0.01354, 0.52239, 0, 0, 1],
    "8608": [0.01354, 0.52239, 0, 0, 1],
    "8610": [0.01354, 0.52239, 0, 0, 1.11111],
    "8611": [0.01354, 0.52239, 0, 0, 1.11111],
    "8619": [0, 0.54986, 0, 0, 1],
    "8620": [0, 0.54986, 0, 0, 1],
    "8621": [-0.13313, 0.37788, 0, 0, 1.38889],
    "8622": [-0.13313, 0.36687, 0, 0, 1],
    "8624": [0, 0.69224, 0, 0, 0.5],
    "8625": [0, 0.69224, 0, 0, 0.5],
    "8630": [0, 0.43056, 0, 0, 1],
    "8631": [0, 0.43056, 0, 0, 1],
    "8634": [0.08198, 0.58198, 0, 0, 0.77778],
    "8635": [0.08198, 0.58198, 0, 0, 0.77778],
    "8638": [0.19444, 0.69224, 0, 0, 0.41667],
    "8639": [0.19444, 0.69224, 0, 0, 0.41667],
    "8642": [0.19444, 0.69224, 0, 0, 0.41667],
    "8643": [0.19444, 0.69224, 0, 0, 0.41667],
    "8644": [0.1808, 0.675, 0, 0, 1],
    "8646": [0.1808, 0.675, 0, 0, 1],
    "8647": [0.1808, 0.675, 0, 0, 1],
    "8648": [0.19444, 0.69224, 0, 0, 0.83334],
    "8649": [0.1808, 0.675, 0, 0, 1],
    "8650": [0.19444, 0.69224, 0, 0, 0.83334],
    "8651": [0.01354, 0.52239, 0, 0, 1],
    "8652": [0.01354, 0.52239, 0, 0, 1],
    "8653": [-0.13313, 0.36687, 0, 0, 1],
    "8654": [-0.13313, 0.36687, 0, 0, 1],
    "8655": [-0.13313, 0.36687, 0, 0, 1],
    "8666": [0.13667, 0.63667, 0, 0, 1],
    "8667": [0.13667, 0.63667, 0, 0, 1],
    "8669": [-0.13313, 0.37788, 0, 0, 1],
    "8672": [-0.064, 0.437, 0, 0, 1.334],
    "8674": [-0.064, 0.437, 0, 0, 1.334],
    "8705": [0, 0.825, 0, 0, 0.5],
    "8708": [0, 0.68889, 0, 0, 0.55556],
    "8709": [0.08167, 0.58167, 0, 0, 0.77778],
    "8717": [0, 0.43056, 0, 0, 0.42917],
    "8722": [-0.03598, 0.46402, 0, 0, 0.5],
    "8724": [0.08198, 0.69224, 0, 0, 0.77778],
    "8726": [0.08167, 0.58167, 0, 0, 0.77778],
    "8733": [0, 0.69224, 0, 0, 0.77778],
    "8736": [0, 0.69224, 0, 0, 0.72222],
    "8737": [0, 0.69224, 0, 0, 0.72222],
    "8738": [0.03517, 0.52239, 0, 0, 0.72222],
    "8739": [0.08167, 0.58167, 0, 0, 0.22222],
    "8740": [0.25142, 0.74111, 0, 0, 0.27778],
    "8741": [0.08167, 0.58167, 0, 0, 0.38889],
    "8742": [0.25142, 0.74111, 0, 0, 0.5],
    "8756": [0, 0.69224, 0, 0, 0.66667],
    "8757": [0, 0.69224, 0, 0, 0.66667],
    "8764": [-0.13313, 0.36687, 0, 0, 0.77778],
    "8765": [-0.13313, 0.37788, 0, 0, 0.77778],
    "8769": [-0.13313, 0.36687, 0, 0, 0.77778],
    "8770": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8774": [0.30274, 0.79383, 0, 0, 0.77778],
    "8776": [-0.01688, 0.48312, 0, 0, 0.77778],
    "8778": [0.08167, 0.58167, 0, 0, 0.77778],
    "8782": [0.06062, 0.54986, 0, 0, 0.77778],
    "8783": [0.06062, 0.54986, 0, 0, 0.77778],
    "8785": [0.08198, 0.58198, 0, 0, 0.77778],
    "8786": [0.08198, 0.58198, 0, 0, 0.77778],
    "8787": [0.08198, 0.58198, 0, 0, 0.77778],
    "8790": [0, 0.69224, 0, 0, 0.77778],
    "8791": [0.22958, 0.72958, 0, 0, 0.77778],
    "8796": [0.08198, 0.91667, 0, 0, 0.77778],
    "8806": [0.25583, 0.75583, 0, 0, 0.77778],
    "8807": [0.25583, 0.75583, 0, 0, 0.77778],
    "8808": [0.25142, 0.75726, 0, 0, 0.77778],
    "8809": [0.25142, 0.75726, 0, 0, 0.77778],
    "8812": [0.25583, 0.75583, 0, 0, 0.5],
    "8814": [0.20576, 0.70576, 0, 0, 0.77778],
    "8815": [0.20576, 0.70576, 0, 0, 0.77778],
    "8816": [0.30274, 0.79383, 0, 0, 0.77778],
    "8817": [0.30274, 0.79383, 0, 0, 0.77778],
    "8818": [0.22958, 0.72958, 0, 0, 0.77778],
    "8819": [0.22958, 0.72958, 0, 0, 0.77778],
    "8822": [0.1808, 0.675, 0, 0, 0.77778],
    "8823": [0.1808, 0.675, 0, 0, 0.77778],
    "8828": [0.13667, 0.63667, 0, 0, 0.77778],
    "8829": [0.13667, 0.63667, 0, 0, 0.77778],
    "8830": [0.22958, 0.72958, 0, 0, 0.77778],
    "8831": [0.22958, 0.72958, 0, 0, 0.77778],
    "8832": [0.20576, 0.70576, 0, 0, 0.77778],
    "8833": [0.20576, 0.70576, 0, 0, 0.77778],
    "8840": [0.30274, 0.79383, 0, 0, 0.77778],
    "8841": [0.30274, 0.79383, 0, 0, 0.77778],
    "8842": [0.13597, 0.63597, 0, 0, 0.77778],
    "8843": [0.13597, 0.63597, 0, 0, 0.77778],
    "8847": [0.03517, 0.54986, 0, 0, 0.77778],
    "8848": [0.03517, 0.54986, 0, 0, 0.77778],
    "8858": [0.08198, 0.58198, 0, 0, 0.77778],
    "8859": [0.08198, 0.58198, 0, 0, 0.77778],
    "8861": [0.08198, 0.58198, 0, 0, 0.77778],
    "8862": [0, 0.675, 0, 0, 0.77778],
    "8863": [0, 0.675, 0, 0, 0.77778],
    "8864": [0, 0.675, 0, 0, 0.77778],
    "8865": [0, 0.675, 0, 0, 0.77778],
    "8872": [0, 0.69224, 0, 0, 0.61111],
    "8873": [0, 0.69224, 0, 0, 0.72222],
    "8874": [0, 0.69224, 0, 0, 0.88889],
    "8876": [0, 0.68889, 0, 0, 0.61111],
    "8877": [0, 0.68889, 0, 0, 0.61111],
    "8878": [0, 0.68889, 0, 0, 0.72222],
    "8879": [0, 0.68889, 0, 0, 0.72222],
    "8882": [0.03517, 0.54986, 0, 0, 0.77778],
    "8883": [0.03517, 0.54986, 0, 0, 0.77778],
    "8884": [0.13667, 0.63667, 0, 0, 0.77778],
    "8885": [0.13667, 0.63667, 0, 0, 0.77778],
    "8888": [0, 0.54986, 0, 0, 1.11111],
    "8890": [0.19444, 0.43056, 0, 0, 0.55556],
    "8891": [0.19444, 0.69224, 0, 0, 0.61111],
    "8892": [0.19444, 0.69224, 0, 0, 0.61111],
    "8901": [0, 0.54986, 0, 0, 0.27778],
    "8903": [0.08167, 0.58167, 0, 0, 0.77778],
    "8905": [0.08167, 0.58167, 0, 0, 0.77778],
    "8906": [0.08167, 0.58167, 0, 0, 0.77778],
    "8907": [0, 0.69224, 0, 0, 0.77778],
    "8908": [0, 0.69224, 0, 0, 0.77778],
    "8909": [-0.03598, 0.46402, 0, 0, 0.77778],
    "8910": [0, 0.54986, 0, 0, 0.76042],
    "8911": [0, 0.54986, 0, 0, 0.76042],
    "8912": [0.03517, 0.54986, 0, 0, 0.77778],
    "8913": [0.03517, 0.54986, 0, 0, 0.77778],
    "8914": [0, 0.54986, 0, 0, 0.66667],
    "8915": [0, 0.54986, 0, 0, 0.66667],
    "8916": [0, 0.69224, 0, 0, 0.66667],
    "8918": [0.0391, 0.5391, 0, 0, 0.77778],
    "8919": [0.0391, 0.5391, 0, 0, 0.77778],
    "8920": [0.03517, 0.54986, 0, 0, 1.33334],
    "8921": [0.03517, 0.54986, 0, 0, 1.33334],
    "8922": [0.38569, 0.88569, 0, 0, 0.77778],
    "8923": [0.38569, 0.88569, 0, 0, 0.77778],
    "8926": [0.13667, 0.63667, 0, 0, 0.77778],
    "8927": [0.13667, 0.63667, 0, 0, 0.77778],
    "8928": [0.30274, 0.79383, 0, 0, 0.77778],
    "8929": [0.30274, 0.79383, 0, 0, 0.77778],
    "8934": [0.23222, 0.74111, 0, 0, 0.77778],
    "8935": [0.23222, 0.74111, 0, 0, 0.77778],
    "8936": [0.23222, 0.74111, 0, 0, 0.77778],
    "8937": [0.23222, 0.74111, 0, 0, 0.77778],
    "8938": [0.20576, 0.70576, 0, 0, 0.77778],
    "8939": [0.20576, 0.70576, 0, 0, 0.77778],
    "8940": [0.30274, 0.79383, 0, 0, 0.77778],
    "8941": [0.30274, 0.79383, 0, 0, 0.77778],
    "8994": [0.19444, 0.69224, 0, 0, 0.77778],
    "8995": [0.19444, 0.69224, 0, 0, 0.77778],
    "9416": [0.15559, 0.69224, 0, 0, 0.90222],
    "9484": [0, 0.69224, 0, 0, 0.5],
    "9488": [0, 0.69224, 0, 0, 0.5],
    "9492": [0, 0.37788, 0, 0, 0.5],
    "9496": [0, 0.37788, 0, 0, 0.5],
    "9585": [0.19444, 0.68889, 0, 0, 0.88889],
    "9586": [0.19444, 0.74111, 0, 0, 0.88889],
    "9632": [0, 0.675, 0, 0, 0.77778],
    "9633": [0, 0.675, 0, 0, 0.77778],
    "9650": [0, 0.54986, 0, 0, 0.72222],
    "9651": [0, 0.54986, 0, 0, 0.72222],
    "9654": [0.03517, 0.54986, 0, 0, 0.77778],
    "9660": [0, 0.54986, 0, 0, 0.72222],
    "9661": [0, 0.54986, 0, 0, 0.72222],
    "9664": [0.03517, 0.54986, 0, 0, 0.77778],
    "9674": [0.11111, 0.69224, 0, 0, 0.66667],
    "9733": [0.19444, 0.69224, 0, 0, 0.94445],
    "10003": [0, 0.69224, 0, 0, 0.83334],
    "10016": [0, 0.69224, 0, 0, 0.83334],
    "10731": [0.11111, 0.69224, 0, 0, 0.66667],
    "10846": [0.19444, 0.75583, 0, 0, 0.61111],
    "10877": [0.13667, 0.63667, 0, 0, 0.77778],
    "10878": [0.13667, 0.63667, 0, 0, 0.77778],
    "10885": [0.25583, 0.75583, 0, 0, 0.77778],
    "10886": [0.25583, 0.75583, 0, 0, 0.77778],
    "10887": [0.13597, 0.63597, 0, 0, 0.77778],
    "10888": [0.13597, 0.63597, 0, 0, 0.77778],
    "10889": [0.26167, 0.75726, 0, 0, 0.77778],
    "10890": [0.26167, 0.75726, 0, 0, 0.77778],
    "10891": [0.48256, 0.98256, 0, 0, 0.77778],
    "10892": [0.48256, 0.98256, 0, 0, 0.77778],
    "10901": [0.13667, 0.63667, 0, 0, 0.77778],
    "10902": [0.13667, 0.63667, 0, 0, 0.77778],
    "10933": [0.25142, 0.75726, 0, 0, 0.77778],
    "10934": [0.25142, 0.75726, 0, 0, 0.77778],
    "10935": [0.26167, 0.75726, 0, 0, 0.77778],
    "10936": [0.26167, 0.75726, 0, 0, 0.77778],
    "10937": [0.26167, 0.75726, 0, 0, 0.77778],
    "10938": [0.26167, 0.75726, 0, 0, 0.77778],
    "10949": [0.25583, 0.75583, 0, 0, 0.77778],
    "10950": [0.25583, 0.75583, 0, 0, 0.77778],
    "10955": [0.28481, 0.79383, 0, 0, 0.77778],
    "10956": [0.28481, 0.79383, 0, 0, 0.77778],
    "57350": [0.08167, 0.58167, 0, 0, 0.22222],
    "57351": [0.08167, 0.58167, 0, 0, 0.38889],
    "57352": [0.08167, 0.58167, 0, 0, 0.77778],
    "57353": [0, 0.43056, 0.04028, 0, 0.66667],
    "57356": [0.25142, 0.75726, 0, 0, 0.77778],
    "57357": [0.25142, 0.75726, 0, 0, 0.77778],
    "57358": [0.41951, 0.91951, 0, 0, 0.77778],
    "57359": [0.30274, 0.79383, 0, 0, 0.77778],
    "57360": [0.30274, 0.79383, 0, 0, 0.77778],
    "57361": [0.41951, 0.91951, 0, 0, 0.77778],
    "57366": [0.25142, 0.75726, 0, 0, 0.77778],
    "57367": [0.25142, 0.75726, 0, 0, 0.77778],
    "57368": [0.25142, 0.75726, 0, 0, 0.77778],
    "57369": [0.25142, 0.75726, 0, 0, 0.77778],
    "57370": [0.13597, 0.63597, 0, 0, 0.77778],
    "57371": [0.13597, 0.63597, 0, 0, 0.77778]
  },
  "Caligraphic-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "65": [0, 0.68333, 0, 0.19445, 0.79847],
    "66": [0, 0.68333, 0.03041, 0.13889, 0.65681],
    "67": [0, 0.68333, 0.05834, 0.13889, 0.52653],
    "68": [0, 0.68333, 0.02778, 0.08334, 0.77139],
    "69": [0, 0.68333, 0.08944, 0.11111, 0.52778],
    "70": [0, 0.68333, 0.09931, 0.11111, 0.71875],
    "71": [0.09722, 0.68333, 0.0593, 0.11111, 0.59487],
    "72": [0, 0.68333, 965e-5, 0.11111, 0.84452],
    "73": [0, 0.68333, 0.07382, 0, 0.54452],
    "74": [0.09722, 0.68333, 0.18472, 0.16667, 0.67778],
    "75": [0, 0.68333, 0.01445, 0.05556, 0.76195],
    "76": [0, 0.68333, 0, 0.13889, 0.68972],
    "77": [0, 0.68333, 0, 0.13889, 1.2009],
    "78": [0, 0.68333, 0.14736, 0.08334, 0.82049],
    "79": [0, 0.68333, 0.02778, 0.11111, 0.79611],
    "80": [0, 0.68333, 0.08222, 0.08334, 0.69556],
    "81": [0.09722, 0.68333, 0, 0.11111, 0.81667],
    "82": [0, 0.68333, 0, 0.08334, 0.8475],
    "83": [0, 0.68333, 0.075, 0.13889, 0.60556],
    "84": [0, 0.68333, 0.25417, 0, 0.54464],
    "85": [0, 0.68333, 0.09931, 0.08334, 0.62583],
    "86": [0, 0.68333, 0.08222, 0, 0.61278],
    "87": [0, 0.68333, 0.08222, 0.08334, 0.98778],
    "88": [0, 0.68333, 0.14643, 0.13889, 0.7133],
    "89": [0.09722, 0.68333, 0.08222, 0.08334, 0.66834],
    "90": [0, 0.68333, 0.07944, 0.13889, 0.72473],
    "160": [0, 0, 0, 0, 0.25]
  },
  "Fraktur-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69141, 0, 0, 0.29574],
    "34": [0, 0.69141, 0, 0, 0.21471],
    "38": [0, 0.69141, 0, 0, 0.73786],
    "39": [0, 0.69141, 0, 0, 0.21201],
    "40": [0.24982, 0.74947, 0, 0, 0.38865],
    "41": [0.24982, 0.74947, 0, 0, 0.38865],
    "42": [0, 0.62119, 0, 0, 0.27764],
    "43": [0.08319, 0.58283, 0, 0, 0.75623],
    "44": [0, 0.10803, 0, 0, 0.27764],
    "45": [0.08319, 0.58283, 0, 0, 0.75623],
    "46": [0, 0.10803, 0, 0, 0.27764],
    "47": [0.24982, 0.74947, 0, 0, 0.50181],
    "48": [0, 0.47534, 0, 0, 0.50181],
    "49": [0, 0.47534, 0, 0, 0.50181],
    "50": [0, 0.47534, 0, 0, 0.50181],
    "51": [0.18906, 0.47534, 0, 0, 0.50181],
    "52": [0.18906, 0.47534, 0, 0, 0.50181],
    "53": [0.18906, 0.47534, 0, 0, 0.50181],
    "54": [0, 0.69141, 0, 0, 0.50181],
    "55": [0.18906, 0.47534, 0, 0, 0.50181],
    "56": [0, 0.69141, 0, 0, 0.50181],
    "57": [0.18906, 0.47534, 0, 0, 0.50181],
    "58": [0, 0.47534, 0, 0, 0.21606],
    "59": [0.12604, 0.47534, 0, 0, 0.21606],
    "61": [-0.13099, 0.36866, 0, 0, 0.75623],
    "63": [0, 0.69141, 0, 0, 0.36245],
    "65": [0, 0.69141, 0, 0, 0.7176],
    "66": [0, 0.69141, 0, 0, 0.88397],
    "67": [0, 0.69141, 0, 0, 0.61254],
    "68": [0, 0.69141, 0, 0, 0.83158],
    "69": [0, 0.69141, 0, 0, 0.66278],
    "70": [0.12604, 0.69141, 0, 0, 0.61119],
    "71": [0, 0.69141, 0, 0, 0.78539],
    "72": [0.06302, 0.69141, 0, 0, 0.7203],
    "73": [0, 0.69141, 0, 0, 0.55448],
    "74": [0.12604, 0.69141, 0, 0, 0.55231],
    "75": [0, 0.69141, 0, 0, 0.66845],
    "76": [0, 0.69141, 0, 0, 0.66602],
    "77": [0, 0.69141, 0, 0, 1.04953],
    "78": [0, 0.69141, 0, 0, 0.83212],
    "79": [0, 0.69141, 0, 0, 0.82699],
    "80": [0.18906, 0.69141, 0, 0, 0.82753],
    "81": [0.03781, 0.69141, 0, 0, 0.82699],
    "82": [0, 0.69141, 0, 0, 0.82807],
    "83": [0, 0.69141, 0, 0, 0.82861],
    "84": [0, 0.69141, 0, 0, 0.66899],
    "85": [0, 0.69141, 0, 0, 0.64576],
    "86": [0, 0.69141, 0, 0, 0.83131],
    "87": [0, 0.69141, 0, 0, 1.04602],
    "88": [0, 0.69141, 0, 0, 0.71922],
    "89": [0.18906, 0.69141, 0, 0, 0.83293],
    "90": [0.12604, 0.69141, 0, 0, 0.60201],
    "91": [0.24982, 0.74947, 0, 0, 0.27764],
    "93": [0.24982, 0.74947, 0, 0, 0.27764],
    "94": [0, 0.69141, 0, 0, 0.49965],
    "97": [0, 0.47534, 0, 0, 0.50046],
    "98": [0, 0.69141, 0, 0, 0.51315],
    "99": [0, 0.47534, 0, 0, 0.38946],
    "100": [0, 0.62119, 0, 0, 0.49857],
    "101": [0, 0.47534, 0, 0, 0.40053],
    "102": [0.18906, 0.69141, 0, 0, 0.32626],
    "103": [0.18906, 0.47534, 0, 0, 0.5037],
    "104": [0.18906, 0.69141, 0, 0, 0.52126],
    "105": [0, 0.69141, 0, 0, 0.27899],
    "106": [0, 0.69141, 0, 0, 0.28088],
    "107": [0, 0.69141, 0, 0, 0.38946],
    "108": [0, 0.69141, 0, 0, 0.27953],
    "109": [0, 0.47534, 0, 0, 0.76676],
    "110": [0, 0.47534, 0, 0, 0.52666],
    "111": [0, 0.47534, 0, 0, 0.48885],
    "112": [0.18906, 0.52396, 0, 0, 0.50046],
    "113": [0.18906, 0.47534, 0, 0, 0.48912],
    "114": [0, 0.47534, 0, 0, 0.38919],
    "115": [0, 0.47534, 0, 0, 0.44266],
    "116": [0, 0.62119, 0, 0, 0.33301],
    "117": [0, 0.47534, 0, 0, 0.5172],
    "118": [0, 0.52396, 0, 0, 0.5118],
    "119": [0, 0.52396, 0, 0, 0.77351],
    "120": [0.18906, 0.47534, 0, 0, 0.38865],
    "121": [0.18906, 0.47534, 0, 0, 0.49884],
    "122": [0.18906, 0.47534, 0, 0, 0.39054],
    "160": [0, 0, 0, 0, 0.25],
    "8216": [0, 0.69141, 0, 0, 0.21471],
    "8217": [0, 0.69141, 0, 0, 0.21471],
    "58112": [0, 0.62119, 0, 0, 0.49749],
    "58113": [0, 0.62119, 0, 0, 0.4983],
    "58114": [0.18906, 0.69141, 0, 0, 0.33328],
    "58115": [0.18906, 0.69141, 0, 0, 0.32923],
    "58116": [0.18906, 0.47534, 0, 0, 0.50343],
    "58117": [0, 0.69141, 0, 0, 0.33301],
    "58118": [0, 0.62119, 0, 0, 0.33409],
    "58119": [0, 0.47534, 0, 0, 0.50073]
  },
  "Main-Bold": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0, 0, 0.35],
    "34": [0, 0.69444, 0, 0, 0.60278],
    "35": [0.19444, 0.69444, 0, 0, 0.95833],
    "36": [0.05556, 0.75, 0, 0, 0.575],
    "37": [0.05556, 0.75, 0, 0, 0.95833],
    "38": [0, 0.69444, 0, 0, 0.89444],
    "39": [0, 0.69444, 0, 0, 0.31944],
    "40": [0.25, 0.75, 0, 0, 0.44722],
    "41": [0.25, 0.75, 0, 0, 0.44722],
    "42": [0, 0.75, 0, 0, 0.575],
    "43": [0.13333, 0.63333, 0, 0, 0.89444],
    "44": [0.19444, 0.15556, 0, 0, 0.31944],
    "45": [0, 0.44444, 0, 0, 0.38333],
    "46": [0, 0.15556, 0, 0, 0.31944],
    "47": [0.25, 0.75, 0, 0, 0.575],
    "48": [0, 0.64444, 0, 0, 0.575],
    "49": [0, 0.64444, 0, 0, 0.575],
    "50": [0, 0.64444, 0, 0, 0.575],
    "51": [0, 0.64444, 0, 0, 0.575],
    "52": [0, 0.64444, 0, 0, 0.575],
    "53": [0, 0.64444, 0, 0, 0.575],
    "54": [0, 0.64444, 0, 0, 0.575],
    "55": [0, 0.64444, 0, 0, 0.575],
    "56": [0, 0.64444, 0, 0, 0.575],
    "57": [0, 0.64444, 0, 0, 0.575],
    "58": [0, 0.44444, 0, 0, 0.31944],
    "59": [0.19444, 0.44444, 0, 0, 0.31944],
    "60": [0.08556, 0.58556, 0, 0, 0.89444],
    "61": [-0.10889, 0.39111, 0, 0, 0.89444],
    "62": [0.08556, 0.58556, 0, 0, 0.89444],
    "63": [0, 0.69444, 0, 0, 0.54305],
    "64": [0, 0.69444, 0, 0, 0.89444],
    "65": [0, 0.68611, 0, 0, 0.86944],
    "66": [0, 0.68611, 0, 0, 0.81805],
    "67": [0, 0.68611, 0, 0, 0.83055],
    "68": [0, 0.68611, 0, 0, 0.88194],
    "69": [0, 0.68611, 0, 0, 0.75555],
    "70": [0, 0.68611, 0, 0, 0.72361],
    "71": [0, 0.68611, 0, 0, 0.90416],
    "72": [0, 0.68611, 0, 0, 0.9],
    "73": [0, 0.68611, 0, 0, 0.43611],
    "74": [0, 0.68611, 0, 0, 0.59444],
    "75": [0, 0.68611, 0, 0, 0.90138],
    "76": [0, 0.68611, 0, 0, 0.69166],
    "77": [0, 0.68611, 0, 0, 1.09166],
    "78": [0, 0.68611, 0, 0, 0.9],
    "79": [0, 0.68611, 0, 0, 0.86388],
    "80": [0, 0.68611, 0, 0, 0.78611],
    "81": [0.19444, 0.68611, 0, 0, 0.86388],
    "82": [0, 0.68611, 0, 0, 0.8625],
    "83": [0, 0.68611, 0, 0, 0.63889],
    "84": [0, 0.68611, 0, 0, 0.8],
    "85": [0, 0.68611, 0, 0, 0.88472],
    "86": [0, 0.68611, 0.01597, 0, 0.86944],
    "87": [0, 0.68611, 0.01597, 0, 1.18888],
    "88": [0, 0.68611, 0, 0, 0.86944],
    "89": [0, 0.68611, 0.02875, 0, 0.86944],
    "90": [0, 0.68611, 0, 0, 0.70277],
    "91": [0.25, 0.75, 0, 0, 0.31944],
    "92": [0.25, 0.75, 0, 0, 0.575],
    "93": [0.25, 0.75, 0, 0, 0.31944],
    "94": [0, 0.69444, 0, 0, 0.575],
    "95": [0.31, 0.13444, 0.03194, 0, 0.575],
    "97": [0, 0.44444, 0, 0, 0.55902],
    "98": [0, 0.69444, 0, 0, 0.63889],
    "99": [0, 0.44444, 0, 0, 0.51111],
    "100": [0, 0.69444, 0, 0, 0.63889],
    "101": [0, 0.44444, 0, 0, 0.52708],
    "102": [0, 0.69444, 0.10903, 0, 0.35139],
    "103": [0.19444, 0.44444, 0.01597, 0, 0.575],
    "104": [0, 0.69444, 0, 0, 0.63889],
    "105": [0, 0.69444, 0, 0, 0.31944],
    "106": [0.19444, 0.69444, 0, 0, 0.35139],
    "107": [0, 0.69444, 0, 0, 0.60694],
    "108": [0, 0.69444, 0, 0, 0.31944],
    "109": [0, 0.44444, 0, 0, 0.95833],
    "110": [0, 0.44444, 0, 0, 0.63889],
    "111": [0, 0.44444, 0, 0, 0.575],
    "112": [0.19444, 0.44444, 0, 0, 0.63889],
    "113": [0.19444, 0.44444, 0, 0, 0.60694],
    "114": [0, 0.44444, 0, 0, 0.47361],
    "115": [0, 0.44444, 0, 0, 0.45361],
    "116": [0, 0.63492, 0, 0, 0.44722],
    "117": [0, 0.44444, 0, 0, 0.63889],
    "118": [0, 0.44444, 0.01597, 0, 0.60694],
    "119": [0, 0.44444, 0.01597, 0, 0.83055],
    "120": [0, 0.44444, 0, 0, 0.60694],
    "121": [0.19444, 0.44444, 0.01597, 0, 0.60694],
    "122": [0, 0.44444, 0, 0, 0.51111],
    "123": [0.25, 0.75, 0, 0, 0.575],
    "124": [0.25, 0.75, 0, 0, 0.31944],
    "125": [0.25, 0.75, 0, 0, 0.575],
    "126": [0.35, 0.34444, 0, 0, 0.575],
    "160": [0, 0, 0, 0, 0.25],
    "163": [0, 0.69444, 0, 0, 0.86853],
    "168": [0, 0.69444, 0, 0, 0.575],
    "172": [0, 0.44444, 0, 0, 0.76666],
    "176": [0, 0.69444, 0, 0, 0.86944],
    "177": [0.13333, 0.63333, 0, 0, 0.89444],
    "184": [0.17014, 0, 0, 0, 0.51111],
    "198": [0, 0.68611, 0, 0, 1.04166],
    "215": [0.13333, 0.63333, 0, 0, 0.89444],
    "216": [0.04861, 0.73472, 0, 0, 0.89444],
    "223": [0, 0.69444, 0, 0, 0.59722],
    "230": [0, 0.44444, 0, 0, 0.83055],
    "247": [0.13333, 0.63333, 0, 0, 0.89444],
    "248": [0.09722, 0.54167, 0, 0, 0.575],
    "305": [0, 0.44444, 0, 0, 0.31944],
    "338": [0, 0.68611, 0, 0, 1.16944],
    "339": [0, 0.44444, 0, 0, 0.89444],
    "567": [0.19444, 0.44444, 0, 0, 0.35139],
    "710": [0, 0.69444, 0, 0, 0.575],
    "711": [0, 0.63194, 0, 0, 0.575],
    "713": [0, 0.59611, 0, 0, 0.575],
    "714": [0, 0.69444, 0, 0, 0.575],
    "715": [0, 0.69444, 0, 0, 0.575],
    "728": [0, 0.69444, 0, 0, 0.575],
    "729": [0, 0.69444, 0, 0, 0.31944],
    "730": [0, 0.69444, 0, 0, 0.86944],
    "732": [0, 0.69444, 0, 0, 0.575],
    "733": [0, 0.69444, 0, 0, 0.575],
    "915": [0, 0.68611, 0, 0, 0.69166],
    "916": [0, 0.68611, 0, 0, 0.95833],
    "920": [0, 0.68611, 0, 0, 0.89444],
    "923": [0, 0.68611, 0, 0, 0.80555],
    "926": [0, 0.68611, 0, 0, 0.76666],
    "928": [0, 0.68611, 0, 0, 0.9],
    "931": [0, 0.68611, 0, 0, 0.83055],
    "933": [0, 0.68611, 0, 0, 0.89444],
    "934": [0, 0.68611, 0, 0, 0.83055],
    "936": [0, 0.68611, 0, 0, 0.89444],
    "937": [0, 0.68611, 0, 0, 0.83055],
    "8211": [0, 0.44444, 0.03194, 0, 0.575],
    "8212": [0, 0.44444, 0.03194, 0, 1.14999],
    "8216": [0, 0.69444, 0, 0, 0.31944],
    "8217": [0, 0.69444, 0, 0, 0.31944],
    "8220": [0, 0.69444, 0, 0, 0.60278],
    "8221": [0, 0.69444, 0, 0, 0.60278],
    "8224": [0.19444, 0.69444, 0, 0, 0.51111],
    "8225": [0.19444, 0.69444, 0, 0, 0.51111],
    "8242": [0, 0.55556, 0, 0, 0.34444],
    "8407": [0, 0.72444, 0.15486, 0, 0.575],
    "8463": [0, 0.69444, 0, 0, 0.66759],
    "8465": [0, 0.69444, 0, 0, 0.83055],
    "8467": [0, 0.69444, 0, 0, 0.47361],
    "8472": [0.19444, 0.44444, 0, 0, 0.74027],
    "8476": [0, 0.69444, 0, 0, 0.83055],
    "8501": [0, 0.69444, 0, 0, 0.70277],
    "8592": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8593": [0.19444, 0.69444, 0, 0, 0.575],
    "8594": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8595": [0.19444, 0.69444, 0, 0, 0.575],
    "8596": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8597": [0.25, 0.75, 0, 0, 0.575],
    "8598": [0.19444, 0.69444, 0, 0, 1.14999],
    "8599": [0.19444, 0.69444, 0, 0, 1.14999],
    "8600": [0.19444, 0.69444, 0, 0, 1.14999],
    "8601": [0.19444, 0.69444, 0, 0, 1.14999],
    "8636": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8637": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8640": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8641": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8656": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8657": [0.19444, 0.69444, 0, 0, 0.70277],
    "8658": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8659": [0.19444, 0.69444, 0, 0, 0.70277],
    "8660": [-0.10889, 0.39111, 0, 0, 1.14999],
    "8661": [0.25, 0.75, 0, 0, 0.70277],
    "8704": [0, 0.69444, 0, 0, 0.63889],
    "8706": [0, 0.69444, 0.06389, 0, 0.62847],
    "8707": [0, 0.69444, 0, 0, 0.63889],
    "8709": [0.05556, 0.75, 0, 0, 0.575],
    "8711": [0, 0.68611, 0, 0, 0.95833],
    "8712": [0.08556, 0.58556, 0, 0, 0.76666],
    "8715": [0.08556, 0.58556, 0, 0, 0.76666],
    "8722": [0.13333, 0.63333, 0, 0, 0.89444],
    "8723": [0.13333, 0.63333, 0, 0, 0.89444],
    "8725": [0.25, 0.75, 0, 0, 0.575],
    "8726": [0.25, 0.75, 0, 0, 0.575],
    "8727": [-0.02778, 0.47222, 0, 0, 0.575],
    "8728": [-0.02639, 0.47361, 0, 0, 0.575],
    "8729": [-0.02639, 0.47361, 0, 0, 0.575],
    "8730": [0.18, 0.82, 0, 0, 0.95833],
    "8733": [0, 0.44444, 0, 0, 0.89444],
    "8734": [0, 0.44444, 0, 0, 1.14999],
    "8736": [0, 0.69224, 0, 0, 0.72222],
    "8739": [0.25, 0.75, 0, 0, 0.31944],
    "8741": [0.25, 0.75, 0, 0, 0.575],
    "8743": [0, 0.55556, 0, 0, 0.76666],
    "8744": [0, 0.55556, 0, 0, 0.76666],
    "8745": [0, 0.55556, 0, 0, 0.76666],
    "8746": [0, 0.55556, 0, 0, 0.76666],
    "8747": [0.19444, 0.69444, 0.12778, 0, 0.56875],
    "8764": [-0.10889, 0.39111, 0, 0, 0.89444],
    "8768": [0.19444, 0.69444, 0, 0, 0.31944],
    "8771": [222e-5, 0.50222, 0, 0, 0.89444],
    "8773": [0.027, 0.638, 0, 0, 0.894],
    "8776": [0.02444, 0.52444, 0, 0, 0.89444],
    "8781": [222e-5, 0.50222, 0, 0, 0.89444],
    "8801": [222e-5, 0.50222, 0, 0, 0.89444],
    "8804": [0.19667, 0.69667, 0, 0, 0.89444],
    "8805": [0.19667, 0.69667, 0, 0, 0.89444],
    "8810": [0.08556, 0.58556, 0, 0, 1.14999],
    "8811": [0.08556, 0.58556, 0, 0, 1.14999],
    "8826": [0.08556, 0.58556, 0, 0, 0.89444],
    "8827": [0.08556, 0.58556, 0, 0, 0.89444],
    "8834": [0.08556, 0.58556, 0, 0, 0.89444],
    "8835": [0.08556, 0.58556, 0, 0, 0.89444],
    "8838": [0.19667, 0.69667, 0, 0, 0.89444],
    "8839": [0.19667, 0.69667, 0, 0, 0.89444],
    "8846": [0, 0.55556, 0, 0, 0.76666],
    "8849": [0.19667, 0.69667, 0, 0, 0.89444],
    "8850": [0.19667, 0.69667, 0, 0, 0.89444],
    "8851": [0, 0.55556, 0, 0, 0.76666],
    "8852": [0, 0.55556, 0, 0, 0.76666],
    "8853": [0.13333, 0.63333, 0, 0, 0.89444],
    "8854": [0.13333, 0.63333, 0, 0, 0.89444],
    "8855": [0.13333, 0.63333, 0, 0, 0.89444],
    "8856": [0.13333, 0.63333, 0, 0, 0.89444],
    "8857": [0.13333, 0.63333, 0, 0, 0.89444],
    "8866": [0, 0.69444, 0, 0, 0.70277],
    "8867": [0, 0.69444, 0, 0, 0.70277],
    "8868": [0, 0.69444, 0, 0, 0.89444],
    "8869": [0, 0.69444, 0, 0, 0.89444],
    "8900": [-0.02639, 0.47361, 0, 0, 0.575],
    "8901": [-0.02639, 0.47361, 0, 0, 0.31944],
    "8902": [-0.02778, 0.47222, 0, 0, 0.575],
    "8968": [0.25, 0.75, 0, 0, 0.51111],
    "8969": [0.25, 0.75, 0, 0, 0.51111],
    "8970": [0.25, 0.75, 0, 0, 0.51111],
    "8971": [0.25, 0.75, 0, 0, 0.51111],
    "8994": [-0.13889, 0.36111, 0, 0, 1.14999],
    "8995": [-0.13889, 0.36111, 0, 0, 1.14999],
    "9651": [0.19444, 0.69444, 0, 0, 1.02222],
    "9657": [-0.02778, 0.47222, 0, 0, 0.575],
    "9661": [0.19444, 0.69444, 0, 0, 1.02222],
    "9667": [-0.02778, 0.47222, 0, 0, 0.575],
    "9711": [0.19444, 0.69444, 0, 0, 1.14999],
    "9824": [0.12963, 0.69444, 0, 0, 0.89444],
    "9825": [0.12963, 0.69444, 0, 0, 0.89444],
    "9826": [0.12963, 0.69444, 0, 0, 0.89444],
    "9827": [0.12963, 0.69444, 0, 0, 0.89444],
    "9837": [0, 0.75, 0, 0, 0.44722],
    "9838": [0.19444, 0.69444, 0, 0, 0.44722],
    "9839": [0.19444, 0.69444, 0, 0, 0.44722],
    "10216": [0.25, 0.75, 0, 0, 0.44722],
    "10217": [0.25, 0.75, 0, 0, 0.44722],
    "10815": [0, 0.68611, 0, 0, 0.9],
    "10927": [0.19667, 0.69667, 0, 0, 0.89444],
    "10928": [0.19667, 0.69667, 0, 0, 0.89444],
    "57376": [0.19444, 0.69444, 0, 0, 0]
  },
  "Main-BoldItalic": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0.11417, 0, 0.38611],
    "34": [0, 0.69444, 0.07939, 0, 0.62055],
    "35": [0.19444, 0.69444, 0.06833, 0, 0.94444],
    "37": [0.05556, 0.75, 0.12861, 0, 0.94444],
    "38": [0, 0.69444, 0.08528, 0, 0.88555],
    "39": [0, 0.69444, 0.12945, 0, 0.35555],
    "40": [0.25, 0.75, 0.15806, 0, 0.47333],
    "41": [0.25, 0.75, 0.03306, 0, 0.47333],
    "42": [0, 0.75, 0.14333, 0, 0.59111],
    "43": [0.10333, 0.60333, 0.03306, 0, 0.88555],
    "44": [0.19444, 0.14722, 0, 0, 0.35555],
    "45": [0, 0.44444, 0.02611, 0, 0.41444],
    "46": [0, 0.14722, 0, 0, 0.35555],
    "47": [0.25, 0.75, 0.15806, 0, 0.59111],
    "48": [0, 0.64444, 0.13167, 0, 0.59111],
    "49": [0, 0.64444, 0.13167, 0, 0.59111],
    "50": [0, 0.64444, 0.13167, 0, 0.59111],
    "51": [0, 0.64444, 0.13167, 0, 0.59111],
    "52": [0.19444, 0.64444, 0.13167, 0, 0.59111],
    "53": [0, 0.64444, 0.13167, 0, 0.59111],
    "54": [0, 0.64444, 0.13167, 0, 0.59111],
    "55": [0.19444, 0.64444, 0.13167, 0, 0.59111],
    "56": [0, 0.64444, 0.13167, 0, 0.59111],
    "57": [0, 0.64444, 0.13167, 0, 0.59111],
    "58": [0, 0.44444, 0.06695, 0, 0.35555],
    "59": [0.19444, 0.44444, 0.06695, 0, 0.35555],
    "61": [-0.10889, 0.39111, 0.06833, 0, 0.88555],
    "63": [0, 0.69444, 0.11472, 0, 0.59111],
    "64": [0, 0.69444, 0.09208, 0, 0.88555],
    "65": [0, 0.68611, 0, 0, 0.86555],
    "66": [0, 0.68611, 0.0992, 0, 0.81666],
    "67": [0, 0.68611, 0.14208, 0, 0.82666],
    "68": [0, 0.68611, 0.09062, 0, 0.87555],
    "69": [0, 0.68611, 0.11431, 0, 0.75666],
    "70": [0, 0.68611, 0.12903, 0, 0.72722],
    "71": [0, 0.68611, 0.07347, 0, 0.89527],
    "72": [0, 0.68611, 0.17208, 0, 0.8961],
    "73": [0, 0.68611, 0.15681, 0, 0.47166],
    "74": [0, 0.68611, 0.145, 0, 0.61055],
    "75": [0, 0.68611, 0.14208, 0, 0.89499],
    "76": [0, 0.68611, 0, 0, 0.69777],
    "77": [0, 0.68611, 0.17208, 0, 1.07277],
    "78": [0, 0.68611, 0.17208, 0, 0.8961],
    "79": [0, 0.68611, 0.09062, 0, 0.85499],
    "80": [0, 0.68611, 0.0992, 0, 0.78721],
    "81": [0.19444, 0.68611, 0.09062, 0, 0.85499],
    "82": [0, 0.68611, 0.02559, 0, 0.85944],
    "83": [0, 0.68611, 0.11264, 0, 0.64999],
    "84": [0, 0.68611, 0.12903, 0, 0.7961],
    "85": [0, 0.68611, 0.17208, 0, 0.88083],
    "86": [0, 0.68611, 0.18625, 0, 0.86555],
    "87": [0, 0.68611, 0.18625, 0, 1.15999],
    "88": [0, 0.68611, 0.15681, 0, 0.86555],
    "89": [0, 0.68611, 0.19803, 0, 0.86555],
    "90": [0, 0.68611, 0.14208, 0, 0.70888],
    "91": [0.25, 0.75, 0.1875, 0, 0.35611],
    "93": [0.25, 0.75, 0.09972, 0, 0.35611],
    "94": [0, 0.69444, 0.06709, 0, 0.59111],
    "95": [0.31, 0.13444, 0.09811, 0, 0.59111],
    "97": [0, 0.44444, 0.09426, 0, 0.59111],
    "98": [0, 0.69444, 0.07861, 0, 0.53222],
    "99": [0, 0.44444, 0.05222, 0, 0.53222],
    "100": [0, 0.69444, 0.10861, 0, 0.59111],
    "101": [0, 0.44444, 0.085, 0, 0.53222],
    "102": [0.19444, 0.69444, 0.21778, 0, 0.4],
    "103": [0.19444, 0.44444, 0.105, 0, 0.53222],
    "104": [0, 0.69444, 0.09426, 0, 0.59111],
    "105": [0, 0.69326, 0.11387, 0, 0.35555],
    "106": [0.19444, 0.69326, 0.1672, 0, 0.35555],
    "107": [0, 0.69444, 0.11111, 0, 0.53222],
    "108": [0, 0.69444, 0.10861, 0, 0.29666],
    "109": [0, 0.44444, 0.09426, 0, 0.94444],
    "110": [0, 0.44444, 0.09426, 0, 0.64999],
    "111": [0, 0.44444, 0.07861, 0, 0.59111],
    "112": [0.19444, 0.44444, 0.07861, 0, 0.59111],
    "113": [0.19444, 0.44444, 0.105, 0, 0.53222],
    "114": [0, 0.44444, 0.11111, 0, 0.50167],
    "115": [0, 0.44444, 0.08167, 0, 0.48694],
    "116": [0, 0.63492, 0.09639, 0, 0.385],
    "117": [0, 0.44444, 0.09426, 0, 0.62055],
    "118": [0, 0.44444, 0.11111, 0, 0.53222],
    "119": [0, 0.44444, 0.11111, 0, 0.76777],
    "120": [0, 0.44444, 0.12583, 0, 0.56055],
    "121": [0.19444, 0.44444, 0.105, 0, 0.56166],
    "122": [0, 0.44444, 0.13889, 0, 0.49055],
    "126": [0.35, 0.34444, 0.11472, 0, 0.59111],
    "160": [0, 0, 0, 0, 0.25],
    "168": [0, 0.69444, 0.11473, 0, 0.59111],
    "176": [0, 0.69444, 0, 0, 0.94888],
    "184": [0.17014, 0, 0, 0, 0.53222],
    "198": [0, 0.68611, 0.11431, 0, 1.02277],
    "216": [0.04861, 0.73472, 0.09062, 0, 0.88555],
    "223": [0.19444, 0.69444, 0.09736, 0, 0.665],
    "230": [0, 0.44444, 0.085, 0, 0.82666],
    "248": [0.09722, 0.54167, 0.09458, 0, 0.59111],
    "305": [0, 0.44444, 0.09426, 0, 0.35555],
    "338": [0, 0.68611, 0.11431, 0, 1.14054],
    "339": [0, 0.44444, 0.085, 0, 0.82666],
    "567": [0.19444, 0.44444, 0.04611, 0, 0.385],
    "710": [0, 0.69444, 0.06709, 0, 0.59111],
    "711": [0, 0.63194, 0.08271, 0, 0.59111],
    "713": [0, 0.59444, 0.10444, 0, 0.59111],
    "714": [0, 0.69444, 0.08528, 0, 0.59111],
    "715": [0, 0.69444, 0, 0, 0.59111],
    "728": [0, 0.69444, 0.10333, 0, 0.59111],
    "729": [0, 0.69444, 0.12945, 0, 0.35555],
    "730": [0, 0.69444, 0, 0, 0.94888],
    "732": [0, 0.69444, 0.11472, 0, 0.59111],
    "733": [0, 0.69444, 0.11472, 0, 0.59111],
    "915": [0, 0.68611, 0.12903, 0, 0.69777],
    "916": [0, 0.68611, 0, 0, 0.94444],
    "920": [0, 0.68611, 0.09062, 0, 0.88555],
    "923": [0, 0.68611, 0, 0, 0.80666],
    "926": [0, 0.68611, 0.15092, 0, 0.76777],
    "928": [0, 0.68611, 0.17208, 0, 0.8961],
    "931": [0, 0.68611, 0.11431, 0, 0.82666],
    "933": [0, 0.68611, 0.10778, 0, 0.88555],
    "934": [0, 0.68611, 0.05632, 0, 0.82666],
    "936": [0, 0.68611, 0.10778, 0, 0.88555],
    "937": [0, 0.68611, 0.0992, 0, 0.82666],
    "8211": [0, 0.44444, 0.09811, 0, 0.59111],
    "8212": [0, 0.44444, 0.09811, 0, 1.18221],
    "8216": [0, 0.69444, 0.12945, 0, 0.35555],
    "8217": [0, 0.69444, 0.12945, 0, 0.35555],
    "8220": [0, 0.69444, 0.16772, 0, 0.62055],
    "8221": [0, 0.69444, 0.07939, 0, 0.62055]
  },
  "Main-Italic": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0.12417, 0, 0.30667],
    "34": [0, 0.69444, 0.06961, 0, 0.51444],
    "35": [0.19444, 0.69444, 0.06616, 0, 0.81777],
    "37": [0.05556, 0.75, 0.13639, 0, 0.81777],
    "38": [0, 0.69444, 0.09694, 0, 0.76666],
    "39": [0, 0.69444, 0.12417, 0, 0.30667],
    "40": [0.25, 0.75, 0.16194, 0, 0.40889],
    "41": [0.25, 0.75, 0.03694, 0, 0.40889],
    "42": [0, 0.75, 0.14917, 0, 0.51111],
    "43": [0.05667, 0.56167, 0.03694, 0, 0.76666],
    "44": [0.19444, 0.10556, 0, 0, 0.30667],
    "45": [0, 0.43056, 0.02826, 0, 0.35778],
    "46": [0, 0.10556, 0, 0, 0.30667],
    "47": [0.25, 0.75, 0.16194, 0, 0.51111],
    "48": [0, 0.64444, 0.13556, 0, 0.51111],
    "49": [0, 0.64444, 0.13556, 0, 0.51111],
    "50": [0, 0.64444, 0.13556, 0, 0.51111],
    "51": [0, 0.64444, 0.13556, 0, 0.51111],
    "52": [0.19444, 0.64444, 0.13556, 0, 0.51111],
    "53": [0, 0.64444, 0.13556, 0, 0.51111],
    "54": [0, 0.64444, 0.13556, 0, 0.51111],
    "55": [0.19444, 0.64444, 0.13556, 0, 0.51111],
    "56": [0, 0.64444, 0.13556, 0, 0.51111],
    "57": [0, 0.64444, 0.13556, 0, 0.51111],
    "58": [0, 0.43056, 0.0582, 0, 0.30667],
    "59": [0.19444, 0.43056, 0.0582, 0, 0.30667],
    "61": [-0.13313, 0.36687, 0.06616, 0, 0.76666],
    "63": [0, 0.69444, 0.1225, 0, 0.51111],
    "64": [0, 0.69444, 0.09597, 0, 0.76666],
    "65": [0, 0.68333, 0, 0, 0.74333],
    "66": [0, 0.68333, 0.10257, 0, 0.70389],
    "67": [0, 0.68333, 0.14528, 0, 0.71555],
    "68": [0, 0.68333, 0.09403, 0, 0.755],
    "69": [0, 0.68333, 0.12028, 0, 0.67833],
    "70": [0, 0.68333, 0.13305, 0, 0.65277],
    "71": [0, 0.68333, 0.08722, 0, 0.77361],
    "72": [0, 0.68333, 0.16389, 0, 0.74333],
    "73": [0, 0.68333, 0.15806, 0, 0.38555],
    "74": [0, 0.68333, 0.14028, 0, 0.525],
    "75": [0, 0.68333, 0.14528, 0, 0.76888],
    "76": [0, 0.68333, 0, 0, 0.62722],
    "77": [0, 0.68333, 0.16389, 0, 0.89666],
    "78": [0, 0.68333, 0.16389, 0, 0.74333],
    "79": [0, 0.68333, 0.09403, 0, 0.76666],
    "80": [0, 0.68333, 0.10257, 0, 0.67833],
    "81": [0.19444, 0.68333, 0.09403, 0, 0.76666],
    "82": [0, 0.68333, 0.03868, 0, 0.72944],
    "83": [0, 0.68333, 0.11972, 0, 0.56222],
    "84": [0, 0.68333, 0.13305, 0, 0.71555],
    "85": [0, 0.68333, 0.16389, 0, 0.74333],
    "86": [0, 0.68333, 0.18361, 0, 0.74333],
    "87": [0, 0.68333, 0.18361, 0, 0.99888],
    "88": [0, 0.68333, 0.15806, 0, 0.74333],
    "89": [0, 0.68333, 0.19383, 0, 0.74333],
    "90": [0, 0.68333, 0.14528, 0, 0.61333],
    "91": [0.25, 0.75, 0.1875, 0, 0.30667],
    "93": [0.25, 0.75, 0.10528, 0, 0.30667],
    "94": [0, 0.69444, 0.06646, 0, 0.51111],
    "95": [0.31, 0.12056, 0.09208, 0, 0.51111],
    "97": [0, 0.43056, 0.07671, 0, 0.51111],
    "98": [0, 0.69444, 0.06312, 0, 0.46],
    "99": [0, 0.43056, 0.05653, 0, 0.46],
    "100": [0, 0.69444, 0.10333, 0, 0.51111],
    "101": [0, 0.43056, 0.07514, 0, 0.46],
    "102": [0.19444, 0.69444, 0.21194, 0, 0.30667],
    "103": [0.19444, 0.43056, 0.08847, 0, 0.46],
    "104": [0, 0.69444, 0.07671, 0, 0.51111],
    "105": [0, 0.65536, 0.1019, 0, 0.30667],
    "106": [0.19444, 0.65536, 0.14467, 0, 0.30667],
    "107": [0, 0.69444, 0.10764, 0, 0.46],
    "108": [0, 0.69444, 0.10333, 0, 0.25555],
    "109": [0, 0.43056, 0.07671, 0, 0.81777],
    "110": [0, 0.43056, 0.07671, 0, 0.56222],
    "111": [0, 0.43056, 0.06312, 0, 0.51111],
    "112": [0.19444, 0.43056, 0.06312, 0, 0.51111],
    "113": [0.19444, 0.43056, 0.08847, 0, 0.46],
    "114": [0, 0.43056, 0.10764, 0, 0.42166],
    "115": [0, 0.43056, 0.08208, 0, 0.40889],
    "116": [0, 0.61508, 0.09486, 0, 0.33222],
    "117": [0, 0.43056, 0.07671, 0, 0.53666],
    "118": [0, 0.43056, 0.10764, 0, 0.46],
    "119": [0, 0.43056, 0.10764, 0, 0.66444],
    "120": [0, 0.43056, 0.12042, 0, 0.46389],
    "121": [0.19444, 0.43056, 0.08847, 0, 0.48555],
    "122": [0, 0.43056, 0.12292, 0, 0.40889],
    "126": [0.35, 0.31786, 0.11585, 0, 0.51111],
    "160": [0, 0, 0, 0, 0.25],
    "168": [0, 0.66786, 0.10474, 0, 0.51111],
    "176": [0, 0.69444, 0, 0, 0.83129],
    "184": [0.17014, 0, 0, 0, 0.46],
    "198": [0, 0.68333, 0.12028, 0, 0.88277],
    "216": [0.04861, 0.73194, 0.09403, 0, 0.76666],
    "223": [0.19444, 0.69444, 0.10514, 0, 0.53666],
    "230": [0, 0.43056, 0.07514, 0, 0.71555],
    "248": [0.09722, 0.52778, 0.09194, 0, 0.51111],
    "338": [0, 0.68333, 0.12028, 0, 0.98499],
    "339": [0, 0.43056, 0.07514, 0, 0.71555],
    "710": [0, 0.69444, 0.06646, 0, 0.51111],
    "711": [0, 0.62847, 0.08295, 0, 0.51111],
    "713": [0, 0.56167, 0.10333, 0, 0.51111],
    "714": [0, 0.69444, 0.09694, 0, 0.51111],
    "715": [0, 0.69444, 0, 0, 0.51111],
    "728": [0, 0.69444, 0.10806, 0, 0.51111],
    "729": [0, 0.66786, 0.11752, 0, 0.30667],
    "730": [0, 0.69444, 0, 0, 0.83129],
    "732": [0, 0.66786, 0.11585, 0, 0.51111],
    "733": [0, 0.69444, 0.1225, 0, 0.51111],
    "915": [0, 0.68333, 0.13305, 0, 0.62722],
    "916": [0, 0.68333, 0, 0, 0.81777],
    "920": [0, 0.68333, 0.09403, 0, 0.76666],
    "923": [0, 0.68333, 0, 0, 0.69222],
    "926": [0, 0.68333, 0.15294, 0, 0.66444],
    "928": [0, 0.68333, 0.16389, 0, 0.74333],
    "931": [0, 0.68333, 0.12028, 0, 0.71555],
    "933": [0, 0.68333, 0.11111, 0, 0.76666],
    "934": [0, 0.68333, 0.05986, 0, 0.71555],
    "936": [0, 0.68333, 0.11111, 0, 0.76666],
    "937": [0, 0.68333, 0.10257, 0, 0.71555],
    "8211": [0, 0.43056, 0.09208, 0, 0.51111],
    "8212": [0, 0.43056, 0.09208, 0, 1.02222],
    "8216": [0, 0.69444, 0.12417, 0, 0.30667],
    "8217": [0, 0.69444, 0.12417, 0, 0.30667],
    "8220": [0, 0.69444, 0.1685, 0, 0.51444],
    "8221": [0, 0.69444, 0.06961, 0, 0.51444],
    "8463": [0, 0.68889, 0, 0, 0.54028]
  },
  "Main-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0, 0, 0.27778],
    "34": [0, 0.69444, 0, 0, 0.5],
    "35": [0.19444, 0.69444, 0, 0, 0.83334],
    "36": [0.05556, 0.75, 0, 0, 0.5],
    "37": [0.05556, 0.75, 0, 0, 0.83334],
    "38": [0, 0.69444, 0, 0, 0.77778],
    "39": [0, 0.69444, 0, 0, 0.27778],
    "40": [0.25, 0.75, 0, 0, 0.38889],
    "41": [0.25, 0.75, 0, 0, 0.38889],
    "42": [0, 0.75, 0, 0, 0.5],
    "43": [0.08333, 0.58333, 0, 0, 0.77778],
    "44": [0.19444, 0.10556, 0, 0, 0.27778],
    "45": [0, 0.43056, 0, 0, 0.33333],
    "46": [0, 0.10556, 0, 0, 0.27778],
    "47": [0.25, 0.75, 0, 0, 0.5],
    "48": [0, 0.64444, 0, 0, 0.5],
    "49": [0, 0.64444, 0, 0, 0.5],
    "50": [0, 0.64444, 0, 0, 0.5],
    "51": [0, 0.64444, 0, 0, 0.5],
    "52": [0, 0.64444, 0, 0, 0.5],
    "53": [0, 0.64444, 0, 0, 0.5],
    "54": [0, 0.64444, 0, 0, 0.5],
    "55": [0, 0.64444, 0, 0, 0.5],
    "56": [0, 0.64444, 0, 0, 0.5],
    "57": [0, 0.64444, 0, 0, 0.5],
    "58": [0, 0.43056, 0, 0, 0.27778],
    "59": [0.19444, 0.43056, 0, 0, 0.27778],
    "60": [0.0391, 0.5391, 0, 0, 0.77778],
    "61": [-0.13313, 0.36687, 0, 0, 0.77778],
    "62": [0.0391, 0.5391, 0, 0, 0.77778],
    "63": [0, 0.69444, 0, 0, 0.47222],
    "64": [0, 0.69444, 0, 0, 0.77778],
    "65": [0, 0.68333, 0, 0, 0.75],
    "66": [0, 0.68333, 0, 0, 0.70834],
    "67": [0, 0.68333, 0, 0, 0.72222],
    "68": [0, 0.68333, 0, 0, 0.76389],
    "69": [0, 0.68333, 0, 0, 0.68056],
    "70": [0, 0.68333, 0, 0, 0.65278],
    "71": [0, 0.68333, 0, 0, 0.78472],
    "72": [0, 0.68333, 0, 0, 0.75],
    "73": [0, 0.68333, 0, 0, 0.36111],
    "74": [0, 0.68333, 0, 0, 0.51389],
    "75": [0, 0.68333, 0, 0, 0.77778],
    "76": [0, 0.68333, 0, 0, 0.625],
    "77": [0, 0.68333, 0, 0, 0.91667],
    "78": [0, 0.68333, 0, 0, 0.75],
    "79": [0, 0.68333, 0, 0, 0.77778],
    "80": [0, 0.68333, 0, 0, 0.68056],
    "81": [0.19444, 0.68333, 0, 0, 0.77778],
    "82": [0, 0.68333, 0, 0, 0.73611],
    "83": [0, 0.68333, 0, 0, 0.55556],
    "84": [0, 0.68333, 0, 0, 0.72222],
    "85": [0, 0.68333, 0, 0, 0.75],
    "86": [0, 0.68333, 0.01389, 0, 0.75],
    "87": [0, 0.68333, 0.01389, 0, 1.02778],
    "88": [0, 0.68333, 0, 0, 0.75],
    "89": [0, 0.68333, 0.025, 0, 0.75],
    "90": [0, 0.68333, 0, 0, 0.61111],
    "91": [0.25, 0.75, 0, 0, 0.27778],
    "92": [0.25, 0.75, 0, 0, 0.5],
    "93": [0.25, 0.75, 0, 0, 0.27778],
    "94": [0, 0.69444, 0, 0, 0.5],
    "95": [0.31, 0.12056, 0.02778, 0, 0.5],
    "97": [0, 0.43056, 0, 0, 0.5],
    "98": [0, 0.69444, 0, 0, 0.55556],
    "99": [0, 0.43056, 0, 0, 0.44445],
    "100": [0, 0.69444, 0, 0, 0.55556],
    "101": [0, 0.43056, 0, 0, 0.44445],
    "102": [0, 0.69444, 0.07778, 0, 0.30556],
    "103": [0.19444, 0.43056, 0.01389, 0, 0.5],
    "104": [0, 0.69444, 0, 0, 0.55556],
    "105": [0, 0.66786, 0, 0, 0.27778],
    "106": [0.19444, 0.66786, 0, 0, 0.30556],
    "107": [0, 0.69444, 0, 0, 0.52778],
    "108": [0, 0.69444, 0, 0, 0.27778],
    "109": [0, 0.43056, 0, 0, 0.83334],
    "110": [0, 0.43056, 0, 0, 0.55556],
    "111": [0, 0.43056, 0, 0, 0.5],
    "112": [0.19444, 0.43056, 0, 0, 0.55556],
    "113": [0.19444, 0.43056, 0, 0, 0.52778],
    "114": [0, 0.43056, 0, 0, 0.39167],
    "115": [0, 0.43056, 0, 0, 0.39445],
    "116": [0, 0.61508, 0, 0, 0.38889],
    "117": [0, 0.43056, 0, 0, 0.55556],
    "118": [0, 0.43056, 0.01389, 0, 0.52778],
    "119": [0, 0.43056, 0.01389, 0, 0.72222],
    "120": [0, 0.43056, 0, 0, 0.52778],
    "121": [0.19444, 0.43056, 0.01389, 0, 0.52778],
    "122": [0, 0.43056, 0, 0, 0.44445],
    "123": [0.25, 0.75, 0, 0, 0.5],
    "124": [0.25, 0.75, 0, 0, 0.27778],
    "125": [0.25, 0.75, 0, 0, 0.5],
    "126": [0.35, 0.31786, 0, 0, 0.5],
    "160": [0, 0, 0, 0, 0.25],
    "163": [0, 0.69444, 0, 0, 0.76909],
    "167": [0.19444, 0.69444, 0, 0, 0.44445],
    "168": [0, 0.66786, 0, 0, 0.5],
    "172": [0, 0.43056, 0, 0, 0.66667],
    "176": [0, 0.69444, 0, 0, 0.75],
    "177": [0.08333, 0.58333, 0, 0, 0.77778],
    "182": [0.19444, 0.69444, 0, 0, 0.61111],
    "184": [0.17014, 0, 0, 0, 0.44445],
    "198": [0, 0.68333, 0, 0, 0.90278],
    "215": [0.08333, 0.58333, 0, 0, 0.77778],
    "216": [0.04861, 0.73194, 0, 0, 0.77778],
    "223": [0, 0.69444, 0, 0, 0.5],
    "230": [0, 0.43056, 0, 0, 0.72222],
    "247": [0.08333, 0.58333, 0, 0, 0.77778],
    "248": [0.09722, 0.52778, 0, 0, 0.5],
    "305": [0, 0.43056, 0, 0, 0.27778],
    "338": [0, 0.68333, 0, 0, 1.01389],
    "339": [0, 0.43056, 0, 0, 0.77778],
    "567": [0.19444, 0.43056, 0, 0, 0.30556],
    "710": [0, 0.69444, 0, 0, 0.5],
    "711": [0, 0.62847, 0, 0, 0.5],
    "713": [0, 0.56778, 0, 0, 0.5],
    "714": [0, 0.69444, 0, 0, 0.5],
    "715": [0, 0.69444, 0, 0, 0.5],
    "728": [0, 0.69444, 0, 0, 0.5],
    "729": [0, 0.66786, 0, 0, 0.27778],
    "730": [0, 0.69444, 0, 0, 0.75],
    "732": [0, 0.66786, 0, 0, 0.5],
    "733": [0, 0.69444, 0, 0, 0.5],
    "915": [0, 0.68333, 0, 0, 0.625],
    "916": [0, 0.68333, 0, 0, 0.83334],
    "920": [0, 0.68333, 0, 0, 0.77778],
    "923": [0, 0.68333, 0, 0, 0.69445],
    "926": [0, 0.68333, 0, 0, 0.66667],
    "928": [0, 0.68333, 0, 0, 0.75],
    "931": [0, 0.68333, 0, 0, 0.72222],
    "933": [0, 0.68333, 0, 0, 0.77778],
    "934": [0, 0.68333, 0, 0, 0.72222],
    "936": [0, 0.68333, 0, 0, 0.77778],
    "937": [0, 0.68333, 0, 0, 0.72222],
    "8211": [0, 0.43056, 0.02778, 0, 0.5],
    "8212": [0, 0.43056, 0.02778, 0, 1],
    "8216": [0, 0.69444, 0, 0, 0.27778],
    "8217": [0, 0.69444, 0, 0, 0.27778],
    "8220": [0, 0.69444, 0, 0, 0.5],
    "8221": [0, 0.69444, 0, 0, 0.5],
    "8224": [0.19444, 0.69444, 0, 0, 0.44445],
    "8225": [0.19444, 0.69444, 0, 0, 0.44445],
    "8230": [0, 0.123, 0, 0, 1.172],
    "8242": [0, 0.55556, 0, 0, 0.275],
    "8407": [0, 0.71444, 0.15382, 0, 0.5],
    "8463": [0, 0.68889, 0, 0, 0.54028],
    "8465": [0, 0.69444, 0, 0, 0.72222],
    "8467": [0, 0.69444, 0, 0.11111, 0.41667],
    "8472": [0.19444, 0.43056, 0, 0.11111, 0.63646],
    "8476": [0, 0.69444, 0, 0, 0.72222],
    "8501": [0, 0.69444, 0, 0, 0.61111],
    "8592": [-0.13313, 0.36687, 0, 0, 1],
    "8593": [0.19444, 0.69444, 0, 0, 0.5],
    "8594": [-0.13313, 0.36687, 0, 0, 1],
    "8595": [0.19444, 0.69444, 0, 0, 0.5],
    "8596": [-0.13313, 0.36687, 0, 0, 1],
    "8597": [0.25, 0.75, 0, 0, 0.5],
    "8598": [0.19444, 0.69444, 0, 0, 1],
    "8599": [0.19444, 0.69444, 0, 0, 1],
    "8600": [0.19444, 0.69444, 0, 0, 1],
    "8601": [0.19444, 0.69444, 0, 0, 1],
    "8614": [0.011, 0.511, 0, 0, 1],
    "8617": [0.011, 0.511, 0, 0, 1.126],
    "8618": [0.011, 0.511, 0, 0, 1.126],
    "8636": [-0.13313, 0.36687, 0, 0, 1],
    "8637": [-0.13313, 0.36687, 0, 0, 1],
    "8640": [-0.13313, 0.36687, 0, 0, 1],
    "8641": [-0.13313, 0.36687, 0, 0, 1],
    "8652": [0.011, 0.671, 0, 0, 1],
    "8656": [-0.13313, 0.36687, 0, 0, 1],
    "8657": [0.19444, 0.69444, 0, 0, 0.61111],
    "8658": [-0.13313, 0.36687, 0, 0, 1],
    "8659": [0.19444, 0.69444, 0, 0, 0.61111],
    "8660": [-0.13313, 0.36687, 0, 0, 1],
    "8661": [0.25, 0.75, 0, 0, 0.61111],
    "8704": [0, 0.69444, 0, 0, 0.55556],
    "8706": [0, 0.69444, 0.05556, 0.08334, 0.5309],
    "8707": [0, 0.69444, 0, 0, 0.55556],
    "8709": [0.05556, 0.75, 0, 0, 0.5],
    "8711": [0, 0.68333, 0, 0, 0.83334],
    "8712": [0.0391, 0.5391, 0, 0, 0.66667],
    "8715": [0.0391, 0.5391, 0, 0, 0.66667],
    "8722": [0.08333, 0.58333, 0, 0, 0.77778],
    "8723": [0.08333, 0.58333, 0, 0, 0.77778],
    "8725": [0.25, 0.75, 0, 0, 0.5],
    "8726": [0.25, 0.75, 0, 0, 0.5],
    "8727": [-0.03472, 0.46528, 0, 0, 0.5],
    "8728": [-0.05555, 0.44445, 0, 0, 0.5],
    "8729": [-0.05555, 0.44445, 0, 0, 0.5],
    "8730": [0.2, 0.8, 0, 0, 0.83334],
    "8733": [0, 0.43056, 0, 0, 0.77778],
    "8734": [0, 0.43056, 0, 0, 1],
    "8736": [0, 0.69224, 0, 0, 0.72222],
    "8739": [0.25, 0.75, 0, 0, 0.27778],
    "8741": [0.25, 0.75, 0, 0, 0.5],
    "8743": [0, 0.55556, 0, 0, 0.66667],
    "8744": [0, 0.55556, 0, 0, 0.66667],
    "8745": [0, 0.55556, 0, 0, 0.66667],
    "8746": [0, 0.55556, 0, 0, 0.66667],
    "8747": [0.19444, 0.69444, 0.11111, 0, 0.41667],
    "8764": [-0.13313, 0.36687, 0, 0, 0.77778],
    "8768": [0.19444, 0.69444, 0, 0, 0.27778],
    "8771": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8773": [-0.022, 0.589, 0, 0, 0.778],
    "8776": [-0.01688, 0.48312, 0, 0, 0.77778],
    "8781": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8784": [-0.133, 0.673, 0, 0, 0.778],
    "8801": [-0.03625, 0.46375, 0, 0, 0.77778],
    "8804": [0.13597, 0.63597, 0, 0, 0.77778],
    "8805": [0.13597, 0.63597, 0, 0, 0.77778],
    "8810": [0.0391, 0.5391, 0, 0, 1],
    "8811": [0.0391, 0.5391, 0, 0, 1],
    "8826": [0.0391, 0.5391, 0, 0, 0.77778],
    "8827": [0.0391, 0.5391, 0, 0, 0.77778],
    "8834": [0.0391, 0.5391, 0, 0, 0.77778],
    "8835": [0.0391, 0.5391, 0, 0, 0.77778],
    "8838": [0.13597, 0.63597, 0, 0, 0.77778],
    "8839": [0.13597, 0.63597, 0, 0, 0.77778],
    "8846": [0, 0.55556, 0, 0, 0.66667],
    "8849": [0.13597, 0.63597, 0, 0, 0.77778],
    "8850": [0.13597, 0.63597, 0, 0, 0.77778],
    "8851": [0, 0.55556, 0, 0, 0.66667],
    "8852": [0, 0.55556, 0, 0, 0.66667],
    "8853": [0.08333, 0.58333, 0, 0, 0.77778],
    "8854": [0.08333, 0.58333, 0, 0, 0.77778],
    "8855": [0.08333, 0.58333, 0, 0, 0.77778],
    "8856": [0.08333, 0.58333, 0, 0, 0.77778],
    "8857": [0.08333, 0.58333, 0, 0, 0.77778],
    "8866": [0, 0.69444, 0, 0, 0.61111],
    "8867": [0, 0.69444, 0, 0, 0.61111],
    "8868": [0, 0.69444, 0, 0, 0.77778],
    "8869": [0, 0.69444, 0, 0, 0.77778],
    "8872": [0.249, 0.75, 0, 0, 0.867],
    "8900": [-0.05555, 0.44445, 0, 0, 0.5],
    "8901": [-0.05555, 0.44445, 0, 0, 0.27778],
    "8902": [-0.03472, 0.46528, 0, 0, 0.5],
    "8904": [5e-3, 0.505, 0, 0, 0.9],
    "8942": [0.03, 0.903, 0, 0, 0.278],
    "8943": [-0.19, 0.313, 0, 0, 1.172],
    "8945": [-0.1, 0.823, 0, 0, 1.282],
    "8968": [0.25, 0.75, 0, 0, 0.44445],
    "8969": [0.25, 0.75, 0, 0, 0.44445],
    "8970": [0.25, 0.75, 0, 0, 0.44445],
    "8971": [0.25, 0.75, 0, 0, 0.44445],
    "8994": [-0.14236, 0.35764, 0, 0, 1],
    "8995": [-0.14236, 0.35764, 0, 0, 1],
    "9136": [0.244, 0.744, 0, 0, 0.412],
    "9137": [0.244, 0.745, 0, 0, 0.412],
    "9651": [0.19444, 0.69444, 0, 0, 0.88889],
    "9657": [-0.03472, 0.46528, 0, 0, 0.5],
    "9661": [0.19444, 0.69444, 0, 0, 0.88889],
    "9667": [-0.03472, 0.46528, 0, 0, 0.5],
    "9711": [0.19444, 0.69444, 0, 0, 1],
    "9824": [0.12963, 0.69444, 0, 0, 0.77778],
    "9825": [0.12963, 0.69444, 0, 0, 0.77778],
    "9826": [0.12963, 0.69444, 0, 0, 0.77778],
    "9827": [0.12963, 0.69444, 0, 0, 0.77778],
    "9837": [0, 0.75, 0, 0, 0.38889],
    "9838": [0.19444, 0.69444, 0, 0, 0.38889],
    "9839": [0.19444, 0.69444, 0, 0, 0.38889],
    "10216": [0.25, 0.75, 0, 0, 0.38889],
    "10217": [0.25, 0.75, 0, 0, 0.38889],
    "10222": [0.244, 0.744, 0, 0, 0.412],
    "10223": [0.244, 0.745, 0, 0, 0.412],
    "10229": [0.011, 0.511, 0, 0, 1.609],
    "10230": [0.011, 0.511, 0, 0, 1.638],
    "10231": [0.011, 0.511, 0, 0, 1.859],
    "10232": [0.024, 0.525, 0, 0, 1.609],
    "10233": [0.024, 0.525, 0, 0, 1.638],
    "10234": [0.024, 0.525, 0, 0, 1.858],
    "10236": [0.011, 0.511, 0, 0, 1.638],
    "10815": [0, 0.68333, 0, 0, 0.75],
    "10927": [0.13597, 0.63597, 0, 0, 0.77778],
    "10928": [0.13597, 0.63597, 0, 0, 0.77778],
    "57376": [0.19444, 0.69444, 0, 0, 0]
  },
  "Math-BoldItalic": {
    "32": [0, 0, 0, 0, 0.25],
    "48": [0, 0.44444, 0, 0, 0.575],
    "49": [0, 0.44444, 0, 0, 0.575],
    "50": [0, 0.44444, 0, 0, 0.575],
    "51": [0.19444, 0.44444, 0, 0, 0.575],
    "52": [0.19444, 0.44444, 0, 0, 0.575],
    "53": [0.19444, 0.44444, 0, 0, 0.575],
    "54": [0, 0.64444, 0, 0, 0.575],
    "55": [0.19444, 0.44444, 0, 0, 0.575],
    "56": [0, 0.64444, 0, 0, 0.575],
    "57": [0.19444, 0.44444, 0, 0, 0.575],
    "65": [0, 0.68611, 0, 0, 0.86944],
    "66": [0, 0.68611, 0.04835, 0, 0.8664],
    "67": [0, 0.68611, 0.06979, 0, 0.81694],
    "68": [0, 0.68611, 0.03194, 0, 0.93812],
    "69": [0, 0.68611, 0.05451, 0, 0.81007],
    "70": [0, 0.68611, 0.15972, 0, 0.68889],
    "71": [0, 0.68611, 0, 0, 0.88673],
    "72": [0, 0.68611, 0.08229, 0, 0.98229],
    "73": [0, 0.68611, 0.07778, 0, 0.51111],
    "74": [0, 0.68611, 0.10069, 0, 0.63125],
    "75": [0, 0.68611, 0.06979, 0, 0.97118],
    "76": [0, 0.68611, 0, 0, 0.75555],
    "77": [0, 0.68611, 0.11424, 0, 1.14201],
    "78": [0, 0.68611, 0.11424, 0, 0.95034],
    "79": [0, 0.68611, 0.03194, 0, 0.83666],
    "80": [0, 0.68611, 0.15972, 0, 0.72309],
    "81": [0.19444, 0.68611, 0, 0, 0.86861],
    "82": [0, 0.68611, 421e-5, 0, 0.87235],
    "83": [0, 0.68611, 0.05382, 0, 0.69271],
    "84": [0, 0.68611, 0.15972, 0, 0.63663],
    "85": [0, 0.68611, 0.11424, 0, 0.80027],
    "86": [0, 0.68611, 0.25555, 0, 0.67778],
    "87": [0, 0.68611, 0.15972, 0, 1.09305],
    "88": [0, 0.68611, 0.07778, 0, 0.94722],
    "89": [0, 0.68611, 0.25555, 0, 0.67458],
    "90": [0, 0.68611, 0.06979, 0, 0.77257],
    "97": [0, 0.44444, 0, 0, 0.63287],
    "98": [0, 0.69444, 0, 0, 0.52083],
    "99": [0, 0.44444, 0, 0, 0.51342],
    "100": [0, 0.69444, 0, 0, 0.60972],
    "101": [0, 0.44444, 0, 0, 0.55361],
    "102": [0.19444, 0.69444, 0.11042, 0, 0.56806],
    "103": [0.19444, 0.44444, 0.03704, 0, 0.5449],
    "104": [0, 0.69444, 0, 0, 0.66759],
    "105": [0, 0.69326, 0, 0, 0.4048],
    "106": [0.19444, 0.69326, 0.0622, 0, 0.47083],
    "107": [0, 0.69444, 0.01852, 0, 0.6037],
    "108": [0, 0.69444, 88e-4, 0, 0.34815],
    "109": [0, 0.44444, 0, 0, 1.0324],
    "110": [0, 0.44444, 0, 0, 0.71296],
    "111": [0, 0.44444, 0, 0, 0.58472],
    "112": [0.19444, 0.44444, 0, 0, 0.60092],
    "113": [0.19444, 0.44444, 0.03704, 0, 0.54213],
    "114": [0, 0.44444, 0.03194, 0, 0.5287],
    "115": [0, 0.44444, 0, 0, 0.53125],
    "116": [0, 0.63492, 0, 0, 0.41528],
    "117": [0, 0.44444, 0, 0, 0.68102],
    "118": [0, 0.44444, 0.03704, 0, 0.56666],
    "119": [0, 0.44444, 0.02778, 0, 0.83148],
    "120": [0, 0.44444, 0, 0, 0.65903],
    "121": [0.19444, 0.44444, 0.03704, 0, 0.59028],
    "122": [0, 0.44444, 0.04213, 0, 0.55509],
    "160": [0, 0, 0, 0, 0.25],
    "915": [0, 0.68611, 0.15972, 0, 0.65694],
    "916": [0, 0.68611, 0, 0, 0.95833],
    "920": [0, 0.68611, 0.03194, 0, 0.86722],
    "923": [0, 0.68611, 0, 0, 0.80555],
    "926": [0, 0.68611, 0.07458, 0, 0.84125],
    "928": [0, 0.68611, 0.08229, 0, 0.98229],
    "931": [0, 0.68611, 0.05451, 0, 0.88507],
    "933": [0, 0.68611, 0.15972, 0, 0.67083],
    "934": [0, 0.68611, 0, 0, 0.76666],
    "936": [0, 0.68611, 0.11653, 0, 0.71402],
    "937": [0, 0.68611, 0.04835, 0, 0.8789],
    "945": [0, 0.44444, 0, 0, 0.76064],
    "946": [0.19444, 0.69444, 0.03403, 0, 0.65972],
    "947": [0.19444, 0.44444, 0.06389, 0, 0.59003],
    "948": [0, 0.69444, 0.03819, 0, 0.52222],
    "949": [0, 0.44444, 0, 0, 0.52882],
    "950": [0.19444, 0.69444, 0.06215, 0, 0.50833],
    "951": [0.19444, 0.44444, 0.03704, 0, 0.6],
    "952": [0, 0.69444, 0.03194, 0, 0.5618],
    "953": [0, 0.44444, 0, 0, 0.41204],
    "954": [0, 0.44444, 0, 0, 0.66759],
    "955": [0, 0.69444, 0, 0, 0.67083],
    "956": [0.19444, 0.44444, 0, 0, 0.70787],
    "957": [0, 0.44444, 0.06898, 0, 0.57685],
    "958": [0.19444, 0.69444, 0.03021, 0, 0.50833],
    "959": [0, 0.44444, 0, 0, 0.58472],
    "960": [0, 0.44444, 0.03704, 0, 0.68241],
    "961": [0.19444, 0.44444, 0, 0, 0.6118],
    "962": [0.09722, 0.44444, 0.07917, 0, 0.42361],
    "963": [0, 0.44444, 0.03704, 0, 0.68588],
    "964": [0, 0.44444, 0.13472, 0, 0.52083],
    "965": [0, 0.44444, 0.03704, 0, 0.63055],
    "966": [0.19444, 0.44444, 0, 0, 0.74722],
    "967": [0.19444, 0.44444, 0, 0, 0.71805],
    "968": [0.19444, 0.69444, 0.03704, 0, 0.75833],
    "969": [0, 0.44444, 0.03704, 0, 0.71782],
    "977": [0, 0.69444, 0, 0, 0.69155],
    "981": [0.19444, 0.69444, 0, 0, 0.7125],
    "982": [0, 0.44444, 0.03194, 0, 0.975],
    "1009": [0.19444, 0.44444, 0, 0, 0.6118],
    "1013": [0, 0.44444, 0, 0, 0.48333],
    "57649": [0, 0.44444, 0, 0, 0.39352],
    "57911": [0.19444, 0.44444, 0, 0, 0.43889]
  },
  "Math-Italic": {
    "32": [0, 0, 0, 0, 0.25],
    "48": [0, 0.43056, 0, 0, 0.5],
    "49": [0, 0.43056, 0, 0, 0.5],
    "50": [0, 0.43056, 0, 0, 0.5],
    "51": [0.19444, 0.43056, 0, 0, 0.5],
    "52": [0.19444, 0.43056, 0, 0, 0.5],
    "53": [0.19444, 0.43056, 0, 0, 0.5],
    "54": [0, 0.64444, 0, 0, 0.5],
    "55": [0.19444, 0.43056, 0, 0, 0.5],
    "56": [0, 0.64444, 0, 0, 0.5],
    "57": [0.19444, 0.43056, 0, 0, 0.5],
    "65": [0, 0.68333, 0, 0.13889, 0.75],
    "66": [0, 0.68333, 0.05017, 0.08334, 0.75851],
    "67": [0, 0.68333, 0.07153, 0.08334, 0.71472],
    "68": [0, 0.68333, 0.02778, 0.05556, 0.82792],
    "69": [0, 0.68333, 0.05764, 0.08334, 0.7382],
    "70": [0, 0.68333, 0.13889, 0.08334, 0.64306],
    "71": [0, 0.68333, 0, 0.08334, 0.78625],
    "72": [0, 0.68333, 0.08125, 0.05556, 0.83125],
    "73": [0, 0.68333, 0.07847, 0.11111, 0.43958],
    "74": [0, 0.68333, 0.09618, 0.16667, 0.55451],
    "75": [0, 0.68333, 0.07153, 0.05556, 0.84931],
    "76": [0, 0.68333, 0, 0.02778, 0.68056],
    "77": [0, 0.68333, 0.10903, 0.08334, 0.97014],
    "78": [0, 0.68333, 0.10903, 0.08334, 0.80347],
    "79": [0, 0.68333, 0.02778, 0.08334, 0.76278],
    "80": [0, 0.68333, 0.13889, 0.08334, 0.64201],
    "81": [0.19444, 0.68333, 0, 0.08334, 0.79056],
    "82": [0, 0.68333, 773e-5, 0.08334, 0.75929],
    "83": [0, 0.68333, 0.05764, 0.08334, 0.6132],
    "84": [0, 0.68333, 0.13889, 0.08334, 0.58438],
    "85": [0, 0.68333, 0.10903, 0.02778, 0.68278],
    "86": [0, 0.68333, 0.22222, 0, 0.58333],
    "87": [0, 0.68333, 0.13889, 0, 0.94445],
    "88": [0, 0.68333, 0.07847, 0.08334, 0.82847],
    "89": [0, 0.68333, 0.22222, 0, 0.58056],
    "90": [0, 0.68333, 0.07153, 0.08334, 0.68264],
    "97": [0, 0.43056, 0, 0, 0.52859],
    "98": [0, 0.69444, 0, 0, 0.42917],
    "99": [0, 0.43056, 0, 0.05556, 0.43276],
    "100": [0, 0.69444, 0, 0.16667, 0.52049],
    "101": [0, 0.43056, 0, 0.05556, 0.46563],
    "102": [0.19444, 0.69444, 0.10764, 0.16667, 0.48959],
    "103": [0.19444, 0.43056, 0.03588, 0.02778, 0.47697],
    "104": [0, 0.69444, 0, 0, 0.57616],
    "105": [0, 0.65952, 0, 0, 0.34451],
    "106": [0.19444, 0.65952, 0.05724, 0, 0.41181],
    "107": [0, 0.69444, 0.03148, 0, 0.5206],
    "108": [0, 0.69444, 0.01968, 0.08334, 0.29838],
    "109": [0, 0.43056, 0, 0, 0.87801],
    "110": [0, 0.43056, 0, 0, 0.60023],
    "111": [0, 0.43056, 0, 0.05556, 0.48472],
    "112": [0.19444, 0.43056, 0, 0.08334, 0.50313],
    "113": [0.19444, 0.43056, 0.03588, 0.08334, 0.44641],
    "114": [0, 0.43056, 0.02778, 0.05556, 0.45116],
    "115": [0, 0.43056, 0, 0.05556, 0.46875],
    "116": [0, 0.61508, 0, 0.08334, 0.36111],
    "117": [0, 0.43056, 0, 0.02778, 0.57246],
    "118": [0, 0.43056, 0.03588, 0.02778, 0.48472],
    "119": [0, 0.43056, 0.02691, 0.08334, 0.71592],
    "120": [0, 0.43056, 0, 0.02778, 0.57153],
    "121": [0.19444, 0.43056, 0.03588, 0.05556, 0.49028],
    "122": [0, 0.43056, 0.04398, 0.05556, 0.46505],
    "160": [0, 0, 0, 0, 0.25],
    "915": [0, 0.68333, 0.13889, 0.08334, 0.61528],
    "916": [0, 0.68333, 0, 0.16667, 0.83334],
    "920": [0, 0.68333, 0.02778, 0.08334, 0.76278],
    "923": [0, 0.68333, 0, 0.16667, 0.69445],
    "926": [0, 0.68333, 0.07569, 0.08334, 0.74236],
    "928": [0, 0.68333, 0.08125, 0.05556, 0.83125],
    "931": [0, 0.68333, 0.05764, 0.08334, 0.77986],
    "933": [0, 0.68333, 0.13889, 0.05556, 0.58333],
    "934": [0, 0.68333, 0, 0.08334, 0.66667],
    "936": [0, 0.68333, 0.11, 0.05556, 0.61222],
    "937": [0, 0.68333, 0.05017, 0.08334, 0.7724],
    "945": [0, 0.43056, 37e-4, 0.02778, 0.6397],
    "946": [0.19444, 0.69444, 0.05278, 0.08334, 0.56563],
    "947": [0.19444, 0.43056, 0.05556, 0, 0.51773],
    "948": [0, 0.69444, 0.03785, 0.05556, 0.44444],
    "949": [0, 0.43056, 0, 0.08334, 0.46632],
    "950": [0.19444, 0.69444, 0.07378, 0.08334, 0.4375],
    "951": [0.19444, 0.43056, 0.03588, 0.05556, 0.49653],
    "952": [0, 0.69444, 0.02778, 0.08334, 0.46944],
    "953": [0, 0.43056, 0, 0.05556, 0.35394],
    "954": [0, 0.43056, 0, 0, 0.57616],
    "955": [0, 0.69444, 0, 0, 0.58334],
    "956": [0.19444, 0.43056, 0, 0.02778, 0.60255],
    "957": [0, 0.43056, 0.06366, 0.02778, 0.49398],
    "958": [0.19444, 0.69444, 0.04601, 0.11111, 0.4375],
    "959": [0, 0.43056, 0, 0.05556, 0.48472],
    "960": [0, 0.43056, 0.03588, 0, 0.57003],
    "961": [0.19444, 0.43056, 0, 0.08334, 0.51702],
    "962": [0.09722, 0.43056, 0.07986, 0.08334, 0.36285],
    "963": [0, 0.43056, 0.03588, 0, 0.57141],
    "964": [0, 0.43056, 0.1132, 0.02778, 0.43715],
    "965": [0, 0.43056, 0.03588, 0.02778, 0.54028],
    "966": [0.19444, 0.43056, 0, 0.08334, 0.65417],
    "967": [0.19444, 0.43056, 0, 0.05556, 0.62569],
    "968": [0.19444, 0.69444, 0.03588, 0.11111, 0.65139],
    "969": [0, 0.43056, 0.03588, 0, 0.62245],
    "977": [0, 0.69444, 0, 0.08334, 0.59144],
    "981": [0.19444, 0.69444, 0, 0.08334, 0.59583],
    "982": [0, 0.43056, 0.02778, 0, 0.82813],
    "1009": [0.19444, 0.43056, 0, 0.08334, 0.51702],
    "1013": [0, 0.43056, 0, 0.05556, 0.4059],
    "57649": [0, 0.43056, 0, 0.02778, 0.32246],
    "57911": [0.19444, 0.43056, 0, 0.08334, 0.38403]
  },
  "SansSerif-Bold": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0, 0, 0.36667],
    "34": [0, 0.69444, 0, 0, 0.55834],
    "35": [0.19444, 0.69444, 0, 0, 0.91667],
    "36": [0.05556, 0.75, 0, 0, 0.55],
    "37": [0.05556, 0.75, 0, 0, 1.02912],
    "38": [0, 0.69444, 0, 0, 0.83056],
    "39": [0, 0.69444, 0, 0, 0.30556],
    "40": [0.25, 0.75, 0, 0, 0.42778],
    "41": [0.25, 0.75, 0, 0, 0.42778],
    "42": [0, 0.75, 0, 0, 0.55],
    "43": [0.11667, 0.61667, 0, 0, 0.85556],
    "44": [0.10556, 0.13056, 0, 0, 0.30556],
    "45": [0, 0.45833, 0, 0, 0.36667],
    "46": [0, 0.13056, 0, 0, 0.30556],
    "47": [0.25, 0.75, 0, 0, 0.55],
    "48": [0, 0.69444, 0, 0, 0.55],
    "49": [0, 0.69444, 0, 0, 0.55],
    "50": [0, 0.69444, 0, 0, 0.55],
    "51": [0, 0.69444, 0, 0, 0.55],
    "52": [0, 0.69444, 0, 0, 0.55],
    "53": [0, 0.69444, 0, 0, 0.55],
    "54": [0, 0.69444, 0, 0, 0.55],
    "55": [0, 0.69444, 0, 0, 0.55],
    "56": [0, 0.69444, 0, 0, 0.55],
    "57": [0, 0.69444, 0, 0, 0.55],
    "58": [0, 0.45833, 0, 0, 0.30556],
    "59": [0.10556, 0.45833, 0, 0, 0.30556],
    "61": [-0.09375, 0.40625, 0, 0, 0.85556],
    "63": [0, 0.69444, 0, 0, 0.51945],
    "64": [0, 0.69444, 0, 0, 0.73334],
    "65": [0, 0.69444, 0, 0, 0.73334],
    "66": [0, 0.69444, 0, 0, 0.73334],
    "67": [0, 0.69444, 0, 0, 0.70278],
    "68": [0, 0.69444, 0, 0, 0.79445],
    "69": [0, 0.69444, 0, 0, 0.64167],
    "70": [0, 0.69444, 0, 0, 0.61111],
    "71": [0, 0.69444, 0, 0, 0.73334],
    "72": [0, 0.69444, 0, 0, 0.79445],
    "73": [0, 0.69444, 0, 0, 0.33056],
    "74": [0, 0.69444, 0, 0, 0.51945],
    "75": [0, 0.69444, 0, 0, 0.76389],
    "76": [0, 0.69444, 0, 0, 0.58056],
    "77": [0, 0.69444, 0, 0, 0.97778],
    "78": [0, 0.69444, 0, 0, 0.79445],
    "79": [0, 0.69444, 0, 0, 0.79445],
    "80": [0, 0.69444, 0, 0, 0.70278],
    "81": [0.10556, 0.69444, 0, 0, 0.79445],
    "82": [0, 0.69444, 0, 0, 0.70278],
    "83": [0, 0.69444, 0, 0, 0.61111],
    "84": [0, 0.69444, 0, 0, 0.73334],
    "85": [0, 0.69444, 0, 0, 0.76389],
    "86": [0, 0.69444, 0.01528, 0, 0.73334],
    "87": [0, 0.69444, 0.01528, 0, 1.03889],
    "88": [0, 0.69444, 0, 0, 0.73334],
    "89": [0, 0.69444, 0.0275, 0, 0.73334],
    "90": [0, 0.69444, 0, 0, 0.67223],
    "91": [0.25, 0.75, 0, 0, 0.34306],
    "93": [0.25, 0.75, 0, 0, 0.34306],
    "94": [0, 0.69444, 0, 0, 0.55],
    "95": [0.35, 0.10833, 0.03056, 0, 0.55],
    "97": [0, 0.45833, 0, 0, 0.525],
    "98": [0, 0.69444, 0, 0, 0.56111],
    "99": [0, 0.45833, 0, 0, 0.48889],
    "100": [0, 0.69444, 0, 0, 0.56111],
    "101": [0, 0.45833, 0, 0, 0.51111],
    "102": [0, 0.69444, 0.07639, 0, 0.33611],
    "103": [0.19444, 0.45833, 0.01528, 0, 0.55],
    "104": [0, 0.69444, 0, 0, 0.56111],
    "105": [0, 0.69444, 0, 0, 0.25556],
    "106": [0.19444, 0.69444, 0, 0, 0.28611],
    "107": [0, 0.69444, 0, 0, 0.53056],
    "108": [0, 0.69444, 0, 0, 0.25556],
    "109": [0, 0.45833, 0, 0, 0.86667],
    "110": [0, 0.45833, 0, 0, 0.56111],
    "111": [0, 0.45833, 0, 0, 0.55],
    "112": [0.19444, 0.45833, 0, 0, 0.56111],
    "113": [0.19444, 0.45833, 0, 0, 0.56111],
    "114": [0, 0.45833, 0.01528, 0, 0.37222],
    "115": [0, 0.45833, 0, 0, 0.42167],
    "116": [0, 0.58929, 0, 0, 0.40417],
    "117": [0, 0.45833, 0, 0, 0.56111],
    "118": [0, 0.45833, 0.01528, 0, 0.5],
    "119": [0, 0.45833, 0.01528, 0, 0.74445],
    "120": [0, 0.45833, 0, 0, 0.5],
    "121": [0.19444, 0.45833, 0.01528, 0, 0.5],
    "122": [0, 0.45833, 0, 0, 0.47639],
    "126": [0.35, 0.34444, 0, 0, 0.55],
    "160": [0, 0, 0, 0, 0.25],
    "168": [0, 0.69444, 0, 0, 0.55],
    "176": [0, 0.69444, 0, 0, 0.73334],
    "180": [0, 0.69444, 0, 0, 0.55],
    "184": [0.17014, 0, 0, 0, 0.48889],
    "305": [0, 0.45833, 0, 0, 0.25556],
    "567": [0.19444, 0.45833, 0, 0, 0.28611],
    "710": [0, 0.69444, 0, 0, 0.55],
    "711": [0, 0.63542, 0, 0, 0.55],
    "713": [0, 0.63778, 0, 0, 0.55],
    "728": [0, 0.69444, 0, 0, 0.55],
    "729": [0, 0.69444, 0, 0, 0.30556],
    "730": [0, 0.69444, 0, 0, 0.73334],
    "732": [0, 0.69444, 0, 0, 0.55],
    "733": [0, 0.69444, 0, 0, 0.55],
    "915": [0, 0.69444, 0, 0, 0.58056],
    "916": [0, 0.69444, 0, 0, 0.91667],
    "920": [0, 0.69444, 0, 0, 0.85556],
    "923": [0, 0.69444, 0, 0, 0.67223],
    "926": [0, 0.69444, 0, 0, 0.73334],
    "928": [0, 0.69444, 0, 0, 0.79445],
    "931": [0, 0.69444, 0, 0, 0.79445],
    "933": [0, 0.69444, 0, 0, 0.85556],
    "934": [0, 0.69444, 0, 0, 0.79445],
    "936": [0, 0.69444, 0, 0, 0.85556],
    "937": [0, 0.69444, 0, 0, 0.79445],
    "8211": [0, 0.45833, 0.03056, 0, 0.55],
    "8212": [0, 0.45833, 0.03056, 0, 1.10001],
    "8216": [0, 0.69444, 0, 0, 0.30556],
    "8217": [0, 0.69444, 0, 0, 0.30556],
    "8220": [0, 0.69444, 0, 0, 0.55834],
    "8221": [0, 0.69444, 0, 0, 0.55834]
  },
  "SansSerif-Italic": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0.05733, 0, 0.31945],
    "34": [0, 0.69444, 316e-5, 0, 0.5],
    "35": [0.19444, 0.69444, 0.05087, 0, 0.83334],
    "36": [0.05556, 0.75, 0.11156, 0, 0.5],
    "37": [0.05556, 0.75, 0.03126, 0, 0.83334],
    "38": [0, 0.69444, 0.03058, 0, 0.75834],
    "39": [0, 0.69444, 0.07816, 0, 0.27778],
    "40": [0.25, 0.75, 0.13164, 0, 0.38889],
    "41": [0.25, 0.75, 0.02536, 0, 0.38889],
    "42": [0, 0.75, 0.11775, 0, 0.5],
    "43": [0.08333, 0.58333, 0.02536, 0, 0.77778],
    "44": [0.125, 0.08333, 0, 0, 0.27778],
    "45": [0, 0.44444, 0.01946, 0, 0.33333],
    "46": [0, 0.08333, 0, 0, 0.27778],
    "47": [0.25, 0.75, 0.13164, 0, 0.5],
    "48": [0, 0.65556, 0.11156, 0, 0.5],
    "49": [0, 0.65556, 0.11156, 0, 0.5],
    "50": [0, 0.65556, 0.11156, 0, 0.5],
    "51": [0, 0.65556, 0.11156, 0, 0.5],
    "52": [0, 0.65556, 0.11156, 0, 0.5],
    "53": [0, 0.65556, 0.11156, 0, 0.5],
    "54": [0, 0.65556, 0.11156, 0, 0.5],
    "55": [0, 0.65556, 0.11156, 0, 0.5],
    "56": [0, 0.65556, 0.11156, 0, 0.5],
    "57": [0, 0.65556, 0.11156, 0, 0.5],
    "58": [0, 0.44444, 0.02502, 0, 0.27778],
    "59": [0.125, 0.44444, 0.02502, 0, 0.27778],
    "61": [-0.13, 0.37, 0.05087, 0, 0.77778],
    "63": [0, 0.69444, 0.11809, 0, 0.47222],
    "64": [0, 0.69444, 0.07555, 0, 0.66667],
    "65": [0, 0.69444, 0, 0, 0.66667],
    "66": [0, 0.69444, 0.08293, 0, 0.66667],
    "67": [0, 0.69444, 0.11983, 0, 0.63889],
    "68": [0, 0.69444, 0.07555, 0, 0.72223],
    "69": [0, 0.69444, 0.11983, 0, 0.59722],
    "70": [0, 0.69444, 0.13372, 0, 0.56945],
    "71": [0, 0.69444, 0.11983, 0, 0.66667],
    "72": [0, 0.69444, 0.08094, 0, 0.70834],
    "73": [0, 0.69444, 0.13372, 0, 0.27778],
    "74": [0, 0.69444, 0.08094, 0, 0.47222],
    "75": [0, 0.69444, 0.11983, 0, 0.69445],
    "76": [0, 0.69444, 0, 0, 0.54167],
    "77": [0, 0.69444, 0.08094, 0, 0.875],
    "78": [0, 0.69444, 0.08094, 0, 0.70834],
    "79": [0, 0.69444, 0.07555, 0, 0.73611],
    "80": [0, 0.69444, 0.08293, 0, 0.63889],
    "81": [0.125, 0.69444, 0.07555, 0, 0.73611],
    "82": [0, 0.69444, 0.08293, 0, 0.64584],
    "83": [0, 0.69444, 0.09205, 0, 0.55556],
    "84": [0, 0.69444, 0.13372, 0, 0.68056],
    "85": [0, 0.69444, 0.08094, 0, 0.6875],
    "86": [0, 0.69444, 0.1615, 0, 0.66667],
    "87": [0, 0.69444, 0.1615, 0, 0.94445],
    "88": [0, 0.69444, 0.13372, 0, 0.66667],
    "89": [0, 0.69444, 0.17261, 0, 0.66667],
    "90": [0, 0.69444, 0.11983, 0, 0.61111],
    "91": [0.25, 0.75, 0.15942, 0, 0.28889],
    "93": [0.25, 0.75, 0.08719, 0, 0.28889],
    "94": [0, 0.69444, 0.0799, 0, 0.5],
    "95": [0.35, 0.09444, 0.08616, 0, 0.5],
    "97": [0, 0.44444, 981e-5, 0, 0.48056],
    "98": [0, 0.69444, 0.03057, 0, 0.51667],
    "99": [0, 0.44444, 0.08336, 0, 0.44445],
    "100": [0, 0.69444, 0.09483, 0, 0.51667],
    "101": [0, 0.44444, 0.06778, 0, 0.44445],
    "102": [0, 0.69444, 0.21705, 0, 0.30556],
    "103": [0.19444, 0.44444, 0.10836, 0, 0.5],
    "104": [0, 0.69444, 0.01778, 0, 0.51667],
    "105": [0, 0.67937, 0.09718, 0, 0.23889],
    "106": [0.19444, 0.67937, 0.09162, 0, 0.26667],
    "107": [0, 0.69444, 0.08336, 0, 0.48889],
    "108": [0, 0.69444, 0.09483, 0, 0.23889],
    "109": [0, 0.44444, 0.01778, 0, 0.79445],
    "110": [0, 0.44444, 0.01778, 0, 0.51667],
    "111": [0, 0.44444, 0.06613, 0, 0.5],
    "112": [0.19444, 0.44444, 0.0389, 0, 0.51667],
    "113": [0.19444, 0.44444, 0.04169, 0, 0.51667],
    "114": [0, 0.44444, 0.10836, 0, 0.34167],
    "115": [0, 0.44444, 0.0778, 0, 0.38333],
    "116": [0, 0.57143, 0.07225, 0, 0.36111],
    "117": [0, 0.44444, 0.04169, 0, 0.51667],
    "118": [0, 0.44444, 0.10836, 0, 0.46111],
    "119": [0, 0.44444, 0.10836, 0, 0.68334],
    "120": [0, 0.44444, 0.09169, 0, 0.46111],
    "121": [0.19444, 0.44444, 0.10836, 0, 0.46111],
    "122": [0, 0.44444, 0.08752, 0, 0.43472],
    "126": [0.35, 0.32659, 0.08826, 0, 0.5],
    "160": [0, 0, 0, 0, 0.25],
    "168": [0, 0.67937, 0.06385, 0, 0.5],
    "176": [0, 0.69444, 0, 0, 0.73752],
    "184": [0.17014, 0, 0, 0, 0.44445],
    "305": [0, 0.44444, 0.04169, 0, 0.23889],
    "567": [0.19444, 0.44444, 0.04169, 0, 0.26667],
    "710": [0, 0.69444, 0.0799, 0, 0.5],
    "711": [0, 0.63194, 0.08432, 0, 0.5],
    "713": [0, 0.60889, 0.08776, 0, 0.5],
    "714": [0, 0.69444, 0.09205, 0, 0.5],
    "715": [0, 0.69444, 0, 0, 0.5],
    "728": [0, 0.69444, 0.09483, 0, 0.5],
    "729": [0, 0.67937, 0.07774, 0, 0.27778],
    "730": [0, 0.69444, 0, 0, 0.73752],
    "732": [0, 0.67659, 0.08826, 0, 0.5],
    "733": [0, 0.69444, 0.09205, 0, 0.5],
    "915": [0, 0.69444, 0.13372, 0, 0.54167],
    "916": [0, 0.69444, 0, 0, 0.83334],
    "920": [0, 0.69444, 0.07555, 0, 0.77778],
    "923": [0, 0.69444, 0, 0, 0.61111],
    "926": [0, 0.69444, 0.12816, 0, 0.66667],
    "928": [0, 0.69444, 0.08094, 0, 0.70834],
    "931": [0, 0.69444, 0.11983, 0, 0.72222],
    "933": [0, 0.69444, 0.09031, 0, 0.77778],
    "934": [0, 0.69444, 0.04603, 0, 0.72222],
    "936": [0, 0.69444, 0.09031, 0, 0.77778],
    "937": [0, 0.69444, 0.08293, 0, 0.72222],
    "8211": [0, 0.44444, 0.08616, 0, 0.5],
    "8212": [0, 0.44444, 0.08616, 0, 1],
    "8216": [0, 0.69444, 0.07816, 0, 0.27778],
    "8217": [0, 0.69444, 0.07816, 0, 0.27778],
    "8220": [0, 0.69444, 0.14205, 0, 0.5],
    "8221": [0, 0.69444, 316e-5, 0, 0.5]
  },
  "SansSerif-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "33": [0, 0.69444, 0, 0, 0.31945],
    "34": [0, 0.69444, 0, 0, 0.5],
    "35": [0.19444, 0.69444, 0, 0, 0.83334],
    "36": [0.05556, 0.75, 0, 0, 0.5],
    "37": [0.05556, 0.75, 0, 0, 0.83334],
    "38": [0, 0.69444, 0, 0, 0.75834],
    "39": [0, 0.69444, 0, 0, 0.27778],
    "40": [0.25, 0.75, 0, 0, 0.38889],
    "41": [0.25, 0.75, 0, 0, 0.38889],
    "42": [0, 0.75, 0, 0, 0.5],
    "43": [0.08333, 0.58333, 0, 0, 0.77778],
    "44": [0.125, 0.08333, 0, 0, 0.27778],
    "45": [0, 0.44444, 0, 0, 0.33333],
    "46": [0, 0.08333, 0, 0, 0.27778],
    "47": [0.25, 0.75, 0, 0, 0.5],
    "48": [0, 0.65556, 0, 0, 0.5],
    "49": [0, 0.65556, 0, 0, 0.5],
    "50": [0, 0.65556, 0, 0, 0.5],
    "51": [0, 0.65556, 0, 0, 0.5],
    "52": [0, 0.65556, 0, 0, 0.5],
    "53": [0, 0.65556, 0, 0, 0.5],
    "54": [0, 0.65556, 0, 0, 0.5],
    "55": [0, 0.65556, 0, 0, 0.5],
    "56": [0, 0.65556, 0, 0, 0.5],
    "57": [0, 0.65556, 0, 0, 0.5],
    "58": [0, 0.44444, 0, 0, 0.27778],
    "59": [0.125, 0.44444, 0, 0, 0.27778],
    "61": [-0.13, 0.37, 0, 0, 0.77778],
    "63": [0, 0.69444, 0, 0, 0.47222],
    "64": [0, 0.69444, 0, 0, 0.66667],
    "65": [0, 0.69444, 0, 0, 0.66667],
    "66": [0, 0.69444, 0, 0, 0.66667],
    "67": [0, 0.69444, 0, 0, 0.63889],
    "68": [0, 0.69444, 0, 0, 0.72223],
    "69": [0, 0.69444, 0, 0, 0.59722],
    "70": [0, 0.69444, 0, 0, 0.56945],
    "71": [0, 0.69444, 0, 0, 0.66667],
    "72": [0, 0.69444, 0, 0, 0.70834],
    "73": [0, 0.69444, 0, 0, 0.27778],
    "74": [0, 0.69444, 0, 0, 0.47222],
    "75": [0, 0.69444, 0, 0, 0.69445],
    "76": [0, 0.69444, 0, 0, 0.54167],
    "77": [0, 0.69444, 0, 0, 0.875],
    "78": [0, 0.69444, 0, 0, 0.70834],
    "79": [0, 0.69444, 0, 0, 0.73611],
    "80": [0, 0.69444, 0, 0, 0.63889],
    "81": [0.125, 0.69444, 0, 0, 0.73611],
    "82": [0, 0.69444, 0, 0, 0.64584],
    "83": [0, 0.69444, 0, 0, 0.55556],
    "84": [0, 0.69444, 0, 0, 0.68056],
    "85": [0, 0.69444, 0, 0, 0.6875],
    "86": [0, 0.69444, 0.01389, 0, 0.66667],
    "87": [0, 0.69444, 0.01389, 0, 0.94445],
    "88": [0, 0.69444, 0, 0, 0.66667],
    "89": [0, 0.69444, 0.025, 0, 0.66667],
    "90": [0, 0.69444, 0, 0, 0.61111],
    "91": [0.25, 0.75, 0, 0, 0.28889],
    "93": [0.25, 0.75, 0, 0, 0.28889],
    "94": [0, 0.69444, 0, 0, 0.5],
    "95": [0.35, 0.09444, 0.02778, 0, 0.5],
    "97": [0, 0.44444, 0, 0, 0.48056],
    "98": [0, 0.69444, 0, 0, 0.51667],
    "99": [0, 0.44444, 0, 0, 0.44445],
    "100": [0, 0.69444, 0, 0, 0.51667],
    "101": [0, 0.44444, 0, 0, 0.44445],
    "102": [0, 0.69444, 0.06944, 0, 0.30556],
    "103": [0.19444, 0.44444, 0.01389, 0, 0.5],
    "104": [0, 0.69444, 0, 0, 0.51667],
    "105": [0, 0.67937, 0, 0, 0.23889],
    "106": [0.19444, 0.67937, 0, 0, 0.26667],
    "107": [0, 0.69444, 0, 0, 0.48889],
    "108": [0, 0.69444, 0, 0, 0.23889],
    "109": [0, 0.44444, 0, 0, 0.79445],
    "110": [0, 0.44444, 0, 0, 0.51667],
    "111": [0, 0.44444, 0, 0, 0.5],
    "112": [0.19444, 0.44444, 0, 0, 0.51667],
    "113": [0.19444, 0.44444, 0, 0, 0.51667],
    "114": [0, 0.44444, 0.01389, 0, 0.34167],
    "115": [0, 0.44444, 0, 0, 0.38333],
    "116": [0, 0.57143, 0, 0, 0.36111],
    "117": [0, 0.44444, 0, 0, 0.51667],
    "118": [0, 0.44444, 0.01389, 0, 0.46111],
    "119": [0, 0.44444, 0.01389, 0, 0.68334],
    "120": [0, 0.44444, 0, 0, 0.46111],
    "121": [0.19444, 0.44444, 0.01389, 0, 0.46111],
    "122": [0, 0.44444, 0, 0, 0.43472],
    "126": [0.35, 0.32659, 0, 0, 0.5],
    "160": [0, 0, 0, 0, 0.25],
    "168": [0, 0.67937, 0, 0, 0.5],
    "176": [0, 0.69444, 0, 0, 0.66667],
    "184": [0.17014, 0, 0, 0, 0.44445],
    "305": [0, 0.44444, 0, 0, 0.23889],
    "567": [0.19444, 0.44444, 0, 0, 0.26667],
    "710": [0, 0.69444, 0, 0, 0.5],
    "711": [0, 0.63194, 0, 0, 0.5],
    "713": [0, 0.60889, 0, 0, 0.5],
    "714": [0, 0.69444, 0, 0, 0.5],
    "715": [0, 0.69444, 0, 0, 0.5],
    "728": [0, 0.69444, 0, 0, 0.5],
    "729": [0, 0.67937, 0, 0, 0.27778],
    "730": [0, 0.69444, 0, 0, 0.66667],
    "732": [0, 0.67659, 0, 0, 0.5],
    "733": [0, 0.69444, 0, 0, 0.5],
    "915": [0, 0.69444, 0, 0, 0.54167],
    "916": [0, 0.69444, 0, 0, 0.83334],
    "920": [0, 0.69444, 0, 0, 0.77778],
    "923": [0, 0.69444, 0, 0, 0.61111],
    "926": [0, 0.69444, 0, 0, 0.66667],
    "928": [0, 0.69444, 0, 0, 0.70834],
    "931": [0, 0.69444, 0, 0, 0.72222],
    "933": [0, 0.69444, 0, 0, 0.77778],
    "934": [0, 0.69444, 0, 0, 0.72222],
    "936": [0, 0.69444, 0, 0, 0.77778],
    "937": [0, 0.69444, 0, 0, 0.72222],
    "8211": [0, 0.44444, 0.02778, 0, 0.5],
    "8212": [0, 0.44444, 0.02778, 0, 1],
    "8216": [0, 0.69444, 0, 0, 0.27778],
    "8217": [0, 0.69444, 0, 0, 0.27778],
    "8220": [0, 0.69444, 0, 0, 0.5],
    "8221": [0, 0.69444, 0, 0, 0.5]
  },
  "Script-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "65": [0, 0.7, 0.22925, 0, 0.80253],
    "66": [0, 0.7, 0.04087, 0, 0.90757],
    "67": [0, 0.7, 0.1689, 0, 0.66619],
    "68": [0, 0.7, 0.09371, 0, 0.77443],
    "69": [0, 0.7, 0.18583, 0, 0.56162],
    "70": [0, 0.7, 0.13634, 0, 0.89544],
    "71": [0, 0.7, 0.17322, 0, 0.60961],
    "72": [0, 0.7, 0.29694, 0, 0.96919],
    "73": [0, 0.7, 0.19189, 0, 0.80907],
    "74": [0.27778, 0.7, 0.19189, 0, 1.05159],
    "75": [0, 0.7, 0.31259, 0, 0.91364],
    "76": [0, 0.7, 0.19189, 0, 0.87373],
    "77": [0, 0.7, 0.15981, 0, 1.08031],
    "78": [0, 0.7, 0.3525, 0, 0.9015],
    "79": [0, 0.7, 0.08078, 0, 0.73787],
    "80": [0, 0.7, 0.08078, 0, 1.01262],
    "81": [0, 0.7, 0.03305, 0, 0.88282],
    "82": [0, 0.7, 0.06259, 0, 0.85],
    "83": [0, 0.7, 0.19189, 0, 0.86767],
    "84": [0, 0.7, 0.29087, 0, 0.74697],
    "85": [0, 0.7, 0.25815, 0, 0.79996],
    "86": [0, 0.7, 0.27523, 0, 0.62204],
    "87": [0, 0.7, 0.27523, 0, 0.80532],
    "88": [0, 0.7, 0.26006, 0, 0.94445],
    "89": [0, 0.7, 0.2939, 0, 0.70961],
    "90": [0, 0.7, 0.24037, 0, 0.8212],
    "160": [0, 0, 0, 0, 0.25]
  },
  "Size1-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "40": [0.35001, 0.85, 0, 0, 0.45834],
    "41": [0.35001, 0.85, 0, 0, 0.45834],
    "47": [0.35001, 0.85, 0, 0, 0.57778],
    "91": [0.35001, 0.85, 0, 0, 0.41667],
    "92": [0.35001, 0.85, 0, 0, 0.57778],
    "93": [0.35001, 0.85, 0, 0, 0.41667],
    "123": [0.35001, 0.85, 0, 0, 0.58334],
    "125": [0.35001, 0.85, 0, 0, 0.58334],
    "160": [0, 0, 0, 0, 0.25],
    "710": [0, 0.72222, 0, 0, 0.55556],
    "732": [0, 0.72222, 0, 0, 0.55556],
    "770": [0, 0.72222, 0, 0, 0.55556],
    "771": [0, 0.72222, 0, 0, 0.55556],
    "8214": [-99e-5, 0.601, 0, 0, 0.77778],
    "8593": [1e-5, 0.6, 0, 0, 0.66667],
    "8595": [1e-5, 0.6, 0, 0, 0.66667],
    "8657": [1e-5, 0.6, 0, 0, 0.77778],
    "8659": [1e-5, 0.6, 0, 0, 0.77778],
    "8719": [0.25001, 0.75, 0, 0, 0.94445],
    "8720": [0.25001, 0.75, 0, 0, 0.94445],
    "8721": [0.25001, 0.75, 0, 0, 1.05556],
    "8730": [0.35001, 0.85, 0, 0, 1],
    "8739": [-599e-5, 0.606, 0, 0, 0.33333],
    "8741": [-599e-5, 0.606, 0, 0, 0.55556],
    "8747": [0.30612, 0.805, 0.19445, 0, 0.47222],
    "8748": [0.306, 0.805, 0.19445, 0, 0.47222],
    "8749": [0.306, 0.805, 0.19445, 0, 0.47222],
    "8750": [0.30612, 0.805, 0.19445, 0, 0.47222],
    "8896": [0.25001, 0.75, 0, 0, 0.83334],
    "8897": [0.25001, 0.75, 0, 0, 0.83334],
    "8898": [0.25001, 0.75, 0, 0, 0.83334],
    "8899": [0.25001, 0.75, 0, 0, 0.83334],
    "8968": [0.35001, 0.85, 0, 0, 0.47222],
    "8969": [0.35001, 0.85, 0, 0, 0.47222],
    "8970": [0.35001, 0.85, 0, 0, 0.47222],
    "8971": [0.35001, 0.85, 0, 0, 0.47222],
    "9168": [-99e-5, 0.601, 0, 0, 0.66667],
    "10216": [0.35001, 0.85, 0, 0, 0.47222],
    "10217": [0.35001, 0.85, 0, 0, 0.47222],
    "10752": [0.25001, 0.75, 0, 0, 1.11111],
    "10753": [0.25001, 0.75, 0, 0, 1.11111],
    "10754": [0.25001, 0.75, 0, 0, 1.11111],
    "10756": [0.25001, 0.75, 0, 0, 0.83334],
    "10758": [0.25001, 0.75, 0, 0, 0.83334]
  },
  "Size2-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "40": [0.65002, 1.15, 0, 0, 0.59722],
    "41": [0.65002, 1.15, 0, 0, 0.59722],
    "47": [0.65002, 1.15, 0, 0, 0.81111],
    "91": [0.65002, 1.15, 0, 0, 0.47222],
    "92": [0.65002, 1.15, 0, 0, 0.81111],
    "93": [0.65002, 1.15, 0, 0, 0.47222],
    "123": [0.65002, 1.15, 0, 0, 0.66667],
    "125": [0.65002, 1.15, 0, 0, 0.66667],
    "160": [0, 0, 0, 0, 0.25],
    "710": [0, 0.75, 0, 0, 1],
    "732": [0, 0.75, 0, 0, 1],
    "770": [0, 0.75, 0, 0, 1],
    "771": [0, 0.75, 0, 0, 1],
    "8719": [0.55001, 1.05, 0, 0, 1.27778],
    "8720": [0.55001, 1.05, 0, 0, 1.27778],
    "8721": [0.55001, 1.05, 0, 0, 1.44445],
    "8730": [0.65002, 1.15, 0, 0, 1],
    "8747": [0.86225, 1.36, 0.44445, 0, 0.55556],
    "8748": [0.862, 1.36, 0.44445, 0, 0.55556],
    "8749": [0.862, 1.36, 0.44445, 0, 0.55556],
    "8750": [0.86225, 1.36, 0.44445, 0, 0.55556],
    "8896": [0.55001, 1.05, 0, 0, 1.11111],
    "8897": [0.55001, 1.05, 0, 0, 1.11111],
    "8898": [0.55001, 1.05, 0, 0, 1.11111],
    "8899": [0.55001, 1.05, 0, 0, 1.11111],
    "8968": [0.65002, 1.15, 0, 0, 0.52778],
    "8969": [0.65002, 1.15, 0, 0, 0.52778],
    "8970": [0.65002, 1.15, 0, 0, 0.52778],
    "8971": [0.65002, 1.15, 0, 0, 0.52778],
    "10216": [0.65002, 1.15, 0, 0, 0.61111],
    "10217": [0.65002, 1.15, 0, 0, 0.61111],
    "10752": [0.55001, 1.05, 0, 0, 1.51112],
    "10753": [0.55001, 1.05, 0, 0, 1.51112],
    "10754": [0.55001, 1.05, 0, 0, 1.51112],
    "10756": [0.55001, 1.05, 0, 0, 1.11111],
    "10758": [0.55001, 1.05, 0, 0, 1.11111]
  },
  "Size3-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "40": [0.95003, 1.45, 0, 0, 0.73611],
    "41": [0.95003, 1.45, 0, 0, 0.73611],
    "47": [0.95003, 1.45, 0, 0, 1.04445],
    "91": [0.95003, 1.45, 0, 0, 0.52778],
    "92": [0.95003, 1.45, 0, 0, 1.04445],
    "93": [0.95003, 1.45, 0, 0, 0.52778],
    "123": [0.95003, 1.45, 0, 0, 0.75],
    "125": [0.95003, 1.45, 0, 0, 0.75],
    "160": [0, 0, 0, 0, 0.25],
    "710": [0, 0.75, 0, 0, 1.44445],
    "732": [0, 0.75, 0, 0, 1.44445],
    "770": [0, 0.75, 0, 0, 1.44445],
    "771": [0, 0.75, 0, 0, 1.44445],
    "8730": [0.95003, 1.45, 0, 0, 1],
    "8968": [0.95003, 1.45, 0, 0, 0.58334],
    "8969": [0.95003, 1.45, 0, 0, 0.58334],
    "8970": [0.95003, 1.45, 0, 0, 0.58334],
    "8971": [0.95003, 1.45, 0, 0, 0.58334],
    "10216": [0.95003, 1.45, 0, 0, 0.75],
    "10217": [0.95003, 1.45, 0, 0, 0.75]
  },
  "Size4-Regular": {
    "32": [0, 0, 0, 0, 0.25],
    "40": [1.25003, 1.75, 0, 0, 0.79167],
    "41": [1.25003, 1.75, 0, 0, 0.79167],
    "47": [1.25003, 1.75, 0, 0, 1.27778],
    "91": [1.25003, 1.75, 0, 0, 0.58334],
    "92": [1.25003, 1.75, 0, 0, 1.27778],
    "93": [1.25003, 1.75, 0, 0, 0.58334],
    "123": [1.25003, 1.75, 0, 0, 0.80556],
    "125": [1.25003, 1.75, 0, 0, 0.80556],
    "160": [0, 0, 0, 0, 0.25],
    "710": [0, 0.825, 0, 0, 1.8889],
    "732": [0, 0.825, 0, 0, 1.8889],
    "770": [0, 0.825, 0, 0, 1.8889],
    "771": [0, 0.825, 0, 0, 1.8889],
    "8730": [1.25003, 1.75, 0, 0, 1],
    "8968": [1.25003, 1.75, 0, 0, 0.63889],
    "8969": [1.25003, 1.75, 0, 0, 0.63889],
    "8970": [1.25003, 1.75, 0, 0, 0.63889],
    "8971": [1.25003, 1.75, 0, 0, 0.63889],
    "9115": [0.64502, 1.155, 0, 0, 0.875],
    "9116": [1e-5, 0.6, 0, 0, 0.875],
    "9117": [0.64502, 1.155, 0, 0, 0.875],
    "9118": [0.64502, 1.155, 0, 0, 0.875],
    "9119": [1e-5, 0.6, 0, 0, 0.875],
    "9120": [0.64502, 1.155, 0, 0, 0.875],
    "9121": [0.64502, 1.155, 0, 0, 0.66667],
    "9122": [-99e-5, 0.601, 0, 0, 0.66667],
    "9123": [0.64502, 1.155, 0, 0, 0.66667],
    "9124": [0.64502, 1.155, 0, 0, 0.66667],
    "9125": [-99e-5, 0.601, 0, 0, 0.66667],
    "9126": [0.64502, 1.155, 0, 0, 0.66667],
    "9127": [1e-5, 0.9, 0, 0, 0.88889],
    "9128": [0.65002, 1.15, 0, 0, 0.88889],
    "9129": [0.90001, 0, 0, 0, 0.88889],
    "9130": [0, 0.3, 0, 0, 0.88889],
    "9131": [1e-5, 0.9, 0, 0, 0.88889],
    "9132": [0.65002, 1.15, 0, 0, 0.88889],
    "9133": [0.90001, 0, 0, 0, 0.88889],
    "9143": [0.88502, 0.915, 0, 0, 1.05556],
    "10216": [1.25003, 1.75, 0, 0, 0.80556],
    "10217": [1.25003, 1.75, 0, 0, 0.80556],
    "57344": [-499e-5, 0.605, 0, 0, 1.05556],
    "57345": [-499e-5, 0.605, 0, 0, 1.05556],
    "57680": [0, 0.12, 0, 0, 0.45],
    "57681": [0, 0.12, 0, 0, 0.45],
    "57682": [0, 0.12, 0, 0, 0.45],
    "57683": [0, 0.12, 0, 0, 0.45]
  },
  "Typewriter-Regular": {
    "32": [0, 0, 0, 0, 0.525],
    "33": [0, 0.61111, 0, 0, 0.525],
    "34": [0, 0.61111, 0, 0, 0.525],
    "35": [0, 0.61111, 0, 0, 0.525],
    "36": [0.08333, 0.69444, 0, 0, 0.525],
    "37": [0.08333, 0.69444, 0, 0, 0.525],
    "38": [0, 0.61111, 0, 0, 0.525],
    "39": [0, 0.61111, 0, 0, 0.525],
    "40": [0.08333, 0.69444, 0, 0, 0.525],
    "41": [0.08333, 0.69444, 0, 0, 0.525],
    "42": [0, 0.52083, 0, 0, 0.525],
    "43": [-0.08056, 0.53055, 0, 0, 0.525],
    "44": [0.13889, 0.125, 0, 0, 0.525],
    "45": [-0.08056, 0.53055, 0, 0, 0.525],
    "46": [0, 0.125, 0, 0, 0.525],
    "47": [0.08333, 0.69444, 0, 0, 0.525],
    "48": [0, 0.61111, 0, 0, 0.525],
    "49": [0, 0.61111, 0, 0, 0.525],
    "50": [0, 0.61111, 0, 0, 0.525],
    "51": [0, 0.61111, 0, 0, 0.525],
    "52": [0, 0.61111, 0, 0, 0.525],
    "53": [0, 0.61111, 0, 0, 0.525],
    "54": [0, 0.61111, 0, 0, 0.525],
    "55": [0, 0.61111, 0, 0, 0.525],
    "56": [0, 0.61111, 0, 0, 0.525],
    "57": [0, 0.61111, 0, 0, 0.525],
    "58": [0, 0.43056, 0, 0, 0.525],
    "59": [0.13889, 0.43056, 0, 0, 0.525],
    "60": [-0.05556, 0.55556, 0, 0, 0.525],
    "61": [-0.19549, 0.41562, 0, 0, 0.525],
    "62": [-0.05556, 0.55556, 0, 0, 0.525],
    "63": [0, 0.61111, 0, 0, 0.525],
    "64": [0, 0.61111, 0, 0, 0.525],
    "65": [0, 0.61111, 0, 0, 0.525],
    "66": [0, 0.61111, 0, 0, 0.525],
    "67": [0, 0.61111, 0, 0, 0.525],
    "68": [0, 0.61111, 0, 0, 0.525],
    "69": [0, 0.61111, 0, 0, 0.525],
    "70": [0, 0.61111, 0, 0, 0.525],
    "71": [0, 0.61111, 0, 0, 0.525],
    "72": [0, 0.61111, 0, 0, 0.525],
    "73": [0, 0.61111, 0, 0, 0.525],
    "74": [0, 0.61111, 0, 0, 0.525],
    "75": [0, 0.61111, 0, 0, 0.525],
    "76": [0, 0.61111, 0, 0, 0.525],
    "77": [0, 0.61111, 0, 0, 0.525],
    "78": [0, 0.61111, 0, 0, 0.525],
    "79": [0, 0.61111, 0, 0, 0.525],
    "80": [0, 0.61111, 0, 0, 0.525],
    "81": [0.13889, 0.61111, 0, 0, 0.525],
    "82": [0, 0.61111, 0, 0, 0.525],
    "83": [0, 0.61111, 0, 0, 0.525],
    "84": [0, 0.61111, 0, 0, 0.525],
    "85": [0, 0.61111, 0, 0, 0.525],
    "86": [0, 0.61111, 0, 0, 0.525],
    "87": [0, 0.61111, 0, 0, 0.525],
    "88": [0, 0.61111, 0, 0, 0.525],
    "89": [0, 0.61111, 0, 0, 0.525],
    "90": [0, 0.61111, 0, 0, 0.525],
    "91": [0.08333, 0.69444, 0, 0, 0.525],
    "92": [0.08333, 0.69444, 0, 0, 0.525],
    "93": [0.08333, 0.69444, 0, 0, 0.525],
    "94": [0, 0.61111, 0, 0, 0.525],
    "95": [0.09514, 0, 0, 0, 0.525],
    "96": [0, 0.61111, 0, 0, 0.525],
    "97": [0, 0.43056, 0, 0, 0.525],
    "98": [0, 0.61111, 0, 0, 0.525],
    "99": [0, 0.43056, 0, 0, 0.525],
    "100": [0, 0.61111, 0, 0, 0.525],
    "101": [0, 0.43056, 0, 0, 0.525],
    "102": [0, 0.61111, 0, 0, 0.525],
    "103": [0.22222, 0.43056, 0, 0, 0.525],
    "104": [0, 0.61111, 0, 0, 0.525],
    "105": [0, 0.61111, 0, 0, 0.525],
    "106": [0.22222, 0.61111, 0, 0, 0.525],
    "107": [0, 0.61111, 0, 0, 0.525],
    "108": [0, 0.61111, 0, 0, 0.525],
    "109": [0, 0.43056, 0, 0, 0.525],
    "110": [0, 0.43056, 0, 0, 0.525],
    "111": [0, 0.43056, 0, 0, 0.525],
    "112": [0.22222, 0.43056, 0, 0, 0.525],
    "113": [0.22222, 0.43056, 0, 0, 0.525],
    "114": [0, 0.43056, 0, 0, 0.525],
    "115": [0, 0.43056, 0, 0, 0.525],
    "116": [0, 0.55358, 0, 0, 0.525],
    "117": [0, 0.43056, 0, 0, 0.525],
    "118": [0, 0.43056, 0, 0, 0.525],
    "119": [0, 0.43056, 0, 0, 0.525],
    "120": [0, 0.43056, 0, 0, 0.525],
    "121": [0.22222, 0.43056, 0, 0, 0.525],
    "122": [0, 0.43056, 0, 0, 0.525],
    "123": [0.08333, 0.69444, 0, 0, 0.525],
    "124": [0.08333, 0.69444, 0, 0, 0.525],
    "125": [0.08333, 0.69444, 0, 0, 0.525],
    "126": [0, 0.61111, 0, 0, 0.525],
    "127": [0, 0.61111, 0, 0, 0.525],
    "160": [0, 0, 0, 0, 0.525],
    "176": [0, 0.61111, 0, 0, 0.525],
    "184": [0.19445, 0, 0, 0, 0.525],
    "305": [0, 0.43056, 0, 0, 0.525],
    "567": [0.22222, 0.43056, 0, 0, 0.525],
    "711": [0, 0.56597, 0, 0, 0.525],
    "713": [0, 0.56555, 0, 0, 0.525],
    "714": [0, 0.61111, 0, 0, 0.525],
    "715": [0, 0.61111, 0, 0, 0.525],
    "728": [0, 0.61111, 0, 0, 0.525],
    "730": [0, 0.61111, 0, 0, 0.525],
    "770": [0, 0.61111, 0, 0, 0.525],
    "771": [0, 0.61111, 0, 0, 0.525],
    "776": [0, 0.61111, 0, 0, 0.525],
    "915": [0, 0.61111, 0, 0, 0.525],
    "916": [0, 0.61111, 0, 0, 0.525],
    "920": [0, 0.61111, 0, 0, 0.525],
    "923": [0, 0.61111, 0, 0, 0.525],
    "926": [0, 0.61111, 0, 0, 0.525],
    "928": [0, 0.61111, 0, 0, 0.525],
    "931": [0, 0.61111, 0, 0, 0.525],
    "933": [0, 0.61111, 0, 0, 0.525],
    "934": [0, 0.61111, 0, 0, 0.525],
    "936": [0, 0.61111, 0, 0, 0.525],
    "937": [0, 0.61111, 0, 0, 0.525],
    "8216": [0, 0.61111, 0, 0, 0.525],
    "8217": [0, 0.61111, 0, 0, 0.525],
    "8242": [0, 0.61111, 0, 0, 0.525],
    "9251": [0.11111, 0.21944, 0, 0, 0.525]
  }
};
var sigmasAndXis = {
  slant: [0.25, 0.25, 0.25],
  // sigma1
  space: [0, 0, 0],
  // sigma2
  stretch: [0, 0, 0],
  // sigma3
  shrink: [0, 0, 0],
  // sigma4
  xHeight: [0.431, 0.431, 0.431],
  // sigma5
  quad: [1, 1.171, 1.472],
  // sigma6
  extraSpace: [0, 0, 0],
  // sigma7
  num1: [0.677, 0.732, 0.925],
  // sigma8
  num2: [0.394, 0.384, 0.387],
  // sigma9
  num3: [0.444, 0.471, 0.504],
  // sigma10
  denom1: [0.686, 0.752, 1.025],
  // sigma11
  denom2: [0.345, 0.344, 0.532],
  // sigma12
  sup1: [0.413, 0.503, 0.504],
  // sigma13
  sup2: [0.363, 0.431, 0.404],
  // sigma14
  sup3: [0.289, 0.286, 0.294],
  // sigma15
  sub1: [0.15, 0.143, 0.2],
  // sigma16
  sub2: [0.247, 0.286, 0.4],
  // sigma17
  supDrop: [0.386, 0.353, 0.494],
  // sigma18
  subDrop: [0.05, 0.071, 0.1],
  // sigma19
  delim1: [2.39, 1.7, 1.98],
  // sigma20
  delim2: [1.01, 1.157, 1.42],
  // sigma21
  axisHeight: [0.25, 0.25, 0.25],
  // sigma22
  // These font metrics are extracted from TeX by using tftopl on cmex10.tfm;
  // they correspond to the font parameters of the extension fonts (family 3).
  // See the TeXbook, page 441. In AMSTeX, the extension fonts scale; to
  // match cmex7, we'd use cmex7.tfm values for script and scriptscript
  // values.
  defaultRuleThickness: [0.04, 0.049, 0.049],
  // xi8; cmex7: 0.049
  bigOpSpacing1: [0.111, 0.111, 0.111],
  // xi9
  bigOpSpacing2: [0.166, 0.166, 0.166],
  // xi10
  bigOpSpacing3: [0.2, 0.2, 0.2],
  // xi11
  bigOpSpacing4: [0.6, 0.611, 0.611],
  // xi12; cmex7: 0.611
  bigOpSpacing5: [0.1, 0.143, 0.143],
  // xi13; cmex7: 0.143
  // The \sqrt rule width is taken from the height of the surd character.
  // Since we use the same font at all sizes, this thickness doesn't scale.
  sqrtRuleThickness: [0.04, 0.04, 0.04],
  // This value determines how large a pt is, for metrics which are defined
  // in terms of pts.
  // This value is also used in katex.scss; if you change it make sure the
  // values match.
  ptPerEm: [10, 10, 10],
  // The space between adjacent `|` columns in an array definition. From
  // `\showthe\doublerulesep` in LaTeX. Equals 2.0 / ptPerEm.
  doubleRuleSep: [0.2, 0.2, 0.2],
  // The width of separator lines in {array} environments. From
  // `\showthe\arrayrulewidth` in LaTeX. Equals 0.4 / ptPerEm.
  arrayRuleWidth: [0.04, 0.04, 0.04],
  // Two values from LaTeX source2e:
  fboxsep: [0.3, 0.3, 0.3],
  //        3 pt / ptPerEm
  fboxrule: [0.04, 0.04, 0.04]
  // 0.4 pt / ptPerEm
};
var extraCharacterMap = {
  // Latin-1
  "\xC5": "A",
  "\xD0": "D",
  "\xDE": "o",
  "\xE5": "a",
  "\xF0": "d",
  "\xFE": "o",
  // Cyrillic
  "\u0410": "A",
  "\u0411": "B",
  "\u0412": "B",
  "\u0413": "F",
  "\u0414": "A",
  "\u0415": "E",
  "\u0416": "K",
  "\u0417": "3",
  "\u0418": "N",
  "\u0419": "N",
  "\u041A": "K",
  "\u041B": "N",
  "\u041C": "M",
  "\u041D": "H",
  "\u041E": "O",
  "\u041F": "N",
  "\u0420": "P",
  "\u0421": "C",
  "\u0422": "T",
  "\u0423": "y",
  "\u0424": "O",
  "\u0425": "X",
  "\u0426": "U",
  "\u0427": "h",
  "\u0428": "W",
  "\u0429": "W",
  "\u042A": "B",
  "\u042B": "X",
  "\u042C": "B",
  "\u042D": "3",
  "\u042E": "X",
  "\u042F": "R",
  "\u0430": "a",
  "\u0431": "b",
  "\u0432": "a",
  "\u0433": "r",
  "\u0434": "y",
  "\u0435": "e",
  "\u0436": "m",
  "\u0437": "e",
  "\u0438": "n",
  "\u0439": "n",
  "\u043A": "n",
  "\u043B": "n",
  "\u043C": "m",
  "\u043D": "n",
  "\u043E": "o",
  "\u043F": "n",
  "\u0440": "p",
  "\u0441": "c",
  "\u0442": "o",
  "\u0443": "y",
  "\u0444": "b",
  "\u0445": "x",
  "\u0446": "n",
  "\u0447": "n",
  "\u0448": "w",
  "\u0449": "w",
  "\u044A": "a",
  "\u044B": "m",
  "\u044C": "a",
  "\u044D": "e",
  "\u044E": "m",
  "\u044F": "r"
};
function setFontMetrics(fontName, metrics) {
  fontMetricsData[fontName] = metrics;
}
function getCharacterMetrics(character, font, mode) {
  if (!fontMetricsData[font]) {
    throw new Error("Font metrics not found for font: " + font + ".");
  }
  var ch2 = character.charCodeAt(0);
  var metrics = fontMetricsData[font][ch2];
  if (!metrics && character[0] in extraCharacterMap) {
    ch2 = extraCharacterMap[character[0]].charCodeAt(0);
    metrics = fontMetricsData[font][ch2];
  }
  if (!metrics && mode === "text") {
    if (supportedCodepoint(ch2)) {
      metrics = fontMetricsData[font][77];
    }
  }
  if (metrics) {
    return {
      depth: metrics[0],
      height: metrics[1],
      italic: metrics[2],
      skew: metrics[3],
      width: metrics[4]
    };
  }
}
var fontMetricsBySizeIndex = {};
function getGlobalMetrics(size) {
  var sizeIndex;
  if (size >= 5) {
    sizeIndex = 0;
  } else if (size >= 3) {
    sizeIndex = 1;
  } else {
    sizeIndex = 2;
  }
  if (!fontMetricsBySizeIndex[sizeIndex]) {
    var metrics = fontMetricsBySizeIndex[sizeIndex] = {
      cssEmPerMu: sigmasAndXis.quad[sizeIndex] / 18
    };
    for (var key in sigmasAndXis) {
      if (sigmasAndXis.hasOwnProperty(key)) {
        metrics[key] = sigmasAndXis[key][sizeIndex];
      }
    }
  }
  return fontMetricsBySizeIndex[sizeIndex];
}
var sizeStyleMap = [
  // Each element contains [textsize, scriptsize, scriptscriptsize].
  // The size mappings are taken from TeX with \normalsize=10pt.
  [1, 1, 1],
  // size1: [5, 5, 5]              \tiny
  [2, 1, 1],
  // size2: [6, 5, 5]
  [3, 1, 1],
  // size3: [7, 5, 5]              \scriptsize
  [4, 2, 1],
  // size4: [8, 6, 5]              \footnotesize
  [5, 2, 1],
  // size5: [9, 6, 5]              \small
  [6, 3, 1],
  // size6: [10, 7, 5]             \normalsize
  [7, 4, 2],
  // size7: [12, 8, 6]             \large
  [8, 6, 3],
  // size8: [14.4, 10, 7]          \Large
  [9, 7, 6],
  // size9: [17.28, 12, 10]        \LARGE
  [10, 8, 7],
  // size10: [20.74, 14.4, 12]     \huge
  [11, 10, 9]
  // size11: [24.88, 20.74, 17.28] \HUGE
];
var sizeMultipliers = [
  // fontMetrics.js:getGlobalMetrics also uses size indexes, so if
  // you change size indexes, change that function.
  0.5,
  0.6,
  0.7,
  0.8,
  0.9,
  1,
  1.2,
  1.44,
  1.728,
  2.074,
  2.488
];
var sizeAtStyle = function sizeAtStyle2(size, style) {
  return style.size < 2 ? size : sizeStyleMap[size - 1][style.size - 1];
};
var Options = class _Options {
  // A font family applies to a group of fonts (i.e. SansSerif), while a font
  // represents a specific font (i.e. SansSerif Bold).
  // See: https://tex.stackexchange.com/questions/22350/difference-between-textrm-and-mathrm
  /**
   * The base size index.
   */
  constructor(data) {
    this.style = void 0;
    this.color = void 0;
    this.size = void 0;
    this.textSize = void 0;
    this.phantom = void 0;
    this.font = void 0;
    this.fontFamily = void 0;
    this.fontWeight = void 0;
    this.fontShape = void 0;
    this.sizeMultiplier = void 0;
    this.maxSize = void 0;
    this.minRuleThickness = void 0;
    this._fontMetrics = void 0;
    this.style = data.style;
    this.color = data.color;
    this.size = data.size || _Options.BASESIZE;
    this.textSize = data.textSize || this.size;
    this.phantom = !!data.phantom;
    this.font = data.font || "";
    this.fontFamily = data.fontFamily || "";
    this.fontWeight = data.fontWeight || "";
    this.fontShape = data.fontShape || "";
    this.sizeMultiplier = sizeMultipliers[this.size - 1];
    this.maxSize = data.maxSize;
    this.minRuleThickness = data.minRuleThickness;
    this._fontMetrics = void 0;
  }
  /**
   * Returns a new options object with the same properties as "this".  Properties
   * from "extension" will be copied to the new options object.
   */
  extend(extension) {
    var data = {
      style: this.style,
      size: this.size,
      textSize: this.textSize,
      color: this.color,
      phantom: this.phantom,
      font: this.font,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontShape: this.fontShape,
      maxSize: this.maxSize,
      minRuleThickness: this.minRuleThickness
    };
    for (var key in extension) {
      if (extension.hasOwnProperty(key)) {
        data[key] = extension[key];
      }
    }
    return new _Options(data);
  }
  /**
   * Return an options object with the given style. If `this.style === style`,
   * returns `this`.
   */
  havingStyle(style) {
    if (this.style === style) {
      return this;
    } else {
      return this.extend({
        style,
        size: sizeAtStyle(this.textSize, style)
      });
    }
  }
  /**
   * Return an options object with a cramped version of the current style. If
   * the current style is cramped, returns `this`.
   */
  havingCrampedStyle() {
    return this.havingStyle(this.style.cramp());
  }
  /**
   * Return an options object with the given size and in at least `\textstyle`.
   * Returns `this` if appropriate.
   */
  havingSize(size) {
    if (this.size === size && this.textSize === size) {
      return this;
    } else {
      return this.extend({
        style: this.style.text(),
        size,
        textSize: size,
        sizeMultiplier: sizeMultipliers[size - 1]
      });
    }
  }
  /**
   * Like `this.havingSize(BASESIZE).havingStyle(style)`. If `style` is omitted,
   * changes to at least `\textstyle`.
   */
  havingBaseStyle(style) {
    style = style || this.style.text();
    var wantSize = sizeAtStyle(_Options.BASESIZE, style);
    if (this.size === wantSize && this.textSize === _Options.BASESIZE && this.style === style) {
      return this;
    } else {
      return this.extend({
        style,
        size: wantSize
      });
    }
  }
  /**
   * Remove the effect of sizing changes such as \Huge.
   * Keep the effect of the current style, such as \scriptstyle.
   */
  havingBaseSizing() {
    var size;
    switch (this.style.id) {
      case 4:
      case 5:
        size = 3;
        break;
      case 6:
      case 7:
        size = 1;
        break;
      default:
        size = 6;
    }
    return this.extend({
      style: this.style.text(),
      size
    });
  }
  /**
   * Create a new options object with the given color.
   */
  withColor(color) {
    return this.extend({
      color
    });
  }
  /**
   * Create a new options object with "phantom" set to true.
   */
  withPhantom() {
    return this.extend({
      phantom: true
    });
  }
  /**
   * Creates a new options object with the given math font or old text font.
   * @type {[type]}
   */
  withFont(font) {
    return this.extend({
      font
    });
  }
  /**
   * Create a new options objects with the given fontFamily.
   */
  withTextFontFamily(fontFamily) {
    return this.extend({
      fontFamily,
      font: ""
    });
  }
  /**
   * Creates a new options object with the given font weight
   */
  withTextFontWeight(fontWeight) {
    return this.extend({
      fontWeight,
      font: ""
    });
  }
  /**
   * Creates a new options object with the given font weight
   */
  withTextFontShape(fontShape) {
    return this.extend({
      fontShape,
      font: ""
    });
  }
  /**
   * Return the CSS sizing classes required to switch from enclosing options
   * `oldOptions` to `this`. Returns an array of classes.
   */
  sizingClasses(oldOptions) {
    if (oldOptions.size !== this.size) {
      return ["sizing", "reset-size" + oldOptions.size, "size" + this.size];
    } else {
      return [];
    }
  }
  /**
   * Return the CSS sizing classes required to switch to the base size. Like
   * `this.havingSize(BASESIZE).sizingClasses(this)`.
   */
  baseSizingClasses() {
    if (this.size !== _Options.BASESIZE) {
      return ["sizing", "reset-size" + this.size, "size" + _Options.BASESIZE];
    } else {
      return [];
    }
  }
  /**
   * Return the font metrics for this size.
   */
  fontMetrics() {
    if (!this._fontMetrics) {
      this._fontMetrics = getGlobalMetrics(this.size);
    }
    return this._fontMetrics;
  }
  /**
   * Gets the CSS color of the current options object
   */
  getColor() {
    if (this.phantom) {
      return "transparent";
    } else {
      return this.color;
    }
  }
};
Options.BASESIZE = 6;
var ptPerUnit = {
  // https://en.wikibooks.org/wiki/LaTeX/Lengths and
  // https://tex.stackexchange.com/a/8263
  "pt": 1,
  // TeX point
  "mm": 7227 / 2540,
  // millimeter
  "cm": 7227 / 254,
  // centimeter
  "in": 72.27,
  // inch
  "bp": 803 / 800,
  // big (PostScript) points
  "pc": 12,
  // pica
  "dd": 1238 / 1157,
  // didot
  "cc": 14856 / 1157,
  // cicero (12 didot)
  "nd": 685 / 642,
  // new didot
  "nc": 1370 / 107,
  // new cicero (12 new didot)
  "sp": 1 / 65536,
  // scaled point (TeX's internal smallest unit)
  // https://tex.stackexchange.com/a/41371
  "px": 803 / 800
  // \pdfpxdimen defaults to 1 bp in pdfTeX and LuaTeX
};
var relativeUnit = {
  "ex": true,
  "em": true,
  "mu": true
};
var validUnit = function validUnit2(unit) {
  if (typeof unit !== "string") {
    unit = unit.unit;
  }
  return unit in ptPerUnit || unit in relativeUnit || unit === "ex";
};
var calculateSize = function calculateSize2(sizeValue, options) {
  var scale;
  if (sizeValue.unit in ptPerUnit) {
    scale = ptPerUnit[sizeValue.unit] / options.fontMetrics().ptPerEm / options.sizeMultiplier;
  } else if (sizeValue.unit === "mu") {
    scale = options.fontMetrics().cssEmPerMu;
  } else {
    var unitOptions;
    if (options.style.isTight()) {
      unitOptions = options.havingStyle(options.style.text());
    } else {
      unitOptions = options;
    }
    if (sizeValue.unit === "ex") {
      scale = unitOptions.fontMetrics().xHeight;
    } else if (sizeValue.unit === "em") {
      scale = unitOptions.fontMetrics().quad;
    } else {
      throw new ParseError("Invalid unit: '" + sizeValue.unit + "'");
    }
    if (unitOptions !== options) {
      scale *= unitOptions.sizeMultiplier / options.sizeMultiplier;
    }
  }
  return Math.min(sizeValue.number * scale, options.maxSize);
};
var makeEm = function makeEm2(n) {
  return +n.toFixed(4) + "em";
};
var createClass = function createClass2(classes) {
  return classes.filter((cls) => cls).join(" ");
};
var initNode = function initNode2(classes, options, style) {
  this.classes = classes || [];
  this.attributes = {};
  this.height = 0;
  this.depth = 0;
  this.maxFontSize = 0;
  this.style = style || {};
  if (options) {
    if (options.style.isTight()) {
      this.classes.push("mtight");
    }
    var color = options.getColor();
    if (color) {
      this.style.color = color;
    }
  }
};
var toNode = function toNode2(tagName) {
  var node = document.createElement(tagName);
  node.className = createClass(this.classes);
  for (var style in this.style) {
    if (this.style.hasOwnProperty(style)) {
      node.style[style] = this.style[style];
    }
  }
  for (var attr in this.attributes) {
    if (this.attributes.hasOwnProperty(attr)) {
      node.setAttribute(attr, this.attributes[attr]);
    }
  }
  for (var i2 = 0; i2 < this.children.length; i2++) {
    node.appendChild(this.children[i2].toNode());
  }
  return node;
};
var invalidAttributeNameRegex = /[\s"'>/=\x00-\x1f]/;
var toMarkup = function toMarkup2(tagName) {
  var markup = "<" + tagName;
  if (this.classes.length) {
    markup += ' class="' + utils.escape(createClass(this.classes)) + '"';
  }
  var styles2 = "";
  for (var style in this.style) {
    if (this.style.hasOwnProperty(style)) {
      styles2 += utils.hyphenate(style) + ":" + this.style[style] + ";";
    }
  }
  if (styles2) {
    markup += ' style="' + utils.escape(styles2) + '"';
  }
  for (var attr in this.attributes) {
    if (this.attributes.hasOwnProperty(attr)) {
      if (invalidAttributeNameRegex.test(attr)) {
        throw new ParseError("Invalid attribute name '" + attr + "'");
      }
      markup += " " + attr + '="' + utils.escape(this.attributes[attr]) + '"';
    }
  }
  markup += ">";
  for (var i2 = 0; i2 < this.children.length; i2++) {
    markup += this.children[i2].toMarkup();
  }
  markup += "</" + tagName + ">";
  return markup;
};
var Span = class {
  constructor(classes, children, options, style) {
    this.children = void 0;
    this.attributes = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.width = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    initNode.call(this, classes, options, style);
    this.children = children || [];
  }
  /**
   * Sets an arbitrary attribute on the span. Warning: use this wisely. Not
   * all browsers support attributes the same, and having too many custom
   * attributes is probably bad.
   */
  setAttribute(attribute, value) {
    this.attributes[attribute] = value;
  }
  hasClass(className) {
    return utils.contains(this.classes, className);
  }
  toNode() {
    return toNode.call(this, "span");
  }
  toMarkup() {
    return toMarkup.call(this, "span");
  }
};
var Anchor = class {
  constructor(href, classes, children, options) {
    this.children = void 0;
    this.attributes = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    initNode.call(this, classes, options);
    this.children = children || [];
    this.setAttribute("href", href);
  }
  setAttribute(attribute, value) {
    this.attributes[attribute] = value;
  }
  hasClass(className) {
    return utils.contains(this.classes, className);
  }
  toNode() {
    return toNode.call(this, "a");
  }
  toMarkup() {
    return toMarkup.call(this, "a");
  }
};
var Img = class {
  constructor(src, alt, style) {
    this.src = void 0;
    this.alt = void 0;
    this.classes = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.maxFontSize = void 0;
    this.style = void 0;
    this.alt = alt;
    this.src = src;
    this.classes = ["mord"];
    this.style = style;
  }
  hasClass(className) {
    return utils.contains(this.classes, className);
  }
  toNode() {
    var node = document.createElement("img");
    node.src = this.src;
    node.alt = this.alt;
    node.className = "mord";
    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        node.style[style] = this.style[style];
      }
    }
    return node;
  }
  toMarkup() {
    var markup = '<img src="' + utils.escape(this.src) + '"' + (' alt="' + utils.escape(this.alt) + '"');
    var styles2 = "";
    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        styles2 += utils.hyphenate(style) + ":" + this.style[style] + ";";
      }
    }
    if (styles2) {
      markup += ' style="' + utils.escape(styles2) + '"';
    }
    markup += "'/>";
    return markup;
  }
};
var iCombinations = {
  "\xEE": "\u0131\u0302",
  "\xEF": "\u0131\u0308",
  "\xED": "\u0131\u0301",
  // 'ī': '\u0131\u0304', // enable when we add Extended Latin
  "\xEC": "\u0131\u0300"
};
var SymbolNode = class {
  constructor(text2, height, depth, italic, skew, width, classes, style) {
    this.text = void 0;
    this.height = void 0;
    this.depth = void 0;
    this.italic = void 0;
    this.skew = void 0;
    this.width = void 0;
    this.maxFontSize = void 0;
    this.classes = void 0;
    this.style = void 0;
    this.text = text2;
    this.height = height || 0;
    this.depth = depth || 0;
    this.italic = italic || 0;
    this.skew = skew || 0;
    this.width = width || 0;
    this.classes = classes || [];
    this.style = style || {};
    this.maxFontSize = 0;
    var script = scriptFromCodepoint(this.text.charCodeAt(0));
    if (script) {
      this.classes.push(script + "_fallback");
    }
    if (/[îïíì]/.test(this.text)) {
      this.text = iCombinations[this.text];
    }
  }
  hasClass(className) {
    return utils.contains(this.classes, className);
  }
  /**
   * Creates a text node or span from a symbol node. Note that a span is only
   * created if it is needed.
   */
  toNode() {
    var node = document.createTextNode(this.text);
    var span = null;
    if (this.italic > 0) {
      span = document.createElement("span");
      span.style.marginRight = makeEm(this.italic);
    }
    if (this.classes.length > 0) {
      span = span || document.createElement("span");
      span.className = createClass(this.classes);
    }
    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        span = span || document.createElement("span");
        span.style[style] = this.style[style];
      }
    }
    if (span) {
      span.appendChild(node);
      return span;
    } else {
      return node;
    }
  }
  /**
   * Creates markup for a symbol node.
   */
  toMarkup() {
    var needsSpan = false;
    var markup = "<span";
    if (this.classes.length) {
      needsSpan = true;
      markup += ' class="';
      markup += utils.escape(createClass(this.classes));
      markup += '"';
    }
    var styles2 = "";
    if (this.italic > 0) {
      styles2 += "margin-right:" + this.italic + "em;";
    }
    for (var style in this.style) {
      if (this.style.hasOwnProperty(style)) {
        styles2 += utils.hyphenate(style) + ":" + this.style[style] + ";";
      }
    }
    if (styles2) {
      needsSpan = true;
      markup += ' style="' + utils.escape(styles2) + '"';
    }
    var escaped = utils.escape(this.text);
    if (needsSpan) {
      markup += ">";
      markup += escaped;
      markup += "</span>";
      return markup;
    } else {
      return escaped;
    }
  }
};
var SvgNode = class {
  constructor(children, attributes) {
    this.children = void 0;
    this.attributes = void 0;
    this.children = children || [];
    this.attributes = attributes || {};
  }
  toNode() {
    var svgNS = "http://www.w3.org/2000/svg";
    var node = document.createElementNS(svgNS, "svg");
    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }
    for (var i2 = 0; i2 < this.children.length; i2++) {
      node.appendChild(this.children[i2].toNode());
    }
    return node;
  }
  toMarkup() {
    var markup = '<svg xmlns="http://www.w3.org/2000/svg"';
    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + '="' + utils.escape(this.attributes[attr]) + '"';
      }
    }
    markup += ">";
    for (var i2 = 0; i2 < this.children.length; i2++) {
      markup += this.children[i2].toMarkup();
    }
    markup += "</svg>";
    return markup;
  }
};
var PathNode = class {
  constructor(pathName, alternate) {
    this.pathName = void 0;
    this.alternate = void 0;
    this.pathName = pathName;
    this.alternate = alternate;
  }
  toNode() {
    var svgNS = "http://www.w3.org/2000/svg";
    var node = document.createElementNS(svgNS, "path");
    if (this.alternate) {
      node.setAttribute("d", this.alternate);
    } else {
      node.setAttribute("d", path[this.pathName]);
    }
    return node;
  }
  toMarkup() {
    if (this.alternate) {
      return '<path d="' + utils.escape(this.alternate) + '"/>';
    } else {
      return '<path d="' + utils.escape(path[this.pathName]) + '"/>';
    }
  }
};
var LineNode = class {
  constructor(attributes) {
    this.attributes = void 0;
    this.attributes = attributes || {};
  }
  toNode() {
    var svgNS = "http://www.w3.org/2000/svg";
    var node = document.createElementNS(svgNS, "line");
    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }
    return node;
  }
  toMarkup() {
    var markup = "<line";
    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + '="' + utils.escape(this.attributes[attr]) + '"';
      }
    }
    markup += "/>";
    return markup;
  }
};
function assertSymbolDomNode(group) {
  if (group instanceof SymbolNode) {
    return group;
  } else {
    throw new Error("Expected symbolNode but got " + String(group) + ".");
  }
}
function assertSpan(group) {
  if (group instanceof Span) {
    return group;
  } else {
    throw new Error("Expected span<HtmlDomNode> but got " + String(group) + ".");
  }
}
var ATOMS = {
  "bin": 1,
  "close": 1,
  "inner": 1,
  "open": 1,
  "punct": 1,
  "rel": 1
};
var NON_ATOMS = {
  "accent-token": 1,
  "mathord": 1,
  "op-token": 1,
  "spacing": 1,
  "textord": 1
};
var symbols = {
  "math": {},
  "text": {}
};
function defineSymbol(mode, font, group, replace, name, acceptUnicodeChar) {
  symbols[mode][name] = {
    font,
    group,
    replace
  };
  if (acceptUnicodeChar && replace) {
    symbols[mode][replace] = symbols[mode][name];
  }
}
var math = "math";
var text = "text";
var main = "main";
var ams = "ams";
var accent = "accent-token";
var bin = "bin";
var close = "close";
var inner = "inner";
var mathord = "mathord";
var op = "op-token";
var open = "open";
var punct = "punct";
var rel = "rel";
var spacing = "spacing";
var textord = "textord";
defineSymbol(math, main, rel, "\u2261", "\\equiv", true);
defineSymbol(math, main, rel, "\u227A", "\\prec", true);
defineSymbol(math, main, rel, "\u227B", "\\succ", true);
defineSymbol(math, main, rel, "\u223C", "\\sim", true);
defineSymbol(math, main, rel, "\u22A5", "\\perp");
defineSymbol(math, main, rel, "\u2AAF", "\\preceq", true);
defineSymbol(math, main, rel, "\u2AB0", "\\succeq", true);
defineSymbol(math, main, rel, "\u2243", "\\simeq", true);
defineSymbol(math, main, rel, "\u2223", "\\mid", true);
defineSymbol(math, main, rel, "\u226A", "\\ll", true);
defineSymbol(math, main, rel, "\u226B", "\\gg", true);
defineSymbol(math, main, rel, "\u224D", "\\asymp", true);
defineSymbol(math, main, rel, "\u2225", "\\parallel");
defineSymbol(math, main, rel, "\u22C8", "\\bowtie", true);
defineSymbol(math, main, rel, "\u2323", "\\smile", true);
defineSymbol(math, main, rel, "\u2291", "\\sqsubseteq", true);
defineSymbol(math, main, rel, "\u2292", "\\sqsupseteq", true);
defineSymbol(math, main, rel, "\u2250", "\\doteq", true);
defineSymbol(math, main, rel, "\u2322", "\\frown", true);
defineSymbol(math, main, rel, "\u220B", "\\ni", true);
defineSymbol(math, main, rel, "\u221D", "\\propto", true);
defineSymbol(math, main, rel, "\u22A2", "\\vdash", true);
defineSymbol(math, main, rel, "\u22A3", "\\dashv", true);
defineSymbol(math, main, rel, "\u220B", "\\owns");
defineSymbol(math, main, punct, ".", "\\ldotp");
defineSymbol(math, main, punct, "\u22C5", "\\cdotp");
defineSymbol(math, main, textord, "#", "\\#");
defineSymbol(text, main, textord, "#", "\\#");
defineSymbol(math, main, textord, "&", "\\&");
defineSymbol(text, main, textord, "&", "\\&");
defineSymbol(math, main, textord, "\u2135", "\\aleph", true);
defineSymbol(math, main, textord, "\u2200", "\\forall", true);
defineSymbol(math, main, textord, "\u210F", "\\hbar", true);
defineSymbol(math, main, textord, "\u2203", "\\exists", true);
defineSymbol(math, main, textord, "\u2207", "\\nabla", true);
defineSymbol(math, main, textord, "\u266D", "\\flat", true);
defineSymbol(math, main, textord, "\u2113", "\\ell", true);
defineSymbol(math, main, textord, "\u266E", "\\natural", true);
defineSymbol(math, main, textord, "\u2663", "\\clubsuit", true);
defineSymbol(math, main, textord, "\u2118", "\\wp", true);
defineSymbol(math, main, textord, "\u266F", "\\sharp", true);
defineSymbol(math, main, textord, "\u2662", "\\diamondsuit", true);
defineSymbol(math, main, textord, "\u211C", "\\Re", true);
defineSymbol(math, main, textord, "\u2661", "\\heartsuit", true);
defineSymbol(math, main, textord, "\u2111", "\\Im", true);
defineSymbol(math, main, textord, "\u2660", "\\spadesuit", true);
defineSymbol(math, main, textord, "\xA7", "\\S", true);
defineSymbol(text, main, textord, "\xA7", "\\S");
defineSymbol(math, main, textord, "\xB6", "\\P", true);
defineSymbol(text, main, textord, "\xB6", "\\P");
defineSymbol(math, main, textord, "\u2020", "\\dag");
defineSymbol(text, main, textord, "\u2020", "\\dag");
defineSymbol(text, main, textord, "\u2020", "\\textdagger");
defineSymbol(math, main, textord, "\u2021", "\\ddag");
defineSymbol(text, main, textord, "\u2021", "\\ddag");
defineSymbol(text, main, textord, "\u2021", "\\textdaggerdbl");
defineSymbol(math, main, close, "\u23B1", "\\rmoustache", true);
defineSymbol(math, main, open, "\u23B0", "\\lmoustache", true);
defineSymbol(math, main, close, "\u27EF", "\\rgroup", true);
defineSymbol(math, main, open, "\u27EE", "\\lgroup", true);
defineSymbol(math, main, bin, "\u2213", "\\mp", true);
defineSymbol(math, main, bin, "\u2296", "\\ominus", true);
defineSymbol(math, main, bin, "\u228E", "\\uplus", true);
defineSymbol(math, main, bin, "\u2293", "\\sqcap", true);
defineSymbol(math, main, bin, "\u2217", "\\ast");
defineSymbol(math, main, bin, "\u2294", "\\sqcup", true);
defineSymbol(math, main, bin, "\u25EF", "\\bigcirc", true);
defineSymbol(math, main, bin, "\u2219", "\\bullet", true);
defineSymbol(math, main, bin, "\u2021", "\\ddagger");
defineSymbol(math, main, bin, "\u2240", "\\wr", true);
defineSymbol(math, main, bin, "\u2A3F", "\\amalg");
defineSymbol(math, main, bin, "&", "\\And");
defineSymbol(math, main, rel, "\u27F5", "\\longleftarrow", true);
defineSymbol(math, main, rel, "\u21D0", "\\Leftarrow", true);
defineSymbol(math, main, rel, "\u27F8", "\\Longleftarrow", true);
defineSymbol(math, main, rel, "\u27F6", "\\longrightarrow", true);
defineSymbol(math, main, rel, "\u21D2", "\\Rightarrow", true);
defineSymbol(math, main, rel, "\u27F9", "\\Longrightarrow", true);
defineSymbol(math, main, rel, "\u2194", "\\leftrightarrow", true);
defineSymbol(math, main, rel, "\u27F7", "\\longleftrightarrow", true);
defineSymbol(math, main, rel, "\u21D4", "\\Leftrightarrow", true);
defineSymbol(math, main, rel, "\u27FA", "\\Longleftrightarrow", true);
defineSymbol(math, main, rel, "\u21A6", "\\mapsto", true);
defineSymbol(math, main, rel, "\u27FC", "\\longmapsto", true);
defineSymbol(math, main, rel, "\u2197", "\\nearrow", true);
defineSymbol(math, main, rel, "\u21A9", "\\hookleftarrow", true);
defineSymbol(math, main, rel, "\u21AA", "\\hookrightarrow", true);
defineSymbol(math, main, rel, "\u2198", "\\searrow", true);
defineSymbol(math, main, rel, "\u21BC", "\\leftharpoonup", true);
defineSymbol(math, main, rel, "\u21C0", "\\rightharpoonup", true);
defineSymbol(math, main, rel, "\u2199", "\\swarrow", true);
defineSymbol(math, main, rel, "\u21BD", "\\leftharpoondown", true);
defineSymbol(math, main, rel, "\u21C1", "\\rightharpoondown", true);
defineSymbol(math, main, rel, "\u2196", "\\nwarrow", true);
defineSymbol(math, main, rel, "\u21CC", "\\rightleftharpoons", true);
defineSymbol(math, ams, rel, "\u226E", "\\nless", true);
defineSymbol(math, ams, rel, "\uE010", "\\@nleqslant");
defineSymbol(math, ams, rel, "\uE011", "\\@nleqq");
defineSymbol(math, ams, rel, "\u2A87", "\\lneq", true);
defineSymbol(math, ams, rel, "\u2268", "\\lneqq", true);
defineSymbol(math, ams, rel, "\uE00C", "\\@lvertneqq");
defineSymbol(math, ams, rel, "\u22E6", "\\lnsim", true);
defineSymbol(math, ams, rel, "\u2A89", "\\lnapprox", true);
defineSymbol(math, ams, rel, "\u2280", "\\nprec", true);
defineSymbol(math, ams, rel, "\u22E0", "\\npreceq", true);
defineSymbol(math, ams, rel, "\u22E8", "\\precnsim", true);
defineSymbol(math, ams, rel, "\u2AB9", "\\precnapprox", true);
defineSymbol(math, ams, rel, "\u2241", "\\nsim", true);
defineSymbol(math, ams, rel, "\uE006", "\\@nshortmid");
defineSymbol(math, ams, rel, "\u2224", "\\nmid", true);
defineSymbol(math, ams, rel, "\u22AC", "\\nvdash", true);
defineSymbol(math, ams, rel, "\u22AD", "\\nvDash", true);
defineSymbol(math, ams, rel, "\u22EA", "\\ntriangleleft");
defineSymbol(math, ams, rel, "\u22EC", "\\ntrianglelefteq", true);
defineSymbol(math, ams, rel, "\u228A", "\\subsetneq", true);
defineSymbol(math, ams, rel, "\uE01A", "\\@varsubsetneq");
defineSymbol(math, ams, rel, "\u2ACB", "\\subsetneqq", true);
defineSymbol(math, ams, rel, "\uE017", "\\@varsubsetneqq");
defineSymbol(math, ams, rel, "\u226F", "\\ngtr", true);
defineSymbol(math, ams, rel, "\uE00F", "\\@ngeqslant");
defineSymbol(math, ams, rel, "\uE00E", "\\@ngeqq");
defineSymbol(math, ams, rel, "\u2A88", "\\gneq", true);
defineSymbol(math, ams, rel, "\u2269", "\\gneqq", true);
defineSymbol(math, ams, rel, "\uE00D", "\\@gvertneqq");
defineSymbol(math, ams, rel, "\u22E7", "\\gnsim", true);
defineSymbol(math, ams, rel, "\u2A8A", "\\gnapprox", true);
defineSymbol(math, ams, rel, "\u2281", "\\nsucc", true);
defineSymbol(math, ams, rel, "\u22E1", "\\nsucceq", true);
defineSymbol(math, ams, rel, "\u22E9", "\\succnsim", true);
defineSymbol(math, ams, rel, "\u2ABA", "\\succnapprox", true);
defineSymbol(math, ams, rel, "\u2246", "\\ncong", true);
defineSymbol(math, ams, rel, "\uE007", "\\@nshortparallel");
defineSymbol(math, ams, rel, "\u2226", "\\nparallel", true);
defineSymbol(math, ams, rel, "\u22AF", "\\nVDash", true);
defineSymbol(math, ams, rel, "\u22EB", "\\ntriangleright");
defineSymbol(math, ams, rel, "\u22ED", "\\ntrianglerighteq", true);
defineSymbol(math, ams, rel, "\uE018", "\\@nsupseteqq");
defineSymbol(math, ams, rel, "\u228B", "\\supsetneq", true);
defineSymbol(math, ams, rel, "\uE01B", "\\@varsupsetneq");
defineSymbol(math, ams, rel, "\u2ACC", "\\supsetneqq", true);
defineSymbol(math, ams, rel, "\uE019", "\\@varsupsetneqq");
defineSymbol(math, ams, rel, "\u22AE", "\\nVdash", true);
defineSymbol(math, ams, rel, "\u2AB5", "\\precneqq", true);
defineSymbol(math, ams, rel, "\u2AB6", "\\succneqq", true);
defineSymbol(math, ams, rel, "\uE016", "\\@nsubseteqq");
defineSymbol(math, ams, bin, "\u22B4", "\\unlhd");
defineSymbol(math, ams, bin, "\u22B5", "\\unrhd");
defineSymbol(math, ams, rel, "\u219A", "\\nleftarrow", true);
defineSymbol(math, ams, rel, "\u219B", "\\nrightarrow", true);
defineSymbol(math, ams, rel, "\u21CD", "\\nLeftarrow", true);
defineSymbol(math, ams, rel, "\u21CF", "\\nRightarrow", true);
defineSymbol(math, ams, rel, "\u21AE", "\\nleftrightarrow", true);
defineSymbol(math, ams, rel, "\u21CE", "\\nLeftrightarrow", true);
defineSymbol(math, ams, rel, "\u25B3", "\\vartriangle");
defineSymbol(math, ams, textord, "\u210F", "\\hslash");
defineSymbol(math, ams, textord, "\u25BD", "\\triangledown");
defineSymbol(math, ams, textord, "\u25CA", "\\lozenge");
defineSymbol(math, ams, textord, "\u24C8", "\\circledS");
defineSymbol(math, ams, textord, "\xAE", "\\circledR");
defineSymbol(text, ams, textord, "\xAE", "\\circledR");
defineSymbol(math, ams, textord, "\u2221", "\\measuredangle", true);
defineSymbol(math, ams, textord, "\u2204", "\\nexists");
defineSymbol(math, ams, textord, "\u2127", "\\mho");
defineSymbol(math, ams, textord, "\u2132", "\\Finv", true);
defineSymbol(math, ams, textord, "\u2141", "\\Game", true);
defineSymbol(math, ams, textord, "\u2035", "\\backprime");
defineSymbol(math, ams, textord, "\u25B2", "\\blacktriangle");
defineSymbol(math, ams, textord, "\u25BC", "\\blacktriangledown");
defineSymbol(math, ams, textord, "\u25A0", "\\blacksquare");
defineSymbol(math, ams, textord, "\u29EB", "\\blacklozenge");
defineSymbol(math, ams, textord, "\u2605", "\\bigstar");
defineSymbol(math, ams, textord, "\u2222", "\\sphericalangle", true);
defineSymbol(math, ams, textord, "\u2201", "\\complement", true);
defineSymbol(math, ams, textord, "\xF0", "\\eth", true);
defineSymbol(text, main, textord, "\xF0", "\xF0");
defineSymbol(math, ams, textord, "\u2571", "\\diagup");
defineSymbol(math, ams, textord, "\u2572", "\\diagdown");
defineSymbol(math, ams, textord, "\u25A1", "\\square");
defineSymbol(math, ams, textord, "\u25A1", "\\Box");
defineSymbol(math, ams, textord, "\u25CA", "\\Diamond");
defineSymbol(math, ams, textord, "\xA5", "\\yen", true);
defineSymbol(text, ams, textord, "\xA5", "\\yen", true);
defineSymbol(math, ams, textord, "\u2713", "\\checkmark", true);
defineSymbol(text, ams, textord, "\u2713", "\\checkmark");
defineSymbol(math, ams, textord, "\u2136", "\\beth", true);
defineSymbol(math, ams, textord, "\u2138", "\\daleth", true);
defineSymbol(math, ams, textord, "\u2137", "\\gimel", true);
defineSymbol(math, ams, textord, "\u03DD", "\\digamma", true);
defineSymbol(math, ams, textord, "\u03F0", "\\varkappa");
defineSymbol(math, ams, open, "\u250C", "\\@ulcorner", true);
defineSymbol(math, ams, close, "\u2510", "\\@urcorner", true);
defineSymbol(math, ams, open, "\u2514", "\\@llcorner", true);
defineSymbol(math, ams, close, "\u2518", "\\@lrcorner", true);
defineSymbol(math, ams, rel, "\u2266", "\\leqq", true);
defineSymbol(math, ams, rel, "\u2A7D", "\\leqslant", true);
defineSymbol(math, ams, rel, "\u2A95", "\\eqslantless", true);
defineSymbol(math, ams, rel, "\u2272", "\\lesssim", true);
defineSymbol(math, ams, rel, "\u2A85", "\\lessapprox", true);
defineSymbol(math, ams, rel, "\u224A", "\\approxeq", true);
defineSymbol(math, ams, bin, "\u22D6", "\\lessdot");
defineSymbol(math, ams, rel, "\u22D8", "\\lll", true);
defineSymbol(math, ams, rel, "\u2276", "\\lessgtr", true);
defineSymbol(math, ams, rel, "\u22DA", "\\lesseqgtr", true);
defineSymbol(math, ams, rel, "\u2A8B", "\\lesseqqgtr", true);
defineSymbol(math, ams, rel, "\u2251", "\\doteqdot");
defineSymbol(math, ams, rel, "\u2253", "\\risingdotseq", true);
defineSymbol(math, ams, rel, "\u2252", "\\fallingdotseq", true);
defineSymbol(math, ams, rel, "\u223D", "\\backsim", true);
defineSymbol(math, ams, rel, "\u22CD", "\\backsimeq", true);
defineSymbol(math, ams, rel, "\u2AC5", "\\subseteqq", true);
defineSymbol(math, ams, rel, "\u22D0", "\\Subset", true);
defineSymbol(math, ams, rel, "\u228F", "\\sqsubset", true);
defineSymbol(math, ams, rel, "\u227C", "\\preccurlyeq", true);
defineSymbol(math, ams, rel, "\u22DE", "\\curlyeqprec", true);
defineSymbol(math, ams, rel, "\u227E", "\\precsim", true);
defineSymbol(math, ams, rel, "\u2AB7", "\\precapprox", true);
defineSymbol(math, ams, rel, "\u22B2", "\\vartriangleleft");
defineSymbol(math, ams, rel, "\u22B4", "\\trianglelefteq");
defineSymbol(math, ams, rel, "\u22A8", "\\vDash", true);
defineSymbol(math, ams, rel, "\u22AA", "\\Vvdash", true);
defineSymbol(math, ams, rel, "\u2323", "\\smallsmile");
defineSymbol(math, ams, rel, "\u2322", "\\smallfrown");
defineSymbol(math, ams, rel, "\u224F", "\\bumpeq", true);
defineSymbol(math, ams, rel, "\u224E", "\\Bumpeq", true);
defineSymbol(math, ams, rel, "\u2267", "\\geqq", true);
defineSymbol(math, ams, rel, "\u2A7E", "\\geqslant", true);
defineSymbol(math, ams, rel, "\u2A96", "\\eqslantgtr", true);
defineSymbol(math, ams, rel, "\u2273", "\\gtrsim", true);
defineSymbol(math, ams, rel, "\u2A86", "\\gtrapprox", true);
defineSymbol(math, ams, bin, "\u22D7", "\\gtrdot");
defineSymbol(math, ams, rel, "\u22D9", "\\ggg", true);
defineSymbol(math, ams, rel, "\u2277", "\\gtrless", true);
defineSymbol(math, ams, rel, "\u22DB", "\\gtreqless", true);
defineSymbol(math, ams, rel, "\u2A8C", "\\gtreqqless", true);
defineSymbol(math, ams, rel, "\u2256", "\\eqcirc", true);
defineSymbol(math, ams, rel, "\u2257", "\\circeq", true);
defineSymbol(math, ams, rel, "\u225C", "\\triangleq", true);
defineSymbol(math, ams, rel, "\u223C", "\\thicksim");
defineSymbol(math, ams, rel, "\u2248", "\\thickapprox");
defineSymbol(math, ams, rel, "\u2AC6", "\\supseteqq", true);
defineSymbol(math, ams, rel, "\u22D1", "\\Supset", true);
defineSymbol(math, ams, rel, "\u2290", "\\sqsupset", true);
defineSymbol(math, ams, rel, "\u227D", "\\succcurlyeq", true);
defineSymbol(math, ams, rel, "\u22DF", "\\curlyeqsucc", true);
defineSymbol(math, ams, rel, "\u227F", "\\succsim", true);
defineSymbol(math, ams, rel, "\u2AB8", "\\succapprox", true);
defineSymbol(math, ams, rel, "\u22B3", "\\vartriangleright");
defineSymbol(math, ams, rel, "\u22B5", "\\trianglerighteq");
defineSymbol(math, ams, rel, "\u22A9", "\\Vdash", true);
defineSymbol(math, ams, rel, "\u2223", "\\shortmid");
defineSymbol(math, ams, rel, "\u2225", "\\shortparallel");
defineSymbol(math, ams, rel, "\u226C", "\\between", true);
defineSymbol(math, ams, rel, "\u22D4", "\\pitchfork", true);
defineSymbol(math, ams, rel, "\u221D", "\\varpropto");
defineSymbol(math, ams, rel, "\u25C0", "\\blacktriangleleft");
defineSymbol(math, ams, rel, "\u2234", "\\therefore", true);
defineSymbol(math, ams, rel, "\u220D", "\\backepsilon");
defineSymbol(math, ams, rel, "\u25B6", "\\blacktriangleright");
defineSymbol(math, ams, rel, "\u2235", "\\because", true);
defineSymbol(math, ams, rel, "\u22D8", "\\llless");
defineSymbol(math, ams, rel, "\u22D9", "\\gggtr");
defineSymbol(math, ams, bin, "\u22B2", "\\lhd");
defineSymbol(math, ams, bin, "\u22B3", "\\rhd");
defineSymbol(math, ams, rel, "\u2242", "\\eqsim", true);
defineSymbol(math, main, rel, "\u22C8", "\\Join");
defineSymbol(math, ams, rel, "\u2251", "\\Doteq", true);
defineSymbol(math, ams, bin, "\u2214", "\\dotplus", true);
defineSymbol(math, ams, bin, "\u2216", "\\smallsetminus");
defineSymbol(math, ams, bin, "\u22D2", "\\Cap", true);
defineSymbol(math, ams, bin, "\u22D3", "\\Cup", true);
defineSymbol(math, ams, bin, "\u2A5E", "\\doublebarwedge", true);
defineSymbol(math, ams, bin, "\u229F", "\\boxminus", true);
defineSymbol(math, ams, bin, "\u229E", "\\boxplus", true);
defineSymbol(math, ams, bin, "\u22C7", "\\divideontimes", true);
defineSymbol(math, ams, bin, "\u22C9", "\\ltimes", true);
defineSymbol(math, ams, bin, "\u22CA", "\\rtimes", true);
defineSymbol(math, ams, bin, "\u22CB", "\\leftthreetimes", true);
defineSymbol(math, ams, bin, "\u22CC", "\\rightthreetimes", true);
defineSymbol(math, ams, bin, "\u22CF", "\\curlywedge", true);
defineSymbol(math, ams, bin, "\u22CE", "\\curlyvee", true);
defineSymbol(math, ams, bin, "\u229D", "\\circleddash", true);
defineSymbol(math, ams, bin, "\u229B", "\\circledast", true);
defineSymbol(math, ams, bin, "\u22C5", "\\centerdot");
defineSymbol(math, ams, bin, "\u22BA", "\\intercal", true);
defineSymbol(math, ams, bin, "\u22D2", "\\doublecap");
defineSymbol(math, ams, bin, "\u22D3", "\\doublecup");
defineSymbol(math, ams, bin, "\u22A0", "\\boxtimes", true);
defineSymbol(math, ams, rel, "\u21E2", "\\dashrightarrow", true);
defineSymbol(math, ams, rel, "\u21E0", "\\dashleftarrow", true);
defineSymbol(math, ams, rel, "\u21C7", "\\leftleftarrows", true);
defineSymbol(math, ams, rel, "\u21C6", "\\leftrightarrows", true);
defineSymbol(math, ams, rel, "\u21DA", "\\Lleftarrow", true);
defineSymbol(math, ams, rel, "\u219E", "\\twoheadleftarrow", true);
defineSymbol(math, ams, rel, "\u21A2", "\\leftarrowtail", true);
defineSymbol(math, ams, rel, "\u21AB", "\\looparrowleft", true);
defineSymbol(math, ams, rel, "\u21CB", "\\leftrightharpoons", true);
defineSymbol(math, ams, rel, "\u21B6", "\\curvearrowleft", true);
defineSymbol(math, ams, rel, "\u21BA", "\\circlearrowleft", true);
defineSymbol(math, ams, rel, "\u21B0", "\\Lsh", true);
defineSymbol(math, ams, rel, "\u21C8", "\\upuparrows", true);
defineSymbol(math, ams, rel, "\u21BF", "\\upharpoonleft", true);
defineSymbol(math, ams, rel, "\u21C3", "\\downharpoonleft", true);
defineSymbol(math, main, rel, "\u22B6", "\\origof", true);
defineSymbol(math, main, rel, "\u22B7", "\\imageof", true);
defineSymbol(math, ams, rel, "\u22B8", "\\multimap", true);
defineSymbol(math, ams, rel, "\u21AD", "\\leftrightsquigarrow", true);
defineSymbol(math, ams, rel, "\u21C9", "\\rightrightarrows", true);
defineSymbol(math, ams, rel, "\u21C4", "\\rightleftarrows", true);
defineSymbol(math, ams, rel, "\u21A0", "\\twoheadrightarrow", true);
defineSymbol(math, ams, rel, "\u21A3", "\\rightarrowtail", true);
defineSymbol(math, ams, rel, "\u21AC", "\\looparrowright", true);
defineSymbol(math, ams, rel, "\u21B7", "\\curvearrowright", true);
defineSymbol(math, ams, rel, "\u21BB", "\\circlearrowright", true);
defineSymbol(math, ams, rel, "\u21B1", "\\Rsh", true);
defineSymbol(math, ams, rel, "\u21CA", "\\downdownarrows", true);
defineSymbol(math, ams, rel, "\u21BE", "\\upharpoonright", true);
defineSymbol(math, ams, rel, "\u21C2", "\\downharpoonright", true);
defineSymbol(math, ams, rel, "\u21DD", "\\rightsquigarrow", true);
defineSymbol(math, ams, rel, "\u21DD", "\\leadsto");
defineSymbol(math, ams, rel, "\u21DB", "\\Rrightarrow", true);
defineSymbol(math, ams, rel, "\u21BE", "\\restriction");
defineSymbol(math, main, textord, "\u2018", "`");
defineSymbol(math, main, textord, "$", "\\$");
defineSymbol(text, main, textord, "$", "\\$");
defineSymbol(text, main, textord, "$", "\\textdollar");
defineSymbol(math, main, textord, "%", "\\%");
defineSymbol(text, main, textord, "%", "\\%");
defineSymbol(math, main, textord, "_", "\\_");
defineSymbol(text, main, textord, "_", "\\_");
defineSymbol(text, main, textord, "_", "\\textunderscore");
defineSymbol(math, main, textord, "\u2220", "\\angle", true);
defineSymbol(math, main, textord, "\u221E", "\\infty", true);
defineSymbol(math, main, textord, "\u2032", "\\prime");
defineSymbol(math, main, textord, "\u25B3", "\\triangle");
defineSymbol(math, main, textord, "\u0393", "\\Gamma", true);
defineSymbol(math, main, textord, "\u0394", "\\Delta", true);
defineSymbol(math, main, textord, "\u0398", "\\Theta", true);
defineSymbol(math, main, textord, "\u039B", "\\Lambda", true);
defineSymbol(math, main, textord, "\u039E", "\\Xi", true);
defineSymbol(math, main, textord, "\u03A0", "\\Pi", true);
defineSymbol(math, main, textord, "\u03A3", "\\Sigma", true);
defineSymbol(math, main, textord, "\u03A5", "\\Upsilon", true);
defineSymbol(math, main, textord, "\u03A6", "\\Phi", true);
defineSymbol(math, main, textord, "\u03A8", "\\Psi", true);
defineSymbol(math, main, textord, "\u03A9", "\\Omega", true);
defineSymbol(math, main, textord, "A", "\u0391");
defineSymbol(math, main, textord, "B", "\u0392");
defineSymbol(math, main, textord, "E", "\u0395");
defineSymbol(math, main, textord, "Z", "\u0396");
defineSymbol(math, main, textord, "H", "\u0397");
defineSymbol(math, main, textord, "I", "\u0399");
defineSymbol(math, main, textord, "K", "\u039A");
defineSymbol(math, main, textord, "M", "\u039C");
defineSymbol(math, main, textord, "N", "\u039D");
defineSymbol(math, main, textord, "O", "\u039F");
defineSymbol(math, main, textord, "P", "\u03A1");
defineSymbol(math, main, textord, "T", "\u03A4");
defineSymbol(math, main, textord, "X", "\u03A7");
defineSymbol(math, main, textord, "\xAC", "\\neg", true);
defineSymbol(math, main, textord, "\xAC", "\\lnot");
defineSymbol(math, main, textord, "\u22A4", "\\top");
defineSymbol(math, main, textord, "\u22A5", "\\bot");
defineSymbol(math, main, textord, "\u2205", "\\emptyset");
defineSymbol(math, ams, textord, "\u2205", "\\varnothing");
defineSymbol(math, main, mathord, "\u03B1", "\\alpha", true);
defineSymbol(math, main, mathord, "\u03B2", "\\beta", true);
defineSymbol(math, main, mathord, "\u03B3", "\\gamma", true);
defineSymbol(math, main, mathord, "\u03B4", "\\delta", true);
defineSymbol(math, main, mathord, "\u03F5", "\\epsilon", true);
defineSymbol(math, main, mathord, "\u03B6", "\\zeta", true);
defineSymbol(math, main, mathord, "\u03B7", "\\eta", true);
defineSymbol(math, main, mathord, "\u03B8", "\\theta", true);
defineSymbol(math, main, mathord, "\u03B9", "\\iota", true);
defineSymbol(math, main, mathord, "\u03BA", "\\kappa", true);
defineSymbol(math, main, mathord, "\u03BB", "\\lambda", true);
defineSymbol(math, main, mathord, "\u03BC", "\\mu", true);
defineSymbol(math, main, mathord, "\u03BD", "\\nu", true);
defineSymbol(math, main, mathord, "\u03BE", "\\xi", true);
defineSymbol(math, main, mathord, "\u03BF", "\\omicron", true);
defineSymbol(math, main, mathord, "\u03C0", "\\pi", true);
defineSymbol(math, main, mathord, "\u03C1", "\\rho", true);
defineSymbol(math, main, mathord, "\u03C3", "\\sigma", true);
defineSymbol(math, main, mathord, "\u03C4", "\\tau", true);
defineSymbol(math, main, mathord, "\u03C5", "\\upsilon", true);
defineSymbol(math, main, mathord, "\u03D5", "\\phi", true);
defineSymbol(math, main, mathord, "\u03C7", "\\chi", true);
defineSymbol(math, main, mathord, "\u03C8", "\\psi", true);
defineSymbol(math, main, mathord, "\u03C9", "\\omega", true);
defineSymbol(math, main, mathord, "\u03B5", "\\varepsilon", true);
defineSymbol(math, main, mathord, "\u03D1", "\\vartheta", true);
defineSymbol(math, main, mathord, "\u03D6", "\\varpi", true);
defineSymbol(math, main, mathord, "\u03F1", "\\varrho", true);
defineSymbol(math, main, mathord, "\u03C2", "\\varsigma", true);
defineSymbol(math, main, mathord, "\u03C6", "\\varphi", true);
defineSymbol(math, main, bin, "\u2217", "*", true);
defineSymbol(math, main, bin, "+", "+");
defineSymbol(math, main, bin, "\u2212", "-", true);
defineSymbol(math, main, bin, "\u22C5", "\\cdot", true);
defineSymbol(math, main, bin, "\u2218", "\\circ", true);
defineSymbol(math, main, bin, "\xF7", "\\div", true);
defineSymbol(math, main, bin, "\xB1", "\\pm", true);
defineSymbol(math, main, bin, "\xD7", "\\times", true);
defineSymbol(math, main, bin, "\u2229", "\\cap", true);
defineSymbol(math, main, bin, "\u222A", "\\cup", true);
defineSymbol(math, main, bin, "\u2216", "\\setminus", true);
defineSymbol(math, main, bin, "\u2227", "\\land");
defineSymbol(math, main, bin, "\u2228", "\\lor");
defineSymbol(math, main, bin, "\u2227", "\\wedge", true);
defineSymbol(math, main, bin, "\u2228", "\\vee", true);
defineSymbol(math, main, textord, "\u221A", "\\surd");
defineSymbol(math, main, open, "\u27E8", "\\langle", true);
defineSymbol(math, main, open, "\u2223", "\\lvert");
defineSymbol(math, main, open, "\u2225", "\\lVert");
defineSymbol(math, main, close, "?", "?");
defineSymbol(math, main, close, "!", "!");
defineSymbol(math, main, close, "\u27E9", "\\rangle", true);
defineSymbol(math, main, close, "\u2223", "\\rvert");
defineSymbol(math, main, close, "\u2225", "\\rVert");
defineSymbol(math, main, rel, "=", "=");
defineSymbol(math, main, rel, ":", ":");
defineSymbol(math, main, rel, "\u2248", "\\approx", true);
defineSymbol(math, main, rel, "\u2245", "\\cong", true);
defineSymbol(math, main, rel, "\u2265", "\\ge");
defineSymbol(math, main, rel, "\u2265", "\\geq", true);
defineSymbol(math, main, rel, "\u2190", "\\gets");
defineSymbol(math, main, rel, ">", "\\gt", true);
defineSymbol(math, main, rel, "\u2208", "\\in", true);
defineSymbol(math, main, rel, "\uE020", "\\@not");
defineSymbol(math, main, rel, "\u2282", "\\subset", true);
defineSymbol(math, main, rel, "\u2283", "\\supset", true);
defineSymbol(math, main, rel, "\u2286", "\\subseteq", true);
defineSymbol(math, main, rel, "\u2287", "\\supseteq", true);
defineSymbol(math, ams, rel, "\u2288", "\\nsubseteq", true);
defineSymbol(math, ams, rel, "\u2289", "\\nsupseteq", true);
defineSymbol(math, main, rel, "\u22A8", "\\models");
defineSymbol(math, main, rel, "\u2190", "\\leftarrow", true);
defineSymbol(math, main, rel, "\u2264", "\\le");
defineSymbol(math, main, rel, "\u2264", "\\leq", true);
defineSymbol(math, main, rel, "<", "\\lt", true);
defineSymbol(math, main, rel, "\u2192", "\\rightarrow", true);
defineSymbol(math, main, rel, "\u2192", "\\to");
defineSymbol(math, ams, rel, "\u2271", "\\ngeq", true);
defineSymbol(math, ams, rel, "\u2270", "\\nleq", true);
defineSymbol(math, main, spacing, "\xA0", "\\ ");
defineSymbol(math, main, spacing, "\xA0", "\\space");
defineSymbol(math, main, spacing, "\xA0", "\\nobreakspace");
defineSymbol(text, main, spacing, "\xA0", "\\ ");
defineSymbol(text, main, spacing, "\xA0", " ");
defineSymbol(text, main, spacing, "\xA0", "\\space");
defineSymbol(text, main, spacing, "\xA0", "\\nobreakspace");
defineSymbol(math, main, spacing, null, "\\nobreak");
defineSymbol(math, main, spacing, null, "\\allowbreak");
defineSymbol(math, main, punct, ",", ",");
defineSymbol(math, main, punct, ";", ";");
defineSymbol(math, ams, bin, "\u22BC", "\\barwedge", true);
defineSymbol(math, ams, bin, "\u22BB", "\\veebar", true);
defineSymbol(math, main, bin, "\u2299", "\\odot", true);
defineSymbol(math, main, bin, "\u2295", "\\oplus", true);
defineSymbol(math, main, bin, "\u2297", "\\otimes", true);
defineSymbol(math, main, textord, "\u2202", "\\partial", true);
defineSymbol(math, main, bin, "\u2298", "\\oslash", true);
defineSymbol(math, ams, bin, "\u229A", "\\circledcirc", true);
defineSymbol(math, ams, bin, "\u22A1", "\\boxdot", true);
defineSymbol(math, main, bin, "\u25B3", "\\bigtriangleup");
defineSymbol(math, main, bin, "\u25BD", "\\bigtriangledown");
defineSymbol(math, main, bin, "\u2020", "\\dagger");
defineSymbol(math, main, bin, "\u22C4", "\\diamond");
defineSymbol(math, main, bin, "\u22C6", "\\star");
defineSymbol(math, main, bin, "\u25C3", "\\triangleleft");
defineSymbol(math, main, bin, "\u25B9", "\\triangleright");
defineSymbol(math, main, open, "{", "\\{");
defineSymbol(text, main, textord, "{", "\\{");
defineSymbol(text, main, textord, "{", "\\textbraceleft");
defineSymbol(math, main, close, "}", "\\}");
defineSymbol(text, main, textord, "}", "\\}");
defineSymbol(text, main, textord, "}", "\\textbraceright");
defineSymbol(math, main, open, "{", "\\lbrace");
defineSymbol(math, main, close, "}", "\\rbrace");
defineSymbol(math, main, open, "[", "\\lbrack", true);
defineSymbol(text, main, textord, "[", "\\lbrack", true);
defineSymbol(math, main, close, "]", "\\rbrack", true);
defineSymbol(text, main, textord, "]", "\\rbrack", true);
defineSymbol(math, main, open, "(", "\\lparen", true);
defineSymbol(math, main, close, ")", "\\rparen", true);
defineSymbol(text, main, textord, "<", "\\textless", true);
defineSymbol(text, main, textord, ">", "\\textgreater", true);
defineSymbol(math, main, open, "\u230A", "\\lfloor", true);
defineSymbol(math, main, close, "\u230B", "\\rfloor", true);
defineSymbol(math, main, open, "\u2308", "\\lceil", true);
defineSymbol(math, main, close, "\u2309", "\\rceil", true);
defineSymbol(math, main, textord, "\\", "\\backslash");
defineSymbol(math, main, textord, "\u2223", "|");
defineSymbol(math, main, textord, "\u2223", "\\vert");
defineSymbol(text, main, textord, "|", "\\textbar", true);
defineSymbol(math, main, textord, "\u2225", "\\|");
defineSymbol(math, main, textord, "\u2225", "\\Vert");
defineSymbol(text, main, textord, "\u2225", "\\textbardbl");
defineSymbol(text, main, textord, "~", "\\textasciitilde");
defineSymbol(text, main, textord, "\\", "\\textbackslash");
defineSymbol(text, main, textord, "^", "\\textasciicircum");
defineSymbol(math, main, rel, "\u2191", "\\uparrow", true);
defineSymbol(math, main, rel, "\u21D1", "\\Uparrow", true);
defineSymbol(math, main, rel, "\u2193", "\\downarrow", true);
defineSymbol(math, main, rel, "\u21D3", "\\Downarrow", true);
defineSymbol(math, main, rel, "\u2195", "\\updownarrow", true);
defineSymbol(math, main, rel, "\u21D5", "\\Updownarrow", true);
defineSymbol(math, main, op, "\u2210", "\\coprod");
defineSymbol(math, main, op, "\u22C1", "\\bigvee");
defineSymbol(math, main, op, "\u22C0", "\\bigwedge");
defineSymbol(math, main, op, "\u2A04", "\\biguplus");
defineSymbol(math, main, op, "\u22C2", "\\bigcap");
defineSymbol(math, main, op, "\u22C3", "\\bigcup");
defineSymbol(math, main, op, "\u222B", "\\int");
defineSymbol(math, main, op, "\u222B", "\\intop");
defineSymbol(math, main, op, "\u222C", "\\iint");
defineSymbol(math, main, op, "\u222D", "\\iiint");
defineSymbol(math, main, op, "\u220F", "\\prod");
defineSymbol(math, main, op, "\u2211", "\\sum");
defineSymbol(math, main, op, "\u2A02", "\\bigotimes");
defineSymbol(math, main, op, "\u2A01", "\\bigoplus");
defineSymbol(math, main, op, "\u2A00", "\\bigodot");
defineSymbol(math, main, op, "\u222E", "\\oint");
defineSymbol(math, main, op, "\u222F", "\\oiint");
defineSymbol(math, main, op, "\u2230", "\\oiiint");
defineSymbol(math, main, op, "\u2A06", "\\bigsqcup");
defineSymbol(math, main, op, "\u222B", "\\smallint");
defineSymbol(text, main, inner, "\u2026", "\\textellipsis");
defineSymbol(math, main, inner, "\u2026", "\\mathellipsis");
defineSymbol(text, main, inner, "\u2026", "\\ldots", true);
defineSymbol(math, main, inner, "\u2026", "\\ldots", true);
defineSymbol(math, main, inner, "\u22EF", "\\@cdots", true);
defineSymbol(math, main, inner, "\u22F1", "\\ddots", true);
defineSymbol(math, main, textord, "\u22EE", "\\varvdots");
defineSymbol(text, main, textord, "\u22EE", "\\varvdots");
defineSymbol(math, main, accent, "\u02CA", "\\acute");
defineSymbol(math, main, accent, "\u02CB", "\\grave");
defineSymbol(math, main, accent, "\xA8", "\\ddot");
defineSymbol(math, main, accent, "~", "\\tilde");
defineSymbol(math, main, accent, "\u02C9", "\\bar");
defineSymbol(math, main, accent, "\u02D8", "\\breve");
defineSymbol(math, main, accent, "\u02C7", "\\check");
defineSymbol(math, main, accent, "^", "\\hat");
defineSymbol(math, main, accent, "\u20D7", "\\vec");
defineSymbol(math, main, accent, "\u02D9", "\\dot");
defineSymbol(math, main, accent, "\u02DA", "\\mathring");
defineSymbol(math, main, mathord, "\uE131", "\\@imath");
defineSymbol(math, main, mathord, "\uE237", "\\@jmath");
defineSymbol(math, main, textord, "\u0131", "\u0131");
defineSymbol(math, main, textord, "\u0237", "\u0237");
defineSymbol(text, main, textord, "\u0131", "\\i", true);
defineSymbol(text, main, textord, "\u0237", "\\j", true);
defineSymbol(text, main, textord, "\xDF", "\\ss", true);
defineSymbol(text, main, textord, "\xE6", "\\ae", true);
defineSymbol(text, main, textord, "\u0153", "\\oe", true);
defineSymbol(text, main, textord, "\xF8", "\\o", true);
defineSymbol(text, main, textord, "\xC6", "\\AE", true);
defineSymbol(text, main, textord, "\u0152", "\\OE", true);
defineSymbol(text, main, textord, "\xD8", "\\O", true);
defineSymbol(text, main, accent, "\u02CA", "\\'");
defineSymbol(text, main, accent, "\u02CB", "\\`");
defineSymbol(text, main, accent, "\u02C6", "\\^");
defineSymbol(text, main, accent, "\u02DC", "\\~");
defineSymbol(text, main, accent, "\u02C9", "\\=");
defineSymbol(text, main, accent, "\u02D8", "\\u");
defineSymbol(text, main, accent, "\u02D9", "\\.");
defineSymbol(text, main, accent, "\xB8", "\\c");
defineSymbol(text, main, accent, "\u02DA", "\\r");
defineSymbol(text, main, accent, "\u02C7", "\\v");
defineSymbol(text, main, accent, "\xA8", '\\"');
defineSymbol(text, main, accent, "\u02DD", "\\H");
defineSymbol(text, main, accent, "\u25EF", "\\textcircled");
var ligatures = {
  "--": true,
  "---": true,
  "``": true,
  "''": true
};
defineSymbol(text, main, textord, "\u2013", "--", true);
defineSymbol(text, main, textord, "\u2013", "\\textendash");
defineSymbol(text, main, textord, "\u2014", "---", true);
defineSymbol(text, main, textord, "\u2014", "\\textemdash");
defineSymbol(text, main, textord, "\u2018", "`", true);
defineSymbol(text, main, textord, "\u2018", "\\textquoteleft");
defineSymbol(text, main, textord, "\u2019", "'", true);
defineSymbol(text, main, textord, "\u2019", "\\textquoteright");
defineSymbol(text, main, textord, "\u201C", "``", true);
defineSymbol(text, main, textord, "\u201C", "\\textquotedblleft");
defineSymbol(text, main, textord, "\u201D", "''", true);
defineSymbol(text, main, textord, "\u201D", "\\textquotedblright");
defineSymbol(math, main, textord, "\xB0", "\\degree", true);
defineSymbol(text, main, textord, "\xB0", "\\degree");
defineSymbol(text, main, textord, "\xB0", "\\textdegree", true);
defineSymbol(math, main, textord, "\xA3", "\\pounds");
defineSymbol(math, main, textord, "\xA3", "\\mathsterling", true);
defineSymbol(text, main, textord, "\xA3", "\\pounds");
defineSymbol(text, main, textord, "\xA3", "\\textsterling", true);
defineSymbol(math, ams, textord, "\u2720", "\\maltese");
defineSymbol(text, ams, textord, "\u2720", "\\maltese");
var mathTextSymbols = '0123456789/@."';
for (i = 0; i < mathTextSymbols.length; i++) {
  ch = mathTextSymbols.charAt(i);
  defineSymbol(math, main, textord, ch, ch);
}
var ch;
var i;
var textSymbols = '0123456789!@*()-=+";:?/.,';
for (_i = 0; _i < textSymbols.length; _i++) {
  _ch = textSymbols.charAt(_i);
  defineSymbol(text, main, textord, _ch, _ch);
}
var _ch;
var _i;
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
for (_i2 = 0; _i2 < letters.length; _i2++) {
  _ch2 = letters.charAt(_i2);
  defineSymbol(math, main, mathord, _ch2, _ch2);
  defineSymbol(text, main, textord, _ch2, _ch2);
}
var _ch2;
var _i2;
defineSymbol(math, ams, textord, "C", "\u2102");
defineSymbol(text, ams, textord, "C", "\u2102");
defineSymbol(math, ams, textord, "H", "\u210D");
defineSymbol(text, ams, textord, "H", "\u210D");
defineSymbol(math, ams, textord, "N", "\u2115");
defineSymbol(text, ams, textord, "N", "\u2115");
defineSymbol(math, ams, textord, "P", "\u2119");
defineSymbol(text, ams, textord, "P", "\u2119");
defineSymbol(math, ams, textord, "Q", "\u211A");
defineSymbol(text, ams, textord, "Q", "\u211A");
defineSymbol(math, ams, textord, "R", "\u211D");
defineSymbol(text, ams, textord, "R", "\u211D");
defineSymbol(math, ams, textord, "Z", "\u2124");
defineSymbol(text, ams, textord, "Z", "\u2124");
defineSymbol(math, main, mathord, "h", "\u210E");
defineSymbol(text, main, mathord, "h", "\u210E");
var wideChar = "";
for (_i3 = 0; _i3 < letters.length; _i3++) {
  _ch3 = letters.charAt(_i3);
  wideChar = String.fromCharCode(55349, 56320 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56372 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56424 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56580 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56684 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56736 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56788 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56840 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  wideChar = String.fromCharCode(55349, 56944 + _i3);
  defineSymbol(math, main, mathord, _ch3, wideChar);
  defineSymbol(text, main, textord, _ch3, wideChar);
  if (_i3 < 26) {
    wideChar = String.fromCharCode(55349, 56632 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text, main, textord, _ch3, wideChar);
    wideChar = String.fromCharCode(55349, 56476 + _i3);
    defineSymbol(math, main, mathord, _ch3, wideChar);
    defineSymbol(text, main, textord, _ch3, wideChar);
  }
}
var _ch3;
var _i3;
wideChar = String.fromCharCode(55349, 56668);
defineSymbol(math, main, mathord, "k", wideChar);
defineSymbol(text, main, textord, "k", wideChar);
for (_i4 = 0; _i4 < 10; _i4++) {
  _ch4 = _i4.toString();
  wideChar = String.fromCharCode(55349, 57294 + _i4);
  defineSymbol(math, main, mathord, _ch4, wideChar);
  defineSymbol(text, main, textord, _ch4, wideChar);
  wideChar = String.fromCharCode(55349, 57314 + _i4);
  defineSymbol(math, main, mathord, _ch4, wideChar);
  defineSymbol(text, main, textord, _ch4, wideChar);
  wideChar = String.fromCharCode(55349, 57324 + _i4);
  defineSymbol(math, main, mathord, _ch4, wideChar);
  defineSymbol(text, main, textord, _ch4, wideChar);
  wideChar = String.fromCharCode(55349, 57334 + _i4);
  defineSymbol(math, main, mathord, _ch4, wideChar);
  defineSymbol(text, main, textord, _ch4, wideChar);
}
var _ch4;
var _i4;
var extraLatin = "\xD0\xDE\xFE";
for (_i5 = 0; _i5 < extraLatin.length; _i5++) {
  _ch5 = extraLatin.charAt(_i5);
  defineSymbol(math, main, mathord, _ch5, _ch5);
  defineSymbol(text, main, textord, _ch5, _ch5);
}
var _ch5;
var _i5;
var wideLatinLetterData = [
  ["mathbf", "textbf", "Main-Bold"],
  // A-Z bold upright
  ["mathbf", "textbf", "Main-Bold"],
  // a-z bold upright
  ["mathnormal", "textit", "Math-Italic"],
  // A-Z italic
  ["mathnormal", "textit", "Math-Italic"],
  // a-z italic
  ["boldsymbol", "boldsymbol", "Main-BoldItalic"],
  // A-Z bold italic
  ["boldsymbol", "boldsymbol", "Main-BoldItalic"],
  // a-z bold italic
  // Map fancy A-Z letters to script, not calligraphic.
  // This aligns with unicode-math and math fonts (except Cambria Math).
  ["mathscr", "textscr", "Script-Regular"],
  // A-Z script
  ["", "", ""],
  // a-z script.  No font
  ["", "", ""],
  // A-Z bold script. No font
  ["", "", ""],
  // a-z bold script. No font
  ["mathfrak", "textfrak", "Fraktur-Regular"],
  // A-Z Fraktur
  ["mathfrak", "textfrak", "Fraktur-Regular"],
  // a-z Fraktur
  ["mathbb", "textbb", "AMS-Regular"],
  // A-Z double-struck
  ["mathbb", "textbb", "AMS-Regular"],
  // k double-struck
  // Note that we are using a bold font, but font metrics for regular Fraktur.
  ["mathboldfrak", "textboldfrak", "Fraktur-Regular"],
  // A-Z bold Fraktur
  ["mathboldfrak", "textboldfrak", "Fraktur-Regular"],
  // a-z bold Fraktur
  ["mathsf", "textsf", "SansSerif-Regular"],
  // A-Z sans-serif
  ["mathsf", "textsf", "SansSerif-Regular"],
  // a-z sans-serif
  ["mathboldsf", "textboldsf", "SansSerif-Bold"],
  // A-Z bold sans-serif
  ["mathboldsf", "textboldsf", "SansSerif-Bold"],
  // a-z bold sans-serif
  ["mathitsf", "textitsf", "SansSerif-Italic"],
  // A-Z italic sans-serif
  ["mathitsf", "textitsf", "SansSerif-Italic"],
  // a-z italic sans-serif
  ["", "", ""],
  // A-Z bold italic sans. No font
  ["", "", ""],
  // a-z bold italic sans. No font
  ["mathtt", "texttt", "Typewriter-Regular"],
  // A-Z monospace
  ["mathtt", "texttt", "Typewriter-Regular"]
  // a-z monospace
];
var wideNumeralData = [
  ["mathbf", "textbf", "Main-Bold"],
  // 0-9 bold
  ["", "", ""],
  // 0-9 double-struck. No KaTeX font.
  ["mathsf", "textsf", "SansSerif-Regular"],
  // 0-9 sans-serif
  ["mathboldsf", "textboldsf", "SansSerif-Bold"],
  // 0-9 bold sans-serif
  ["mathtt", "texttt", "Typewriter-Regular"]
  // 0-9 monospace
];
var wideCharacterFont = function wideCharacterFont2(wideChar2, mode) {
  var H = wideChar2.charCodeAt(0);
  var L = wideChar2.charCodeAt(1);
  var codePoint = (H - 55296) * 1024 + (L - 56320) + 65536;
  var j = mode === "math" ? 0 : 1;
  if (119808 <= codePoint && codePoint < 120484) {
    var i2 = Math.floor((codePoint - 119808) / 26);
    return [wideLatinLetterData[i2][2], wideLatinLetterData[i2][j]];
  } else if (120782 <= codePoint && codePoint <= 120831) {
    var _i6 = Math.floor((codePoint - 120782) / 10);
    return [wideNumeralData[_i6][2], wideNumeralData[_i6][j]];
  } else if (codePoint === 120485 || codePoint === 120486) {
    return [wideLatinLetterData[0][2], wideLatinLetterData[0][j]];
  } else if (120486 < codePoint && codePoint < 120782) {
    return ["", ""];
  } else {
    throw new ParseError("Unsupported character: " + wideChar2);
  }
};
var lookupSymbol = function lookupSymbol2(value, fontName, mode) {
  if (symbols[mode][value] && symbols[mode][value].replace) {
    value = symbols[mode][value].replace;
  }
  return {
    value,
    metrics: getCharacterMetrics(value, fontName, mode)
  };
};
var makeSymbol = function makeSymbol2(value, fontName, mode, options, classes) {
  var lookup = lookupSymbol(value, fontName, mode);
  var metrics = lookup.metrics;
  value = lookup.value;
  var symbolNode;
  if (metrics) {
    var italic = metrics.italic;
    if (mode === "text" || options && options.font === "mathit") {
      italic = 0;
    }
    symbolNode = new SymbolNode(value, metrics.height, metrics.depth, italic, metrics.skew, metrics.width, classes);
  } else {
    typeof console !== "undefined" && console.warn("No character metrics " + ("for '" + value + "' in style '" + fontName + "' and mode '" + mode + "'"));
    symbolNode = new SymbolNode(value, 0, 0, 0, 0, 0, classes);
  }
  if (options) {
    symbolNode.maxFontSize = options.sizeMultiplier;
    if (options.style.isTight()) {
      symbolNode.classes.push("mtight");
    }
    var color = options.getColor();
    if (color) {
      symbolNode.style.color = color;
    }
  }
  return symbolNode;
};
var mathsym = function mathsym2(value, mode, options, classes) {
  if (classes === void 0) {
    classes = [];
  }
  if (options.font === "boldsymbol" && lookupSymbol(value, "Main-Bold", mode).metrics) {
    return makeSymbol(value, "Main-Bold", mode, options, classes.concat(["mathbf"]));
  } else if (value === "\\" || symbols[mode][value].font === "main") {
    return makeSymbol(value, "Main-Regular", mode, options, classes);
  } else {
    return makeSymbol(value, "AMS-Regular", mode, options, classes.concat(["amsrm"]));
  }
};
var boldsymbol = function boldsymbol2(value, mode, options, classes, type) {
  if (type !== "textord" && lookupSymbol(value, "Math-BoldItalic", mode).metrics) {
    return {
      fontName: "Math-BoldItalic",
      fontClass: "boldsymbol"
    };
  } else {
    return {
      fontName: "Main-Bold",
      fontClass: "mathbf"
    };
  }
};
var makeOrd = function makeOrd2(group, options, type) {
  var mode = group.mode;
  var text2 = group.text;
  var classes = ["mord"];
  var isFont = mode === "math" || mode === "text" && options.font;
  var fontOrFamily = isFont ? options.font : options.fontFamily;
  var wideFontName = "";
  var wideFontClass = "";
  if (text2.charCodeAt(0) === 55349) {
    [wideFontName, wideFontClass] = wideCharacterFont(text2, mode);
  }
  if (wideFontName.length > 0) {
    return makeSymbol(text2, wideFontName, mode, options, classes.concat(wideFontClass));
  } else if (fontOrFamily) {
    var fontName;
    var fontClasses;
    if (fontOrFamily === "boldsymbol") {
      var fontData = boldsymbol(text2, mode, options, classes, type);
      fontName = fontData.fontName;
      fontClasses = [fontData.fontClass];
    } else if (isFont) {
      fontName = fontMap[fontOrFamily].fontName;
      fontClasses = [fontOrFamily];
    } else {
      fontName = retrieveTextFontName(fontOrFamily, options.fontWeight, options.fontShape);
      fontClasses = [fontOrFamily, options.fontWeight, options.fontShape];
    }
    if (lookupSymbol(text2, fontName, mode).metrics) {
      return makeSymbol(text2, fontName, mode, options, classes.concat(fontClasses));
    } else if (ligatures.hasOwnProperty(text2) && fontName.slice(0, 10) === "Typewriter") {
      var parts = [];
      for (var i2 = 0; i2 < text2.length; i2++) {
        parts.push(makeSymbol(text2[i2], fontName, mode, options, classes.concat(fontClasses)));
      }
      return makeFragment(parts);
    }
  }
  if (type === "mathord") {
    return makeSymbol(text2, "Math-Italic", mode, options, classes.concat(["mathnormal"]));
  } else if (type === "textord") {
    var font = symbols[mode][text2] && symbols[mode][text2].font;
    if (font === "ams") {
      var _fontName = retrieveTextFontName("amsrm", options.fontWeight, options.fontShape);
      return makeSymbol(text2, _fontName, mode, options, classes.concat("amsrm", options.fontWeight, options.fontShape));
    } else if (font === "main" || !font) {
      var _fontName2 = retrieveTextFontName("textrm", options.fontWeight, options.fontShape);
      return makeSymbol(text2, _fontName2, mode, options, classes.concat(options.fontWeight, options.fontShape));
    } else {
      var _fontName3 = retrieveTextFontName(font, options.fontWeight, options.fontShape);
      return makeSymbol(text2, _fontName3, mode, options, classes.concat(_fontName3, options.fontWeight, options.fontShape));
    }
  } else {
    throw new Error("unexpected type: " + type + " in makeOrd");
  }
};
var canCombine = (prev, next) => {
  if (createClass(prev.classes) !== createClass(next.classes) || prev.skew !== next.skew || prev.maxFontSize !== next.maxFontSize) {
    return false;
  }
  if (prev.classes.length === 1) {
    var cls = prev.classes[0];
    if (cls === "mbin" || cls === "mord") {
      return false;
    }
  }
  for (var style in prev.style) {
    if (prev.style.hasOwnProperty(style) && prev.style[style] !== next.style[style]) {
      return false;
    }
  }
  for (var _style in next.style) {
    if (next.style.hasOwnProperty(_style) && prev.style[_style] !== next.style[_style]) {
      return false;
    }
  }
  return true;
};
var tryCombineChars = (chars) => {
  for (var i2 = 0; i2 < chars.length - 1; i2++) {
    var prev = chars[i2];
    var next = chars[i2 + 1];
    if (prev instanceof SymbolNode && next instanceof SymbolNode && canCombine(prev, next)) {
      prev.text += next.text;
      prev.height = Math.max(prev.height, next.height);
      prev.depth = Math.max(prev.depth, next.depth);
      prev.italic = next.italic;
      chars.splice(i2 + 1, 1);
      i2--;
    }
  }
  return chars;
};
var sizeElementFromChildren = function sizeElementFromChildren2(elem) {
  var height = 0;
  var depth = 0;
  var maxFontSize = 0;
  for (var i2 = 0; i2 < elem.children.length; i2++) {
    var child = elem.children[i2];
    if (child.height > height) {
      height = child.height;
    }
    if (child.depth > depth) {
      depth = child.depth;
    }
    if (child.maxFontSize > maxFontSize) {
      maxFontSize = child.maxFontSize;
    }
  }
  elem.height = height;
  elem.depth = depth;
  elem.maxFontSize = maxFontSize;
};
var makeSpan$2 = function makeSpan(classes, children, options, style) {
  var span = new Span(classes, children, options, style);
  sizeElementFromChildren(span);
  return span;
};
var makeSvgSpan = (classes, children, options, style) => new Span(classes, children, options, style);
var makeLineSpan = function makeLineSpan2(className, options, thickness) {
  var line = makeSpan$2([className], [], options);
  line.height = Math.max(thickness || options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
  line.style.borderBottomWidth = makeEm(line.height);
  line.maxFontSize = 1;
  return line;
};
var makeAnchor = function makeAnchor2(href, classes, children, options) {
  var anchor = new Anchor(href, classes, children, options);
  sizeElementFromChildren(anchor);
  return anchor;
};
var makeFragment = function makeFragment2(children) {
  var fragment = new DocumentFragment(children);
  sizeElementFromChildren(fragment);
  return fragment;
};
var wrapFragment = function wrapFragment2(group, options) {
  if (group instanceof DocumentFragment) {
    return makeSpan$2([], [group], options);
  }
  return group;
};
var getVListChildrenAndDepth = function getVListChildrenAndDepth2(params) {
  if (params.positionType === "individualShift") {
    var oldChildren = params.children;
    var children = [oldChildren[0]];
    var _depth = -oldChildren[0].shift - oldChildren[0].elem.depth;
    var currPos = _depth;
    for (var i2 = 1; i2 < oldChildren.length; i2++) {
      var diff = -oldChildren[i2].shift - currPos - oldChildren[i2].elem.depth;
      var size = diff - (oldChildren[i2 - 1].elem.height + oldChildren[i2 - 1].elem.depth);
      currPos = currPos + diff;
      children.push({
        type: "kern",
        size
      });
      children.push(oldChildren[i2]);
    }
    return {
      children,
      depth: _depth
    };
  }
  var depth;
  if (params.positionType === "top") {
    var bottom = params.positionData;
    for (var _i6 = 0; _i6 < params.children.length; _i6++) {
      var child = params.children[_i6];
      bottom -= child.type === "kern" ? child.size : child.elem.height + child.elem.depth;
    }
    depth = bottom;
  } else if (params.positionType === "bottom") {
    depth = -params.positionData;
  } else {
    var firstChild = params.children[0];
    if (firstChild.type !== "elem") {
      throw new Error('First child must have type "elem".');
    }
    if (params.positionType === "shift") {
      depth = -firstChild.elem.depth - params.positionData;
    } else if (params.positionType === "firstBaseline") {
      depth = -firstChild.elem.depth;
    } else {
      throw new Error("Invalid positionType " + params.positionType + ".");
    }
  }
  return {
    children: params.children,
    depth
  };
};
var makeVList = function makeVList2(params, options) {
  var {
    children,
    depth
  } = getVListChildrenAndDepth(params);
  var pstrutSize = 0;
  for (var i2 = 0; i2 < children.length; i2++) {
    var child = children[i2];
    if (child.type === "elem") {
      var elem = child.elem;
      pstrutSize = Math.max(pstrutSize, elem.maxFontSize, elem.height);
    }
  }
  pstrutSize += 2;
  var pstrut = makeSpan$2(["pstrut"], []);
  pstrut.style.height = makeEm(pstrutSize);
  var realChildren = [];
  var minPos = depth;
  var maxPos = depth;
  var currPos = depth;
  for (var _i22 = 0; _i22 < children.length; _i22++) {
    var _child = children[_i22];
    if (_child.type === "kern") {
      currPos += _child.size;
    } else {
      var _elem = _child.elem;
      var classes = _child.wrapperClasses || [];
      var style = _child.wrapperStyle || {};
      var childWrap = makeSpan$2(classes, [pstrut, _elem], void 0, style);
      childWrap.style.top = makeEm(-pstrutSize - currPos - _elem.depth);
      if (_child.marginLeft) {
        childWrap.style.marginLeft = _child.marginLeft;
      }
      if (_child.marginRight) {
        childWrap.style.marginRight = _child.marginRight;
      }
      realChildren.push(childWrap);
      currPos += _elem.height + _elem.depth;
    }
    minPos = Math.min(minPos, currPos);
    maxPos = Math.max(maxPos, currPos);
  }
  var vlist = makeSpan$2(["vlist"], realChildren);
  vlist.style.height = makeEm(maxPos);
  var rows;
  if (minPos < 0) {
    var emptySpan = makeSpan$2([], []);
    var depthStrut = makeSpan$2(["vlist"], [emptySpan]);
    depthStrut.style.height = makeEm(-minPos);
    var topStrut = makeSpan$2(["vlist-s"], [new SymbolNode("\u200B")]);
    rows = [makeSpan$2(["vlist-r"], [vlist, topStrut]), makeSpan$2(["vlist-r"], [depthStrut])];
  } else {
    rows = [makeSpan$2(["vlist-r"], [vlist])];
  }
  var vtable = makeSpan$2(["vlist-t"], rows);
  if (rows.length === 2) {
    vtable.classes.push("vlist-t2");
  }
  vtable.height = maxPos;
  vtable.depth = -minPos;
  return vtable;
};
var makeGlue = (measurement, options) => {
  var rule = makeSpan$2(["mspace"], [], options);
  var size = calculateSize(measurement, options);
  rule.style.marginRight = makeEm(size);
  return rule;
};
var retrieveTextFontName = function retrieveTextFontName2(fontFamily, fontWeight, fontShape) {
  var baseFontName = "";
  switch (fontFamily) {
    case "amsrm":
      baseFontName = "AMS";
      break;
    case "textrm":
      baseFontName = "Main";
      break;
    case "textsf":
      baseFontName = "SansSerif";
      break;
    case "texttt":
      baseFontName = "Typewriter";
      break;
    default:
      baseFontName = fontFamily;
  }
  var fontStylesName;
  if (fontWeight === "textbf" && fontShape === "textit") {
    fontStylesName = "BoldItalic";
  } else if (fontWeight === "textbf") {
    fontStylesName = "Bold";
  } else if (fontWeight === "textit") {
    fontStylesName = "Italic";
  } else {
    fontStylesName = "Regular";
  }
  return baseFontName + "-" + fontStylesName;
};
var fontMap = {
  // styles
  "mathbf": {
    variant: "bold",
    fontName: "Main-Bold"
  },
  "mathrm": {
    variant: "normal",
    fontName: "Main-Regular"
  },
  "textit": {
    variant: "italic",
    fontName: "Main-Italic"
  },
  "mathit": {
    variant: "italic",
    fontName: "Main-Italic"
  },
  "mathnormal": {
    variant: "italic",
    fontName: "Math-Italic"
  },
  "mathsfit": {
    variant: "sans-serif-italic",
    fontName: "SansSerif-Italic"
  },
  // "boldsymbol" is missing because they require the use of multiple fonts:
  // Math-BoldItalic and Main-Bold.  This is handled by a special case in
  // makeOrd which ends up calling boldsymbol.
  // families
  "mathbb": {
    variant: "double-struck",
    fontName: "AMS-Regular"
  },
  "mathcal": {
    variant: "script",
    fontName: "Caligraphic-Regular"
  },
  "mathfrak": {
    variant: "fraktur",
    fontName: "Fraktur-Regular"
  },
  "mathscr": {
    variant: "script",
    fontName: "Script-Regular"
  },
  "mathsf": {
    variant: "sans-serif",
    fontName: "SansSerif-Regular"
  },
  "mathtt": {
    variant: "monospace",
    fontName: "Typewriter-Regular"
  }
};
var svgData = {
  //   path, width, height
  vec: ["vec", 0.471, 0.714],
  // values from the font glyph
  oiintSize1: ["oiintSize1", 0.957, 0.499],
  // oval to overlay the integrand
  oiintSize2: ["oiintSize2", 1.472, 0.659],
  oiiintSize1: ["oiiintSize1", 1.304, 0.499],
  oiiintSize2: ["oiiintSize2", 1.98, 0.659]
};
var staticSvg = function staticSvg2(value, options) {
  var [pathName, width, height] = svgData[value];
  var path2 = new PathNode(pathName);
  var svgNode = new SvgNode([path2], {
    "width": makeEm(width),
    "height": makeEm(height),
    // Override CSS rule `.katex svg { width: 100% }`
    "style": "width:" + makeEm(width),
    "viewBox": "0 0 " + 1e3 * width + " " + 1e3 * height,
    "preserveAspectRatio": "xMinYMin"
  });
  var span = makeSvgSpan(["overlay"], [svgNode], options);
  span.height = height;
  span.style.height = makeEm(height);
  span.style.width = makeEm(width);
  return span;
};
var buildCommon = {
  fontMap,
  makeSymbol,
  mathsym,
  makeSpan: makeSpan$2,
  makeSvgSpan,
  makeLineSpan,
  makeAnchor,
  makeFragment,
  wrapFragment,
  makeVList,
  makeOrd,
  makeGlue,
  staticSvg,
  svgData,
  tryCombineChars
};
var thinspace = {
  number: 3,
  unit: "mu"
};
var mediumspace = {
  number: 4,
  unit: "mu"
};
var thickspace = {
  number: 5,
  unit: "mu"
};
var spacings = {
  mord: {
    mop: thinspace,
    mbin: mediumspace,
    mrel: thickspace,
    minner: thinspace
  },
  mop: {
    mord: thinspace,
    mop: thinspace,
    mrel: thickspace,
    minner: thinspace
  },
  mbin: {
    mord: mediumspace,
    mop: mediumspace,
    mopen: mediumspace,
    minner: mediumspace
  },
  mrel: {
    mord: thickspace,
    mop: thickspace,
    mopen: thickspace,
    minner: thickspace
  },
  mopen: {},
  mclose: {
    mop: thinspace,
    mbin: mediumspace,
    mrel: thickspace,
    minner: thinspace
  },
  mpunct: {
    mord: thinspace,
    mop: thinspace,
    mrel: thickspace,
    mopen: thinspace,
    mclose: thinspace,
    mpunct: thinspace,
    minner: thinspace
  },
  minner: {
    mord: thinspace,
    mop: thinspace,
    mbin: mediumspace,
    mrel: thickspace,
    mopen: thinspace,
    mpunct: thinspace,
    minner: thinspace
  }
};
var tightSpacings = {
  mord: {
    mop: thinspace
  },
  mop: {
    mord: thinspace,
    mop: thinspace
  },
  mbin: {},
  mrel: {},
  mopen: {},
  mclose: {
    mop: thinspace
  },
  mpunct: {},
  minner: {
    mop: thinspace
  }
};
var _functions = {};
var _htmlGroupBuilders = {};
var _mathmlGroupBuilders = {};
function defineFunction(_ref) {
  var {
    type,
    names,
    props,
    handler,
    htmlBuilder: htmlBuilder3,
    mathmlBuilder: mathmlBuilder3
  } = _ref;
  var data = {
    type,
    numArgs: props.numArgs,
    argTypes: props.argTypes,
    allowedInArgument: !!props.allowedInArgument,
    allowedInText: !!props.allowedInText,
    allowedInMath: props.allowedInMath === void 0 ? true : props.allowedInMath,
    numOptionalArgs: props.numOptionalArgs || 0,
    infix: !!props.infix,
    primitive: !!props.primitive,
    handler
  };
  for (var i2 = 0; i2 < names.length; ++i2) {
    _functions[names[i2]] = data;
  }
  if (type) {
    if (htmlBuilder3) {
      _htmlGroupBuilders[type] = htmlBuilder3;
    }
    if (mathmlBuilder3) {
      _mathmlGroupBuilders[type] = mathmlBuilder3;
    }
  }
}
function defineFunctionBuilders(_ref2) {
  var {
    type,
    htmlBuilder: htmlBuilder3,
    mathmlBuilder: mathmlBuilder3
  } = _ref2;
  defineFunction({
    type,
    names: [],
    props: {
      numArgs: 0
    },
    handler() {
      throw new Error("Should never be called.");
    },
    htmlBuilder: htmlBuilder3,
    mathmlBuilder: mathmlBuilder3
  });
}
var normalizeArgument = function normalizeArgument2(arg) {
  return arg.type === "ordgroup" && arg.body.length === 1 ? arg.body[0] : arg;
};
var ordargument = function ordargument2(arg) {
  return arg.type === "ordgroup" ? arg.body : [arg];
};
var makeSpan$1 = buildCommon.makeSpan;
var binLeftCanceller = ["leftmost", "mbin", "mopen", "mrel", "mop", "mpunct"];
var binRightCanceller = ["rightmost", "mrel", "mclose", "mpunct"];
var styleMap$1 = {
  "display": Style$1.DISPLAY,
  "text": Style$1.TEXT,
  "script": Style$1.SCRIPT,
  "scriptscript": Style$1.SCRIPTSCRIPT
};
var DomEnum = {
  mord: "mord",
  mop: "mop",
  mbin: "mbin",
  mrel: "mrel",
  mopen: "mopen",
  mclose: "mclose",
  mpunct: "mpunct",
  minner: "minner"
};
var buildExpression$1 = function buildExpression(expression, options, isRealGroup, surrounding) {
  if (surrounding === void 0) {
    surrounding = [null, null];
  }
  var groups = [];
  for (var i2 = 0; i2 < expression.length; i2++) {
    var output = buildGroup$1(expression[i2], options);
    if (output instanceof DocumentFragment) {
      var children = output.children;
      groups.push(...children);
    } else {
      groups.push(output);
    }
  }
  buildCommon.tryCombineChars(groups);
  if (!isRealGroup) {
    return groups;
  }
  var glueOptions = options;
  if (expression.length === 1) {
    var node = expression[0];
    if (node.type === "sizing") {
      glueOptions = options.havingSize(node.size);
    } else if (node.type === "styling") {
      glueOptions = options.havingStyle(styleMap$1[node.style]);
    }
  }
  var dummyPrev = makeSpan$1([surrounding[0] || "leftmost"], [], options);
  var dummyNext = makeSpan$1([surrounding[1] || "rightmost"], [], options);
  var isRoot = isRealGroup === "root";
  traverseNonSpaceNodes(groups, (node2, prev) => {
    var prevType = prev.classes[0];
    var type = node2.classes[0];
    if (prevType === "mbin" && utils.contains(binRightCanceller, type)) {
      prev.classes[0] = "mord";
    } else if (type === "mbin" && utils.contains(binLeftCanceller, prevType)) {
      node2.classes[0] = "mord";
    }
  }, {
    node: dummyPrev
  }, dummyNext, isRoot);
  traverseNonSpaceNodes(groups, (node2, prev) => {
    var prevType = getTypeOfDomTree(prev);
    var type = getTypeOfDomTree(node2);
    var space = prevType && type ? node2.hasClass("mtight") ? tightSpacings[prevType][type] : spacings[prevType][type] : null;
    if (space) {
      return buildCommon.makeGlue(space, glueOptions);
    }
  }, {
    node: dummyPrev
  }, dummyNext, isRoot);
  return groups;
};
var traverseNonSpaceNodes = function traverseNonSpaceNodes2(nodes, callback, prev, next, isRoot) {
  if (next) {
    nodes.push(next);
  }
  var i2 = 0;
  for (; i2 < nodes.length; i2++) {
    var node = nodes[i2];
    var partialGroup = checkPartialGroup(node);
    if (partialGroup) {
      traverseNonSpaceNodes2(partialGroup.children, callback, prev, null, isRoot);
      continue;
    }
    var nonspace = !node.hasClass("mspace");
    if (nonspace) {
      var result = callback(node, prev.node);
      if (result) {
        if (prev.insertAfter) {
          prev.insertAfter(result);
        } else {
          nodes.unshift(result);
          i2++;
        }
      }
    }
    if (nonspace) {
      prev.node = node;
    } else if (isRoot && node.hasClass("newline")) {
      prev.node = makeSpan$1(["leftmost"]);
    }
    prev.insertAfter = /* @__PURE__ */ ((index) => (n) => {
      nodes.splice(index + 1, 0, n);
      i2++;
    })(i2);
  }
  if (next) {
    nodes.pop();
  }
};
var checkPartialGroup = function checkPartialGroup2(node) {
  if (node instanceof DocumentFragment || node instanceof Anchor || node instanceof Span && node.hasClass("enclosing")) {
    return node;
  }
  return null;
};
var getOutermostNode = function getOutermostNode2(node, side) {
  var partialGroup = checkPartialGroup(node);
  if (partialGroup) {
    var children = partialGroup.children;
    if (children.length) {
      if (side === "right") {
        return getOutermostNode2(children[children.length - 1], "right");
      } else if (side === "left") {
        return getOutermostNode2(children[0], "left");
      }
    }
  }
  return node;
};
var getTypeOfDomTree = function getTypeOfDomTree2(node, side) {
  if (!node) {
    return null;
  }
  if (side) {
    node = getOutermostNode(node, side);
  }
  return DomEnum[node.classes[0]] || null;
};
var makeNullDelimiter = function makeNullDelimiter2(options, classes) {
  var moreClasses = ["nulldelimiter"].concat(options.baseSizingClasses());
  return makeSpan$1(classes.concat(moreClasses));
};
var buildGroup$1 = function buildGroup(group, options, baseOptions) {
  if (!group) {
    return makeSpan$1();
  }
  if (_htmlGroupBuilders[group.type]) {
    var groupNode = _htmlGroupBuilders[group.type](group, options);
    if (baseOptions && options.size !== baseOptions.size) {
      groupNode = makeSpan$1(options.sizingClasses(baseOptions), [groupNode], options);
      var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
      groupNode.height *= multiplier;
      groupNode.depth *= multiplier;
    }
    return groupNode;
  } else {
    throw new ParseError("Got group of unknown type: '" + group.type + "'");
  }
};
function buildHTMLUnbreakable(children, options) {
  var body = makeSpan$1(["base"], children, options);
  var strut = makeSpan$1(["strut"]);
  strut.style.height = makeEm(body.height + body.depth);
  if (body.depth) {
    strut.style.verticalAlign = makeEm(-body.depth);
  }
  body.children.unshift(strut);
  return body;
}
function buildHTML(tree, options) {
  var tag = null;
  if (tree.length === 1 && tree[0].type === "tag") {
    tag = tree[0].tag;
    tree = tree[0].body;
  }
  var expression = buildExpression$1(tree, options, "root");
  var eqnNum;
  if (expression.length === 2 && expression[1].hasClass("tag")) {
    eqnNum = expression.pop();
  }
  var children = [];
  var parts = [];
  for (var i2 = 0; i2 < expression.length; i2++) {
    parts.push(expression[i2]);
    if (expression[i2].hasClass("mbin") || expression[i2].hasClass("mrel") || expression[i2].hasClass("allowbreak")) {
      var nobreak = false;
      while (i2 < expression.length - 1 && expression[i2 + 1].hasClass("mspace") && !expression[i2 + 1].hasClass("newline")) {
        i2++;
        parts.push(expression[i2]);
        if (expression[i2].hasClass("nobreak")) {
          nobreak = true;
        }
      }
      if (!nobreak) {
        children.push(buildHTMLUnbreakable(parts, options));
        parts = [];
      }
    } else if (expression[i2].hasClass("newline")) {
      parts.pop();
      if (parts.length > 0) {
        children.push(buildHTMLUnbreakable(parts, options));
        parts = [];
      }
      children.push(expression[i2]);
    }
  }
  if (parts.length > 0) {
    children.push(buildHTMLUnbreakable(parts, options));
  }
  var tagChild;
  if (tag) {
    tagChild = buildHTMLUnbreakable(buildExpression$1(tag, options, true));
    tagChild.classes = ["tag"];
    children.push(tagChild);
  } else if (eqnNum) {
    children.push(eqnNum);
  }
  var htmlNode = makeSpan$1(["katex-html"], children);
  htmlNode.setAttribute("aria-hidden", "true");
  if (tagChild) {
    var strut = tagChild.children[0];
    strut.style.height = makeEm(htmlNode.height + htmlNode.depth);
    if (htmlNode.depth) {
      strut.style.verticalAlign = makeEm(-htmlNode.depth);
    }
  }
  return htmlNode;
}
function newDocumentFragment(children) {
  return new DocumentFragment(children);
}
var MathNode = class {
  constructor(type, children, classes) {
    this.type = void 0;
    this.attributes = void 0;
    this.children = void 0;
    this.classes = void 0;
    this.type = type;
    this.attributes = {};
    this.children = children || [];
    this.classes = classes || [];
  }
  /**
   * Sets an attribute on a MathML node. MathML depends on attributes to convey a
   * semantic content, so this is used heavily.
   */
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  /**
   * Gets an attribute on a MathML node.
   */
  getAttribute(name) {
    return this.attributes[name];
  }
  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */
  toNode() {
    var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);
    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }
    if (this.classes.length > 0) {
      node.className = createClass(this.classes);
    }
    for (var i2 = 0; i2 < this.children.length; i2++) {
      if (this.children[i2] instanceof TextNode && this.children[i2 + 1] instanceof TextNode) {
        var text2 = this.children[i2].toText() + this.children[++i2].toText();
        while (this.children[i2 + 1] instanceof TextNode) {
          text2 += this.children[++i2].toText();
        }
        node.appendChild(new TextNode(text2).toNode());
      } else {
        node.appendChild(this.children[i2].toNode());
      }
    }
    return node;
  }
  /**
   * Converts the math node into an HTML markup string.
   */
  toMarkup() {
    var markup = "<" + this.type;
    for (var attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + '="';
        markup += utils.escape(this.attributes[attr]);
        markup += '"';
      }
    }
    if (this.classes.length > 0) {
      markup += ' class ="' + utils.escape(createClass(this.classes)) + '"';
    }
    markup += ">";
    for (var i2 = 0; i2 < this.children.length; i2++) {
      markup += this.children[i2].toMarkup();
    }
    markup += "</" + this.type + ">";
    return markup;
  }
  /**
   * Converts the math node into a string, similar to innerText, but escaped.
   */
  toText() {
    return this.children.map((child) => child.toText()).join("");
  }
};
var TextNode = class {
  constructor(text2) {
    this.text = void 0;
    this.text = text2;
  }
  /**
   * Converts the text node into a DOM text node.
   */
  toNode() {
    return document.createTextNode(this.text);
  }
  /**
   * Converts the text node into escaped HTML markup
   * (representing the text itself).
   */
  toMarkup() {
    return utils.escape(this.toText());
  }
  /**
   * Converts the text node into a string
   * (representing the text itself).
   */
  toText() {
    return this.text;
  }
};
var SpaceNode = class {
  /**
   * Create a Space node with width given in CSS ems.
   */
  constructor(width) {
    this.width = void 0;
    this.character = void 0;
    this.width = width;
    if (width >= 0.05555 && width <= 0.05556) {
      this.character = "\u200A";
    } else if (width >= 0.1666 && width <= 0.1667) {
      this.character = "\u2009";
    } else if (width >= 0.2222 && width <= 0.2223) {
      this.character = "\u2005";
    } else if (width >= 0.2777 && width <= 0.2778) {
      this.character = "\u2005\u200A";
    } else if (width >= -0.05556 && width <= -0.05555) {
      this.character = "\u200A\u2063";
    } else if (width >= -0.1667 && width <= -0.1666) {
      this.character = "\u2009\u2063";
    } else if (width >= -0.2223 && width <= -0.2222) {
      this.character = "\u205F\u2063";
    } else if (width >= -0.2778 && width <= -0.2777) {
      this.character = "\u2005\u2063";
    } else {
      this.character = null;
    }
  }
  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */
  toNode() {
    if (this.character) {
      return document.createTextNode(this.character);
    } else {
      var node = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mspace");
      node.setAttribute("width", makeEm(this.width));
      return node;
    }
  }
  /**
   * Converts the math node into an HTML markup string.
   */
  toMarkup() {
    if (this.character) {
      return "<mtext>" + this.character + "</mtext>";
    } else {
      return '<mspace width="' + makeEm(this.width) + '"/>';
    }
  }
  /**
   * Converts the math node into a string, similar to innerText.
   */
  toText() {
    if (this.character) {
      return this.character;
    } else {
      return " ";
    }
  }
};
var mathMLTree = {
  MathNode,
  TextNode,
  SpaceNode,
  newDocumentFragment
};
var makeText = function makeText2(text2, mode, options) {
  if (symbols[mode][text2] && symbols[mode][text2].replace && text2.charCodeAt(0) !== 55349 && !(ligatures.hasOwnProperty(text2) && options && (options.fontFamily && options.fontFamily.slice(4, 6) === "tt" || options.font && options.font.slice(4, 6) === "tt"))) {
    text2 = symbols[mode][text2].replace;
  }
  return new mathMLTree.TextNode(text2);
};
var makeRow = function makeRow2(body) {
  if (body.length === 1) {
    return body[0];
  } else {
    return new mathMLTree.MathNode("mrow", body);
  }
};
var getVariant = function getVariant2(group, options) {
  if (options.fontFamily === "texttt") {
    return "monospace";
  } else if (options.fontFamily === "textsf") {
    if (options.fontShape === "textit" && options.fontWeight === "textbf") {
      return "sans-serif-bold-italic";
    } else if (options.fontShape === "textit") {
      return "sans-serif-italic";
    } else if (options.fontWeight === "textbf") {
      return "bold-sans-serif";
    } else {
      return "sans-serif";
    }
  } else if (options.fontShape === "textit" && options.fontWeight === "textbf") {
    return "bold-italic";
  } else if (options.fontShape === "textit") {
    return "italic";
  } else if (options.fontWeight === "textbf") {
    return "bold";
  }
  var font = options.font;
  if (!font || font === "mathnormal") {
    return null;
  }
  var mode = group.mode;
  if (font === "mathit") {
    return "italic";
  } else if (font === "boldsymbol") {
    return group.type === "textord" ? "bold" : "bold-italic";
  } else if (font === "mathbf") {
    return "bold";
  } else if (font === "mathbb") {
    return "double-struck";
  } else if (font === "mathsfit") {
    return "sans-serif-italic";
  } else if (font === "mathfrak") {
    return "fraktur";
  } else if (font === "mathscr" || font === "mathcal") {
    return "script";
  } else if (font === "mathsf") {
    return "sans-serif";
  } else if (font === "mathtt") {
    return "monospace";
  }
  var text2 = group.text;
  if (utils.contains(["\\imath", "\\jmath"], text2)) {
    return null;
  }
  if (symbols[mode][text2] && symbols[mode][text2].replace) {
    text2 = symbols[mode][text2].replace;
  }
  var fontName = buildCommon.fontMap[font].fontName;
  if (getCharacterMetrics(text2, fontName, mode)) {
    return buildCommon.fontMap[font].variant;
  }
  return null;
};
function isNumberPunctuation(group) {
  if (!group) {
    return false;
  }
  if (group.type === "mi" && group.children.length === 1) {
    var child = group.children[0];
    return child instanceof TextNode && child.text === ".";
  } else if (group.type === "mo" && group.children.length === 1 && group.getAttribute("separator") === "true" && group.getAttribute("lspace") === "0em" && group.getAttribute("rspace") === "0em") {
    var _child = group.children[0];
    return _child instanceof TextNode && _child.text === ",";
  } else {
    return false;
  }
}
var buildExpression2 = function buildExpression3(expression, options, isOrdgroup) {
  if (expression.length === 1) {
    var group = buildGroup2(expression[0], options);
    if (isOrdgroup && group instanceof MathNode && group.type === "mo") {
      group.setAttribute("lspace", "0em");
      group.setAttribute("rspace", "0em");
    }
    return [group];
  }
  var groups = [];
  var lastGroup;
  for (var i2 = 0; i2 < expression.length; i2++) {
    var _group = buildGroup2(expression[i2], options);
    if (_group instanceof MathNode && lastGroup instanceof MathNode) {
      if (_group.type === "mtext" && lastGroup.type === "mtext" && _group.getAttribute("mathvariant") === lastGroup.getAttribute("mathvariant")) {
        lastGroup.children.push(..._group.children);
        continue;
      } else if (_group.type === "mn" && lastGroup.type === "mn") {
        lastGroup.children.push(..._group.children);
        continue;
      } else if (isNumberPunctuation(_group) && lastGroup.type === "mn") {
        lastGroup.children.push(..._group.children);
        continue;
      } else if (_group.type === "mn" && isNumberPunctuation(lastGroup)) {
        _group.children = [...lastGroup.children, ..._group.children];
        groups.pop();
      } else if ((_group.type === "msup" || _group.type === "msub") && _group.children.length >= 1 && (lastGroup.type === "mn" || isNumberPunctuation(lastGroup))) {
        var base = _group.children[0];
        if (base instanceof MathNode && base.type === "mn") {
          base.children = [...lastGroup.children, ...base.children];
          groups.pop();
        }
      } else if (lastGroup.type === "mi" && lastGroup.children.length === 1) {
        var lastChild = lastGroup.children[0];
        if (lastChild instanceof TextNode && lastChild.text === "\u0338" && (_group.type === "mo" || _group.type === "mi" || _group.type === "mn")) {
          var child = _group.children[0];
          if (child instanceof TextNode && child.text.length > 0) {
            child.text = child.text.slice(0, 1) + "\u0338" + child.text.slice(1);
            groups.pop();
          }
        }
      }
    }
    groups.push(_group);
    lastGroup = _group;
  }
  return groups;
};
var buildExpressionRow = function buildExpressionRow2(expression, options, isOrdgroup) {
  return makeRow(buildExpression2(expression, options, isOrdgroup));
};
var buildGroup2 = function buildGroup3(group, options) {
  if (!group) {
    return new mathMLTree.MathNode("mrow");
  }
  if (_mathmlGroupBuilders[group.type]) {
    var result = _mathmlGroupBuilders[group.type](group, options);
    return result;
  } else {
    throw new ParseError("Got group of unknown type: '" + group.type + "'");
  }
};
function buildMathML(tree, texExpression, options, isDisplayMode, forMathmlOnly) {
  var expression = buildExpression2(tree, options);
  var wrapper;
  if (expression.length === 1 && expression[0] instanceof MathNode && utils.contains(["mrow", "mtable"], expression[0].type)) {
    wrapper = expression[0];
  } else {
    wrapper = new mathMLTree.MathNode("mrow", expression);
  }
  var annotation = new mathMLTree.MathNode("annotation", [new mathMLTree.TextNode(texExpression)]);
  annotation.setAttribute("encoding", "application/x-tex");
  var semantics = new mathMLTree.MathNode("semantics", [wrapper, annotation]);
  var math2 = new mathMLTree.MathNode("math", [semantics]);
  math2.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
  if (isDisplayMode) {
    math2.setAttribute("display", "block");
  }
  var wrapperClass = forMathmlOnly ? "katex" : "katex-mathml";
  return buildCommon.makeSpan([wrapperClass], [math2]);
}
var optionsFromSettings = function optionsFromSettings2(settings) {
  return new Options({
    style: settings.displayMode ? Style$1.DISPLAY : Style$1.TEXT,
    maxSize: settings.maxSize,
    minRuleThickness: settings.minRuleThickness
  });
};
var displayWrap = function displayWrap2(node, settings) {
  if (settings.displayMode) {
    var classes = ["katex-display"];
    if (settings.leqno) {
      classes.push("leqno");
    }
    if (settings.fleqn) {
      classes.push("fleqn");
    }
    node = buildCommon.makeSpan(classes, [node]);
  }
  return node;
};
var buildTree = function buildTree2(tree, expression, settings) {
  var options = optionsFromSettings(settings);
  var katexNode;
  if (settings.output === "mathml") {
    return buildMathML(tree, expression, options, settings.displayMode, true);
  } else if (settings.output === "html") {
    var htmlNode = buildHTML(tree, options);
    katexNode = buildCommon.makeSpan(["katex"], [htmlNode]);
  } else {
    var mathMLNode = buildMathML(tree, expression, options, settings.displayMode, false);
    var _htmlNode = buildHTML(tree, options);
    katexNode = buildCommon.makeSpan(["katex"], [mathMLNode, _htmlNode]);
  }
  return displayWrap(katexNode, settings);
};
var buildHTMLTree = function buildHTMLTree2(tree, expression, settings) {
  var options = optionsFromSettings(settings);
  var htmlNode = buildHTML(tree, options);
  var katexNode = buildCommon.makeSpan(["katex"], [htmlNode]);
  return displayWrap(katexNode, settings);
};
var stretchyCodePoint = {
  widehat: "^",
  widecheck: "\u02C7",
  widetilde: "~",
  utilde: "~",
  overleftarrow: "\u2190",
  underleftarrow: "\u2190",
  xleftarrow: "\u2190",
  overrightarrow: "\u2192",
  underrightarrow: "\u2192",
  xrightarrow: "\u2192",
  underbrace: "\u23DF",
  overbrace: "\u23DE",
  overgroup: "\u23E0",
  undergroup: "\u23E1",
  overleftrightarrow: "\u2194",
  underleftrightarrow: "\u2194",
  xleftrightarrow: "\u2194",
  Overrightarrow: "\u21D2",
  xRightarrow: "\u21D2",
  overleftharpoon: "\u21BC",
  xleftharpoonup: "\u21BC",
  overrightharpoon: "\u21C0",
  xrightharpoonup: "\u21C0",
  xLeftarrow: "\u21D0",
  xLeftrightarrow: "\u21D4",
  xhookleftarrow: "\u21A9",
  xhookrightarrow: "\u21AA",
  xmapsto: "\u21A6",
  xrightharpoondown: "\u21C1",
  xleftharpoondown: "\u21BD",
  xrightleftharpoons: "\u21CC",
  xleftrightharpoons: "\u21CB",
  xtwoheadleftarrow: "\u219E",
  xtwoheadrightarrow: "\u21A0",
  xlongequal: "=",
  xtofrom: "\u21C4",
  xrightleftarrows: "\u21C4",
  xrightequilibrium: "\u21CC",
  // Not a perfect match.
  xleftequilibrium: "\u21CB",
  // None better available.
  "\\cdrightarrow": "\u2192",
  "\\cdleftarrow": "\u2190",
  "\\cdlongequal": "="
};
var mathMLnode = function mathMLnode2(label) {
  var node = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode(stretchyCodePoint[label.replace(/^\\/, "")])]);
  node.setAttribute("stretchy", "true");
  return node;
};
var katexImagesData = {
  //   path(s), minWidth, height, align
  overrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
  overleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
  underrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"],
  underleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"],
  xrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"],
  "\\cdrightarrow": [["rightarrow"], 3, 522, "xMaxYMin"],
  // CD minwwidth2.5pc
  xleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"],
  "\\cdleftarrow": [["leftarrow"], 3, 522, "xMinYMin"],
  Overrightarrow: [["doublerightarrow"], 0.888, 560, "xMaxYMin"],
  xRightarrow: [["doublerightarrow"], 1.526, 560, "xMaxYMin"],
  xLeftarrow: [["doubleleftarrow"], 1.526, 560, "xMinYMin"],
  overleftharpoon: [["leftharpoon"], 0.888, 522, "xMinYMin"],
  xleftharpoonup: [["leftharpoon"], 0.888, 522, "xMinYMin"],
  xleftharpoondown: [["leftharpoondown"], 0.888, 522, "xMinYMin"],
  overrightharpoon: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
  xrightharpoonup: [["rightharpoon"], 0.888, 522, "xMaxYMin"],
  xrightharpoondown: [["rightharpoondown"], 0.888, 522, "xMaxYMin"],
  xlongequal: [["longequal"], 0.888, 334, "xMinYMin"],
  "\\cdlongequal": [["longequal"], 3, 334, "xMinYMin"],
  xtwoheadleftarrow: [["twoheadleftarrow"], 0.888, 334, "xMinYMin"],
  xtwoheadrightarrow: [["twoheadrightarrow"], 0.888, 334, "xMaxYMin"],
  overleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
  overbrace: [["leftbrace", "midbrace", "rightbrace"], 1.6, 548],
  underbrace: [["leftbraceunder", "midbraceunder", "rightbraceunder"], 1.6, 548],
  underleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522],
  xleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522],
  xLeftrightarrow: [["doubleleftarrow", "doublerightarrow"], 1.75, 560],
  xrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716],
  xleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716],
  xhookleftarrow: [["leftarrow", "righthook"], 1.08, 522],
  xhookrightarrow: [["lefthook", "rightarrow"], 1.08, 522],
  overlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
  underlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522],
  overgroup: [["leftgroup", "rightgroup"], 0.888, 342],
  undergroup: [["leftgroupunder", "rightgroupunder"], 0.888, 342],
  xmapsto: [["leftmapsto", "rightarrow"], 1.5, 522],
  xtofrom: [["leftToFrom", "rightToFrom"], 1.75, 528],
  // The next three arrows are from the mhchem package.
  // In mhchem.sty, min-length is 2.0em. But these arrows might appear in the
  // document as \xrightarrow or \xrightleftharpoons. Those have
  // min-length = 1.75em, so we set min-length on these next three to match.
  xrightleftarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901],
  xrightequilibrium: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716],
  xleftequilibrium: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716]
};
var groupLength = function groupLength2(arg) {
  if (arg.type === "ordgroup") {
    return arg.body.length;
  } else {
    return 1;
  }
};
var svgSpan = function svgSpan2(group, options) {
  function buildSvgSpan_() {
    var viewBoxWidth = 4e5;
    var label = group.label.slice(1);
    if (utils.contains(["widehat", "widecheck", "widetilde", "utilde"], label)) {
      var grp = group;
      var numChars = groupLength(grp.base);
      var viewBoxHeight;
      var pathName;
      var _height;
      if (numChars > 5) {
        if (label === "widehat" || label === "widecheck") {
          viewBoxHeight = 420;
          viewBoxWidth = 2364;
          _height = 0.42;
          pathName = label + "4";
        } else {
          viewBoxHeight = 312;
          viewBoxWidth = 2340;
          _height = 0.34;
          pathName = "tilde4";
        }
      } else {
        var imgIndex = [1, 1, 2, 2, 3, 3][numChars];
        if (label === "widehat" || label === "widecheck") {
          viewBoxWidth = [0, 1062, 2364, 2364, 2364][imgIndex];
          viewBoxHeight = [0, 239, 300, 360, 420][imgIndex];
          _height = [0, 0.24, 0.3, 0.3, 0.36, 0.42][imgIndex];
          pathName = label + imgIndex;
        } else {
          viewBoxWidth = [0, 600, 1033, 2339, 2340][imgIndex];
          viewBoxHeight = [0, 260, 286, 306, 312][imgIndex];
          _height = [0, 0.26, 0.286, 0.3, 0.306, 0.34][imgIndex];
          pathName = "tilde" + imgIndex;
        }
      }
      var path2 = new PathNode(pathName);
      var svgNode = new SvgNode([path2], {
        "width": "100%",
        "height": makeEm(_height),
        "viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight,
        "preserveAspectRatio": "none"
      });
      return {
        span: buildCommon.makeSvgSpan([], [svgNode], options),
        minWidth: 0,
        height: _height
      };
    } else {
      var spans = [];
      var data = katexImagesData[label];
      var [paths, _minWidth, _viewBoxHeight] = data;
      var _height2 = _viewBoxHeight / 1e3;
      var numSvgChildren = paths.length;
      var widthClasses;
      var aligns;
      if (numSvgChildren === 1) {
        var align1 = data[3];
        widthClasses = ["hide-tail"];
        aligns = [align1];
      } else if (numSvgChildren === 2) {
        widthClasses = ["halfarrow-left", "halfarrow-right"];
        aligns = ["xMinYMin", "xMaxYMin"];
      } else if (numSvgChildren === 3) {
        widthClasses = ["brace-left", "brace-center", "brace-right"];
        aligns = ["xMinYMin", "xMidYMin", "xMaxYMin"];
      } else {
        throw new Error("Correct katexImagesData or update code here to support\n                    " + numSvgChildren + " children.");
      }
      for (var i2 = 0; i2 < numSvgChildren; i2++) {
        var _path = new PathNode(paths[i2]);
        var _svgNode = new SvgNode([_path], {
          "width": "400em",
          "height": makeEm(_height2),
          "viewBox": "0 0 " + viewBoxWidth + " " + _viewBoxHeight,
          "preserveAspectRatio": aligns[i2] + " slice"
        });
        var _span = buildCommon.makeSvgSpan([widthClasses[i2]], [_svgNode], options);
        if (numSvgChildren === 1) {
          return {
            span: _span,
            minWidth: _minWidth,
            height: _height2
          };
        } else {
          _span.style.height = makeEm(_height2);
          spans.push(_span);
        }
      }
      return {
        span: buildCommon.makeSpan(["stretchy"], spans, options),
        minWidth: _minWidth,
        height: _height2
      };
    }
  }
  var {
    span,
    minWidth,
    height
  } = buildSvgSpan_();
  span.height = height;
  span.style.height = makeEm(height);
  if (minWidth > 0) {
    span.style.minWidth = makeEm(minWidth);
  }
  return span;
};
var encloseSpan = function encloseSpan2(inner2, label, topPad, bottomPad, options) {
  var img;
  var totalHeight = inner2.height + inner2.depth + topPad + bottomPad;
  if (/fbox|color|angl/.test(label)) {
    img = buildCommon.makeSpan(["stretchy", label], [], options);
    if (label === "fbox") {
      var color = options.color && options.getColor();
      if (color) {
        img.style.borderColor = color;
      }
    }
  } else {
    var lines = [];
    if (/^[bx]cancel$/.test(label)) {
      lines.push(new LineNode({
        "x1": "0",
        "y1": "0",
        "x2": "100%",
        "y2": "100%",
        "stroke-width": "0.046em"
      }));
    }
    if (/^x?cancel$/.test(label)) {
      lines.push(new LineNode({
        "x1": "0",
        "y1": "100%",
        "x2": "100%",
        "y2": "0",
        "stroke-width": "0.046em"
      }));
    }
    var svgNode = new SvgNode(lines, {
      "width": "100%",
      "height": makeEm(totalHeight)
    });
    img = buildCommon.makeSvgSpan([], [svgNode], options);
  }
  img.height = totalHeight;
  img.style.height = makeEm(totalHeight);
  return img;
};
var stretchy = {
  encloseSpan,
  mathMLnode,
  svgSpan
};
function assertNodeType(node, type) {
  if (!node || node.type !== type) {
    throw new Error("Expected node of type " + type + ", but got " + (node ? "node of type " + node.type : String(node)));
  }
  return node;
}
function assertSymbolNodeType(node) {
  var typedNode = checkSymbolNodeType(node);
  if (!typedNode) {
    throw new Error("Expected node of symbol group type, but got " + (node ? "node of type " + node.type : String(node)));
  }
  return typedNode;
}
function checkSymbolNodeType(node) {
  if (node && (node.type === "atom" || NON_ATOMS.hasOwnProperty(node.type))) {
    return node;
  }
  return null;
}
var htmlBuilder$a = (grp, options) => {
  var base;
  var group;
  var supSubGroup;
  if (grp && grp.type === "supsub") {
    group = assertNodeType(grp.base, "accent");
    base = group.base;
    grp.base = base;
    supSubGroup = assertSpan(buildGroup$1(grp, options));
    grp.base = group;
  } else {
    group = assertNodeType(grp, "accent");
    base = group.base;
  }
  var body = buildGroup$1(base, options.havingCrampedStyle());
  var mustShift = group.isShifty && utils.isCharacterBox(base);
  var skew = 0;
  if (mustShift) {
    var baseChar = utils.getBaseElem(base);
    var baseGroup = buildGroup$1(baseChar, options.havingCrampedStyle());
    skew = assertSymbolDomNode(baseGroup).skew;
  }
  var accentBelow = group.label === "\\c";
  var clearance = accentBelow ? body.height + body.depth : Math.min(body.height, options.fontMetrics().xHeight);
  var accentBody;
  if (!group.isStretchy) {
    var accent2;
    var width;
    if (group.label === "\\vec") {
      accent2 = buildCommon.staticSvg("vec", options);
      width = buildCommon.svgData.vec[1];
    } else {
      accent2 = buildCommon.makeOrd({
        mode: group.mode,
        text: group.label
      }, options, "textord");
      accent2 = assertSymbolDomNode(accent2);
      accent2.italic = 0;
      width = accent2.width;
      if (accentBelow) {
        clearance += accent2.depth;
      }
    }
    accentBody = buildCommon.makeSpan(["accent-body"], [accent2]);
    var accentFull = group.label === "\\textcircled";
    if (accentFull) {
      accentBody.classes.push("accent-full");
      clearance = body.height;
    }
    var left = skew;
    if (!accentFull) {
      left -= width / 2;
    }
    accentBody.style.left = makeEm(left);
    if (group.label === "\\textcircled") {
      accentBody.style.top = ".2em";
    }
    accentBody = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: body
      }, {
        type: "kern",
        size: -clearance
      }, {
        type: "elem",
        elem: accentBody
      }]
    }, options);
  } else {
    accentBody = stretchy.svgSpan(group, options);
    accentBody = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: body
      }, {
        type: "elem",
        elem: accentBody,
        wrapperClasses: ["svg-align"],
        wrapperStyle: skew > 0 ? {
          width: "calc(100% - " + makeEm(2 * skew) + ")",
          marginLeft: makeEm(2 * skew)
        } : void 0
      }]
    }, options);
  }
  var accentWrap = buildCommon.makeSpan(["mord", "accent"], [accentBody], options);
  if (supSubGroup) {
    supSubGroup.children[0] = accentWrap;
    supSubGroup.height = Math.max(accentWrap.height, supSubGroup.height);
    supSubGroup.classes[0] = "mord";
    return supSubGroup;
  } else {
    return accentWrap;
  }
};
var mathmlBuilder$9 = (group, options) => {
  var accentNode = group.isStretchy ? stretchy.mathMLnode(group.label) : new mathMLTree.MathNode("mo", [makeText(group.label, group.mode)]);
  var node = new mathMLTree.MathNode("mover", [buildGroup2(group.base, options), accentNode]);
  node.setAttribute("accent", "true");
  return node;
};
var NON_STRETCHY_ACCENT_REGEX = new RegExp(["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring"].map((accent2) => "\\" + accent2).join("|"));
defineFunction({
  type: "accent",
  names: ["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring", "\\widecheck", "\\widehat", "\\widetilde", "\\overrightarrow", "\\overleftarrow", "\\Overrightarrow", "\\overleftrightarrow", "\\overgroup", "\\overlinesegment", "\\overleftharpoon", "\\overrightharpoon"],
  props: {
    numArgs: 1
  },
  handler: (context, args) => {
    var base = normalizeArgument(args[0]);
    var isStretchy = !NON_STRETCHY_ACCENT_REGEX.test(context.funcName);
    var isShifty = !isStretchy || context.funcName === "\\widehat" || context.funcName === "\\widetilde" || context.funcName === "\\widecheck";
    return {
      type: "accent",
      mode: context.parser.mode,
      label: context.funcName,
      isStretchy,
      isShifty,
      base
    };
  },
  htmlBuilder: htmlBuilder$a,
  mathmlBuilder: mathmlBuilder$9
});
defineFunction({
  type: "accent",
  names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\u", "\\.", '\\"', "\\c", "\\r", "\\H", "\\v", "\\textcircled"],
  props: {
    numArgs: 1,
    allowedInText: true,
    allowedInMath: true,
    // unless in strict mode
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    var base = args[0];
    var mode = context.parser.mode;
    if (mode === "math") {
      context.parser.settings.reportNonstrict("mathVsTextAccents", "LaTeX's accent " + context.funcName + " works only in text mode");
      mode = "text";
    }
    return {
      type: "accent",
      mode,
      label: context.funcName,
      isStretchy: false,
      isShifty: true,
      base
    };
  },
  htmlBuilder: htmlBuilder$a,
  mathmlBuilder: mathmlBuilder$9
});
defineFunction({
  type: "accentUnder",
  names: ["\\underleftarrow", "\\underrightarrow", "\\underleftrightarrow", "\\undergroup", "\\underlinesegment", "\\utilde"],
  props: {
    numArgs: 1
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName
    } = _ref;
    var base = args[0];
    return {
      type: "accentUnder",
      mode: parser.mode,
      label: funcName,
      base
    };
  },
  htmlBuilder: (group, options) => {
    var innerGroup = buildGroup$1(group.base, options);
    var accentBody = stretchy.svgSpan(group, options);
    var kern = group.label === "\\utilde" ? 0.12 : 0;
    var vlist = buildCommon.makeVList({
      positionType: "top",
      positionData: innerGroup.height,
      children: [{
        type: "elem",
        elem: accentBody,
        wrapperClasses: ["svg-align"]
      }, {
        type: "kern",
        size: kern
      }, {
        type: "elem",
        elem: innerGroup
      }]
    }, options);
    return buildCommon.makeSpan(["mord", "accentunder"], [vlist], options);
  },
  mathmlBuilder: (group, options) => {
    var accentNode = stretchy.mathMLnode(group.label);
    var node = new mathMLTree.MathNode("munder", [buildGroup2(group.base, options), accentNode]);
    node.setAttribute("accentunder", "true");
    return node;
  }
});
var paddedNode = (group) => {
  var node = new mathMLTree.MathNode("mpadded", group ? [group] : []);
  node.setAttribute("width", "+0.6em");
  node.setAttribute("lspace", "0.3em");
  return node;
};
defineFunction({
  type: "xArrow",
  names: [
    "\\xleftarrow",
    "\\xrightarrow",
    "\\xLeftarrow",
    "\\xRightarrow",
    "\\xleftrightarrow",
    "\\xLeftrightarrow",
    "\\xhookleftarrow",
    "\\xhookrightarrow",
    "\\xmapsto",
    "\\xrightharpoondown",
    "\\xrightharpoonup",
    "\\xleftharpoondown",
    "\\xleftharpoonup",
    "\\xrightleftharpoons",
    "\\xleftrightharpoons",
    "\\xlongequal",
    "\\xtwoheadrightarrow",
    "\\xtwoheadleftarrow",
    "\\xtofrom",
    // The next 3 functions are here to support the mhchem extension.
    // Direct use of these functions is discouraged and may break someday.
    "\\xrightleftarrows",
    "\\xrightequilibrium",
    "\\xleftequilibrium",
    // The next 3 functions are here only to support the {CD} environment.
    "\\\\cdrightarrow",
    "\\\\cdleftarrow",
    "\\\\cdlongequal"
  ],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler(_ref, args, optArgs) {
    var {
      parser,
      funcName
    } = _ref;
    return {
      type: "xArrow",
      mode: parser.mode,
      label: funcName,
      body: args[0],
      below: optArgs[0]
    };
  },
  // Flow is unable to correctly infer the type of `group`, even though it's
  // unambiguously determined from the passed-in `type` above.
  htmlBuilder(group, options) {
    var style = options.style;
    var newOptions = options.havingStyle(style.sup());
    var upperGroup = buildCommon.wrapFragment(buildGroup$1(group.body, newOptions, options), options);
    var arrowPrefix = group.label.slice(0, 2) === "\\x" ? "x" : "cd";
    upperGroup.classes.push(arrowPrefix + "-arrow-pad");
    var lowerGroup;
    if (group.below) {
      newOptions = options.havingStyle(style.sub());
      lowerGroup = buildCommon.wrapFragment(buildGroup$1(group.below, newOptions, options), options);
      lowerGroup.classes.push(arrowPrefix + "-arrow-pad");
    }
    var arrowBody = stretchy.svgSpan(group, options);
    var arrowShift = -options.fontMetrics().axisHeight + 0.5 * arrowBody.height;
    var upperShift = -options.fontMetrics().axisHeight - 0.5 * arrowBody.height - 0.111;
    if (upperGroup.depth > 0.25 || group.label === "\\xleftequilibrium") {
      upperShift -= upperGroup.depth;
    }
    var vlist;
    if (lowerGroup) {
      var lowerShift = -options.fontMetrics().axisHeight + lowerGroup.height + 0.5 * arrowBody.height + 0.111;
      vlist = buildCommon.makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: upperGroup,
          shift: upperShift
        }, {
          type: "elem",
          elem: arrowBody,
          shift: arrowShift
        }, {
          type: "elem",
          elem: lowerGroup,
          shift: lowerShift
        }]
      }, options);
    } else {
      vlist = buildCommon.makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: upperGroup,
          shift: upperShift
        }, {
          type: "elem",
          elem: arrowBody,
          shift: arrowShift
        }]
      }, options);
    }
    vlist.children[0].children[0].children[1].classes.push("svg-align");
    return buildCommon.makeSpan(["mrel", "x-arrow"], [vlist], options);
  },
  mathmlBuilder(group, options) {
    var arrowNode = stretchy.mathMLnode(group.label);
    arrowNode.setAttribute("minsize", group.label.charAt(0) === "x" ? "1.75em" : "3.0em");
    var node;
    if (group.body) {
      var upperNode = paddedNode(buildGroup2(group.body, options));
      if (group.below) {
        var lowerNode = paddedNode(buildGroup2(group.below, options));
        node = new mathMLTree.MathNode("munderover", [arrowNode, lowerNode, upperNode]);
      } else {
        node = new mathMLTree.MathNode("mover", [arrowNode, upperNode]);
      }
    } else if (group.below) {
      var _lowerNode = paddedNode(buildGroup2(group.below, options));
      node = new mathMLTree.MathNode("munder", [arrowNode, _lowerNode]);
    } else {
      node = paddedNode();
      node = new mathMLTree.MathNode("mover", [arrowNode, node]);
    }
    return node;
  }
});
var makeSpan2 = buildCommon.makeSpan;
function htmlBuilder$9(group, options) {
  var elements = buildExpression$1(group.body, options, true);
  return makeSpan2([group.mclass], elements, options);
}
function mathmlBuilder$8(group, options) {
  var node;
  var inner2 = buildExpression2(group.body, options);
  if (group.mclass === "minner") {
    node = new mathMLTree.MathNode("mpadded", inner2);
  } else if (group.mclass === "mord") {
    if (group.isCharacterBox) {
      node = inner2[0];
      node.type = "mi";
    } else {
      node = new mathMLTree.MathNode("mi", inner2);
    }
  } else {
    if (group.isCharacterBox) {
      node = inner2[0];
      node.type = "mo";
    } else {
      node = new mathMLTree.MathNode("mo", inner2);
    }
    if (group.mclass === "mbin") {
      node.attributes.lspace = "0.22em";
      node.attributes.rspace = "0.22em";
    } else if (group.mclass === "mpunct") {
      node.attributes.lspace = "0em";
      node.attributes.rspace = "0.17em";
    } else if (group.mclass === "mopen" || group.mclass === "mclose") {
      node.attributes.lspace = "0em";
      node.attributes.rspace = "0em";
    } else if (group.mclass === "minner") {
      node.attributes.lspace = "0.0556em";
      node.attributes.width = "+0.1111em";
    }
  }
  return node;
}
defineFunction({
  type: "mclass",
  names: ["\\mathord", "\\mathbin", "\\mathrel", "\\mathopen", "\\mathclose", "\\mathpunct", "\\mathinner"],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler(_ref, args) {
    var {
      parser,
      funcName
    } = _ref;
    var body = args[0];
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: "m" + funcName.slice(5),
      // TODO(kevinb): don't prefix with 'm'
      body: ordargument(body),
      isCharacterBox: utils.isCharacterBox(body)
    };
  },
  htmlBuilder: htmlBuilder$9,
  mathmlBuilder: mathmlBuilder$8
});
var binrelClass = (arg) => {
  var atom = arg.type === "ordgroup" && arg.body.length ? arg.body[0] : arg;
  if (atom.type === "atom" && (atom.family === "bin" || atom.family === "rel")) {
    return "m" + atom.family;
  } else {
    return "mord";
  }
};
defineFunction({
  type: "mclass",
  names: ["\\@binrel"],
  props: {
    numArgs: 2
  },
  handler(_ref2, args) {
    var {
      parser
    } = _ref2;
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: binrelClass(args[0]),
      body: ordargument(args[1]),
      isCharacterBox: utils.isCharacterBox(args[1])
    };
  }
});
defineFunction({
  type: "mclass",
  names: ["\\stackrel", "\\overset", "\\underset"],
  props: {
    numArgs: 2
  },
  handler(_ref3, args) {
    var {
      parser,
      funcName
    } = _ref3;
    var baseArg = args[1];
    var shiftedArg = args[0];
    var mclass;
    if (funcName !== "\\stackrel") {
      mclass = binrelClass(baseArg);
    } else {
      mclass = "mrel";
    }
    var baseOp = {
      type: "op",
      mode: baseArg.mode,
      limits: true,
      alwaysHandleSupSub: true,
      parentIsSupSub: false,
      symbol: false,
      suppressBaseShift: funcName !== "\\stackrel",
      body: ordargument(baseArg)
    };
    var supsub = {
      type: "supsub",
      mode: shiftedArg.mode,
      base: baseOp,
      sup: funcName === "\\underset" ? null : shiftedArg,
      sub: funcName === "\\underset" ? shiftedArg : null
    };
    return {
      type: "mclass",
      mode: parser.mode,
      mclass,
      body: [supsub],
      isCharacterBox: utils.isCharacterBox(supsub)
    };
  },
  htmlBuilder: htmlBuilder$9,
  mathmlBuilder: mathmlBuilder$8
});
defineFunction({
  type: "pmb",
  names: ["\\pmb"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    return {
      type: "pmb",
      mode: parser.mode,
      mclass: binrelClass(args[0]),
      body: ordargument(args[0])
    };
  },
  htmlBuilder(group, options) {
    var elements = buildExpression$1(group.body, options, true);
    var node = buildCommon.makeSpan([group.mclass], elements, options);
    node.style.textShadow = "0.02em 0.01em 0.04px";
    return node;
  },
  mathmlBuilder(group, style) {
    var inner2 = buildExpression2(group.body, style);
    var node = new mathMLTree.MathNode("mstyle", inner2);
    node.setAttribute("style", "text-shadow: 0.02em 0.01em 0.04px");
    return node;
  }
});
var cdArrowFunctionName = {
  ">": "\\\\cdrightarrow",
  "<": "\\\\cdleftarrow",
  "=": "\\\\cdlongequal",
  "A": "\\uparrow",
  "V": "\\downarrow",
  "|": "\\Vert",
  ".": "no arrow"
};
var newCell = () => {
  return {
    type: "styling",
    body: [],
    mode: "math",
    style: "display"
  };
};
var isStartOfArrow = (node) => {
  return node.type === "textord" && node.text === "@";
};
var isLabelEnd = (node, endChar) => {
  return (node.type === "mathord" || node.type === "atom") && node.text === endChar;
};
function cdArrow(arrowChar, labels, parser) {
  var funcName = cdArrowFunctionName[arrowChar];
  switch (funcName) {
    case "\\\\cdrightarrow":
    case "\\\\cdleftarrow":
      return parser.callFunction(funcName, [labels[0]], [labels[1]]);
    case "\\uparrow":
    case "\\downarrow": {
      var leftLabel = parser.callFunction("\\\\cdleft", [labels[0]], []);
      var bareArrow = {
        type: "atom",
        text: funcName,
        mode: "math",
        family: "rel"
      };
      var sizedArrow = parser.callFunction("\\Big", [bareArrow], []);
      var rightLabel = parser.callFunction("\\\\cdright", [labels[1]], []);
      var arrowGroup = {
        type: "ordgroup",
        mode: "math",
        body: [leftLabel, sizedArrow, rightLabel]
      };
      return parser.callFunction("\\\\cdparent", [arrowGroup], []);
    }
    case "\\\\cdlongequal":
      return parser.callFunction("\\\\cdlongequal", [], []);
    case "\\Vert": {
      var arrow = {
        type: "textord",
        text: "\\Vert",
        mode: "math"
      };
      return parser.callFunction("\\Big", [arrow], []);
    }
    default:
      return {
        type: "textord",
        text: " ",
        mode: "math"
      };
  }
}
function parseCD(parser) {
  var parsedRows = [];
  parser.gullet.beginGroup();
  parser.gullet.macros.set("\\cr", "\\\\\\relax");
  parser.gullet.beginGroup();
  while (true) {
    parsedRows.push(parser.parseExpression(false, "\\\\"));
    parser.gullet.endGroup();
    parser.gullet.beginGroup();
    var next = parser.fetch().text;
    if (next === "&" || next === "\\\\") {
      parser.consume();
    } else if (next === "\\end") {
      if (parsedRows[parsedRows.length - 1].length === 0) {
        parsedRows.pop();
      }
      break;
    } else {
      throw new ParseError("Expected \\\\ or \\cr or \\end", parser.nextToken);
    }
  }
  var row = [];
  var body = [row];
  for (var i2 = 0; i2 < parsedRows.length; i2++) {
    var rowNodes = parsedRows[i2];
    var cell = newCell();
    for (var j = 0; j < rowNodes.length; j++) {
      if (!isStartOfArrow(rowNodes[j])) {
        cell.body.push(rowNodes[j]);
      } else {
        row.push(cell);
        j += 1;
        var arrowChar = assertSymbolNodeType(rowNodes[j]).text;
        var labels = new Array(2);
        labels[0] = {
          type: "ordgroup",
          mode: "math",
          body: []
        };
        labels[1] = {
          type: "ordgroup",
          mode: "math",
          body: []
        };
        if ("=|.".indexOf(arrowChar) > -1) ;
        else if ("<>AV".indexOf(arrowChar) > -1) {
          for (var labelNum = 0; labelNum < 2; labelNum++) {
            var inLabel = true;
            for (var k = j + 1; k < rowNodes.length; k++) {
              if (isLabelEnd(rowNodes[k], arrowChar)) {
                inLabel = false;
                j = k;
                break;
              }
              if (isStartOfArrow(rowNodes[k])) {
                throw new ParseError("Missing a " + arrowChar + " character to complete a CD arrow.", rowNodes[k]);
              }
              labels[labelNum].body.push(rowNodes[k]);
            }
            if (inLabel) {
              throw new ParseError("Missing a " + arrowChar + " character to complete a CD arrow.", rowNodes[j]);
            }
          }
        } else {
          throw new ParseError('Expected one of "<>AV=|." after @', rowNodes[j]);
        }
        var arrow = cdArrow(arrowChar, labels, parser);
        var wrappedArrow = {
          type: "styling",
          body: [arrow],
          mode: "math",
          style: "display"
          // CD is always displaystyle.
        };
        row.push(wrappedArrow);
        cell = newCell();
      }
    }
    if (i2 % 2 === 0) {
      row.push(cell);
    } else {
      row.shift();
    }
    row = [];
    body.push(row);
  }
  parser.gullet.endGroup();
  parser.gullet.endGroup();
  var cols = new Array(body[0].length).fill({
    type: "align",
    align: "c",
    pregap: 0.25,
    // CD package sets \enskip between columns.
    postgap: 0.25
    // So pre and post each get half an \enskip, i.e. 0.25em.
  });
  return {
    type: "array",
    mode: "math",
    body,
    arraystretch: 1,
    addJot: true,
    rowGaps: [null],
    cols,
    colSeparationType: "CD",
    hLinesBeforeRow: new Array(body.length + 1).fill([])
  };
}
defineFunction({
  type: "cdlabel",
  names: ["\\\\cdleft", "\\\\cdright"],
  props: {
    numArgs: 1
  },
  handler(_ref, args) {
    var {
      parser,
      funcName
    } = _ref;
    return {
      type: "cdlabel",
      mode: parser.mode,
      side: funcName.slice(4),
      label: args[0]
    };
  },
  htmlBuilder(group, options) {
    var newOptions = options.havingStyle(options.style.sup());
    var label = buildCommon.wrapFragment(buildGroup$1(group.label, newOptions, options), options);
    label.classes.push("cd-label-" + group.side);
    label.style.bottom = makeEm(0.8 - label.depth);
    label.height = 0;
    label.depth = 0;
    return label;
  },
  mathmlBuilder(group, options) {
    var label = new mathMLTree.MathNode("mrow", [buildGroup2(group.label, options)]);
    label = new mathMLTree.MathNode("mpadded", [label]);
    label.setAttribute("width", "0");
    if (group.side === "left") {
      label.setAttribute("lspace", "-1width");
    }
    label.setAttribute("voffset", "0.7em");
    label = new mathMLTree.MathNode("mstyle", [label]);
    label.setAttribute("displaystyle", "false");
    label.setAttribute("scriptlevel", "1");
    return label;
  }
});
defineFunction({
  type: "cdlabelparent",
  names: ["\\\\cdparent"],
  props: {
    numArgs: 1
  },
  handler(_ref2, args) {
    var {
      parser
    } = _ref2;
    return {
      type: "cdlabelparent",
      mode: parser.mode,
      fragment: args[0]
    };
  },
  htmlBuilder(group, options) {
    var parent = buildCommon.wrapFragment(buildGroup$1(group.fragment, options), options);
    parent.classes.push("cd-vert-arrow");
    return parent;
  },
  mathmlBuilder(group, options) {
    return new mathMLTree.MathNode("mrow", [buildGroup2(group.fragment, options)]);
  }
});
defineFunction({
  type: "textord",
  names: ["\\@char"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    var arg = assertNodeType(args[0], "ordgroup");
    var group = arg.body;
    var number = "";
    for (var i2 = 0; i2 < group.length; i2++) {
      var node = assertNodeType(group[i2], "textord");
      number += node.text;
    }
    var code = parseInt(number);
    var text2;
    if (isNaN(code)) {
      throw new ParseError("\\@char has non-numeric argument " + number);
    } else if (code < 0 || code >= 1114111) {
      throw new ParseError("\\@char with invalid code point " + number);
    } else if (code <= 65535) {
      text2 = String.fromCharCode(code);
    } else {
      code -= 65536;
      text2 = String.fromCharCode((code >> 10) + 55296, (code & 1023) + 56320);
    }
    return {
      type: "textord",
      mode: parser.mode,
      text: text2
    };
  }
});
var htmlBuilder$8 = (group, options) => {
  var elements = buildExpression$1(group.body, options.withColor(group.color), false);
  return buildCommon.makeFragment(elements);
};
var mathmlBuilder$7 = (group, options) => {
  var inner2 = buildExpression2(group.body, options.withColor(group.color));
  var node = new mathMLTree.MathNode("mstyle", inner2);
  node.setAttribute("mathcolor", group.color);
  return node;
};
defineFunction({
  type: "color",
  names: ["\\textcolor"],
  props: {
    numArgs: 2,
    allowedInText: true,
    argTypes: ["color", "original"]
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    var color = assertNodeType(args[0], "color-token").color;
    var body = args[1];
    return {
      type: "color",
      mode: parser.mode,
      color,
      body: ordargument(body)
    };
  },
  htmlBuilder: htmlBuilder$8,
  mathmlBuilder: mathmlBuilder$7
});
defineFunction({
  type: "color",
  names: ["\\color"],
  props: {
    numArgs: 1,
    allowedInText: true,
    argTypes: ["color"]
  },
  handler(_ref2, args) {
    var {
      parser,
      breakOnTokenText
    } = _ref2;
    var color = assertNodeType(args[0], "color-token").color;
    parser.gullet.macros.set("\\current@color", color);
    var body = parser.parseExpression(true, breakOnTokenText);
    return {
      type: "color",
      mode: parser.mode,
      color,
      body
    };
  },
  htmlBuilder: htmlBuilder$8,
  mathmlBuilder: mathmlBuilder$7
});
defineFunction({
  type: "cr",
  names: ["\\\\"],
  props: {
    numArgs: 0,
    numOptionalArgs: 0,
    allowedInText: true
  },
  handler(_ref, args, optArgs) {
    var {
      parser
    } = _ref;
    var size = parser.gullet.future().text === "[" ? parser.parseSizeGroup(true) : null;
    var newLine = !parser.settings.displayMode || !parser.settings.useStrictBehavior("newLineInDisplayMode", "In LaTeX, \\\\ or \\newline does nothing in display mode");
    return {
      type: "cr",
      mode: parser.mode,
      newLine,
      size: size && assertNodeType(size, "size").value
    };
  },
  // The following builders are called only at the top level,
  // not within tabular/array environments.
  htmlBuilder(group, options) {
    var span = buildCommon.makeSpan(["mspace"], [], options);
    if (group.newLine) {
      span.classes.push("newline");
      if (group.size) {
        span.style.marginTop = makeEm(calculateSize(group.size, options));
      }
    }
    return span;
  },
  mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mspace");
    if (group.newLine) {
      node.setAttribute("linebreak", "newline");
      if (group.size) {
        node.setAttribute("height", makeEm(calculateSize(group.size, options)));
      }
    }
    return node;
  }
});
var globalMap = {
  "\\global": "\\global",
  "\\long": "\\\\globallong",
  "\\\\globallong": "\\\\globallong",
  "\\def": "\\gdef",
  "\\gdef": "\\gdef",
  "\\edef": "\\xdef",
  "\\xdef": "\\xdef",
  "\\let": "\\\\globallet",
  "\\futurelet": "\\\\globalfuture"
};
var checkControlSequence = (tok) => {
  var name = tok.text;
  if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
    throw new ParseError("Expected a control sequence", tok);
  }
  return name;
};
var getRHS = (parser) => {
  var tok = parser.gullet.popToken();
  if (tok.text === "=") {
    tok = parser.gullet.popToken();
    if (tok.text === " ") {
      tok = parser.gullet.popToken();
    }
  }
  return tok;
};
var letCommand = (parser, name, tok, global) => {
  var macro = parser.gullet.macros.get(tok.text);
  if (macro == null) {
    tok.noexpand = true;
    macro = {
      tokens: [tok],
      numArgs: 0,
      // reproduce the same behavior in expansion
      unexpandable: !parser.gullet.isExpandable(tok.text)
    };
  }
  parser.gullet.macros.set(name, macro, global);
};
defineFunction({
  type: "internal",
  names: [
    "\\global",
    "\\long",
    "\\\\globallong"
    // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler(_ref) {
    var {
      parser,
      funcName
    } = _ref;
    parser.consumeSpaces();
    var token = parser.fetch();
    if (globalMap[token.text]) {
      if (funcName === "\\global" || funcName === "\\\\globallong") {
        token.text = globalMap[token.text];
      }
      return assertNodeType(parser.parseFunction(), "internal");
    }
    throw new ParseError("Invalid token after macro prefix", token);
  }
});
defineFunction({
  type: "internal",
  names: ["\\def", "\\gdef", "\\edef", "\\xdef"],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler(_ref2) {
    var {
      parser,
      funcName
    } = _ref2;
    var tok = parser.gullet.popToken();
    var name = tok.text;
    if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
      throw new ParseError("Expected a control sequence", tok);
    }
    var numArgs = 0;
    var insert;
    var delimiters2 = [[]];
    while (parser.gullet.future().text !== "{") {
      tok = parser.gullet.popToken();
      if (tok.text === "#") {
        if (parser.gullet.future().text === "{") {
          insert = parser.gullet.future();
          delimiters2[numArgs].push("{");
          break;
        }
        tok = parser.gullet.popToken();
        if (!/^[1-9]$/.test(tok.text)) {
          throw new ParseError('Invalid argument number "' + tok.text + '"');
        }
        if (parseInt(tok.text) !== numArgs + 1) {
          throw new ParseError('Argument number "' + tok.text + '" out of order');
        }
        numArgs++;
        delimiters2.push([]);
      } else if (tok.text === "EOF") {
        throw new ParseError("Expected a macro definition");
      } else {
        delimiters2[numArgs].push(tok.text);
      }
    }
    var {
      tokens
    } = parser.gullet.consumeArg();
    if (insert) {
      tokens.unshift(insert);
    }
    if (funcName === "\\edef" || funcName === "\\xdef") {
      tokens = parser.gullet.expandTokens(tokens);
      tokens.reverse();
    }
    parser.gullet.macros.set(name, {
      tokens,
      numArgs,
      delimiters: delimiters2
    }, funcName === globalMap[funcName]);
    return {
      type: "internal",
      mode: parser.mode
    };
  }
});
defineFunction({
  type: "internal",
  names: [
    "\\let",
    "\\\\globallet"
    // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler(_ref3) {
    var {
      parser,
      funcName
    } = _ref3;
    var name = checkControlSequence(parser.gullet.popToken());
    parser.gullet.consumeSpaces();
    var tok = getRHS(parser);
    letCommand(parser, name, tok, funcName === "\\\\globallet");
    return {
      type: "internal",
      mode: parser.mode
    };
  }
});
defineFunction({
  type: "internal",
  names: [
    "\\futurelet",
    "\\\\globalfuture"
    // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler(_ref4) {
    var {
      parser,
      funcName
    } = _ref4;
    var name = checkControlSequence(parser.gullet.popToken());
    var middle = parser.gullet.popToken();
    var tok = parser.gullet.popToken();
    letCommand(parser, name, tok, funcName === "\\\\globalfuture");
    parser.gullet.pushToken(tok);
    parser.gullet.pushToken(middle);
    return {
      type: "internal",
      mode: parser.mode
    };
  }
});
var getMetrics = function getMetrics2(symbol, font, mode) {
  var replace = symbols.math[symbol] && symbols.math[symbol].replace;
  var metrics = getCharacterMetrics(replace || symbol, font, mode);
  if (!metrics) {
    throw new Error("Unsupported symbol " + symbol + " and font size " + font + ".");
  }
  return metrics;
};
var styleWrap = function styleWrap2(delim, toStyle, options, classes) {
  var newOptions = options.havingBaseStyle(toStyle);
  var span = buildCommon.makeSpan(classes.concat(newOptions.sizingClasses(options)), [delim], options);
  var delimSizeMultiplier = newOptions.sizeMultiplier / options.sizeMultiplier;
  span.height *= delimSizeMultiplier;
  span.depth *= delimSizeMultiplier;
  span.maxFontSize = newOptions.sizeMultiplier;
  return span;
};
var centerSpan = function centerSpan2(span, options, style) {
  var newOptions = options.havingBaseStyle(style);
  var shift = (1 - options.sizeMultiplier / newOptions.sizeMultiplier) * options.fontMetrics().axisHeight;
  span.classes.push("delimcenter");
  span.style.top = makeEm(shift);
  span.height -= shift;
  span.depth += shift;
};
var makeSmallDelim = function makeSmallDelim2(delim, style, center, options, mode, classes) {
  var text2 = buildCommon.makeSymbol(delim, "Main-Regular", mode, options);
  var span = styleWrap(text2, style, options, classes);
  if (center) {
    centerSpan(span, options, style);
  }
  return span;
};
var mathrmSize = function mathrmSize2(value, size, mode, options) {
  return buildCommon.makeSymbol(value, "Size" + size + "-Regular", mode, options);
};
var makeLargeDelim = function makeLargeDelim2(delim, size, center, options, mode, classes) {
  var inner2 = mathrmSize(delim, size, mode, options);
  var span = styleWrap(buildCommon.makeSpan(["delimsizing", "size" + size], [inner2], options), Style$1.TEXT, options, classes);
  if (center) {
    centerSpan(span, options, Style$1.TEXT);
  }
  return span;
};
var makeGlyphSpan = function makeGlyphSpan2(symbol, font, mode) {
  var sizeClass;
  if (font === "Size1-Regular") {
    sizeClass = "delim-size1";
  } else {
    sizeClass = "delim-size4";
  }
  var corner = buildCommon.makeSpan(["delimsizinginner", sizeClass], [buildCommon.makeSpan([], [buildCommon.makeSymbol(symbol, font, mode)])]);
  return {
    type: "elem",
    elem: corner
  };
};
var makeInner = function makeInner2(ch2, height, options) {
  var width = fontMetricsData["Size4-Regular"][ch2.charCodeAt(0)] ? fontMetricsData["Size4-Regular"][ch2.charCodeAt(0)][4] : fontMetricsData["Size1-Regular"][ch2.charCodeAt(0)][4];
  var path2 = new PathNode("inner", innerPath(ch2, Math.round(1e3 * height)));
  var svgNode = new SvgNode([path2], {
    "width": makeEm(width),
    "height": makeEm(height),
    // Override CSS rule `.katex svg { width: 100% }`
    "style": "width:" + makeEm(width),
    "viewBox": "0 0 " + 1e3 * width + " " + Math.round(1e3 * height),
    "preserveAspectRatio": "xMinYMin"
  });
  var span = buildCommon.makeSvgSpan([], [svgNode], options);
  span.height = height;
  span.style.height = makeEm(height);
  span.style.width = makeEm(width);
  return {
    type: "elem",
    elem: span
  };
};
var lapInEms = 8e-3;
var lap = {
  type: "kern",
  size: -1 * lapInEms
};
var verts = ["|", "\\lvert", "\\rvert", "\\vert"];
var doubleVerts = ["\\|", "\\lVert", "\\rVert", "\\Vert"];
var makeStackedDelim = function makeStackedDelim2(delim, heightTotal, center, options, mode, classes) {
  var top;
  var middle;
  var repeat;
  var bottom;
  var svgLabel = "";
  var viewBoxWidth = 0;
  top = repeat = bottom = delim;
  middle = null;
  var font = "Size1-Regular";
  if (delim === "\\uparrow") {
    repeat = bottom = "\u23D0";
  } else if (delim === "\\Uparrow") {
    repeat = bottom = "\u2016";
  } else if (delim === "\\downarrow") {
    top = repeat = "\u23D0";
  } else if (delim === "\\Downarrow") {
    top = repeat = "\u2016";
  } else if (delim === "\\updownarrow") {
    top = "\\uparrow";
    repeat = "\u23D0";
    bottom = "\\downarrow";
  } else if (delim === "\\Updownarrow") {
    top = "\\Uparrow";
    repeat = "\u2016";
    bottom = "\\Downarrow";
  } else if (utils.contains(verts, delim)) {
    repeat = "\u2223";
    svgLabel = "vert";
    viewBoxWidth = 333;
  } else if (utils.contains(doubleVerts, delim)) {
    repeat = "\u2225";
    svgLabel = "doublevert";
    viewBoxWidth = 556;
  } else if (delim === "[" || delim === "\\lbrack") {
    top = "\u23A1";
    repeat = "\u23A2";
    bottom = "\u23A3";
    font = "Size4-Regular";
    svgLabel = "lbrack";
    viewBoxWidth = 667;
  } else if (delim === "]" || delim === "\\rbrack") {
    top = "\u23A4";
    repeat = "\u23A5";
    bottom = "\u23A6";
    font = "Size4-Regular";
    svgLabel = "rbrack";
    viewBoxWidth = 667;
  } else if (delim === "\\lfloor" || delim === "\u230A") {
    repeat = top = "\u23A2";
    bottom = "\u23A3";
    font = "Size4-Regular";
    svgLabel = "lfloor";
    viewBoxWidth = 667;
  } else if (delim === "\\lceil" || delim === "\u2308") {
    top = "\u23A1";
    repeat = bottom = "\u23A2";
    font = "Size4-Regular";
    svgLabel = "lceil";
    viewBoxWidth = 667;
  } else if (delim === "\\rfloor" || delim === "\u230B") {
    repeat = top = "\u23A5";
    bottom = "\u23A6";
    font = "Size4-Regular";
    svgLabel = "rfloor";
    viewBoxWidth = 667;
  } else if (delim === "\\rceil" || delim === "\u2309") {
    top = "\u23A4";
    repeat = bottom = "\u23A5";
    font = "Size4-Regular";
    svgLabel = "rceil";
    viewBoxWidth = 667;
  } else if (delim === "(" || delim === "\\lparen") {
    top = "\u239B";
    repeat = "\u239C";
    bottom = "\u239D";
    font = "Size4-Regular";
    svgLabel = "lparen";
    viewBoxWidth = 875;
  } else if (delim === ")" || delim === "\\rparen") {
    top = "\u239E";
    repeat = "\u239F";
    bottom = "\u23A0";
    font = "Size4-Regular";
    svgLabel = "rparen";
    viewBoxWidth = 875;
  } else if (delim === "\\{" || delim === "\\lbrace") {
    top = "\u23A7";
    middle = "\u23A8";
    bottom = "\u23A9";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\}" || delim === "\\rbrace") {
    top = "\u23AB";
    middle = "\u23AC";
    bottom = "\u23AD";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\lgroup" || delim === "\u27EE") {
    top = "\u23A7";
    bottom = "\u23A9";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\rgroup" || delim === "\u27EF") {
    top = "\u23AB";
    bottom = "\u23AD";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\lmoustache" || delim === "\u23B0") {
    top = "\u23A7";
    bottom = "\u23AD";
    repeat = "\u23AA";
    font = "Size4-Regular";
  } else if (delim === "\\rmoustache" || delim === "\u23B1") {
    top = "\u23AB";
    bottom = "\u23A9";
    repeat = "\u23AA";
    font = "Size4-Regular";
  }
  var topMetrics = getMetrics(top, font, mode);
  var topHeightTotal = topMetrics.height + topMetrics.depth;
  var repeatMetrics = getMetrics(repeat, font, mode);
  var repeatHeightTotal = repeatMetrics.height + repeatMetrics.depth;
  var bottomMetrics = getMetrics(bottom, font, mode);
  var bottomHeightTotal = bottomMetrics.height + bottomMetrics.depth;
  var middleHeightTotal = 0;
  var middleFactor = 1;
  if (middle !== null) {
    var middleMetrics = getMetrics(middle, font, mode);
    middleHeightTotal = middleMetrics.height + middleMetrics.depth;
    middleFactor = 2;
  }
  var minHeight = topHeightTotal + bottomHeightTotal + middleHeightTotal;
  var repeatCount = Math.max(0, Math.ceil((heightTotal - minHeight) / (middleFactor * repeatHeightTotal)));
  var realHeightTotal = minHeight + repeatCount * middleFactor * repeatHeightTotal;
  var axisHeight = options.fontMetrics().axisHeight;
  if (center) {
    axisHeight *= options.sizeMultiplier;
  }
  var depth = realHeightTotal / 2 - axisHeight;
  var stack = [];
  if (svgLabel.length > 0) {
    var midHeight = realHeightTotal - topHeightTotal - bottomHeightTotal;
    var viewBoxHeight = Math.round(realHeightTotal * 1e3);
    var pathStr = tallDelim(svgLabel, Math.round(midHeight * 1e3));
    var path2 = new PathNode(svgLabel, pathStr);
    var width = (viewBoxWidth / 1e3).toFixed(3) + "em";
    var height = (viewBoxHeight / 1e3).toFixed(3) + "em";
    var svg = new SvgNode([path2], {
      "width": width,
      "height": height,
      "viewBox": "0 0 " + viewBoxWidth + " " + viewBoxHeight
    });
    var wrapper = buildCommon.makeSvgSpan([], [svg], options);
    wrapper.height = viewBoxHeight / 1e3;
    wrapper.style.width = width;
    wrapper.style.height = height;
    stack.push({
      type: "elem",
      elem: wrapper
    });
  } else {
    stack.push(makeGlyphSpan(bottom, font, mode));
    stack.push(lap);
    if (middle === null) {
      var innerHeight = realHeightTotal - topHeightTotal - bottomHeightTotal + 2 * lapInEms;
      stack.push(makeInner(repeat, innerHeight, options));
    } else {
      var _innerHeight = (realHeightTotal - topHeightTotal - bottomHeightTotal - middleHeightTotal) / 2 + 2 * lapInEms;
      stack.push(makeInner(repeat, _innerHeight, options));
      stack.push(lap);
      stack.push(makeGlyphSpan(middle, font, mode));
      stack.push(lap);
      stack.push(makeInner(repeat, _innerHeight, options));
    }
    stack.push(lap);
    stack.push(makeGlyphSpan(top, font, mode));
  }
  var newOptions = options.havingBaseStyle(Style$1.TEXT);
  var inner2 = buildCommon.makeVList({
    positionType: "bottom",
    positionData: depth,
    children: stack
  }, newOptions);
  return styleWrap(buildCommon.makeSpan(["delimsizing", "mult"], [inner2], newOptions), Style$1.TEXT, options, classes);
};
var vbPad = 80;
var emPad = 0.08;
var sqrtSvg = function sqrtSvg2(sqrtName, height, viewBoxHeight, extraVinculum, options) {
  var path2 = sqrtPath(sqrtName, extraVinculum, viewBoxHeight);
  var pathNode = new PathNode(sqrtName, path2);
  var svg = new SvgNode([pathNode], {
    // Note: 1000:1 ratio of viewBox to document em width.
    "width": "400em",
    "height": makeEm(height),
    "viewBox": "0 0 400000 " + viewBoxHeight,
    "preserveAspectRatio": "xMinYMin slice"
  });
  return buildCommon.makeSvgSpan(["hide-tail"], [svg], options);
};
var makeSqrtImage = function makeSqrtImage2(height, options) {
  var newOptions = options.havingBaseSizing();
  var delim = traverseSequence("\\surd", height * newOptions.sizeMultiplier, stackLargeDelimiterSequence, newOptions);
  var sizeMultiplier = newOptions.sizeMultiplier;
  var extraVinculum = Math.max(0, options.minRuleThickness - options.fontMetrics().sqrtRuleThickness);
  var span;
  var spanHeight = 0;
  var texHeight = 0;
  var viewBoxHeight = 0;
  var advanceWidth;
  if (delim.type === "small") {
    viewBoxHeight = 1e3 + 1e3 * extraVinculum + vbPad;
    if (height < 1) {
      sizeMultiplier = 1;
    } else if (height < 1.4) {
      sizeMultiplier = 0.7;
    }
    spanHeight = (1 + extraVinculum + emPad) / sizeMultiplier;
    texHeight = (1 + extraVinculum) / sizeMultiplier;
    span = sqrtSvg("sqrtMain", spanHeight, viewBoxHeight, extraVinculum, options);
    span.style.minWidth = "0.853em";
    advanceWidth = 0.833 / sizeMultiplier;
  } else if (delim.type === "large") {
    viewBoxHeight = (1e3 + vbPad) * sizeToMaxHeight[delim.size];
    texHeight = (sizeToMaxHeight[delim.size] + extraVinculum) / sizeMultiplier;
    spanHeight = (sizeToMaxHeight[delim.size] + extraVinculum + emPad) / sizeMultiplier;
    span = sqrtSvg("sqrtSize" + delim.size, spanHeight, viewBoxHeight, extraVinculum, options);
    span.style.minWidth = "1.02em";
    advanceWidth = 1 / sizeMultiplier;
  } else {
    spanHeight = height + extraVinculum + emPad;
    texHeight = height + extraVinculum;
    viewBoxHeight = Math.floor(1e3 * height + extraVinculum) + vbPad;
    span = sqrtSvg("sqrtTall", spanHeight, viewBoxHeight, extraVinculum, options);
    span.style.minWidth = "0.742em";
    advanceWidth = 1.056;
  }
  span.height = texHeight;
  span.style.height = makeEm(spanHeight);
  return {
    span,
    advanceWidth,
    // Calculate the actual line width.
    // This actually should depend on the chosen font -- e.g. \boldmath
    // should use the thicker surd symbols from e.g. KaTeX_Main-Bold, and
    // have thicker rules.
    ruleWidth: (options.fontMetrics().sqrtRuleThickness + extraVinculum) * sizeMultiplier
  };
};
var stackLargeDelimiters = ["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "\u230A", "\u230B", "\\lceil", "\\rceil", "\u2308", "\u2309", "\\surd"];
var stackAlwaysDelimiters = ["\\uparrow", "\\downarrow", "\\updownarrow", "\\Uparrow", "\\Downarrow", "\\Updownarrow", "|", "\\|", "\\vert", "\\Vert", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "\u27EE", "\u27EF", "\\lmoustache", "\\rmoustache", "\u23B0", "\u23B1"];
var stackNeverDelimiters = ["<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt"];
var sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3];
var makeSizedDelim = function makeSizedDelim2(delim, size, options, mode, classes) {
  if (delim === "<" || delim === "\\lt" || delim === "\u27E8") {
    delim = "\\langle";
  } else if (delim === ">" || delim === "\\gt" || delim === "\u27E9") {
    delim = "\\rangle";
  }
  if (utils.contains(stackLargeDelimiters, delim) || utils.contains(stackNeverDelimiters, delim)) {
    return makeLargeDelim(delim, size, false, options, mode, classes);
  } else if (utils.contains(stackAlwaysDelimiters, delim)) {
    return makeStackedDelim(delim, sizeToMaxHeight[size], false, options, mode, classes);
  } else {
    throw new ParseError("Illegal delimiter: '" + delim + "'");
  }
};
var stackNeverDelimiterSequence = [{
  type: "small",
  style: Style$1.SCRIPTSCRIPT
}, {
  type: "small",
  style: Style$1.SCRIPT
}, {
  type: "small",
  style: Style$1.TEXT
}, {
  type: "large",
  size: 1
}, {
  type: "large",
  size: 2
}, {
  type: "large",
  size: 3
}, {
  type: "large",
  size: 4
}];
var stackAlwaysDelimiterSequence = [{
  type: "small",
  style: Style$1.SCRIPTSCRIPT
}, {
  type: "small",
  style: Style$1.SCRIPT
}, {
  type: "small",
  style: Style$1.TEXT
}, {
  type: "stack"
}];
var stackLargeDelimiterSequence = [{
  type: "small",
  style: Style$1.SCRIPTSCRIPT
}, {
  type: "small",
  style: Style$1.SCRIPT
}, {
  type: "small",
  style: Style$1.TEXT
}, {
  type: "large",
  size: 1
}, {
  type: "large",
  size: 2
}, {
  type: "large",
  size: 3
}, {
  type: "large",
  size: 4
}, {
  type: "stack"
}];
var delimTypeToFont = function delimTypeToFont2(type) {
  if (type.type === "small") {
    return "Main-Regular";
  } else if (type.type === "large") {
    return "Size" + type.size + "-Regular";
  } else if (type.type === "stack") {
    return "Size4-Regular";
  } else {
    throw new Error("Add support for delim type '" + type.type + "' here.");
  }
};
var traverseSequence = function traverseSequence2(delim, height, sequence, options) {
  var start = Math.min(2, 3 - options.style.size);
  for (var i2 = start; i2 < sequence.length; i2++) {
    if (sequence[i2].type === "stack") {
      break;
    }
    var metrics = getMetrics(delim, delimTypeToFont(sequence[i2]), "math");
    var heightDepth = metrics.height + metrics.depth;
    if (sequence[i2].type === "small") {
      var newOptions = options.havingBaseStyle(sequence[i2].style);
      heightDepth *= newOptions.sizeMultiplier;
    }
    if (heightDepth > height) {
      return sequence[i2];
    }
  }
  return sequence[sequence.length - 1];
};
var makeCustomSizedDelim = function makeCustomSizedDelim2(delim, height, center, options, mode, classes) {
  if (delim === "<" || delim === "\\lt" || delim === "\u27E8") {
    delim = "\\langle";
  } else if (delim === ">" || delim === "\\gt" || delim === "\u27E9") {
    delim = "\\rangle";
  }
  var sequence;
  if (utils.contains(stackNeverDelimiters, delim)) {
    sequence = stackNeverDelimiterSequence;
  } else if (utils.contains(stackLargeDelimiters, delim)) {
    sequence = stackLargeDelimiterSequence;
  } else {
    sequence = stackAlwaysDelimiterSequence;
  }
  var delimType = traverseSequence(delim, height, sequence, options);
  if (delimType.type === "small") {
    return makeSmallDelim(delim, delimType.style, center, options, mode, classes);
  } else if (delimType.type === "large") {
    return makeLargeDelim(delim, delimType.size, center, options, mode, classes);
  } else {
    return makeStackedDelim(delim, height, center, options, mode, classes);
  }
};
var makeLeftRightDelim = function makeLeftRightDelim2(delim, height, depth, options, mode, classes) {
  var axisHeight = options.fontMetrics().axisHeight * options.sizeMultiplier;
  var delimiterFactor = 901;
  var delimiterExtend = 5 / options.fontMetrics().ptPerEm;
  var maxDistFromAxis = Math.max(height - axisHeight, depth + axisHeight);
  var totalHeight = Math.max(
    // In real TeX, calculations are done using integral values which are
    // 65536 per pt, or 655360 per em. So, the division here truncates in
    // TeX but doesn't here, producing different results. If we wanted to
    // exactly match TeX's calculation, we could do
    //   Math.floor(655360 * maxDistFromAxis / 500) *
    //    delimiterFactor / 655360
    // (To see the difference, compare
    //    x^{x^{\left(\rule{0.1em}{0.68em}\right)}}
    // in TeX and KaTeX)
    maxDistFromAxis / 500 * delimiterFactor,
    2 * maxDistFromAxis - delimiterExtend
  );
  return makeCustomSizedDelim(delim, totalHeight, true, options, mode, classes);
};
var delimiter = {
  sqrtImage: makeSqrtImage,
  sizedDelim: makeSizedDelim,
  sizeToMaxHeight,
  customSizedDelim: makeCustomSizedDelim,
  leftRightDelim: makeLeftRightDelim
};
var delimiterSizes = {
  "\\bigl": {
    mclass: "mopen",
    size: 1
  },
  "\\Bigl": {
    mclass: "mopen",
    size: 2
  },
  "\\biggl": {
    mclass: "mopen",
    size: 3
  },
  "\\Biggl": {
    mclass: "mopen",
    size: 4
  },
  "\\bigr": {
    mclass: "mclose",
    size: 1
  },
  "\\Bigr": {
    mclass: "mclose",
    size: 2
  },
  "\\biggr": {
    mclass: "mclose",
    size: 3
  },
  "\\Biggr": {
    mclass: "mclose",
    size: 4
  },
  "\\bigm": {
    mclass: "mrel",
    size: 1
  },
  "\\Bigm": {
    mclass: "mrel",
    size: 2
  },
  "\\biggm": {
    mclass: "mrel",
    size: 3
  },
  "\\Biggm": {
    mclass: "mrel",
    size: 4
  },
  "\\big": {
    mclass: "mord",
    size: 1
  },
  "\\Big": {
    mclass: "mord",
    size: 2
  },
  "\\bigg": {
    mclass: "mord",
    size: 3
  },
  "\\Bigg": {
    mclass: "mord",
    size: 4
  }
};
var delimiters = ["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "\u230A", "\u230B", "\\lceil", "\\rceil", "\u2308", "\u2309", "<", ">", "\\langle", "\u27E8", "\\rangle", "\u27E9", "\\lt", "\\gt", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "\u27EE", "\u27EF", "\\lmoustache", "\\rmoustache", "\u23B0", "\u23B1", "/", "\\backslash", "|", "\\vert", "\\|", "\\Vert", "\\uparrow", "\\Uparrow", "\\downarrow", "\\Downarrow", "\\updownarrow", "\\Updownarrow", "."];
function checkDelimiter(delim, context) {
  var symDelim = checkSymbolNodeType(delim);
  if (symDelim && utils.contains(delimiters, symDelim.text)) {
    return symDelim;
  } else if (symDelim) {
    throw new ParseError("Invalid delimiter '" + symDelim.text + "' after '" + context.funcName + "'", delim);
  } else {
    throw new ParseError("Invalid delimiter type '" + delim.type + "'", delim);
  }
}
defineFunction({
  type: "delimsizing",
  names: ["\\bigl", "\\Bigl", "\\biggl", "\\Biggl", "\\bigr", "\\Bigr", "\\biggr", "\\Biggr", "\\bigm", "\\Bigm", "\\biggm", "\\Biggm", "\\big", "\\Big", "\\bigg", "\\Bigg"],
  props: {
    numArgs: 1,
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    var delim = checkDelimiter(args[0], context);
    return {
      type: "delimsizing",
      mode: context.parser.mode,
      size: delimiterSizes[context.funcName].size,
      mclass: delimiterSizes[context.funcName].mclass,
      delim: delim.text
    };
  },
  htmlBuilder: (group, options) => {
    if (group.delim === ".") {
      return buildCommon.makeSpan([group.mclass]);
    }
    return delimiter.sizedDelim(group.delim, group.size, options, group.mode, [group.mclass]);
  },
  mathmlBuilder: (group) => {
    var children = [];
    if (group.delim !== ".") {
      children.push(makeText(group.delim, group.mode));
    }
    var node = new mathMLTree.MathNode("mo", children);
    if (group.mclass === "mopen" || group.mclass === "mclose") {
      node.setAttribute("fence", "true");
    } else {
      node.setAttribute("fence", "false");
    }
    node.setAttribute("stretchy", "true");
    var size = makeEm(delimiter.sizeToMaxHeight[group.size]);
    node.setAttribute("minsize", size);
    node.setAttribute("maxsize", size);
    return node;
  }
});
function assertParsed(group) {
  if (!group.body) {
    throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
  }
}
defineFunction({
  type: "leftright-right",
  names: ["\\right"],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler: (context, args) => {
    var color = context.parser.gullet.macros.get("\\current@color");
    if (color && typeof color !== "string") {
      throw new ParseError("\\current@color set to non-string in \\right");
    }
    return {
      type: "leftright-right",
      mode: context.parser.mode,
      delim: checkDelimiter(args[0], context).text,
      color
      // undefined if not set via \color
    };
  }
});
defineFunction({
  type: "leftright",
  names: ["\\left"],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler: (context, args) => {
    var delim = checkDelimiter(args[0], context);
    var parser = context.parser;
    ++parser.leftrightDepth;
    var body = parser.parseExpression(false);
    --parser.leftrightDepth;
    parser.expect("\\right", false);
    var right = assertNodeType(parser.parseFunction(), "leftright-right");
    return {
      type: "leftright",
      mode: parser.mode,
      body,
      left: delim.text,
      right: right.delim,
      rightColor: right.color
    };
  },
  htmlBuilder: (group, options) => {
    assertParsed(group);
    var inner2 = buildExpression$1(group.body, options, true, ["mopen", "mclose"]);
    var innerHeight = 0;
    var innerDepth = 0;
    var hadMiddle = false;
    for (var i2 = 0; i2 < inner2.length; i2++) {
      if (inner2[i2].isMiddle) {
        hadMiddle = true;
      } else {
        innerHeight = Math.max(inner2[i2].height, innerHeight);
        innerDepth = Math.max(inner2[i2].depth, innerDepth);
      }
    }
    innerHeight *= options.sizeMultiplier;
    innerDepth *= options.sizeMultiplier;
    var leftDelim;
    if (group.left === ".") {
      leftDelim = makeNullDelimiter(options, ["mopen"]);
    } else {
      leftDelim = delimiter.leftRightDelim(group.left, innerHeight, innerDepth, options, group.mode, ["mopen"]);
    }
    inner2.unshift(leftDelim);
    if (hadMiddle) {
      for (var _i6 = 1; _i6 < inner2.length; _i6++) {
        var middleDelim = inner2[_i6];
        var isMiddle = middleDelim.isMiddle;
        if (isMiddle) {
          inner2[_i6] = delimiter.leftRightDelim(isMiddle.delim, innerHeight, innerDepth, isMiddle.options, group.mode, []);
        }
      }
    }
    var rightDelim;
    if (group.right === ".") {
      rightDelim = makeNullDelimiter(options, ["mclose"]);
    } else {
      var colorOptions = group.rightColor ? options.withColor(group.rightColor) : options;
      rightDelim = delimiter.leftRightDelim(group.right, innerHeight, innerDepth, colorOptions, group.mode, ["mclose"]);
    }
    inner2.push(rightDelim);
    return buildCommon.makeSpan(["minner"], inner2, options);
  },
  mathmlBuilder: (group, options) => {
    assertParsed(group);
    var inner2 = buildExpression2(group.body, options);
    if (group.left !== ".") {
      var leftNode = new mathMLTree.MathNode("mo", [makeText(group.left, group.mode)]);
      leftNode.setAttribute("fence", "true");
      inner2.unshift(leftNode);
    }
    if (group.right !== ".") {
      var rightNode = new mathMLTree.MathNode("mo", [makeText(group.right, group.mode)]);
      rightNode.setAttribute("fence", "true");
      if (group.rightColor) {
        rightNode.setAttribute("mathcolor", group.rightColor);
      }
      inner2.push(rightNode);
    }
    return makeRow(inner2);
  }
});
defineFunction({
  type: "middle",
  names: ["\\middle"],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler: (context, args) => {
    var delim = checkDelimiter(args[0], context);
    if (!context.parser.leftrightDepth) {
      throw new ParseError("\\middle without preceding \\left", delim);
    }
    return {
      type: "middle",
      mode: context.parser.mode,
      delim: delim.text
    };
  },
  htmlBuilder: (group, options) => {
    var middleDelim;
    if (group.delim === ".") {
      middleDelim = makeNullDelimiter(options, []);
    } else {
      middleDelim = delimiter.sizedDelim(group.delim, 1, options, group.mode, []);
      var isMiddle = {
        delim: group.delim,
        options
      };
      middleDelim.isMiddle = isMiddle;
    }
    return middleDelim;
  },
  mathmlBuilder: (group, options) => {
    var textNode = group.delim === "\\vert" || group.delim === "|" ? makeText("|", "text") : makeText(group.delim, group.mode);
    var middleNode = new mathMLTree.MathNode("mo", [textNode]);
    middleNode.setAttribute("fence", "true");
    middleNode.setAttribute("lspace", "0.05em");
    middleNode.setAttribute("rspace", "0.05em");
    return middleNode;
  }
});
var htmlBuilder$7 = (group, options) => {
  var inner2 = buildCommon.wrapFragment(buildGroup$1(group.body, options), options);
  var label = group.label.slice(1);
  var scale = options.sizeMultiplier;
  var img;
  var imgShift = 0;
  var isSingleChar = utils.isCharacterBox(group.body);
  if (label === "sout") {
    img = buildCommon.makeSpan(["stretchy", "sout"]);
    img.height = options.fontMetrics().defaultRuleThickness / scale;
    imgShift = -0.5 * options.fontMetrics().xHeight;
  } else if (label === "phase") {
    var lineWeight = calculateSize({
      number: 0.6,
      unit: "pt"
    }, options);
    var clearance = calculateSize({
      number: 0.35,
      unit: "ex"
    }, options);
    var newOptions = options.havingBaseSizing();
    scale = scale / newOptions.sizeMultiplier;
    var angleHeight = inner2.height + inner2.depth + lineWeight + clearance;
    inner2.style.paddingLeft = makeEm(angleHeight / 2 + lineWeight);
    var viewBoxHeight = Math.floor(1e3 * angleHeight * scale);
    var path2 = phasePath(viewBoxHeight);
    var svgNode = new SvgNode([new PathNode("phase", path2)], {
      "width": "400em",
      "height": makeEm(viewBoxHeight / 1e3),
      "viewBox": "0 0 400000 " + viewBoxHeight,
      "preserveAspectRatio": "xMinYMin slice"
    });
    img = buildCommon.makeSvgSpan(["hide-tail"], [svgNode], options);
    img.style.height = makeEm(angleHeight);
    imgShift = inner2.depth + lineWeight + clearance;
  } else {
    if (/cancel/.test(label)) {
      if (!isSingleChar) {
        inner2.classes.push("cancel-pad");
      }
    } else if (label === "angl") {
      inner2.classes.push("anglpad");
    } else {
      inner2.classes.push("boxpad");
    }
    var topPad = 0;
    var bottomPad = 0;
    var ruleThickness = 0;
    if (/box/.test(label)) {
      ruleThickness = Math.max(
        options.fontMetrics().fboxrule,
        // default
        options.minRuleThickness
        // User override.
      );
      topPad = options.fontMetrics().fboxsep + (label === "colorbox" ? 0 : ruleThickness);
      bottomPad = topPad;
    } else if (label === "angl") {
      ruleThickness = Math.max(options.fontMetrics().defaultRuleThickness, options.minRuleThickness);
      topPad = 4 * ruleThickness;
      bottomPad = Math.max(0, 0.25 - inner2.depth);
    } else {
      topPad = isSingleChar ? 0.2 : 0;
      bottomPad = topPad;
    }
    img = stretchy.encloseSpan(inner2, label, topPad, bottomPad, options);
    if (/fbox|boxed|fcolorbox/.test(label)) {
      img.style.borderStyle = "solid";
      img.style.borderWidth = makeEm(ruleThickness);
    } else if (label === "angl" && ruleThickness !== 0.049) {
      img.style.borderTopWidth = makeEm(ruleThickness);
      img.style.borderRightWidth = makeEm(ruleThickness);
    }
    imgShift = inner2.depth + bottomPad;
    if (group.backgroundColor) {
      img.style.backgroundColor = group.backgroundColor;
      if (group.borderColor) {
        img.style.borderColor = group.borderColor;
      }
    }
  }
  var vlist;
  if (group.backgroundColor) {
    vlist = buildCommon.makeVList({
      positionType: "individualShift",
      children: [
        // Put the color background behind inner;
        {
          type: "elem",
          elem: img,
          shift: imgShift
        },
        {
          type: "elem",
          elem: inner2,
          shift: 0
        }
      ]
    }, options);
  } else {
    var classes = /cancel|phase/.test(label) ? ["svg-align"] : [];
    vlist = buildCommon.makeVList({
      positionType: "individualShift",
      children: [
        // Write the \cancel stroke on top of inner.
        {
          type: "elem",
          elem: inner2,
          shift: 0
        },
        {
          type: "elem",
          elem: img,
          shift: imgShift,
          wrapperClasses: classes
        }
      ]
    }, options);
  }
  if (/cancel/.test(label)) {
    vlist.height = inner2.height;
    vlist.depth = inner2.depth;
  }
  if (/cancel/.test(label) && !isSingleChar) {
    return buildCommon.makeSpan(["mord", "cancel-lap"], [vlist], options);
  } else {
    return buildCommon.makeSpan(["mord"], [vlist], options);
  }
};
var mathmlBuilder$6 = (group, options) => {
  var fboxsep = 0;
  var node = new mathMLTree.MathNode(group.label.indexOf("colorbox") > -1 ? "mpadded" : "menclose", [buildGroup2(group.body, options)]);
  switch (group.label) {
    case "\\cancel":
      node.setAttribute("notation", "updiagonalstrike");
      break;
    case "\\bcancel":
      node.setAttribute("notation", "downdiagonalstrike");
      break;
    case "\\phase":
      node.setAttribute("notation", "phasorangle");
      break;
    case "\\sout":
      node.setAttribute("notation", "horizontalstrike");
      break;
    case "\\fbox":
      node.setAttribute("notation", "box");
      break;
    case "\\angl":
      node.setAttribute("notation", "actuarial");
      break;
    case "\\fcolorbox":
    case "\\colorbox":
      fboxsep = options.fontMetrics().fboxsep * options.fontMetrics().ptPerEm;
      node.setAttribute("width", "+" + 2 * fboxsep + "pt");
      node.setAttribute("height", "+" + 2 * fboxsep + "pt");
      node.setAttribute("lspace", fboxsep + "pt");
      node.setAttribute("voffset", fboxsep + "pt");
      if (group.label === "\\fcolorbox") {
        var thk = Math.max(
          options.fontMetrics().fboxrule,
          // default
          options.minRuleThickness
          // user override
        );
        node.setAttribute("style", "border: " + thk + "em solid " + String(group.borderColor));
      }
      break;
    case "\\xcancel":
      node.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
      break;
  }
  if (group.backgroundColor) {
    node.setAttribute("mathbackground", group.backgroundColor);
  }
  return node;
};
defineFunction({
  type: "enclose",
  names: ["\\colorbox"],
  props: {
    numArgs: 2,
    allowedInText: true,
    argTypes: ["color", "text"]
  },
  handler(_ref, args, optArgs) {
    var {
      parser,
      funcName
    } = _ref;
    var color = assertNodeType(args[0], "color-token").color;
    var body = args[1];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      backgroundColor: color,
      body
    };
  },
  htmlBuilder: htmlBuilder$7,
  mathmlBuilder: mathmlBuilder$6
});
defineFunction({
  type: "enclose",
  names: ["\\fcolorbox"],
  props: {
    numArgs: 3,
    allowedInText: true,
    argTypes: ["color", "color", "text"]
  },
  handler(_ref2, args, optArgs) {
    var {
      parser,
      funcName
    } = _ref2;
    var borderColor = assertNodeType(args[0], "color-token").color;
    var backgroundColor = assertNodeType(args[1], "color-token").color;
    var body = args[2];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      backgroundColor,
      borderColor,
      body
    };
  },
  htmlBuilder: htmlBuilder$7,
  mathmlBuilder: mathmlBuilder$6
});
defineFunction({
  type: "enclose",
  names: ["\\fbox"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: true
  },
  handler(_ref3, args) {
    var {
      parser
    } = _ref3;
    return {
      type: "enclose",
      mode: parser.mode,
      label: "\\fbox",
      body: args[0]
    };
  }
});
defineFunction({
  type: "enclose",
  names: ["\\cancel", "\\bcancel", "\\xcancel", "\\sout", "\\phase"],
  props: {
    numArgs: 1
  },
  handler(_ref4, args) {
    var {
      parser,
      funcName
    } = _ref4;
    var body = args[0];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      body
    };
  },
  htmlBuilder: htmlBuilder$7,
  mathmlBuilder: mathmlBuilder$6
});
defineFunction({
  type: "enclose",
  names: ["\\angl"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: false
  },
  handler(_ref5, args) {
    var {
      parser
    } = _ref5;
    return {
      type: "enclose",
      mode: parser.mode,
      label: "\\angl",
      body: args[0]
    };
  }
});
var _environments = {};
function defineEnvironment(_ref) {
  var {
    type,
    names,
    props,
    handler,
    htmlBuilder: htmlBuilder3,
    mathmlBuilder: mathmlBuilder3
  } = _ref;
  var data = {
    type,
    numArgs: props.numArgs || 0,
    allowedInText: false,
    numOptionalArgs: 0,
    handler
  };
  for (var i2 = 0; i2 < names.length; ++i2) {
    _environments[names[i2]] = data;
  }
  if (htmlBuilder3) {
    _htmlGroupBuilders[type] = htmlBuilder3;
  }
  if (mathmlBuilder3) {
    _mathmlGroupBuilders[type] = mathmlBuilder3;
  }
}
var _macros = {};
function defineMacro(name, body) {
  _macros[name] = body;
}
function getHLines(parser) {
  var hlineInfo = [];
  parser.consumeSpaces();
  var nxt = parser.fetch().text;
  if (nxt === "\\relax") {
    parser.consume();
    parser.consumeSpaces();
    nxt = parser.fetch().text;
  }
  while (nxt === "\\hline" || nxt === "\\hdashline") {
    parser.consume();
    hlineInfo.push(nxt === "\\hdashline");
    parser.consumeSpaces();
    nxt = parser.fetch().text;
  }
  return hlineInfo;
}
var validateAmsEnvironmentContext = (context) => {
  var settings = context.parser.settings;
  if (!settings.displayMode) {
    throw new ParseError("{" + context.envName + "} can be used only in display mode.");
  }
};
function getAutoTag(name) {
  if (name.indexOf("ed") === -1) {
    return name.indexOf("*") === -1;
  }
}
function parseArray(parser, _ref, style) {
  var {
    hskipBeforeAndAfter,
    addJot,
    cols,
    arraystretch,
    colSeparationType,
    autoTag,
    singleRow,
    emptySingleRow,
    maxNumCols,
    leqno
  } = _ref;
  parser.gullet.beginGroup();
  if (!singleRow) {
    parser.gullet.macros.set("\\cr", "\\\\\\relax");
  }
  if (!arraystretch) {
    var stretch = parser.gullet.expandMacroAsText("\\arraystretch");
    if (stretch == null) {
      arraystretch = 1;
    } else {
      arraystretch = parseFloat(stretch);
      if (!arraystretch || arraystretch < 0) {
        throw new ParseError("Invalid \\arraystretch: " + stretch);
      }
    }
  }
  parser.gullet.beginGroup();
  var row = [];
  var body = [row];
  var rowGaps = [];
  var hLinesBeforeRow = [];
  var tags = autoTag != null ? [] : void 0;
  function beginRow() {
    if (autoTag) {
      parser.gullet.macros.set("\\@eqnsw", "1", true);
    }
  }
  function endRow() {
    if (tags) {
      if (parser.gullet.macros.get("\\df@tag")) {
        tags.push(parser.subparse([new Token("\\df@tag")]));
        parser.gullet.macros.set("\\df@tag", void 0, true);
      } else {
        tags.push(Boolean(autoTag) && parser.gullet.macros.get("\\@eqnsw") === "1");
      }
    }
  }
  beginRow();
  hLinesBeforeRow.push(getHLines(parser));
  while (true) {
    var cell = parser.parseExpression(false, singleRow ? "\\end" : "\\\\");
    parser.gullet.endGroup();
    parser.gullet.beginGroup();
    cell = {
      type: "ordgroup",
      mode: parser.mode,
      body: cell
    };
    if (style) {
      cell = {
        type: "styling",
        mode: parser.mode,
        style,
        body: [cell]
      };
    }
    row.push(cell);
    var next = parser.fetch().text;
    if (next === "&") {
      if (maxNumCols && row.length === maxNumCols) {
        if (singleRow || colSeparationType) {
          throw new ParseError("Too many tab characters: &", parser.nextToken);
        } else {
          parser.settings.reportNonstrict("textEnv", "Too few columns specified in the {array} column argument.");
        }
      }
      parser.consume();
    } else if (next === "\\end") {
      endRow();
      if (row.length === 1 && cell.type === "styling" && cell.body[0].body.length === 0 && (body.length > 1 || !emptySingleRow)) {
        body.pop();
      }
      if (hLinesBeforeRow.length < body.length + 1) {
        hLinesBeforeRow.push([]);
      }
      break;
    } else if (next === "\\\\") {
      parser.consume();
      var size = void 0;
      if (parser.gullet.future().text !== " ") {
        size = parser.parseSizeGroup(true);
      }
      rowGaps.push(size ? size.value : null);
      endRow();
      hLinesBeforeRow.push(getHLines(parser));
      row = [];
      body.push(row);
      beginRow();
    } else {
      throw new ParseError("Expected & or \\\\ or \\cr or \\end", parser.nextToken);
    }
  }
  parser.gullet.endGroup();
  parser.gullet.endGroup();
  return {
    type: "array",
    mode: parser.mode,
    addJot,
    arraystretch,
    body,
    cols,
    rowGaps,
    hskipBeforeAndAfter,
    hLinesBeforeRow,
    colSeparationType,
    tags,
    leqno
  };
}
function dCellStyle(envName) {
  if (envName.slice(0, 1) === "d") {
    return "display";
  } else {
    return "text";
  }
}
var htmlBuilder$6 = function htmlBuilder(group, options) {
  var r;
  var c;
  var nr = group.body.length;
  var hLinesBeforeRow = group.hLinesBeforeRow;
  var nc = 0;
  var body = new Array(nr);
  var hlines = [];
  var ruleThickness = Math.max(
    // From LaTeX \showthe\arrayrulewidth. Equals 0.04 em.
    options.fontMetrics().arrayRuleWidth,
    options.minRuleThickness
    // User override.
  );
  var pt = 1 / options.fontMetrics().ptPerEm;
  var arraycolsep = 5 * pt;
  if (group.colSeparationType && group.colSeparationType === "small") {
    var localMultiplier = options.havingStyle(Style$1.SCRIPT).sizeMultiplier;
    arraycolsep = 0.2778 * (localMultiplier / options.sizeMultiplier);
  }
  var baselineskip = group.colSeparationType === "CD" ? calculateSize({
    number: 3,
    unit: "ex"
  }, options) : 12 * pt;
  var jot = 3 * pt;
  var arrayskip = group.arraystretch * baselineskip;
  var arstrutHeight = 0.7 * arrayskip;
  var arstrutDepth = 0.3 * arrayskip;
  var totalHeight = 0;
  function setHLinePos(hlinesInGap) {
    for (var i2 = 0; i2 < hlinesInGap.length; ++i2) {
      if (i2 > 0) {
        totalHeight += 0.25;
      }
      hlines.push({
        pos: totalHeight,
        isDashed: hlinesInGap[i2]
      });
    }
  }
  setHLinePos(hLinesBeforeRow[0]);
  for (r = 0; r < group.body.length; ++r) {
    var inrow = group.body[r];
    var height = arstrutHeight;
    var depth = arstrutDepth;
    if (nc < inrow.length) {
      nc = inrow.length;
    }
    var outrow = new Array(inrow.length);
    for (c = 0; c < inrow.length; ++c) {
      var elt = buildGroup$1(inrow[c], options);
      if (depth < elt.depth) {
        depth = elt.depth;
      }
      if (height < elt.height) {
        height = elt.height;
      }
      outrow[c] = elt;
    }
    var rowGap = group.rowGaps[r];
    var gap = 0;
    if (rowGap) {
      gap = calculateSize(rowGap, options);
      if (gap > 0) {
        gap += arstrutDepth;
        if (depth < gap) {
          depth = gap;
        }
        gap = 0;
      }
    }
    if (group.addJot) {
      depth += jot;
    }
    outrow.height = height;
    outrow.depth = depth;
    totalHeight += height;
    outrow.pos = totalHeight;
    totalHeight += depth + gap;
    body[r] = outrow;
    setHLinePos(hLinesBeforeRow[r + 1]);
  }
  var offset = totalHeight / 2 + options.fontMetrics().axisHeight;
  var colDescriptions = group.cols || [];
  var cols = [];
  var colSep;
  var colDescrNum;
  var tagSpans = [];
  if (group.tags && group.tags.some((tag2) => tag2)) {
    for (r = 0; r < nr; ++r) {
      var rw = body[r];
      var shift = rw.pos - offset;
      var tag = group.tags[r];
      var tagSpan = void 0;
      if (tag === true) {
        tagSpan = buildCommon.makeSpan(["eqn-num"], [], options);
      } else if (tag === false) {
        tagSpan = buildCommon.makeSpan([], [], options);
      } else {
        tagSpan = buildCommon.makeSpan([], buildExpression$1(tag, options, true), options);
      }
      tagSpan.depth = rw.depth;
      tagSpan.height = rw.height;
      tagSpans.push({
        type: "elem",
        elem: tagSpan,
        shift
      });
    }
  }
  for (
    c = 0, colDescrNum = 0;
    // Continue while either there are more columns or more column
    // descriptions, so trailing separators don't get lost.
    c < nc || colDescrNum < colDescriptions.length;
    ++c, ++colDescrNum
  ) {
    var colDescr = colDescriptions[colDescrNum] || {};
    var firstSeparator = true;
    while (colDescr.type === "separator") {
      if (!firstSeparator) {
        colSep = buildCommon.makeSpan(["arraycolsep"], []);
        colSep.style.width = makeEm(options.fontMetrics().doubleRuleSep);
        cols.push(colSep);
      }
      if (colDescr.separator === "|" || colDescr.separator === ":") {
        var lineType = colDescr.separator === "|" ? "solid" : "dashed";
        var separator = buildCommon.makeSpan(["vertical-separator"], [], options);
        separator.style.height = makeEm(totalHeight);
        separator.style.borderRightWidth = makeEm(ruleThickness);
        separator.style.borderRightStyle = lineType;
        separator.style.margin = "0 " + makeEm(-ruleThickness / 2);
        var _shift = totalHeight - offset;
        if (_shift) {
          separator.style.verticalAlign = makeEm(-_shift);
        }
        cols.push(separator);
      } else {
        throw new ParseError("Invalid separator type: " + colDescr.separator);
      }
      colDescrNum++;
      colDescr = colDescriptions[colDescrNum] || {};
      firstSeparator = false;
    }
    if (c >= nc) {
      continue;
    }
    var sepwidth = void 0;
    if (c > 0 || group.hskipBeforeAndAfter) {
      sepwidth = utils.deflt(colDescr.pregap, arraycolsep);
      if (sepwidth !== 0) {
        colSep = buildCommon.makeSpan(["arraycolsep"], []);
        colSep.style.width = makeEm(sepwidth);
        cols.push(colSep);
      }
    }
    var col = [];
    for (r = 0; r < nr; ++r) {
      var row = body[r];
      var elem = row[c];
      if (!elem) {
        continue;
      }
      var _shift2 = row.pos - offset;
      elem.depth = row.depth;
      elem.height = row.height;
      col.push({
        type: "elem",
        elem,
        shift: _shift2
      });
    }
    col = buildCommon.makeVList({
      positionType: "individualShift",
      children: col
    }, options);
    col = buildCommon.makeSpan(["col-align-" + (colDescr.align || "c")], [col]);
    cols.push(col);
    if (c < nc - 1 || group.hskipBeforeAndAfter) {
      sepwidth = utils.deflt(colDescr.postgap, arraycolsep);
      if (sepwidth !== 0) {
        colSep = buildCommon.makeSpan(["arraycolsep"], []);
        colSep.style.width = makeEm(sepwidth);
        cols.push(colSep);
      }
    }
  }
  body = buildCommon.makeSpan(["mtable"], cols);
  if (hlines.length > 0) {
    var line = buildCommon.makeLineSpan("hline", options, ruleThickness);
    var dashes = buildCommon.makeLineSpan("hdashline", options, ruleThickness);
    var vListElems = [{
      type: "elem",
      elem: body,
      shift: 0
    }];
    while (hlines.length > 0) {
      var hline = hlines.pop();
      var lineShift = hline.pos - offset;
      if (hline.isDashed) {
        vListElems.push({
          type: "elem",
          elem: dashes,
          shift: lineShift
        });
      } else {
        vListElems.push({
          type: "elem",
          elem: line,
          shift: lineShift
        });
      }
    }
    body = buildCommon.makeVList({
      positionType: "individualShift",
      children: vListElems
    }, options);
  }
  if (tagSpans.length === 0) {
    return buildCommon.makeSpan(["mord"], [body], options);
  } else {
    var eqnNumCol = buildCommon.makeVList({
      positionType: "individualShift",
      children: tagSpans
    }, options);
    eqnNumCol = buildCommon.makeSpan(["tag"], [eqnNumCol], options);
    return buildCommon.makeFragment([body, eqnNumCol]);
  }
};
var alignMap = {
  c: "center ",
  l: "left ",
  r: "right "
};
var mathmlBuilder$5 = function mathmlBuilder(group, options) {
  var tbl = [];
  var glue = new mathMLTree.MathNode("mtd", [], ["mtr-glue"]);
  var tag = new mathMLTree.MathNode("mtd", [], ["mml-eqn-num"]);
  for (var i2 = 0; i2 < group.body.length; i2++) {
    var rw = group.body[i2];
    var row = [];
    for (var j = 0; j < rw.length; j++) {
      row.push(new mathMLTree.MathNode("mtd", [buildGroup2(rw[j], options)]));
    }
    if (group.tags && group.tags[i2]) {
      row.unshift(glue);
      row.push(glue);
      if (group.leqno) {
        row.unshift(tag);
      } else {
        row.push(tag);
      }
    }
    tbl.push(new mathMLTree.MathNode("mtr", row));
  }
  var table = new mathMLTree.MathNode("mtable", tbl);
  var gap = group.arraystretch === 0.5 ? 0.1 : 0.16 + group.arraystretch - 1 + (group.addJot ? 0.09 : 0);
  table.setAttribute("rowspacing", makeEm(gap));
  var menclose = "";
  var align = "";
  if (group.cols && group.cols.length > 0) {
    var cols = group.cols;
    var columnLines = "";
    var prevTypeWasAlign = false;
    var iStart = 0;
    var iEnd = cols.length;
    if (cols[0].type === "separator") {
      menclose += "top ";
      iStart = 1;
    }
    if (cols[cols.length - 1].type === "separator") {
      menclose += "bottom ";
      iEnd -= 1;
    }
    for (var _i6 = iStart; _i6 < iEnd; _i6++) {
      if (cols[_i6].type === "align") {
        align += alignMap[cols[_i6].align];
        if (prevTypeWasAlign) {
          columnLines += "none ";
        }
        prevTypeWasAlign = true;
      } else if (cols[_i6].type === "separator") {
        if (prevTypeWasAlign) {
          columnLines += cols[_i6].separator === "|" ? "solid " : "dashed ";
          prevTypeWasAlign = false;
        }
      }
    }
    table.setAttribute("columnalign", align.trim());
    if (/[sd]/.test(columnLines)) {
      table.setAttribute("columnlines", columnLines.trim());
    }
  }
  if (group.colSeparationType === "align") {
    var _cols = group.cols || [];
    var spacing2 = "";
    for (var _i22 = 1; _i22 < _cols.length; _i22++) {
      spacing2 += _i22 % 2 ? "0em " : "1em ";
    }
    table.setAttribute("columnspacing", spacing2.trim());
  } else if (group.colSeparationType === "alignat" || group.colSeparationType === "gather") {
    table.setAttribute("columnspacing", "0em");
  } else if (group.colSeparationType === "small") {
    table.setAttribute("columnspacing", "0.2778em");
  } else if (group.colSeparationType === "CD") {
    table.setAttribute("columnspacing", "0.5em");
  } else {
    table.setAttribute("columnspacing", "1em");
  }
  var rowLines = "";
  var hlines = group.hLinesBeforeRow;
  menclose += hlines[0].length > 0 ? "left " : "";
  menclose += hlines[hlines.length - 1].length > 0 ? "right " : "";
  for (var _i32 = 1; _i32 < hlines.length - 1; _i32++) {
    rowLines += hlines[_i32].length === 0 ? "none " : hlines[_i32][0] ? "dashed " : "solid ";
  }
  if (/[sd]/.test(rowLines)) {
    table.setAttribute("rowlines", rowLines.trim());
  }
  if (menclose !== "") {
    table = new mathMLTree.MathNode("menclose", [table]);
    table.setAttribute("notation", menclose.trim());
  }
  if (group.arraystretch && group.arraystretch < 1) {
    table = new mathMLTree.MathNode("mstyle", [table]);
    table.setAttribute("scriptlevel", "1");
  }
  return table;
};
var alignedHandler = function alignedHandler2(context, args) {
  if (context.envName.indexOf("ed") === -1) {
    validateAmsEnvironmentContext(context);
  }
  var cols = [];
  var separationType = context.envName.indexOf("at") > -1 ? "alignat" : "align";
  var isSplit = context.envName === "split";
  var res = parseArray(context.parser, {
    cols,
    addJot: true,
    autoTag: isSplit ? void 0 : getAutoTag(context.envName),
    emptySingleRow: true,
    colSeparationType: separationType,
    maxNumCols: isSplit ? 2 : void 0,
    leqno: context.parser.settings.leqno
  }, "display");
  var numMaths;
  var numCols = 0;
  var emptyGroup = {
    type: "ordgroup",
    mode: context.mode,
    body: []
  };
  if (args[0] && args[0].type === "ordgroup") {
    var arg0 = "";
    for (var i2 = 0; i2 < args[0].body.length; i2++) {
      var textord2 = assertNodeType(args[0].body[i2], "textord");
      arg0 += textord2.text;
    }
    numMaths = Number(arg0);
    numCols = numMaths * 2;
  }
  var isAligned = !numCols;
  res.body.forEach(function(row) {
    for (var _i42 = 1; _i42 < row.length; _i42 += 2) {
      var styling = assertNodeType(row[_i42], "styling");
      var ordgroup = assertNodeType(styling.body[0], "ordgroup");
      ordgroup.body.unshift(emptyGroup);
    }
    if (!isAligned) {
      var curMaths = row.length / 2;
      if (numMaths < curMaths) {
        throw new ParseError("Too many math in a row: " + ("expected " + numMaths + ", but got " + curMaths), row[0]);
      }
    } else if (numCols < row.length) {
      numCols = row.length;
    }
  });
  for (var _i52 = 0; _i52 < numCols; ++_i52) {
    var align = "r";
    var pregap = 0;
    if (_i52 % 2 === 1) {
      align = "l";
    } else if (_i52 > 0 && isAligned) {
      pregap = 1;
    }
    cols[_i52] = {
      type: "align",
      align,
      pregap,
      postgap: 0
    };
  }
  res.colSeparationType = isAligned ? "align" : "alignat";
  return res;
};
defineEnvironment({
  type: "array",
  names: ["array", "darray"],
  props: {
    numArgs: 1
  },
  handler(context, args) {
    var symNode = checkSymbolNodeType(args[0]);
    var colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
    var cols = colalign.map(function(nde) {
      var node = assertSymbolNodeType(nde);
      var ca = node.text;
      if ("lcr".indexOf(ca) !== -1) {
        return {
          type: "align",
          align: ca
        };
      } else if (ca === "|") {
        return {
          type: "separator",
          separator: "|"
        };
      } else if (ca === ":") {
        return {
          type: "separator",
          separator: ":"
        };
      }
      throw new ParseError("Unknown column alignment: " + ca, nde);
    });
    var res = {
      cols,
      hskipBeforeAndAfter: true,
      // \@preamble in lttab.dtx
      maxNumCols: cols.length
    };
    return parseArray(context.parser, res, dCellStyle(context.envName));
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix*", "pmatrix*", "bmatrix*", "Bmatrix*", "vmatrix*", "Vmatrix*"],
  props: {
    numArgs: 0
  },
  handler(context) {
    var delimiters2 = {
      "matrix": null,
      "pmatrix": ["(", ")"],
      "bmatrix": ["[", "]"],
      "Bmatrix": ["\\{", "\\}"],
      "vmatrix": ["|", "|"],
      "Vmatrix": ["\\Vert", "\\Vert"]
    }[context.envName.replace("*", "")];
    var colAlign = "c";
    var payload = {
      hskipBeforeAndAfter: false,
      cols: [{
        type: "align",
        align: colAlign
      }]
    };
    if (context.envName.charAt(context.envName.length - 1) === "*") {
      var parser = context.parser;
      parser.consumeSpaces();
      if (parser.fetch().text === "[") {
        parser.consume();
        parser.consumeSpaces();
        colAlign = parser.fetch().text;
        if ("lcr".indexOf(colAlign) === -1) {
          throw new ParseError("Expected l or c or r", parser.nextToken);
        }
        parser.consume();
        parser.consumeSpaces();
        parser.expect("]");
        parser.consume();
        payload.cols = [{
          type: "align",
          align: colAlign
        }];
      }
    }
    var res = parseArray(context.parser, payload, dCellStyle(context.envName));
    var numCols = Math.max(0, ...res.body.map((row) => row.length));
    res.cols = new Array(numCols).fill({
      type: "align",
      align: colAlign
    });
    return delimiters2 ? {
      type: "leftright",
      mode: context.mode,
      body: [res],
      left: delimiters2[0],
      right: delimiters2[1],
      rightColor: void 0
      // \right uninfluenced by \color in array
    } : res;
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["smallmatrix"],
  props: {
    numArgs: 0
  },
  handler(context) {
    var payload = {
      arraystretch: 0.5
    };
    var res = parseArray(context.parser, payload, "script");
    res.colSeparationType = "small";
    return res;
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["subarray"],
  props: {
    numArgs: 1
  },
  handler(context, args) {
    var symNode = checkSymbolNodeType(args[0]);
    var colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
    var cols = colalign.map(function(nde) {
      var node = assertSymbolNodeType(nde);
      var ca = node.text;
      if ("lc".indexOf(ca) !== -1) {
        return {
          type: "align",
          align: ca
        };
      }
      throw new ParseError("Unknown column alignment: " + ca, nde);
    });
    if (cols.length > 1) {
      throw new ParseError("{subarray} can contain only one column");
    }
    var res = {
      cols,
      hskipBeforeAndAfter: false,
      arraystretch: 0.5
    };
    res = parseArray(context.parser, res, "script");
    if (res.body.length > 0 && res.body[0].length > 1) {
      throw new ParseError("{subarray} can contain only one column");
    }
    return res;
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["cases", "dcases", "rcases", "drcases"],
  props: {
    numArgs: 0
  },
  handler(context) {
    var payload = {
      arraystretch: 1.2,
      cols: [{
        type: "align",
        align: "l",
        pregap: 0,
        // TODO(kevinb) get the current style.
        // For now we use the metrics for TEXT style which is what we were
        // doing before.  Before attempting to get the current style we
        // should look at TeX's behavior especially for \over and matrices.
        postgap: 1
        /* 1em quad */
      }, {
        type: "align",
        align: "l",
        pregap: 0,
        postgap: 0
      }]
    };
    var res = parseArray(context.parser, payload, dCellStyle(context.envName));
    return {
      type: "leftright",
      mode: context.mode,
      body: [res],
      left: context.envName.indexOf("r") > -1 ? "." : "\\{",
      right: context.envName.indexOf("r") > -1 ? "\\}" : ".",
      rightColor: void 0
    };
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["align", "align*", "aligned", "split"],
  props: {
    numArgs: 0
  },
  handler: alignedHandler,
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["gathered", "gather", "gather*"],
  props: {
    numArgs: 0
  },
  handler(context) {
    if (utils.contains(["gather", "gather*"], context.envName)) {
      validateAmsEnvironmentContext(context);
    }
    var res = {
      cols: [{
        type: "align",
        align: "c"
      }],
      addJot: true,
      colSeparationType: "gather",
      autoTag: getAutoTag(context.envName),
      emptySingleRow: true,
      leqno: context.parser.settings.leqno
    };
    return parseArray(context.parser, res, "display");
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["alignat", "alignat*", "alignedat"],
  props: {
    numArgs: 1
  },
  handler: alignedHandler,
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["equation", "equation*"],
  props: {
    numArgs: 0
  },
  handler(context) {
    validateAmsEnvironmentContext(context);
    var res = {
      autoTag: getAutoTag(context.envName),
      emptySingleRow: true,
      singleRow: true,
      maxNumCols: 1,
      leqno: context.parser.settings.leqno
    };
    return parseArray(context.parser, res, "display");
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineEnvironment({
  type: "array",
  names: ["CD"],
  props: {
    numArgs: 0
  },
  handler(context) {
    validateAmsEnvironmentContext(context);
    return parseCD(context.parser);
  },
  htmlBuilder: htmlBuilder$6,
  mathmlBuilder: mathmlBuilder$5
});
defineMacro("\\nonumber", "\\gdef\\@eqnsw{0}");
defineMacro("\\notag", "\\nonumber");
defineFunction({
  type: "text",
  // Doesn't matter what this is.
  names: ["\\hline", "\\hdashline"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: true
  },
  handler(context, args) {
    throw new ParseError(context.funcName + " valid only within array environment");
  }
});
var environments = _environments;
defineFunction({
  type: "environment",
  names: ["\\begin", "\\end"],
  props: {
    numArgs: 1,
    argTypes: ["text"]
  },
  handler(_ref, args) {
    var {
      parser,
      funcName
    } = _ref;
    var nameGroup = args[0];
    if (nameGroup.type !== "ordgroup") {
      throw new ParseError("Invalid environment name", nameGroup);
    }
    var envName = "";
    for (var i2 = 0; i2 < nameGroup.body.length; ++i2) {
      envName += assertNodeType(nameGroup.body[i2], "textord").text;
    }
    if (funcName === "\\begin") {
      if (!environments.hasOwnProperty(envName)) {
        throw new ParseError("No such environment: " + envName, nameGroup);
      }
      var env = environments[envName];
      var {
        args: _args,
        optArgs
      } = parser.parseArguments("\\begin{" + envName + "}", env);
      var context = {
        mode: parser.mode,
        envName,
        parser
      };
      var result = env.handler(context, _args, optArgs);
      parser.expect("\\end", false);
      var endNameToken = parser.nextToken;
      var end = assertNodeType(parser.parseFunction(), "environment");
      if (end.name !== envName) {
        throw new ParseError("Mismatch: \\begin{" + envName + "} matched by \\end{" + end.name + "}", endNameToken);
      }
      return result;
    }
    return {
      type: "environment",
      mode: parser.mode,
      name: envName,
      nameGroup
    };
  }
});
var htmlBuilder$5 = (group, options) => {
  var font = group.font;
  var newOptions = options.withFont(font);
  return buildGroup$1(group.body, newOptions);
};
var mathmlBuilder$4 = (group, options) => {
  var font = group.font;
  var newOptions = options.withFont(font);
  return buildGroup2(group.body, newOptions);
};
var fontAliases = {
  "\\Bbb": "\\mathbb",
  "\\bold": "\\mathbf",
  "\\frak": "\\mathfrak",
  "\\bm": "\\boldsymbol"
};
defineFunction({
  type: "font",
  names: [
    // styles, except \boldsymbol defined below
    "\\mathrm",
    "\\mathit",
    "\\mathbf",
    "\\mathnormal",
    "\\mathsfit",
    // families
    "\\mathbb",
    "\\mathcal",
    "\\mathfrak",
    "\\mathscr",
    "\\mathsf",
    "\\mathtt",
    // aliases, except \bm defined below
    "\\Bbb",
    "\\bold",
    "\\frak"
  ],
  props: {
    numArgs: 1,
    allowedInArgument: true
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName
    } = _ref;
    var body = normalizeArgument(args[0]);
    var func = funcName;
    if (func in fontAliases) {
      func = fontAliases[func];
    }
    return {
      type: "font",
      mode: parser.mode,
      font: func.slice(1),
      body
    };
  },
  htmlBuilder: htmlBuilder$5,
  mathmlBuilder: mathmlBuilder$4
});
defineFunction({
  type: "mclass",
  names: ["\\boldsymbol", "\\bm"],
  props: {
    numArgs: 1
  },
  handler: (_ref2, args) => {
    var {
      parser
    } = _ref2;
    var body = args[0];
    var isCharacterBox3 = utils.isCharacterBox(body);
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: binrelClass(body),
      body: [{
        type: "font",
        mode: parser.mode,
        font: "boldsymbol",
        body
      }],
      isCharacterBox: isCharacterBox3
    };
  }
});
defineFunction({
  type: "font",
  names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: (_ref3, args) => {
    var {
      parser,
      funcName,
      breakOnTokenText
    } = _ref3;
    var {
      mode
    } = parser;
    var body = parser.parseExpression(true, breakOnTokenText);
    var style = "math" + funcName.slice(1);
    return {
      type: "font",
      mode,
      font: style,
      body: {
        type: "ordgroup",
        mode: parser.mode,
        body
      }
    };
  },
  htmlBuilder: htmlBuilder$5,
  mathmlBuilder: mathmlBuilder$4
});
var adjustStyle = (size, originalStyle) => {
  var style = originalStyle;
  if (size === "display") {
    style = style.id >= Style$1.SCRIPT.id ? style.text() : Style$1.DISPLAY;
  } else if (size === "text" && style.size === Style$1.DISPLAY.size) {
    style = Style$1.TEXT;
  } else if (size === "script") {
    style = Style$1.SCRIPT;
  } else if (size === "scriptscript") {
    style = Style$1.SCRIPTSCRIPT;
  }
  return style;
};
var htmlBuilder$4 = (group, options) => {
  var style = adjustStyle(group.size, options.style);
  var nstyle = style.fracNum();
  var dstyle = style.fracDen();
  var newOptions;
  newOptions = options.havingStyle(nstyle);
  var numerm = buildGroup$1(group.numer, newOptions, options);
  if (group.continued) {
    var hStrut = 8.5 / options.fontMetrics().ptPerEm;
    var dStrut = 3.5 / options.fontMetrics().ptPerEm;
    numerm.height = numerm.height < hStrut ? hStrut : numerm.height;
    numerm.depth = numerm.depth < dStrut ? dStrut : numerm.depth;
  }
  newOptions = options.havingStyle(dstyle);
  var denomm = buildGroup$1(group.denom, newOptions, options);
  var rule;
  var ruleWidth;
  var ruleSpacing;
  if (group.hasBarLine) {
    if (group.barSize) {
      ruleWidth = calculateSize(group.barSize, options);
      rule = buildCommon.makeLineSpan("frac-line", options, ruleWidth);
    } else {
      rule = buildCommon.makeLineSpan("frac-line", options);
    }
    ruleWidth = rule.height;
    ruleSpacing = rule.height;
  } else {
    rule = null;
    ruleWidth = 0;
    ruleSpacing = options.fontMetrics().defaultRuleThickness;
  }
  var numShift;
  var clearance;
  var denomShift;
  if (style.size === Style$1.DISPLAY.size || group.size === "display") {
    numShift = options.fontMetrics().num1;
    if (ruleWidth > 0) {
      clearance = 3 * ruleSpacing;
    } else {
      clearance = 7 * ruleSpacing;
    }
    denomShift = options.fontMetrics().denom1;
  } else {
    if (ruleWidth > 0) {
      numShift = options.fontMetrics().num2;
      clearance = ruleSpacing;
    } else {
      numShift = options.fontMetrics().num3;
      clearance = 3 * ruleSpacing;
    }
    denomShift = options.fontMetrics().denom2;
  }
  var frac;
  if (!rule) {
    var candidateClearance = numShift - numerm.depth - (denomm.height - denomShift);
    if (candidateClearance < clearance) {
      numShift += 0.5 * (clearance - candidateClearance);
      denomShift += 0.5 * (clearance - candidateClearance);
    }
    frac = buildCommon.makeVList({
      positionType: "individualShift",
      children: [{
        type: "elem",
        elem: denomm,
        shift: denomShift
      }, {
        type: "elem",
        elem: numerm,
        shift: -numShift
      }]
    }, options);
  } else {
    var axisHeight = options.fontMetrics().axisHeight;
    if (numShift - numerm.depth - (axisHeight + 0.5 * ruleWidth) < clearance) {
      numShift += clearance - (numShift - numerm.depth - (axisHeight + 0.5 * ruleWidth));
    }
    if (axisHeight - 0.5 * ruleWidth - (denomm.height - denomShift) < clearance) {
      denomShift += clearance - (axisHeight - 0.5 * ruleWidth - (denomm.height - denomShift));
    }
    var midShift = -(axisHeight - 0.5 * ruleWidth);
    frac = buildCommon.makeVList({
      positionType: "individualShift",
      children: [{
        type: "elem",
        elem: denomm,
        shift: denomShift
      }, {
        type: "elem",
        elem: rule,
        shift: midShift
      }, {
        type: "elem",
        elem: numerm,
        shift: -numShift
      }]
    }, options);
  }
  newOptions = options.havingStyle(style);
  frac.height *= newOptions.sizeMultiplier / options.sizeMultiplier;
  frac.depth *= newOptions.sizeMultiplier / options.sizeMultiplier;
  var delimSize;
  if (style.size === Style$1.DISPLAY.size) {
    delimSize = options.fontMetrics().delim1;
  } else if (style.size === Style$1.SCRIPTSCRIPT.size) {
    delimSize = options.havingStyle(Style$1.SCRIPT).fontMetrics().delim2;
  } else {
    delimSize = options.fontMetrics().delim2;
  }
  var leftDelim;
  var rightDelim;
  if (group.leftDelim == null) {
    leftDelim = makeNullDelimiter(options, ["mopen"]);
  } else {
    leftDelim = delimiter.customSizedDelim(group.leftDelim, delimSize, true, options.havingStyle(style), group.mode, ["mopen"]);
  }
  if (group.continued) {
    rightDelim = buildCommon.makeSpan([]);
  } else if (group.rightDelim == null) {
    rightDelim = makeNullDelimiter(options, ["mclose"]);
  } else {
    rightDelim = delimiter.customSizedDelim(group.rightDelim, delimSize, true, options.havingStyle(style), group.mode, ["mclose"]);
  }
  return buildCommon.makeSpan(["mord"].concat(newOptions.sizingClasses(options)), [leftDelim, buildCommon.makeSpan(["mfrac"], [frac]), rightDelim], options);
};
var mathmlBuilder$3 = (group, options) => {
  var node = new mathMLTree.MathNode("mfrac", [buildGroup2(group.numer, options), buildGroup2(group.denom, options)]);
  if (!group.hasBarLine) {
    node.setAttribute("linethickness", "0px");
  } else if (group.barSize) {
    var ruleWidth = calculateSize(group.barSize, options);
    node.setAttribute("linethickness", makeEm(ruleWidth));
  }
  var style = adjustStyle(group.size, options.style);
  if (style.size !== options.style.size) {
    node = new mathMLTree.MathNode("mstyle", [node]);
    var isDisplay = style.size === Style$1.DISPLAY.size ? "true" : "false";
    node.setAttribute("displaystyle", isDisplay);
    node.setAttribute("scriptlevel", "0");
  }
  if (group.leftDelim != null || group.rightDelim != null) {
    var withDelims = [];
    if (group.leftDelim != null) {
      var leftOp = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode(group.leftDelim.replace("\\", ""))]);
      leftOp.setAttribute("fence", "true");
      withDelims.push(leftOp);
    }
    withDelims.push(node);
    if (group.rightDelim != null) {
      var rightOp = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode(group.rightDelim.replace("\\", ""))]);
      rightOp.setAttribute("fence", "true");
      withDelims.push(rightOp);
    }
    return makeRow(withDelims);
  }
  return node;
};
defineFunction({
  type: "genfrac",
  names: [
    "\\dfrac",
    "\\frac",
    "\\tfrac",
    "\\dbinom",
    "\\binom",
    "\\tbinom",
    "\\\\atopfrac",
    // can’t be entered directly
    "\\\\bracefrac",
    "\\\\brackfrac"
    // ditto
  ],
  props: {
    numArgs: 2,
    allowedInArgument: true
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName
    } = _ref;
    var numer = args[0];
    var denom = args[1];
    var hasBarLine;
    var leftDelim = null;
    var rightDelim = null;
    var size = "auto";
    switch (funcName) {
      case "\\dfrac":
      case "\\frac":
      case "\\tfrac":
        hasBarLine = true;
        break;
      case "\\\\atopfrac":
        hasBarLine = false;
        break;
      case "\\dbinom":
      case "\\binom":
      case "\\tbinom":
        hasBarLine = false;
        leftDelim = "(";
        rightDelim = ")";
        break;
      case "\\\\bracefrac":
        hasBarLine = false;
        leftDelim = "\\{";
        rightDelim = "\\}";
        break;
      case "\\\\brackfrac":
        hasBarLine = false;
        leftDelim = "[";
        rightDelim = "]";
        break;
      default:
        throw new Error("Unrecognized genfrac command");
    }
    switch (funcName) {
      case "\\dfrac":
      case "\\dbinom":
        size = "display";
        break;
      case "\\tfrac":
      case "\\tbinom":
        size = "text";
        break;
    }
    return {
      type: "genfrac",
      mode: parser.mode,
      continued: false,
      numer,
      denom,
      hasBarLine,
      leftDelim,
      rightDelim,
      size,
      barSize: null
    };
  },
  htmlBuilder: htmlBuilder$4,
  mathmlBuilder: mathmlBuilder$3
});
defineFunction({
  type: "genfrac",
  names: ["\\cfrac"],
  props: {
    numArgs: 2
  },
  handler: (_ref2, args) => {
    var {
      parser,
      funcName
    } = _ref2;
    var numer = args[0];
    var denom = args[1];
    return {
      type: "genfrac",
      mode: parser.mode,
      continued: true,
      numer,
      denom,
      hasBarLine: true,
      leftDelim: null,
      rightDelim: null,
      size: "display",
      barSize: null
    };
  }
});
defineFunction({
  type: "infix",
  names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"],
  props: {
    numArgs: 0,
    infix: true
  },
  handler(_ref3) {
    var {
      parser,
      funcName,
      token
    } = _ref3;
    var replaceWith;
    switch (funcName) {
      case "\\over":
        replaceWith = "\\frac";
        break;
      case "\\choose":
        replaceWith = "\\binom";
        break;
      case "\\atop":
        replaceWith = "\\\\atopfrac";
        break;
      case "\\brace":
        replaceWith = "\\\\bracefrac";
        break;
      case "\\brack":
        replaceWith = "\\\\brackfrac";
        break;
      default:
        throw new Error("Unrecognized infix genfrac command");
    }
    return {
      type: "infix",
      mode: parser.mode,
      replaceWith,
      token
    };
  }
});
var stylArray = ["display", "text", "script", "scriptscript"];
var delimFromValue = function delimFromValue2(delimString) {
  var delim = null;
  if (delimString.length > 0) {
    delim = delimString;
    delim = delim === "." ? null : delim;
  }
  return delim;
};
defineFunction({
  type: "genfrac",
  names: ["\\genfrac"],
  props: {
    numArgs: 6,
    allowedInArgument: true,
    argTypes: ["math", "math", "size", "text", "math", "math"]
  },
  handler(_ref4, args) {
    var {
      parser
    } = _ref4;
    var numer = args[4];
    var denom = args[5];
    var leftNode = normalizeArgument(args[0]);
    var leftDelim = leftNode.type === "atom" && leftNode.family === "open" ? delimFromValue(leftNode.text) : null;
    var rightNode = normalizeArgument(args[1]);
    var rightDelim = rightNode.type === "atom" && rightNode.family === "close" ? delimFromValue(rightNode.text) : null;
    var barNode = assertNodeType(args[2], "size");
    var hasBarLine;
    var barSize = null;
    if (barNode.isBlank) {
      hasBarLine = true;
    } else {
      barSize = barNode.value;
      hasBarLine = barSize.number > 0;
    }
    var size = "auto";
    var styl = args[3];
    if (styl.type === "ordgroup") {
      if (styl.body.length > 0) {
        var textOrd = assertNodeType(styl.body[0], "textord");
        size = stylArray[Number(textOrd.text)];
      }
    } else {
      styl = assertNodeType(styl, "textord");
      size = stylArray[Number(styl.text)];
    }
    return {
      type: "genfrac",
      mode: parser.mode,
      numer,
      denom,
      continued: false,
      hasBarLine,
      barSize,
      leftDelim,
      rightDelim,
      size
    };
  },
  htmlBuilder: htmlBuilder$4,
  mathmlBuilder: mathmlBuilder$3
});
defineFunction({
  type: "infix",
  names: ["\\above"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    infix: true
  },
  handler(_ref5, args) {
    var {
      parser,
      funcName,
      token
    } = _ref5;
    return {
      type: "infix",
      mode: parser.mode,
      replaceWith: "\\\\abovefrac",
      size: assertNodeType(args[0], "size").value,
      token
    };
  }
});
defineFunction({
  type: "genfrac",
  names: ["\\\\abovefrac"],
  props: {
    numArgs: 3,
    argTypes: ["math", "size", "math"]
  },
  handler: (_ref6, args) => {
    var {
      parser,
      funcName
    } = _ref6;
    var numer = args[0];
    var barSize = assert(assertNodeType(args[1], "infix").size);
    var denom = args[2];
    var hasBarLine = barSize.number > 0;
    return {
      type: "genfrac",
      mode: parser.mode,
      numer,
      denom,
      continued: false,
      hasBarLine,
      barSize,
      leftDelim: null,
      rightDelim: null,
      size: "auto"
    };
  },
  htmlBuilder: htmlBuilder$4,
  mathmlBuilder: mathmlBuilder$3
});
var htmlBuilder$3 = (grp, options) => {
  var style = options.style;
  var supSubGroup;
  var group;
  if (grp.type === "supsub") {
    supSubGroup = grp.sup ? buildGroup$1(grp.sup, options.havingStyle(style.sup()), options) : buildGroup$1(grp.sub, options.havingStyle(style.sub()), options);
    group = assertNodeType(grp.base, "horizBrace");
  } else {
    group = assertNodeType(grp, "horizBrace");
  }
  var body = buildGroup$1(group.base, options.havingBaseStyle(Style$1.DISPLAY));
  var braceBody = stretchy.svgSpan(group, options);
  var vlist;
  if (group.isOver) {
    vlist = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: body
      }, {
        type: "kern",
        size: 0.1
      }, {
        type: "elem",
        elem: braceBody
      }]
    }, options);
    vlist.children[0].children[0].children[1].classes.push("svg-align");
  } else {
    vlist = buildCommon.makeVList({
      positionType: "bottom",
      positionData: body.depth + 0.1 + braceBody.height,
      children: [{
        type: "elem",
        elem: braceBody
      }, {
        type: "kern",
        size: 0.1
      }, {
        type: "elem",
        elem: body
      }]
    }, options);
    vlist.children[0].children[0].children[0].classes.push("svg-align");
  }
  if (supSubGroup) {
    var vSpan = buildCommon.makeSpan(["mord", group.isOver ? "mover" : "munder"], [vlist], options);
    if (group.isOver) {
      vlist = buildCommon.makeVList({
        positionType: "firstBaseline",
        children: [{
          type: "elem",
          elem: vSpan
        }, {
          type: "kern",
          size: 0.2
        }, {
          type: "elem",
          elem: supSubGroup
        }]
      }, options);
    } else {
      vlist = buildCommon.makeVList({
        positionType: "bottom",
        positionData: vSpan.depth + 0.2 + supSubGroup.height + supSubGroup.depth,
        children: [{
          type: "elem",
          elem: supSubGroup
        }, {
          type: "kern",
          size: 0.2
        }, {
          type: "elem",
          elem: vSpan
        }]
      }, options);
    }
  }
  return buildCommon.makeSpan(["mord", group.isOver ? "mover" : "munder"], [vlist], options);
};
var mathmlBuilder$2 = (group, options) => {
  var accentNode = stretchy.mathMLnode(group.label);
  return new mathMLTree.MathNode(group.isOver ? "mover" : "munder", [buildGroup2(group.base, options), accentNode]);
};
defineFunction({
  type: "horizBrace",
  names: ["\\overbrace", "\\underbrace"],
  props: {
    numArgs: 1
  },
  handler(_ref, args) {
    var {
      parser,
      funcName
    } = _ref;
    return {
      type: "horizBrace",
      mode: parser.mode,
      label: funcName,
      isOver: /^\\over/.test(funcName),
      base: args[0]
    };
  },
  htmlBuilder: htmlBuilder$3,
  mathmlBuilder: mathmlBuilder$2
});
defineFunction({
  type: "href",
  names: ["\\href"],
  props: {
    numArgs: 2,
    argTypes: ["url", "original"],
    allowedInText: true
  },
  handler: (_ref, args) => {
    var {
      parser
    } = _ref;
    var body = args[1];
    var href = assertNodeType(args[0], "url").url;
    if (!parser.settings.isTrusted({
      command: "\\href",
      url: href
    })) {
      return parser.formatUnsupportedCmd("\\href");
    }
    return {
      type: "href",
      mode: parser.mode,
      href,
      body: ordargument(body)
    };
  },
  htmlBuilder: (group, options) => {
    var elements = buildExpression$1(group.body, options, false);
    return buildCommon.makeAnchor(group.href, [], elements, options);
  },
  mathmlBuilder: (group, options) => {
    var math2 = buildExpressionRow(group.body, options);
    if (!(math2 instanceof MathNode)) {
      math2 = new MathNode("mrow", [math2]);
    }
    math2.setAttribute("href", group.href);
    return math2;
  }
});
defineFunction({
  type: "href",
  names: ["\\url"],
  props: {
    numArgs: 1,
    argTypes: ["url"],
    allowedInText: true
  },
  handler: (_ref2, args) => {
    var {
      parser
    } = _ref2;
    var href = assertNodeType(args[0], "url").url;
    if (!parser.settings.isTrusted({
      command: "\\url",
      url: href
    })) {
      return parser.formatUnsupportedCmd("\\url");
    }
    var chars = [];
    for (var i2 = 0; i2 < href.length; i2++) {
      var c = href[i2];
      if (c === "~") {
        c = "\\textasciitilde";
      }
      chars.push({
        type: "textord",
        mode: "text",
        text: c
      });
    }
    var body = {
      type: "text",
      mode: parser.mode,
      font: "\\texttt",
      body: chars
    };
    return {
      type: "href",
      mode: parser.mode,
      href,
      body: ordargument(body)
    };
  }
});
defineFunction({
  type: "hbox",
  names: ["\\hbox"],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    allowedInText: true,
    primitive: true
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    return {
      type: "hbox",
      mode: parser.mode,
      body: ordargument(args[0])
    };
  },
  htmlBuilder(group, options) {
    var elements = buildExpression$1(group.body, options, false);
    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder(group, options) {
    return new mathMLTree.MathNode("mrow", buildExpression2(group.body, options));
  }
});
defineFunction({
  type: "html",
  names: ["\\htmlClass", "\\htmlId", "\\htmlStyle", "\\htmlData"],
  props: {
    numArgs: 2,
    argTypes: ["raw", "original"],
    allowedInText: true
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName,
      token
    } = _ref;
    var value = assertNodeType(args[0], "raw").string;
    var body = args[1];
    if (parser.settings.strict) {
      parser.settings.reportNonstrict("htmlExtension", "HTML extension is disabled on strict mode");
    }
    var trustContext;
    var attributes = {};
    switch (funcName) {
      case "\\htmlClass":
        attributes.class = value;
        trustContext = {
          command: "\\htmlClass",
          class: value
        };
        break;
      case "\\htmlId":
        attributes.id = value;
        trustContext = {
          command: "\\htmlId",
          id: value
        };
        break;
      case "\\htmlStyle":
        attributes.style = value;
        trustContext = {
          command: "\\htmlStyle",
          style: value
        };
        break;
      case "\\htmlData": {
        var data = value.split(",");
        for (var i2 = 0; i2 < data.length; i2++) {
          var keyVal = data[i2].split("=");
          if (keyVal.length !== 2) {
            throw new ParseError("Error parsing key-value for \\htmlData");
          }
          attributes["data-" + keyVal[0].trim()] = keyVal[1].trim();
        }
        trustContext = {
          command: "\\htmlData",
          attributes
        };
        break;
      }
      default:
        throw new Error("Unrecognized html command");
    }
    if (!parser.settings.isTrusted(trustContext)) {
      return parser.formatUnsupportedCmd(funcName);
    }
    return {
      type: "html",
      mode: parser.mode,
      attributes,
      body: ordargument(body)
    };
  },
  htmlBuilder: (group, options) => {
    var elements = buildExpression$1(group.body, options, false);
    var classes = ["enclosing"];
    if (group.attributes.class) {
      classes.push(...group.attributes.class.trim().split(/\s+/));
    }
    var span = buildCommon.makeSpan(classes, elements, options);
    for (var attr in group.attributes) {
      if (attr !== "class" && group.attributes.hasOwnProperty(attr)) {
        span.setAttribute(attr, group.attributes[attr]);
      }
    }
    return span;
  },
  mathmlBuilder: (group, options) => {
    return buildExpressionRow(group.body, options);
  }
});
defineFunction({
  type: "htmlmathml",
  names: ["\\html@mathml"],
  props: {
    numArgs: 2,
    allowedInText: true
  },
  handler: (_ref, args) => {
    var {
      parser
    } = _ref;
    return {
      type: "htmlmathml",
      mode: parser.mode,
      html: ordargument(args[0]),
      mathml: ordargument(args[1])
    };
  },
  htmlBuilder: (group, options) => {
    var elements = buildExpression$1(group.html, options, false);
    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder: (group, options) => {
    return buildExpressionRow(group.mathml, options);
  }
});
var sizeData = function sizeData2(str) {
  if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(str)) {
    return {
      number: +str,
      unit: "bp"
    };
  } else {
    var match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(str);
    if (!match) {
      throw new ParseError("Invalid size: '" + str + "' in \\includegraphics");
    }
    var data = {
      number: +(match[1] + match[2]),
      // sign + magnitude, cast to number
      unit: match[3]
    };
    if (!validUnit(data)) {
      throw new ParseError("Invalid unit: '" + data.unit + "' in \\includegraphics.");
    }
    return data;
  }
};
defineFunction({
  type: "includegraphics",
  names: ["\\includegraphics"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    argTypes: ["raw", "url"],
    allowedInText: false
  },
  handler: (_ref, args, optArgs) => {
    var {
      parser
    } = _ref;
    var width = {
      number: 0,
      unit: "em"
    };
    var height = {
      number: 0.9,
      unit: "em"
    };
    var totalheight = {
      number: 0,
      unit: "em"
    };
    var alt = "";
    if (optArgs[0]) {
      var attributeStr = assertNodeType(optArgs[0], "raw").string;
      var attributes = attributeStr.split(",");
      for (var i2 = 0; i2 < attributes.length; i2++) {
        var keyVal = attributes[i2].split("=");
        if (keyVal.length === 2) {
          var str = keyVal[1].trim();
          switch (keyVal[0].trim()) {
            case "alt":
              alt = str;
              break;
            case "width":
              width = sizeData(str);
              break;
            case "height":
              height = sizeData(str);
              break;
            case "totalheight":
              totalheight = sizeData(str);
              break;
            default:
              throw new ParseError("Invalid key: '" + keyVal[0] + "' in \\includegraphics.");
          }
        }
      }
    }
    var src = assertNodeType(args[0], "url").url;
    if (alt === "") {
      alt = src;
      alt = alt.replace(/^.*[\\/]/, "");
      alt = alt.substring(0, alt.lastIndexOf("."));
    }
    if (!parser.settings.isTrusted({
      command: "\\includegraphics",
      url: src
    })) {
      return parser.formatUnsupportedCmd("\\includegraphics");
    }
    return {
      type: "includegraphics",
      mode: parser.mode,
      alt,
      width,
      height,
      totalheight,
      src
    };
  },
  htmlBuilder: (group, options) => {
    var height = calculateSize(group.height, options);
    var depth = 0;
    if (group.totalheight.number > 0) {
      depth = calculateSize(group.totalheight, options) - height;
    }
    var width = 0;
    if (group.width.number > 0) {
      width = calculateSize(group.width, options);
    }
    var style = {
      height: makeEm(height + depth)
    };
    if (width > 0) {
      style.width = makeEm(width);
    }
    if (depth > 0) {
      style.verticalAlign = makeEm(-depth);
    }
    var node = new Img(group.src, group.alt, style);
    node.height = height;
    node.depth = depth;
    return node;
  },
  mathmlBuilder: (group, options) => {
    var node = new mathMLTree.MathNode("mglyph", []);
    node.setAttribute("alt", group.alt);
    var height = calculateSize(group.height, options);
    var depth = 0;
    if (group.totalheight.number > 0) {
      depth = calculateSize(group.totalheight, options) - height;
      node.setAttribute("valign", makeEm(-depth));
    }
    node.setAttribute("height", makeEm(height + depth));
    if (group.width.number > 0) {
      var width = calculateSize(group.width, options);
      node.setAttribute("width", makeEm(width));
    }
    node.setAttribute("src", group.src);
    return node;
  }
});
defineFunction({
  type: "kern",
  names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    primitive: true,
    allowedInText: true
  },
  handler(_ref, args) {
    var {
      parser,
      funcName
    } = _ref;
    var size = assertNodeType(args[0], "size");
    if (parser.settings.strict) {
      var mathFunction = funcName[1] === "m";
      var muUnit = size.value.unit === "mu";
      if (mathFunction) {
        if (!muUnit) {
          parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " supports only mu units, " + ("not " + size.value.unit + " units"));
        }
        if (parser.mode !== "math") {
          parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " works only in math mode");
        }
      } else {
        if (muUnit) {
          parser.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + funcName + " doesn't support mu units");
        }
      }
    }
    return {
      type: "kern",
      mode: parser.mode,
      dimension: size.value
    };
  },
  htmlBuilder(group, options) {
    return buildCommon.makeGlue(group.dimension, options);
  },
  mathmlBuilder(group, options) {
    var dimension = calculateSize(group.dimension, options);
    return new mathMLTree.SpaceNode(dimension);
  }
});
defineFunction({
  type: "lap",
  names: ["\\mathllap", "\\mathrlap", "\\mathclap"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName
    } = _ref;
    var body = args[0];
    return {
      type: "lap",
      mode: parser.mode,
      alignment: funcName.slice(5),
      body
    };
  },
  htmlBuilder: (group, options) => {
    var inner2;
    if (group.alignment === "clap") {
      inner2 = buildCommon.makeSpan([], [buildGroup$1(group.body, options)]);
      inner2 = buildCommon.makeSpan(["inner"], [inner2], options);
    } else {
      inner2 = buildCommon.makeSpan(["inner"], [buildGroup$1(group.body, options)]);
    }
    var fix = buildCommon.makeSpan(["fix"], []);
    var node = buildCommon.makeSpan([group.alignment], [inner2, fix], options);
    var strut = buildCommon.makeSpan(["strut"]);
    strut.style.height = makeEm(node.height + node.depth);
    if (node.depth) {
      strut.style.verticalAlign = makeEm(-node.depth);
    }
    node.children.unshift(strut);
    node = buildCommon.makeSpan(["thinbox"], [node], options);
    return buildCommon.makeSpan(["mord", "vbox"], [node], options);
  },
  mathmlBuilder: (group, options) => {
    var node = new mathMLTree.MathNode("mpadded", [buildGroup2(group.body, options)]);
    if (group.alignment !== "rlap") {
      var offset = group.alignment === "llap" ? "-1" : "-0.5";
      node.setAttribute("lspace", offset + "width");
    }
    node.setAttribute("width", "0px");
    return node;
  }
});
defineFunction({
  type: "styling",
  names: ["\\(", "$"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: false
  },
  handler(_ref, args) {
    var {
      funcName,
      parser
    } = _ref;
    var outerMode = parser.mode;
    parser.switchMode("math");
    var close2 = funcName === "\\(" ? "\\)" : "$";
    var body = parser.parseExpression(false, close2);
    parser.expect(close2);
    parser.switchMode(outerMode);
    return {
      type: "styling",
      mode: parser.mode,
      style: "text",
      body
    };
  }
});
defineFunction({
  type: "text",
  // Doesn't matter what this is.
  names: ["\\)", "\\]"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: false
  },
  handler(context, args) {
    throw new ParseError("Mismatched " + context.funcName);
  }
});
var chooseMathStyle = (group, options) => {
  switch (options.style.size) {
    case Style$1.DISPLAY.size:
      return group.display;
    case Style$1.TEXT.size:
      return group.text;
    case Style$1.SCRIPT.size:
      return group.script;
    case Style$1.SCRIPTSCRIPT.size:
      return group.scriptscript;
    default:
      return group.text;
  }
};
defineFunction({
  type: "mathchoice",
  names: ["\\mathchoice"],
  props: {
    numArgs: 4,
    primitive: true
  },
  handler: (_ref, args) => {
    var {
      parser
    } = _ref;
    return {
      type: "mathchoice",
      mode: parser.mode,
      display: ordargument(args[0]),
      text: ordargument(args[1]),
      script: ordargument(args[2]),
      scriptscript: ordargument(args[3])
    };
  },
  htmlBuilder: (group, options) => {
    var body = chooseMathStyle(group, options);
    var elements = buildExpression$1(body, options, false);
    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder: (group, options) => {
    var body = chooseMathStyle(group, options);
    return buildExpressionRow(body, options);
  }
});
var assembleSupSub = (base, supGroup, subGroup, options, style, slant, baseShift) => {
  base = buildCommon.makeSpan([], [base]);
  var subIsSingleCharacter = subGroup && utils.isCharacterBox(subGroup);
  var sub2;
  var sup2;
  if (supGroup) {
    var elem = buildGroup$1(supGroup, options.havingStyle(style.sup()), options);
    sup2 = {
      elem,
      kern: Math.max(options.fontMetrics().bigOpSpacing1, options.fontMetrics().bigOpSpacing3 - elem.depth)
    };
  }
  if (subGroup) {
    var _elem = buildGroup$1(subGroup, options.havingStyle(style.sub()), options);
    sub2 = {
      elem: _elem,
      kern: Math.max(options.fontMetrics().bigOpSpacing2, options.fontMetrics().bigOpSpacing4 - _elem.height)
    };
  }
  var finalGroup;
  if (sup2 && sub2) {
    var bottom = options.fontMetrics().bigOpSpacing5 + sub2.elem.height + sub2.elem.depth + sub2.kern + base.depth + baseShift;
    finalGroup = buildCommon.makeVList({
      positionType: "bottom",
      positionData: bottom,
      children: [{
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }, {
        type: "elem",
        elem: sub2.elem,
        marginLeft: makeEm(-slant)
      }, {
        type: "kern",
        size: sub2.kern
      }, {
        type: "elem",
        elem: base
      }, {
        type: "kern",
        size: sup2.kern
      }, {
        type: "elem",
        elem: sup2.elem,
        marginLeft: makeEm(slant)
      }, {
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }]
    }, options);
  } else if (sub2) {
    var top = base.height - baseShift;
    finalGroup = buildCommon.makeVList({
      positionType: "top",
      positionData: top,
      children: [{
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }, {
        type: "elem",
        elem: sub2.elem,
        marginLeft: makeEm(-slant)
      }, {
        type: "kern",
        size: sub2.kern
      }, {
        type: "elem",
        elem: base
      }]
    }, options);
  } else if (sup2) {
    var _bottom = base.depth + baseShift;
    finalGroup = buildCommon.makeVList({
      positionType: "bottom",
      positionData: _bottom,
      children: [{
        type: "elem",
        elem: base
      }, {
        type: "kern",
        size: sup2.kern
      }, {
        type: "elem",
        elem: sup2.elem,
        marginLeft: makeEm(slant)
      }, {
        type: "kern",
        size: options.fontMetrics().bigOpSpacing5
      }]
    }, options);
  } else {
    return base;
  }
  var parts = [finalGroup];
  if (sub2 && slant !== 0 && !subIsSingleCharacter) {
    var spacer = buildCommon.makeSpan(["mspace"], [], options);
    spacer.style.marginRight = makeEm(slant);
    parts.unshift(spacer);
  }
  return buildCommon.makeSpan(["mop", "op-limits"], parts, options);
};
var noSuccessor = ["\\smallint"];
var htmlBuilder$2 = (grp, options) => {
  var supGroup;
  var subGroup;
  var hasLimits = false;
  var group;
  if (grp.type === "supsub") {
    supGroup = grp.sup;
    subGroup = grp.sub;
    group = assertNodeType(grp.base, "op");
    hasLimits = true;
  } else {
    group = assertNodeType(grp, "op");
  }
  var style = options.style;
  var large = false;
  if (style.size === Style$1.DISPLAY.size && group.symbol && !utils.contains(noSuccessor, group.name)) {
    large = true;
  }
  var base;
  if (group.symbol) {
    var fontName = large ? "Size2-Regular" : "Size1-Regular";
    var stash = "";
    if (group.name === "\\oiint" || group.name === "\\oiiint") {
      stash = group.name.slice(1);
      group.name = stash === "oiint" ? "\\iint" : "\\iiint";
    }
    base = buildCommon.makeSymbol(group.name, fontName, "math", options, ["mop", "op-symbol", large ? "large-op" : "small-op"]);
    if (stash.length > 0) {
      var italic = base.italic;
      var oval = buildCommon.staticSvg(stash + "Size" + (large ? "2" : "1"), options);
      base = buildCommon.makeVList({
        positionType: "individualShift",
        children: [{
          type: "elem",
          elem: base,
          shift: 0
        }, {
          type: "elem",
          elem: oval,
          shift: large ? 0.08 : 0
        }]
      }, options);
      group.name = "\\" + stash;
      base.classes.unshift("mop");
      base.italic = italic;
    }
  } else if (group.body) {
    var inner2 = buildExpression$1(group.body, options, true);
    if (inner2.length === 1 && inner2[0] instanceof SymbolNode) {
      base = inner2[0];
      base.classes[0] = "mop";
    } else {
      base = buildCommon.makeSpan(["mop"], inner2, options);
    }
  } else {
    var output = [];
    for (var i2 = 1; i2 < group.name.length; i2++) {
      output.push(buildCommon.mathsym(group.name[i2], group.mode, options));
    }
    base = buildCommon.makeSpan(["mop"], output, options);
  }
  var baseShift = 0;
  var slant = 0;
  if ((base instanceof SymbolNode || group.name === "\\oiint" || group.name === "\\oiiint") && !group.suppressBaseShift) {
    baseShift = (base.height - base.depth) / 2 - options.fontMetrics().axisHeight;
    slant = base.italic;
  }
  if (hasLimits) {
    return assembleSupSub(base, supGroup, subGroup, options, style, slant, baseShift);
  } else {
    if (baseShift) {
      base.style.position = "relative";
      base.style.top = makeEm(baseShift);
    }
    return base;
  }
};
var mathmlBuilder$1 = (group, options) => {
  var node;
  if (group.symbol) {
    node = new MathNode("mo", [makeText(group.name, group.mode)]);
    if (utils.contains(noSuccessor, group.name)) {
      node.setAttribute("largeop", "false");
    }
  } else if (group.body) {
    node = new MathNode("mo", buildExpression2(group.body, options));
  } else {
    node = new MathNode("mi", [new TextNode(group.name.slice(1))]);
    var operator = new MathNode("mo", [makeText("\u2061", "text")]);
    if (group.parentIsSupSub) {
      node = new MathNode("mrow", [node, operator]);
    } else {
      node = newDocumentFragment([node, operator]);
    }
  }
  return node;
};
var singleCharBigOps = {
  "\u220F": "\\prod",
  "\u2210": "\\coprod",
  "\u2211": "\\sum",
  "\u22C0": "\\bigwedge",
  "\u22C1": "\\bigvee",
  "\u22C2": "\\bigcap",
  "\u22C3": "\\bigcup",
  "\u2A00": "\\bigodot",
  "\u2A01": "\\bigoplus",
  "\u2A02": "\\bigotimes",
  "\u2A04": "\\biguplus",
  "\u2A06": "\\bigsqcup"
};
defineFunction({
  type: "op",
  names: ["\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap", "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes", "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint", "\u220F", "\u2210", "\u2211", "\u22C0", "\u22C1", "\u22C2", "\u22C3", "\u2A00", "\u2A01", "\u2A02", "\u2A04", "\u2A06"],
  props: {
    numArgs: 0
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName
    } = _ref;
    var fName = funcName;
    if (fName.length === 1) {
      fName = singleCharBigOps[fName];
    }
    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: true,
      name: fName
    };
  },
  htmlBuilder: htmlBuilder$2,
  mathmlBuilder: mathmlBuilder$1
});
defineFunction({
  type: "op",
  names: ["\\mathop"],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler: (_ref2, args) => {
    var {
      parser
    } = _ref2;
    var body = args[0];
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: false,
      body: ordargument(body)
    };
  },
  htmlBuilder: htmlBuilder$2,
  mathmlBuilder: mathmlBuilder$1
});
var singleCharIntegrals = {
  "\u222B": "\\int",
  "\u222C": "\\iint",
  "\u222D": "\\iiint",
  "\u222E": "\\oint",
  "\u222F": "\\oiint",
  "\u2230": "\\oiiint"
};
defineFunction({
  type: "op",
  names: ["\\arcsin", "\\arccos", "\\arctan", "\\arctg", "\\arcctg", "\\arg", "\\ch", "\\cos", "\\cosec", "\\cosh", "\\cot", "\\cotg", "\\coth", "\\csc", "\\ctg", "\\cth", "\\deg", "\\dim", "\\exp", "\\hom", "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin", "\\sinh", "\\sh", "\\tan", "\\tanh", "\\tg", "\\th"],
  props: {
    numArgs: 0
  },
  handler(_ref3) {
    var {
      parser,
      funcName
    } = _ref3;
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: false,
      name: funcName
    };
  },
  htmlBuilder: htmlBuilder$2,
  mathmlBuilder: mathmlBuilder$1
});
defineFunction({
  type: "op",
  names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"],
  props: {
    numArgs: 0
  },
  handler(_ref4) {
    var {
      parser,
      funcName
    } = _ref4;
    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: false,
      name: funcName
    };
  },
  htmlBuilder: htmlBuilder$2,
  mathmlBuilder: mathmlBuilder$1
});
defineFunction({
  type: "op",
  names: ["\\int", "\\iint", "\\iiint", "\\oint", "\\oiint", "\\oiiint", "\u222B", "\u222C", "\u222D", "\u222E", "\u222F", "\u2230"],
  props: {
    numArgs: 0
  },
  handler(_ref5) {
    var {
      parser,
      funcName
    } = _ref5;
    var fName = funcName;
    if (fName.length === 1) {
      fName = singleCharIntegrals[fName];
    }
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: true,
      name: fName
    };
  },
  htmlBuilder: htmlBuilder$2,
  mathmlBuilder: mathmlBuilder$1
});
var htmlBuilder$1 = (grp, options) => {
  var supGroup;
  var subGroup;
  var hasLimits = false;
  var group;
  if (grp.type === "supsub") {
    supGroup = grp.sup;
    subGroup = grp.sub;
    group = assertNodeType(grp.base, "operatorname");
    hasLimits = true;
  } else {
    group = assertNodeType(grp, "operatorname");
  }
  var base;
  if (group.body.length > 0) {
    var body = group.body.map((child2) => {
      var childText = child2.text;
      if (typeof childText === "string") {
        return {
          type: "textord",
          mode: child2.mode,
          text: childText
        };
      } else {
        return child2;
      }
    });
    var expression = buildExpression$1(body, options.withFont("mathrm"), true);
    for (var i2 = 0; i2 < expression.length; i2++) {
      var child = expression[i2];
      if (child instanceof SymbolNode) {
        child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
      }
    }
    base = buildCommon.makeSpan(["mop"], expression, options);
  } else {
    base = buildCommon.makeSpan(["mop"], [], options);
  }
  if (hasLimits) {
    return assembleSupSub(base, supGroup, subGroup, options, options.style, 0, 0);
  } else {
    return base;
  }
};
var mathmlBuilder2 = (group, options) => {
  var expression = buildExpression2(group.body, options.withFont("mathrm"));
  var isAllString = true;
  for (var i2 = 0; i2 < expression.length; i2++) {
    var node = expression[i2];
    if (node instanceof mathMLTree.SpaceNode) ;
    else if (node instanceof mathMLTree.MathNode) {
      switch (node.type) {
        case "mi":
        case "mn":
        case "ms":
        case "mspace":
        case "mtext":
          break;
        // Do nothing yet.
        case "mo": {
          var child = node.children[0];
          if (node.children.length === 1 && child instanceof mathMLTree.TextNode) {
            child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
          } else {
            isAllString = false;
          }
          break;
        }
        default:
          isAllString = false;
      }
    } else {
      isAllString = false;
    }
  }
  if (isAllString) {
    var word = expression.map((node2) => node2.toText()).join("");
    expression = [new mathMLTree.TextNode(word)];
  }
  var identifier = new mathMLTree.MathNode("mi", expression);
  identifier.setAttribute("mathvariant", "normal");
  var operator = new mathMLTree.MathNode("mo", [makeText("\u2061", "text")]);
  if (group.parentIsSupSub) {
    return new mathMLTree.MathNode("mrow", [identifier, operator]);
  } else {
    return mathMLTree.newDocumentFragment([identifier, operator]);
  }
};
defineFunction({
  type: "operatorname",
  names: ["\\operatorname@", "\\operatornamewithlimits"],
  props: {
    numArgs: 1
  },
  handler: (_ref, args) => {
    var {
      parser,
      funcName
    } = _ref;
    var body = args[0];
    return {
      type: "operatorname",
      mode: parser.mode,
      body: ordargument(body),
      alwaysHandleSupSub: funcName === "\\operatornamewithlimits",
      limits: false,
      parentIsSupSub: false
    };
  },
  htmlBuilder: htmlBuilder$1,
  mathmlBuilder: mathmlBuilder2
});
defineMacro("\\operatorname", "\\@ifstar\\operatornamewithlimits\\operatorname@");
defineFunctionBuilders({
  type: "ordgroup",
  htmlBuilder(group, options) {
    if (group.semisimple) {
      return buildCommon.makeFragment(buildExpression$1(group.body, options, false));
    }
    return buildCommon.makeSpan(["mord"], buildExpression$1(group.body, options, true), options);
  },
  mathmlBuilder(group, options) {
    return buildExpressionRow(group.body, options, true);
  }
});
defineFunction({
  type: "overline",
  names: ["\\overline"],
  props: {
    numArgs: 1
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    var body = args[0];
    return {
      type: "overline",
      mode: parser.mode,
      body
    };
  },
  htmlBuilder(group, options) {
    var innerGroup = buildGroup$1(group.body, options.havingCrampedStyle());
    var line = buildCommon.makeLineSpan("overline-line", options);
    var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
    var vlist = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: innerGroup
      }, {
        type: "kern",
        size: 3 * defaultRuleThickness
      }, {
        type: "elem",
        elem: line
      }, {
        type: "kern",
        size: defaultRuleThickness
      }]
    }, options);
    return buildCommon.makeSpan(["mord", "overline"], [vlist], options);
  },
  mathmlBuilder(group, options) {
    var operator = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode("\u203E")]);
    operator.setAttribute("stretchy", "true");
    var node = new mathMLTree.MathNode("mover", [buildGroup2(group.body, options), operator]);
    node.setAttribute("accent", "true");
    return node;
  }
});
defineFunction({
  type: "phantom",
  names: ["\\phantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: (_ref, args) => {
    var {
      parser
    } = _ref;
    var body = args[0];
    return {
      type: "phantom",
      mode: parser.mode,
      body: ordargument(body)
    };
  },
  htmlBuilder: (group, options) => {
    var elements = buildExpression$1(group.body, options.withPhantom(), false);
    return buildCommon.makeFragment(elements);
  },
  mathmlBuilder: (group, options) => {
    var inner2 = buildExpression2(group.body, options);
    return new mathMLTree.MathNode("mphantom", inner2);
  }
});
defineFunction({
  type: "hphantom",
  names: ["\\hphantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: (_ref2, args) => {
    var {
      parser
    } = _ref2;
    var body = args[0];
    return {
      type: "hphantom",
      mode: parser.mode,
      body
    };
  },
  htmlBuilder: (group, options) => {
    var node = buildCommon.makeSpan([], [buildGroup$1(group.body, options.withPhantom())]);
    node.height = 0;
    node.depth = 0;
    if (node.children) {
      for (var i2 = 0; i2 < node.children.length; i2++) {
        node.children[i2].height = 0;
        node.children[i2].depth = 0;
      }
    }
    node = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: node
      }]
    }, options);
    return buildCommon.makeSpan(["mord"], [node], options);
  },
  mathmlBuilder: (group, options) => {
    var inner2 = buildExpression2(ordargument(group.body), options);
    var phantom = new mathMLTree.MathNode("mphantom", inner2);
    var node = new mathMLTree.MathNode("mpadded", [phantom]);
    node.setAttribute("height", "0px");
    node.setAttribute("depth", "0px");
    return node;
  }
});
defineFunction({
  type: "vphantom",
  names: ["\\vphantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: (_ref3, args) => {
    var {
      parser
    } = _ref3;
    var body = args[0];
    return {
      type: "vphantom",
      mode: parser.mode,
      body
    };
  },
  htmlBuilder: (group, options) => {
    var inner2 = buildCommon.makeSpan(["inner"], [buildGroup$1(group.body, options.withPhantom())]);
    var fix = buildCommon.makeSpan(["fix"], []);
    return buildCommon.makeSpan(["mord", "rlap"], [inner2, fix], options);
  },
  mathmlBuilder: (group, options) => {
    var inner2 = buildExpression2(ordargument(group.body), options);
    var phantom = new mathMLTree.MathNode("mphantom", inner2);
    var node = new mathMLTree.MathNode("mpadded", [phantom]);
    node.setAttribute("width", "0px");
    return node;
  }
});
defineFunction({
  type: "raisebox",
  names: ["\\raisebox"],
  props: {
    numArgs: 2,
    argTypes: ["size", "hbox"],
    allowedInText: true
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    var amount = assertNodeType(args[0], "size").value;
    var body = args[1];
    return {
      type: "raisebox",
      mode: parser.mode,
      dy: amount,
      body
    };
  },
  htmlBuilder(group, options) {
    var body = buildGroup$1(group.body, options);
    var dy = calculateSize(group.dy, options);
    return buildCommon.makeVList({
      positionType: "shift",
      positionData: -dy,
      children: [{
        type: "elem",
        elem: body
      }]
    }, options);
  },
  mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mpadded", [buildGroup2(group.body, options)]);
    var dy = group.dy.number + group.dy.unit;
    node.setAttribute("voffset", dy);
    return node;
  }
});
defineFunction({
  type: "internal",
  names: ["\\relax"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInArgument: true
  },
  handler(_ref) {
    var {
      parser
    } = _ref;
    return {
      type: "internal",
      mode: parser.mode
    };
  }
});
defineFunction({
  type: "rule",
  names: ["\\rule"],
  props: {
    numArgs: 2,
    numOptionalArgs: 1,
    allowedInText: true,
    allowedInMath: true,
    argTypes: ["size", "size", "size"]
  },
  handler(_ref, args, optArgs) {
    var {
      parser
    } = _ref;
    var shift = optArgs[0];
    var width = assertNodeType(args[0], "size");
    var height = assertNodeType(args[1], "size");
    return {
      type: "rule",
      mode: parser.mode,
      shift: shift && assertNodeType(shift, "size").value,
      width: width.value,
      height: height.value
    };
  },
  htmlBuilder(group, options) {
    var rule = buildCommon.makeSpan(["mord", "rule"], [], options);
    var width = calculateSize(group.width, options);
    var height = calculateSize(group.height, options);
    var shift = group.shift ? calculateSize(group.shift, options) : 0;
    rule.style.borderRightWidth = makeEm(width);
    rule.style.borderTopWidth = makeEm(height);
    rule.style.bottom = makeEm(shift);
    rule.width = width;
    rule.height = height + shift;
    rule.depth = -shift;
    rule.maxFontSize = height * 1.125 * options.sizeMultiplier;
    return rule;
  },
  mathmlBuilder(group, options) {
    var width = calculateSize(group.width, options);
    var height = calculateSize(group.height, options);
    var shift = group.shift ? calculateSize(group.shift, options) : 0;
    var color = options.color && options.getColor() || "black";
    var rule = new mathMLTree.MathNode("mspace");
    rule.setAttribute("mathbackground", color);
    rule.setAttribute("width", makeEm(width));
    rule.setAttribute("height", makeEm(height));
    var wrapper = new mathMLTree.MathNode("mpadded", [rule]);
    if (shift >= 0) {
      wrapper.setAttribute("height", makeEm(shift));
    } else {
      wrapper.setAttribute("height", makeEm(shift));
      wrapper.setAttribute("depth", makeEm(-shift));
    }
    wrapper.setAttribute("voffset", makeEm(shift));
    return wrapper;
  }
});
function sizingGroup(value, options, baseOptions) {
  var inner2 = buildExpression$1(value, options, false);
  var multiplier = options.sizeMultiplier / baseOptions.sizeMultiplier;
  for (var i2 = 0; i2 < inner2.length; i2++) {
    var pos = inner2[i2].classes.indexOf("sizing");
    if (pos < 0) {
      Array.prototype.push.apply(inner2[i2].classes, options.sizingClasses(baseOptions));
    } else if (inner2[i2].classes[pos + 1] === "reset-size" + options.size) {
      inner2[i2].classes[pos + 1] = "reset-size" + baseOptions.size;
    }
    inner2[i2].height *= multiplier;
    inner2[i2].depth *= multiplier;
  }
  return buildCommon.makeFragment(inner2);
}
var sizeFuncs = ["\\tiny", "\\sixptsize", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"];
var htmlBuilder2 = (group, options) => {
  var newOptions = options.havingSize(group.size);
  return sizingGroup(group.body, newOptions, options);
};
defineFunction({
  type: "sizing",
  names: sizeFuncs,
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: (_ref, args) => {
    var {
      breakOnTokenText,
      funcName,
      parser
    } = _ref;
    var body = parser.parseExpression(false, breakOnTokenText);
    return {
      type: "sizing",
      mode: parser.mode,
      // Figure out what size to use based on the list of functions above
      size: sizeFuncs.indexOf(funcName) + 1,
      body
    };
  },
  htmlBuilder: htmlBuilder2,
  mathmlBuilder: (group, options) => {
    var newOptions = options.havingSize(group.size);
    var inner2 = buildExpression2(group.body, newOptions);
    var node = new mathMLTree.MathNode("mstyle", inner2);
    node.setAttribute("mathsize", makeEm(newOptions.sizeMultiplier));
    return node;
  }
});
defineFunction({
  type: "smash",
  names: ["\\smash"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    allowedInText: true
  },
  handler: (_ref, args, optArgs) => {
    var {
      parser
    } = _ref;
    var smashHeight = false;
    var smashDepth = false;
    var tbArg = optArgs[0] && assertNodeType(optArgs[0], "ordgroup");
    if (tbArg) {
      var letter = "";
      for (var i2 = 0; i2 < tbArg.body.length; ++i2) {
        var node = tbArg.body[i2];
        letter = node.text;
        if (letter === "t") {
          smashHeight = true;
        } else if (letter === "b") {
          smashDepth = true;
        } else {
          smashHeight = false;
          smashDepth = false;
          break;
        }
      }
    } else {
      smashHeight = true;
      smashDepth = true;
    }
    var body = args[0];
    return {
      type: "smash",
      mode: parser.mode,
      body,
      smashHeight,
      smashDepth
    };
  },
  htmlBuilder: (group, options) => {
    var node = buildCommon.makeSpan([], [buildGroup$1(group.body, options)]);
    if (!group.smashHeight && !group.smashDepth) {
      return node;
    }
    if (group.smashHeight) {
      node.height = 0;
      if (node.children) {
        for (var i2 = 0; i2 < node.children.length; i2++) {
          node.children[i2].height = 0;
        }
      }
    }
    if (group.smashDepth) {
      node.depth = 0;
      if (node.children) {
        for (var _i6 = 0; _i6 < node.children.length; _i6++) {
          node.children[_i6].depth = 0;
        }
      }
    }
    var smashedNode = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: node
      }]
    }, options);
    return buildCommon.makeSpan(["mord"], [smashedNode], options);
  },
  mathmlBuilder: (group, options) => {
    var node = new mathMLTree.MathNode("mpadded", [buildGroup2(group.body, options)]);
    if (group.smashHeight) {
      node.setAttribute("height", "0px");
    }
    if (group.smashDepth) {
      node.setAttribute("depth", "0px");
    }
    return node;
  }
});
defineFunction({
  type: "sqrt",
  names: ["\\sqrt"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler(_ref, args, optArgs) {
    var {
      parser
    } = _ref;
    var index = optArgs[0];
    var body = args[0];
    return {
      type: "sqrt",
      mode: parser.mode,
      body,
      index
    };
  },
  htmlBuilder(group, options) {
    var inner2 = buildGroup$1(group.body, options.havingCrampedStyle());
    if (inner2.height === 0) {
      inner2.height = options.fontMetrics().xHeight;
    }
    inner2 = buildCommon.wrapFragment(inner2, options);
    var metrics = options.fontMetrics();
    var theta = metrics.defaultRuleThickness;
    var phi = theta;
    if (options.style.id < Style$1.TEXT.id) {
      phi = options.fontMetrics().xHeight;
    }
    var lineClearance = theta + phi / 4;
    var minDelimiterHeight = inner2.height + inner2.depth + lineClearance + theta;
    var {
      span: img,
      ruleWidth,
      advanceWidth
    } = delimiter.sqrtImage(minDelimiterHeight, options);
    var delimDepth = img.height - ruleWidth;
    if (delimDepth > inner2.height + inner2.depth + lineClearance) {
      lineClearance = (lineClearance + delimDepth - inner2.height - inner2.depth) / 2;
    }
    var imgShift = img.height - inner2.height - lineClearance - ruleWidth;
    inner2.style.paddingLeft = makeEm(advanceWidth);
    var body = buildCommon.makeVList({
      positionType: "firstBaseline",
      children: [{
        type: "elem",
        elem: inner2,
        wrapperClasses: ["svg-align"]
      }, {
        type: "kern",
        size: -(inner2.height + imgShift)
      }, {
        type: "elem",
        elem: img
      }, {
        type: "kern",
        size: ruleWidth
      }]
    }, options);
    if (!group.index) {
      return buildCommon.makeSpan(["mord", "sqrt"], [body], options);
    } else {
      var newOptions = options.havingStyle(Style$1.SCRIPTSCRIPT);
      var rootm = buildGroup$1(group.index, newOptions, options);
      var toShift = 0.6 * (body.height - body.depth);
      var rootVList = buildCommon.makeVList({
        positionType: "shift",
        positionData: -toShift,
        children: [{
          type: "elem",
          elem: rootm
        }]
      }, options);
      var rootVListWrap = buildCommon.makeSpan(["root"], [rootVList]);
      return buildCommon.makeSpan(["mord", "sqrt"], [rootVListWrap, body], options);
    }
  },
  mathmlBuilder(group, options) {
    var {
      body,
      index
    } = group;
    return index ? new mathMLTree.MathNode("mroot", [buildGroup2(body, options), buildGroup2(index, options)]) : new mathMLTree.MathNode("msqrt", [buildGroup2(body, options)]);
  }
});
var styleMap = {
  "display": Style$1.DISPLAY,
  "text": Style$1.TEXT,
  "script": Style$1.SCRIPT,
  "scriptscript": Style$1.SCRIPTSCRIPT
};
defineFunction({
  type: "styling",
  names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler(_ref, args) {
    var {
      breakOnTokenText,
      funcName,
      parser
    } = _ref;
    var body = parser.parseExpression(true, breakOnTokenText);
    var style = funcName.slice(1, funcName.length - 5);
    return {
      type: "styling",
      mode: parser.mode,
      // Figure out what style to use by pulling out the style from
      // the function name
      style,
      body
    };
  },
  htmlBuilder(group, options) {
    var newStyle = styleMap[group.style];
    var newOptions = options.havingStyle(newStyle).withFont("");
    return sizingGroup(group.body, newOptions, options);
  },
  mathmlBuilder(group, options) {
    var newStyle = styleMap[group.style];
    var newOptions = options.havingStyle(newStyle);
    var inner2 = buildExpression2(group.body, newOptions);
    var node = new mathMLTree.MathNode("mstyle", inner2);
    var styleAttributes = {
      "display": ["0", "true"],
      "text": ["0", "false"],
      "script": ["1", "false"],
      "scriptscript": ["2", "false"]
    };
    var attr = styleAttributes[group.style];
    node.setAttribute("scriptlevel", attr[0]);
    node.setAttribute("displaystyle", attr[1]);
    return node;
  }
});
var htmlBuilderDelegate = function htmlBuilderDelegate2(group, options) {
  var base = group.base;
  if (!base) {
    return null;
  } else if (base.type === "op") {
    var delegate = base.limits && (options.style.size === Style$1.DISPLAY.size || base.alwaysHandleSupSub);
    return delegate ? htmlBuilder$2 : null;
  } else if (base.type === "operatorname") {
    var _delegate = base.alwaysHandleSupSub && (options.style.size === Style$1.DISPLAY.size || base.limits);
    return _delegate ? htmlBuilder$1 : null;
  } else if (base.type === "accent") {
    return utils.isCharacterBox(base.base) ? htmlBuilder$a : null;
  } else if (base.type === "horizBrace") {
    var isSup = !group.sub;
    return isSup === base.isOver ? htmlBuilder$3 : null;
  } else {
    return null;
  }
};
defineFunctionBuilders({
  type: "supsub",
  htmlBuilder(group, options) {
    var builderDelegate = htmlBuilderDelegate(group, options);
    if (builderDelegate) {
      return builderDelegate(group, options);
    }
    var {
      base: valueBase,
      sup: valueSup,
      sub: valueSub
    } = group;
    var base = buildGroup$1(valueBase, options);
    var supm;
    var subm;
    var metrics = options.fontMetrics();
    var supShift = 0;
    var subShift = 0;
    var isCharacterBox3 = valueBase && utils.isCharacterBox(valueBase);
    if (valueSup) {
      var newOptions = options.havingStyle(options.style.sup());
      supm = buildGroup$1(valueSup, newOptions, options);
      if (!isCharacterBox3) {
        supShift = base.height - newOptions.fontMetrics().supDrop * newOptions.sizeMultiplier / options.sizeMultiplier;
      }
    }
    if (valueSub) {
      var _newOptions = options.havingStyle(options.style.sub());
      subm = buildGroup$1(valueSub, _newOptions, options);
      if (!isCharacterBox3) {
        subShift = base.depth + _newOptions.fontMetrics().subDrop * _newOptions.sizeMultiplier / options.sizeMultiplier;
      }
    }
    var minSupShift;
    if (options.style === Style$1.DISPLAY) {
      minSupShift = metrics.sup1;
    } else if (options.style.cramped) {
      minSupShift = metrics.sup3;
    } else {
      minSupShift = metrics.sup2;
    }
    var multiplier = options.sizeMultiplier;
    var marginRight = makeEm(0.5 / metrics.ptPerEm / multiplier);
    var marginLeft = null;
    if (subm) {
      var isOiint = group.base && group.base.type === "op" && group.base.name && (group.base.name === "\\oiint" || group.base.name === "\\oiiint");
      if (base instanceof SymbolNode || isOiint) {
        marginLeft = makeEm(-base.italic);
      }
    }
    var supsub;
    if (supm && subm) {
      supShift = Math.max(supShift, minSupShift, supm.depth + 0.25 * metrics.xHeight);
      subShift = Math.max(subShift, metrics.sub2);
      var ruleWidth = metrics.defaultRuleThickness;
      var maxWidth = 4 * ruleWidth;
      if (supShift - supm.depth - (subm.height - subShift) < maxWidth) {
        subShift = maxWidth - (supShift - supm.depth) + subm.height;
        var psi = 0.8 * metrics.xHeight - (supShift - supm.depth);
        if (psi > 0) {
          supShift += psi;
          subShift -= psi;
        }
      }
      var vlistElem = [{
        type: "elem",
        elem: subm,
        shift: subShift,
        marginRight,
        marginLeft
      }, {
        type: "elem",
        elem: supm,
        shift: -supShift,
        marginRight
      }];
      supsub = buildCommon.makeVList({
        positionType: "individualShift",
        children: vlistElem
      }, options);
    } else if (subm) {
      subShift = Math.max(subShift, metrics.sub1, subm.height - 0.8 * metrics.xHeight);
      var _vlistElem = [{
        type: "elem",
        elem: subm,
        marginLeft,
        marginRight
      }];
      supsub = buildCommon.makeVList({
        positionType: "shift",
        positionData: subShift,
        children: _vlistElem
      }, options);
    } else if (supm) {
      supShift = Math.max(supShift, minSupShift, supm.depth + 0.25 * metrics.xHeight);
      supsub = buildCommon.makeVList({
        positionType: "shift",
        positionData: -supShift,
        children: [{
          type: "elem",
          elem: supm,
          marginRight
        }]
      }, options);
    } else {
      throw new Error("supsub must have either sup or sub.");
    }
    var mclass = getTypeOfDomTree(base, "right") || "mord";
    return buildCommon.makeSpan([mclass], [base, buildCommon.makeSpan(["msupsub"], [supsub])], options);
  },
  mathmlBuilder(group, options) {
    var isBrace = false;
    var isOver;
    var isSup;
    if (group.base && group.base.type === "horizBrace") {
      isSup = !!group.sup;
      if (isSup === group.base.isOver) {
        isBrace = true;
        isOver = group.base.isOver;
      }
    }
    if (group.base && (group.base.type === "op" || group.base.type === "operatorname")) {
      group.base.parentIsSupSub = true;
    }
    var children = [buildGroup2(group.base, options)];
    if (group.sub) {
      children.push(buildGroup2(group.sub, options));
    }
    if (group.sup) {
      children.push(buildGroup2(group.sup, options));
    }
    var nodeType;
    if (isBrace) {
      nodeType = isOver ? "mover" : "munder";
    } else if (!group.sub) {
      var base = group.base;
      if (base && base.type === "op" && base.limits && (options.style === Style$1.DISPLAY || base.alwaysHandleSupSub)) {
        nodeType = "mover";
      } else if (base && base.type === "operatorname" && base.alwaysHandleSupSub && (base.limits || options.style === Style$1.DISPLAY)) {
        nodeType = "mover";
      } else {
        nodeType = "msup";
      }
    } else if (!group.sup) {
      var _base = group.base;
      if (_base && _base.type === "op" && _base.limits && (options.style === Style$1.DISPLAY || _base.alwaysHandleSupSub)) {
        nodeType = "munder";
      } else if (_base && _base.type === "operatorname" && _base.alwaysHandleSupSub && (_base.limits || options.style === Style$1.DISPLAY)) {
        nodeType = "munder";
      } else {
        nodeType = "msub";
      }
    } else {
      var _base2 = group.base;
      if (_base2 && _base2.type === "op" && _base2.limits && options.style === Style$1.DISPLAY) {
        nodeType = "munderover";
      } else if (_base2 && _base2.type === "operatorname" && _base2.alwaysHandleSupSub && (options.style === Style$1.DISPLAY || _base2.limits)) {
        nodeType = "munderover";
      } else {
        nodeType = "msubsup";
      }
    }
    return new mathMLTree.MathNode(nodeType, children);
  }
});
defineFunctionBuilders({
  type: "atom",
  htmlBuilder(group, options) {
    return buildCommon.mathsym(group.text, group.mode, options, ["m" + group.family]);
  },
  mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mo", [makeText(group.text, group.mode)]);
    if (group.family === "bin") {
      var variant = getVariant(group, options);
      if (variant === "bold-italic") {
        node.setAttribute("mathvariant", variant);
      }
    } else if (group.family === "punct") {
      node.setAttribute("separator", "true");
    } else if (group.family === "open" || group.family === "close") {
      node.setAttribute("stretchy", "false");
    }
    return node;
  }
});
var defaultVariant = {
  "mi": "italic",
  "mn": "normal",
  "mtext": "normal"
};
defineFunctionBuilders({
  type: "mathord",
  htmlBuilder(group, options) {
    return buildCommon.makeOrd(group, options, "mathord");
  },
  mathmlBuilder(group, options) {
    var node = new mathMLTree.MathNode("mi", [makeText(group.text, group.mode, options)]);
    var variant = getVariant(group, options) || "italic";
    if (variant !== defaultVariant[node.type]) {
      node.setAttribute("mathvariant", variant);
    }
    return node;
  }
});
defineFunctionBuilders({
  type: "textord",
  htmlBuilder(group, options) {
    return buildCommon.makeOrd(group, options, "textord");
  },
  mathmlBuilder(group, options) {
    var text2 = makeText(group.text, group.mode, options);
    var variant = getVariant(group, options) || "normal";
    var node;
    if (group.mode === "text") {
      node = new mathMLTree.MathNode("mtext", [text2]);
    } else if (/[0-9]/.test(group.text)) {
      node = new mathMLTree.MathNode("mn", [text2]);
    } else if (group.text === "\\prime") {
      node = new mathMLTree.MathNode("mo", [text2]);
    } else {
      node = new mathMLTree.MathNode("mi", [text2]);
    }
    if (variant !== defaultVariant[node.type]) {
      node.setAttribute("mathvariant", variant);
    }
    return node;
  }
});
var cssSpace = {
  "\\nobreak": "nobreak",
  "\\allowbreak": "allowbreak"
};
var regularSpace = {
  " ": {},
  "\\ ": {},
  "~": {
    className: "nobreak"
  },
  "\\space": {},
  "\\nobreakspace": {
    className: "nobreak"
  }
};
defineFunctionBuilders({
  type: "spacing",
  htmlBuilder(group, options) {
    if (regularSpace.hasOwnProperty(group.text)) {
      var className = regularSpace[group.text].className || "";
      if (group.mode === "text") {
        var ord = buildCommon.makeOrd(group, options, "textord");
        ord.classes.push(className);
        return ord;
      } else {
        return buildCommon.makeSpan(["mspace", className], [buildCommon.mathsym(group.text, group.mode, options)], options);
      }
    } else if (cssSpace.hasOwnProperty(group.text)) {
      return buildCommon.makeSpan(["mspace", cssSpace[group.text]], [], options);
    } else {
      throw new ParseError('Unknown type of space "' + group.text + '"');
    }
  },
  mathmlBuilder(group, options) {
    var node;
    if (regularSpace.hasOwnProperty(group.text)) {
      node = new mathMLTree.MathNode("mtext", [new mathMLTree.TextNode("\xA0")]);
    } else if (cssSpace.hasOwnProperty(group.text)) {
      return new mathMLTree.MathNode("mspace");
    } else {
      throw new ParseError('Unknown type of space "' + group.text + '"');
    }
    return node;
  }
});
var pad = () => {
  var padNode = new mathMLTree.MathNode("mtd", []);
  padNode.setAttribute("width", "50%");
  return padNode;
};
defineFunctionBuilders({
  type: "tag",
  mathmlBuilder(group, options) {
    var table = new mathMLTree.MathNode("mtable", [new mathMLTree.MathNode("mtr", [pad(), new mathMLTree.MathNode("mtd", [buildExpressionRow(group.body, options)]), pad(), new mathMLTree.MathNode("mtd", [buildExpressionRow(group.tag, options)])])]);
    table.setAttribute("width", "100%");
    return table;
  }
});
var textFontFamilies = {
  "\\text": void 0,
  "\\textrm": "textrm",
  "\\textsf": "textsf",
  "\\texttt": "texttt",
  "\\textnormal": "textrm"
};
var textFontWeights = {
  "\\textbf": "textbf",
  "\\textmd": "textmd"
};
var textFontShapes = {
  "\\textit": "textit",
  "\\textup": "textup"
};
var optionsWithFont = (group, options) => {
  var font = group.font;
  if (!font) {
    return options;
  } else if (textFontFamilies[font]) {
    return options.withTextFontFamily(textFontFamilies[font]);
  } else if (textFontWeights[font]) {
    return options.withTextFontWeight(textFontWeights[font]);
  } else if (font === "\\emph") {
    return options.fontShape === "textit" ? options.withTextFontShape("textup") : options.withTextFontShape("textit");
  }
  return options.withTextFontShape(textFontShapes[font]);
};
defineFunction({
  type: "text",
  names: [
    // Font families
    "\\text",
    "\\textrm",
    "\\textsf",
    "\\texttt",
    "\\textnormal",
    // Font weights
    "\\textbf",
    "\\textmd",
    // Font Shapes
    "\\textit",
    "\\textup",
    "\\emph"
  ],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    allowedInArgument: true,
    allowedInText: true
  },
  handler(_ref, args) {
    var {
      parser,
      funcName
    } = _ref;
    var body = args[0];
    return {
      type: "text",
      mode: parser.mode,
      body: ordargument(body),
      font: funcName
    };
  },
  htmlBuilder(group, options) {
    var newOptions = optionsWithFont(group, options);
    var inner2 = buildExpression$1(group.body, newOptions, true);
    return buildCommon.makeSpan(["mord", "text"], inner2, newOptions);
  },
  mathmlBuilder(group, options) {
    var newOptions = optionsWithFont(group, options);
    return buildExpressionRow(group.body, newOptions);
  }
});
defineFunction({
  type: "underline",
  names: ["\\underline"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    return {
      type: "underline",
      mode: parser.mode,
      body: args[0]
    };
  },
  htmlBuilder(group, options) {
    var innerGroup = buildGroup$1(group.body, options);
    var line = buildCommon.makeLineSpan("underline-line", options);
    var defaultRuleThickness = options.fontMetrics().defaultRuleThickness;
    var vlist = buildCommon.makeVList({
      positionType: "top",
      positionData: innerGroup.height,
      children: [{
        type: "kern",
        size: defaultRuleThickness
      }, {
        type: "elem",
        elem: line
      }, {
        type: "kern",
        size: 3 * defaultRuleThickness
      }, {
        type: "elem",
        elem: innerGroup
      }]
    }, options);
    return buildCommon.makeSpan(["mord", "underline"], [vlist], options);
  },
  mathmlBuilder(group, options) {
    var operator = new mathMLTree.MathNode("mo", [new mathMLTree.TextNode("\u203E")]);
    operator.setAttribute("stretchy", "true");
    var node = new mathMLTree.MathNode("munder", [buildGroup2(group.body, options), operator]);
    node.setAttribute("accentunder", "true");
    return node;
  }
});
defineFunction({
  type: "vcenter",
  names: ["\\vcenter"],
  props: {
    numArgs: 1,
    argTypes: ["original"],
    // In LaTeX, \vcenter can act only on a box.
    allowedInText: false
  },
  handler(_ref, args) {
    var {
      parser
    } = _ref;
    return {
      type: "vcenter",
      mode: parser.mode,
      body: args[0]
    };
  },
  htmlBuilder(group, options) {
    var body = buildGroup$1(group.body, options);
    var axisHeight = options.fontMetrics().axisHeight;
    var dy = 0.5 * (body.height - axisHeight - (body.depth + axisHeight));
    return buildCommon.makeVList({
      positionType: "shift",
      positionData: dy,
      children: [{
        type: "elem",
        elem: body
      }]
    }, options);
  },
  mathmlBuilder(group, options) {
    return new mathMLTree.MathNode("mpadded", [buildGroup2(group.body, options)], ["vcenter"]);
  }
});
defineFunction({
  type: "verb",
  names: ["\\verb"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler(context, args, optArgs) {
    throw new ParseError("\\verb ended by end of line instead of matching delimiter");
  },
  htmlBuilder(group, options) {
    var text2 = makeVerb(group);
    var body = [];
    var newOptions = options.havingStyle(options.style.text());
    for (var i2 = 0; i2 < text2.length; i2++) {
      var c = text2[i2];
      if (c === "~") {
        c = "\\textasciitilde";
      }
      body.push(buildCommon.makeSymbol(c, "Typewriter-Regular", group.mode, newOptions, ["mord", "texttt"]));
    }
    return buildCommon.makeSpan(["mord", "text"].concat(newOptions.sizingClasses(options)), buildCommon.tryCombineChars(body), newOptions);
  },
  mathmlBuilder(group, options) {
    var text2 = new mathMLTree.TextNode(makeVerb(group));
    var node = new mathMLTree.MathNode("mtext", [text2]);
    node.setAttribute("mathvariant", "monospace");
    return node;
  }
});
var makeVerb = (group) => group.body.replace(/ /g, group.star ? "\u2423" : "\xA0");
var functions = _functions;
var spaceRegexString = "[ \r\n	]";
var controlWordRegexString = "\\\\[a-zA-Z@]+";
var controlSymbolRegexString = "\\\\[^\uD800-\uDFFF]";
var controlWordWhitespaceRegexString = "(" + controlWordRegexString + ")" + spaceRegexString + "*";
var controlSpaceRegexString = "\\\\(\n|[ \r	]+\n?)[ \r	]*";
var combiningDiacriticalMarkString = "[\u0300-\u036F]";
var combiningDiacriticalMarksEndRegex = new RegExp(combiningDiacriticalMarkString + "+$");
var tokenRegexString = "(" + spaceRegexString + "+)|" + // whitespace
(controlSpaceRegexString + "|") + // \whitespace
"([!-\\[\\]-\u2027\u202A-\uD7FF\uF900-\uFFFF]" + // single codepoint
(combiningDiacriticalMarkString + "*") + // ...plus accents
"|[\uD800-\uDBFF][\uDC00-\uDFFF]" + // surrogate pair
(combiningDiacriticalMarkString + "*") + // ...plus accents
"|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5" + // \verb unstarred
("|" + controlWordWhitespaceRegexString) + // \macroName + spaces
("|" + controlSymbolRegexString + ")");
var Lexer = class {
  // Category codes. The lexer only supports comment characters (14) for now.
  // MacroExpander additionally distinguishes active (13).
  constructor(input, settings) {
    this.input = void 0;
    this.settings = void 0;
    this.tokenRegex = void 0;
    this.catcodes = void 0;
    this.input = input;
    this.settings = settings;
    this.tokenRegex = new RegExp(tokenRegexString, "g");
    this.catcodes = {
      "%": 14,
      // comment character
      "~": 13
      // active character
    };
  }
  setCatcode(char, code) {
    this.catcodes[char] = code;
  }
  /**
   * This function lexes a single token.
   */
  lex() {
    var input = this.input;
    var pos = this.tokenRegex.lastIndex;
    if (pos === input.length) {
      return new Token("EOF", new SourceLocation(this, pos, pos));
    }
    var match = this.tokenRegex.exec(input);
    if (match === null || match.index !== pos) {
      throw new ParseError("Unexpected character: '" + input[pos] + "'", new Token(input[pos], new SourceLocation(this, pos, pos + 1)));
    }
    var text2 = match[6] || match[3] || (match[2] ? "\\ " : " ");
    if (this.catcodes[text2] === 14) {
      var nlIndex = input.indexOf("\n", this.tokenRegex.lastIndex);
      if (nlIndex === -1) {
        this.tokenRegex.lastIndex = input.length;
        this.settings.reportNonstrict("commentAtEnd", "% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode (e.g. $)");
      } else {
        this.tokenRegex.lastIndex = nlIndex + 1;
      }
      return this.lex();
    }
    return new Token(text2, new SourceLocation(this, pos, this.tokenRegex.lastIndex));
  }
};
var Namespace = class {
  /**
   * Both arguments are optional.  The first argument is an object of
   * built-in mappings which never change.  The second argument is an object
   * of initial (global-level) mappings, which will constantly change
   * according to any global/top-level `set`s done.
   */
  constructor(builtins, globalMacros) {
    if (builtins === void 0) {
      builtins = {};
    }
    if (globalMacros === void 0) {
      globalMacros = {};
    }
    this.current = void 0;
    this.builtins = void 0;
    this.undefStack = void 0;
    this.current = globalMacros;
    this.builtins = builtins;
    this.undefStack = [];
  }
  /**
   * Start a new nested group, affecting future local `set`s.
   */
  beginGroup() {
    this.undefStack.push({});
  }
  /**
   * End current nested group, restoring values before the group began.
   */
  endGroup() {
    if (this.undefStack.length === 0) {
      throw new ParseError("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");
    }
    var undefs = this.undefStack.pop();
    for (var undef in undefs) {
      if (undefs.hasOwnProperty(undef)) {
        if (undefs[undef] == null) {
          delete this.current[undef];
        } else {
          this.current[undef] = undefs[undef];
        }
      }
    }
  }
  /**
   * Ends all currently nested groups (if any), restoring values before the
   * groups began.  Useful in case of an error in the middle of parsing.
   */
  endGroups() {
    while (this.undefStack.length > 0) {
      this.endGroup();
    }
  }
  /**
   * Detect whether `name` has a definition.  Equivalent to
   * `get(name) != null`.
   */
  has(name) {
    return this.current.hasOwnProperty(name) || this.builtins.hasOwnProperty(name);
  }
  /**
   * Get the current value of a name, or `undefined` if there is no value.
   *
   * Note: Do not use `if (namespace.get(...))` to detect whether a macro
   * is defined, as the definition may be the empty string which evaluates
   * to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
   * `if (namespace.has(...))`.
   */
  get(name) {
    if (this.current.hasOwnProperty(name)) {
      return this.current[name];
    } else {
      return this.builtins[name];
    }
  }
  /**
   * Set the current value of a name, and optionally set it globally too.
   * Local set() sets the current value and (when appropriate) adds an undo
   * operation to the undo stack.  Global set() may change the undo
   * operation at every level, so takes time linear in their number.
   * A value of undefined means to delete existing definitions.
   */
  set(name, value, global) {
    if (global === void 0) {
      global = false;
    }
    if (global) {
      for (var i2 = 0; i2 < this.undefStack.length; i2++) {
        delete this.undefStack[i2][name];
      }
      if (this.undefStack.length > 0) {
        this.undefStack[this.undefStack.length - 1][name] = value;
      }
    } else {
      var top = this.undefStack[this.undefStack.length - 1];
      if (top && !top.hasOwnProperty(name)) {
        top[name] = this.current[name];
      }
    }
    if (value == null) {
      delete this.current[name];
    } else {
      this.current[name] = value;
    }
  }
};
var macros = _macros;
defineMacro("\\noexpand", function(context) {
  var t2 = context.popToken();
  if (context.isExpandable(t2.text)) {
    t2.noexpand = true;
    t2.treatAsRelax = true;
  }
  return {
    tokens: [t2],
    numArgs: 0
  };
});
defineMacro("\\expandafter", function(context) {
  var t2 = context.popToken();
  context.expandOnce(true);
  return {
    tokens: [t2],
    numArgs: 0
  };
});
defineMacro("\\@firstoftwo", function(context) {
  var args = context.consumeArgs(2);
  return {
    tokens: args[0],
    numArgs: 0
  };
});
defineMacro("\\@secondoftwo", function(context) {
  var args = context.consumeArgs(2);
  return {
    tokens: args[1],
    numArgs: 0
  };
});
defineMacro("\\@ifnextchar", function(context) {
  var args = context.consumeArgs(3);
  context.consumeSpaces();
  var nextToken = context.future();
  if (args[0].length === 1 && args[0][0].text === nextToken.text) {
    return {
      tokens: args[1],
      numArgs: 0
    };
  } else {
    return {
      tokens: args[2],
      numArgs: 0
    };
  }
});
defineMacro("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}");
defineMacro("\\TextOrMath", function(context) {
  var args = context.consumeArgs(2);
  if (context.mode === "text") {
    return {
      tokens: args[0],
      numArgs: 0
    };
  } else {
    return {
      tokens: args[1],
      numArgs: 0
    };
  }
});
var digitToNumber = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "a": 10,
  "A": 10,
  "b": 11,
  "B": 11,
  "c": 12,
  "C": 12,
  "d": 13,
  "D": 13,
  "e": 14,
  "E": 14,
  "f": 15,
  "F": 15
};
defineMacro("\\char", function(context) {
  var token = context.popToken();
  var base;
  var number = "";
  if (token.text === "'") {
    base = 8;
    token = context.popToken();
  } else if (token.text === '"') {
    base = 16;
    token = context.popToken();
  } else if (token.text === "`") {
    token = context.popToken();
    if (token.text[0] === "\\") {
      number = token.text.charCodeAt(1);
    } else if (token.text === "EOF") {
      throw new ParseError("\\char` missing argument");
    } else {
      number = token.text.charCodeAt(0);
    }
  } else {
    base = 10;
  }
  if (base) {
    number = digitToNumber[token.text];
    if (number == null || number >= base) {
      throw new ParseError("Invalid base-" + base + " digit " + token.text);
    }
    var digit;
    while ((digit = digitToNumber[context.future().text]) != null && digit < base) {
      number *= base;
      number += digit;
      context.popToken();
    }
  }
  return "\\@char{" + number + "}";
});
var newcommand = (context, existsOK, nonexistsOK, skipIfExists) => {
  var arg = context.consumeArg().tokens;
  if (arg.length !== 1) {
    throw new ParseError("\\newcommand's first argument must be a macro name");
  }
  var name = arg[0].text;
  var exists = context.isDefined(name);
  if (exists && !existsOK) {
    throw new ParseError("\\newcommand{" + name + "} attempting to redefine " + (name + "; use \\renewcommand"));
  }
  if (!exists && !nonexistsOK) {
    throw new ParseError("\\renewcommand{" + name + "} when command " + name + " does not yet exist; use \\newcommand");
  }
  var numArgs = 0;
  arg = context.consumeArg().tokens;
  if (arg.length === 1 && arg[0].text === "[") {
    var argText = "";
    var token = context.expandNextToken();
    while (token.text !== "]" && token.text !== "EOF") {
      argText += token.text;
      token = context.expandNextToken();
    }
    if (!argText.match(/^\s*[0-9]+\s*$/)) {
      throw new ParseError("Invalid number of arguments: " + argText);
    }
    numArgs = parseInt(argText);
    arg = context.consumeArg().tokens;
  }
  if (!(exists && skipIfExists)) {
    context.macros.set(name, {
      tokens: arg,
      numArgs
    });
  }
  return "";
};
defineMacro("\\newcommand", (context) => newcommand(context, false, true, false));
defineMacro("\\renewcommand", (context) => newcommand(context, true, false, false));
defineMacro("\\providecommand", (context) => newcommand(context, true, true, true));
defineMacro("\\message", (context) => {
  var arg = context.consumeArgs(1)[0];
  console.log(arg.reverse().map((token) => token.text).join(""));
  return "";
});
defineMacro("\\errmessage", (context) => {
  var arg = context.consumeArgs(1)[0];
  console.error(arg.reverse().map((token) => token.text).join(""));
  return "";
});
defineMacro("\\show", (context) => {
  var tok = context.popToken();
  var name = tok.text;
  console.log(tok, context.macros.get(name), functions[name], symbols.math[name], symbols.text[name]);
  return "";
});
defineMacro("\\bgroup", "{");
defineMacro("\\egroup", "}");
defineMacro("~", "\\nobreakspace");
defineMacro("\\lq", "`");
defineMacro("\\rq", "'");
defineMacro("\\aa", "\\r a");
defineMacro("\\AA", "\\r A");
defineMacro("\\textcopyright", "\\html@mathml{\\textcircled{c}}{\\char`\xA9}");
defineMacro("\\copyright", "\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}");
defineMacro("\\textregistered", "\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`\xAE}");
defineMacro("\u212C", "\\mathscr{B}");
defineMacro("\u2130", "\\mathscr{E}");
defineMacro("\u2131", "\\mathscr{F}");
defineMacro("\u210B", "\\mathscr{H}");
defineMacro("\u2110", "\\mathscr{I}");
defineMacro("\u2112", "\\mathscr{L}");
defineMacro("\u2133", "\\mathscr{M}");
defineMacro("\u211B", "\\mathscr{R}");
defineMacro("\u212D", "\\mathfrak{C}");
defineMacro("\u210C", "\\mathfrak{H}");
defineMacro("\u2128", "\\mathfrak{Z}");
defineMacro("\\Bbbk", "\\Bbb{k}");
defineMacro("\xB7", "\\cdotp");
defineMacro("\\llap", "\\mathllap{\\textrm{#1}}");
defineMacro("\\rlap", "\\mathrlap{\\textrm{#1}}");
defineMacro("\\clap", "\\mathclap{\\textrm{#1}}");
defineMacro("\\mathstrut", "\\vphantom{(}");
defineMacro("\\underbar", "\\underline{\\text{#1}}");
defineMacro("\\not", '\\html@mathml{\\mathrel{\\mathrlap\\@not}}{\\char"338}');
defineMacro("\\neq", "\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`\u2260}}");
defineMacro("\\ne", "\\neq");
defineMacro("\u2260", "\\neq");
defineMacro("\\notin", "\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}{\\mathrel{\\char`\u2209}}");
defineMacro("\u2209", "\\notin");
defineMacro("\u2258", "\\html@mathml{\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}}{\\mathrel{\\char`\u2258}}");
defineMacro("\u2259", "\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`\u2258}}");
defineMacro("\u225A", "\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`\u225A}}");
defineMacro("\u225B", "\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}{\\mathrel{\\char`\u225B}}");
defineMacro("\u225D", "\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}{\\mathrel{\\char`\u225D}}");
defineMacro("\u225E", "\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}{\\mathrel{\\char`\u225E}}");
defineMacro("\u225F", "\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`\u225F}}");
defineMacro("\u27C2", "\\perp");
defineMacro("\u203C", "\\mathclose{!\\mkern-0.8mu!}");
defineMacro("\u220C", "\\notni");
defineMacro("\u231C", "\\ulcorner");
defineMacro("\u231D", "\\urcorner");
defineMacro("\u231E", "\\llcorner");
defineMacro("\u231F", "\\lrcorner");
defineMacro("\xA9", "\\copyright");
defineMacro("\xAE", "\\textregistered");
defineMacro("\uFE0F", "\\textregistered");
defineMacro("\\ulcorner", '\\html@mathml{\\@ulcorner}{\\mathop{\\char"231c}}');
defineMacro("\\urcorner", '\\html@mathml{\\@urcorner}{\\mathop{\\char"231d}}');
defineMacro("\\llcorner", '\\html@mathml{\\@llcorner}{\\mathop{\\char"231e}}');
defineMacro("\\lrcorner", '\\html@mathml{\\@lrcorner}{\\mathop{\\char"231f}}');
defineMacro("\\vdots", "{\\varvdots\\rule{0pt}{15pt}}");
defineMacro("\u22EE", "\\vdots");
defineMacro("\\varGamma", "\\mathit{\\Gamma}");
defineMacro("\\varDelta", "\\mathit{\\Delta}");
defineMacro("\\varTheta", "\\mathit{\\Theta}");
defineMacro("\\varLambda", "\\mathit{\\Lambda}");
defineMacro("\\varXi", "\\mathit{\\Xi}");
defineMacro("\\varPi", "\\mathit{\\Pi}");
defineMacro("\\varSigma", "\\mathit{\\Sigma}");
defineMacro("\\varUpsilon", "\\mathit{\\Upsilon}");
defineMacro("\\varPhi", "\\mathit{\\Phi}");
defineMacro("\\varPsi", "\\mathit{\\Psi}");
defineMacro("\\varOmega", "\\mathit{\\Omega}");
defineMacro("\\substack", "\\begin{subarray}{c}#1\\end{subarray}");
defineMacro("\\colon", "\\nobreak\\mskip2mu\\mathpunct{}\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu\\relax");
defineMacro("\\boxed", "\\fbox{$\\displaystyle{#1}$}");
defineMacro("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
defineMacro("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
defineMacro("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");
defineMacro("\\dddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ...}}{#1}}");
defineMacro("\\ddddot", "{\\overset{\\raisebox{-0.1ex}{\\normalsize ....}}{#1}}");
var dotsByToken = {
  ",": "\\dotsc",
  "\\not": "\\dotsb",
  // \keybin@ checks for the following:
  "+": "\\dotsb",
  "=": "\\dotsb",
  "<": "\\dotsb",
  ">": "\\dotsb",
  "-": "\\dotsb",
  "*": "\\dotsb",
  ":": "\\dotsb",
  // Symbols whose definition starts with \DOTSB:
  "\\DOTSB": "\\dotsb",
  "\\coprod": "\\dotsb",
  "\\bigvee": "\\dotsb",
  "\\bigwedge": "\\dotsb",
  "\\biguplus": "\\dotsb",
  "\\bigcap": "\\dotsb",
  "\\bigcup": "\\dotsb",
  "\\prod": "\\dotsb",
  "\\sum": "\\dotsb",
  "\\bigotimes": "\\dotsb",
  "\\bigoplus": "\\dotsb",
  "\\bigodot": "\\dotsb",
  "\\bigsqcup": "\\dotsb",
  "\\And": "\\dotsb",
  "\\longrightarrow": "\\dotsb",
  "\\Longrightarrow": "\\dotsb",
  "\\longleftarrow": "\\dotsb",
  "\\Longleftarrow": "\\dotsb",
  "\\longleftrightarrow": "\\dotsb",
  "\\Longleftrightarrow": "\\dotsb",
  "\\mapsto": "\\dotsb",
  "\\longmapsto": "\\dotsb",
  "\\hookrightarrow": "\\dotsb",
  "\\doteq": "\\dotsb",
  // Symbols whose definition starts with \mathbin:
  "\\mathbin": "\\dotsb",
  // Symbols whose definition starts with \mathrel:
  "\\mathrel": "\\dotsb",
  "\\relbar": "\\dotsb",
  "\\Relbar": "\\dotsb",
  "\\xrightarrow": "\\dotsb",
  "\\xleftarrow": "\\dotsb",
  // Symbols whose definition starts with \DOTSI:
  "\\DOTSI": "\\dotsi",
  "\\int": "\\dotsi",
  "\\oint": "\\dotsi",
  "\\iint": "\\dotsi",
  "\\iiint": "\\dotsi",
  "\\iiiint": "\\dotsi",
  "\\idotsint": "\\dotsi",
  // Symbols whose definition starts with \DOTSX:
  "\\DOTSX": "\\dotsx"
};
defineMacro("\\dots", function(context) {
  var thedots = "\\dotso";
  var next = context.expandAfterFuture().text;
  if (next in dotsByToken) {
    thedots = dotsByToken[next];
  } else if (next.slice(0, 4) === "\\not") {
    thedots = "\\dotsb";
  } else if (next in symbols.math) {
    if (utils.contains(["bin", "rel"], symbols.math[next].group)) {
      thedots = "\\dotsb";
    }
  }
  return thedots;
});
var spaceAfterDots = {
  // \rightdelim@ checks for the following:
  ")": true,
  "]": true,
  "\\rbrack": true,
  "\\}": true,
  "\\rbrace": true,
  "\\rangle": true,
  "\\rceil": true,
  "\\rfloor": true,
  "\\rgroup": true,
  "\\rmoustache": true,
  "\\right": true,
  "\\bigr": true,
  "\\biggr": true,
  "\\Bigr": true,
  "\\Biggr": true,
  // \extra@ also tests for the following:
  "$": true,
  // \extrap@ checks for the following:
  ";": true,
  ".": true,
  ",": true
};
defineMacro("\\dotso", function(context) {
  var next = context.future().text;
  if (next in spaceAfterDots) {
    return "\\ldots\\,";
  } else {
    return "\\ldots";
  }
});
defineMacro("\\dotsc", function(context) {
  var next = context.future().text;
  if (next in spaceAfterDots && next !== ",") {
    return "\\ldots\\,";
  } else {
    return "\\ldots";
  }
});
defineMacro("\\cdots", function(context) {
  var next = context.future().text;
  if (next in spaceAfterDots) {
    return "\\@cdots\\,";
  } else {
    return "\\@cdots";
  }
});
defineMacro("\\dotsb", "\\cdots");
defineMacro("\\dotsm", "\\cdots");
defineMacro("\\dotsi", "\\!\\cdots");
defineMacro("\\dotsx", "\\ldots\\,");
defineMacro("\\DOTSI", "\\relax");
defineMacro("\\DOTSB", "\\relax");
defineMacro("\\DOTSX", "\\relax");
defineMacro("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax");
defineMacro("\\,", "\\tmspace+{3mu}{.1667em}");
defineMacro("\\thinspace", "\\,");
defineMacro("\\>", "\\mskip{4mu}");
defineMacro("\\:", "\\tmspace+{4mu}{.2222em}");
defineMacro("\\medspace", "\\:");
defineMacro("\\;", "\\tmspace+{5mu}{.2777em}");
defineMacro("\\thickspace", "\\;");
defineMacro("\\!", "\\tmspace-{3mu}{.1667em}");
defineMacro("\\negthinspace", "\\!");
defineMacro("\\negmedspace", "\\tmspace-{4mu}{.2222em}");
defineMacro("\\negthickspace", "\\tmspace-{5mu}{.277em}");
defineMacro("\\enspace", "\\kern.5em ");
defineMacro("\\enskip", "\\hskip.5em\\relax");
defineMacro("\\quad", "\\hskip1em\\relax");
defineMacro("\\qquad", "\\hskip2em\\relax");
defineMacro("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
defineMacro("\\tag@paren", "\\tag@literal{({#1})}");
defineMacro("\\tag@literal", (context) => {
  if (context.macros.get("\\df@tag")) {
    throw new ParseError("Multiple \\tag");
  }
  return "\\gdef\\df@tag{\\text{#1}}";
});
defineMacro("\\bmod", "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}\\mathbin{\\rm mod}\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}");
defineMacro("\\pod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)");
defineMacro("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
defineMacro("\\mod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1");
defineMacro("\\newline", "\\\\\\relax");
defineMacro("\\TeX", "\\textrm{\\html@mathml{T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX}{TeX}}");
var latexRaiseA = makeEm(fontMetricsData["Main-Regular"]["T".charCodeAt(0)][1] - 0.7 * fontMetricsData["Main-Regular"]["A".charCodeAt(0)][1]);
defineMacro("\\LaTeX", "\\textrm{\\html@mathml{" + ("L\\kern-.36em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{LaTeX}}");
defineMacro("\\KaTeX", "\\textrm{\\html@mathml{" + ("K\\kern-.17em\\raisebox{" + latexRaiseA + "}{\\scriptstyle A}") + "\\kern-.15em\\TeX}{KaTeX}}");
defineMacro("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
defineMacro("\\@hspace", "\\hskip #1\\relax");
defineMacro("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax");
defineMacro("\\ordinarycolon", ":");
defineMacro("\\vcentcolon", "\\mathrel{\\mathop\\ordinarycolon}");
defineMacro("\\dblcolon", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}{\\mathop{\\char"2237}}');
defineMacro("\\coloneqq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2254}}');
defineMacro("\\Coloneqq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2237\\char"3d}}');
defineMacro("\\coloneq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"3a\\char"2212}}');
defineMacro("\\Coloneq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"2237\\char"2212}}');
defineMacro("\\eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2255}}');
defineMacro("\\Eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"3d\\char"2237}}');
defineMacro("\\eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2239}}');
defineMacro("\\Eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"2212\\char"2237}}');
defineMacro("\\colonapprox", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"3a\\char"2248}}');
defineMacro("\\Colonapprox", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"2237\\char"2248}}');
defineMacro("\\colonsim", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"3a\\char"223c}}');
defineMacro("\\Colonsim", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"2237\\char"223c}}');
defineMacro("\u2237", "\\dblcolon");
defineMacro("\u2239", "\\eqcolon");
defineMacro("\u2254", "\\coloneqq");
defineMacro("\u2255", "\\eqqcolon");
defineMacro("\u2A74", "\\Coloneqq");
defineMacro("\\ratio", "\\vcentcolon");
defineMacro("\\coloncolon", "\\dblcolon");
defineMacro("\\colonequals", "\\coloneqq");
defineMacro("\\coloncolonequals", "\\Coloneqq");
defineMacro("\\equalscolon", "\\eqqcolon");
defineMacro("\\equalscoloncolon", "\\Eqqcolon");
defineMacro("\\colonminus", "\\coloneq");
defineMacro("\\coloncolonminus", "\\Coloneq");
defineMacro("\\minuscolon", "\\eqcolon");
defineMacro("\\minuscoloncolon", "\\Eqcolon");
defineMacro("\\coloncolonapprox", "\\Colonapprox");
defineMacro("\\coloncolonsim", "\\Colonsim");
defineMacro("\\simcolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
defineMacro("\\simcoloncolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}");
defineMacro("\\approxcolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}");
defineMacro("\\approxcoloncolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}");
defineMacro("\\notni", "\\html@mathml{\\not\\ni}{\\mathrel{\\char`\u220C}}");
defineMacro("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
defineMacro("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}");
defineMacro("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}");
defineMacro("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}");
defineMacro("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{lim}}");
defineMacro("\\varliminf", "\\DOTSB\\operatorname*{\\underline{lim}}");
defineMacro("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{lim}}");
defineMacro("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{lim}}");
defineMacro("\\gvertneqq", "\\html@mathml{\\@gvertneqq}{\u2269}");
defineMacro("\\lvertneqq", "\\html@mathml{\\@lvertneqq}{\u2268}");
defineMacro("\\ngeqq", "\\html@mathml{\\@ngeqq}{\u2271}");
defineMacro("\\ngeqslant", "\\html@mathml{\\@ngeqslant}{\u2271}");
defineMacro("\\nleqq", "\\html@mathml{\\@nleqq}{\u2270}");
defineMacro("\\nleqslant", "\\html@mathml{\\@nleqslant}{\u2270}");
defineMacro("\\nshortmid", "\\html@mathml{\\@nshortmid}{\u2224}");
defineMacro("\\nshortparallel", "\\html@mathml{\\@nshortparallel}{\u2226}");
defineMacro("\\nsubseteqq", "\\html@mathml{\\@nsubseteqq}{\u2288}");
defineMacro("\\nsupseteqq", "\\html@mathml{\\@nsupseteqq}{\u2289}");
defineMacro("\\varsubsetneq", "\\html@mathml{\\@varsubsetneq}{\u228A}");
defineMacro("\\varsubsetneqq", "\\html@mathml{\\@varsubsetneqq}{\u2ACB}");
defineMacro("\\varsupsetneq", "\\html@mathml{\\@varsupsetneq}{\u228B}");
defineMacro("\\varsupsetneqq", "\\html@mathml{\\@varsupsetneqq}{\u2ACC}");
defineMacro("\\imath", "\\html@mathml{\\@imath}{\u0131}");
defineMacro("\\jmath", "\\html@mathml{\\@jmath}{\u0237}");
defineMacro("\\llbracket", "\\html@mathml{\\mathopen{[\\mkern-3.2mu[}}{\\mathopen{\\char`\u27E6}}");
defineMacro("\\rrbracket", "\\html@mathml{\\mathclose{]\\mkern-3.2mu]}}{\\mathclose{\\char`\u27E7}}");
defineMacro("\u27E6", "\\llbracket");
defineMacro("\u27E7", "\\rrbracket");
defineMacro("\\lBrace", "\\html@mathml{\\mathopen{\\{\\mkern-3.2mu[}}{\\mathopen{\\char`\u2983}}");
defineMacro("\\rBrace", "\\html@mathml{\\mathclose{]\\mkern-3.2mu\\}}}{\\mathclose{\\char`\u2984}}");
defineMacro("\u2983", "\\lBrace");
defineMacro("\u2984", "\\rBrace");
defineMacro("\\minuso", "\\mathbin{\\html@mathml{{\\mathrlap{\\mathchoice{\\kern{0.145em}}{\\kern{0.145em}}{\\kern{0.1015em}}{\\kern{0.0725em}}\\circ}{-}}}{\\char`\u29B5}}");
defineMacro("\u29B5", "\\minuso");
defineMacro("\\darr", "\\downarrow");
defineMacro("\\dArr", "\\Downarrow");
defineMacro("\\Darr", "\\Downarrow");
defineMacro("\\lang", "\\langle");
defineMacro("\\rang", "\\rangle");
defineMacro("\\uarr", "\\uparrow");
defineMacro("\\uArr", "\\Uparrow");
defineMacro("\\Uarr", "\\Uparrow");
defineMacro("\\N", "\\mathbb{N}");
defineMacro("\\R", "\\mathbb{R}");
defineMacro("\\Z", "\\mathbb{Z}");
defineMacro("\\alef", "\\aleph");
defineMacro("\\alefsym", "\\aleph");
defineMacro("\\Alpha", "\\mathrm{A}");
defineMacro("\\Beta", "\\mathrm{B}");
defineMacro("\\bull", "\\bullet");
defineMacro("\\Chi", "\\mathrm{X}");
defineMacro("\\clubs", "\\clubsuit");
defineMacro("\\cnums", "\\mathbb{C}");
defineMacro("\\Complex", "\\mathbb{C}");
defineMacro("\\Dagger", "\\ddagger");
defineMacro("\\diamonds", "\\diamondsuit");
defineMacro("\\empty", "\\emptyset");
defineMacro("\\Epsilon", "\\mathrm{E}");
defineMacro("\\Eta", "\\mathrm{H}");
defineMacro("\\exist", "\\exists");
defineMacro("\\harr", "\\leftrightarrow");
defineMacro("\\hArr", "\\Leftrightarrow");
defineMacro("\\Harr", "\\Leftrightarrow");
defineMacro("\\hearts", "\\heartsuit");
defineMacro("\\image", "\\Im");
defineMacro("\\infin", "\\infty");
defineMacro("\\Iota", "\\mathrm{I}");
defineMacro("\\isin", "\\in");
defineMacro("\\Kappa", "\\mathrm{K}");
defineMacro("\\larr", "\\leftarrow");
defineMacro("\\lArr", "\\Leftarrow");
defineMacro("\\Larr", "\\Leftarrow");
defineMacro("\\lrarr", "\\leftrightarrow");
defineMacro("\\lrArr", "\\Leftrightarrow");
defineMacro("\\Lrarr", "\\Leftrightarrow");
defineMacro("\\Mu", "\\mathrm{M}");
defineMacro("\\natnums", "\\mathbb{N}");
defineMacro("\\Nu", "\\mathrm{N}");
defineMacro("\\Omicron", "\\mathrm{O}");
defineMacro("\\plusmn", "\\pm");
defineMacro("\\rarr", "\\rightarrow");
defineMacro("\\rArr", "\\Rightarrow");
defineMacro("\\Rarr", "\\Rightarrow");
defineMacro("\\real", "\\Re");
defineMacro("\\reals", "\\mathbb{R}");
defineMacro("\\Reals", "\\mathbb{R}");
defineMacro("\\Rho", "\\mathrm{P}");
defineMacro("\\sdot", "\\cdot");
defineMacro("\\sect", "\\S");
defineMacro("\\spades", "\\spadesuit");
defineMacro("\\sub", "\\subset");
defineMacro("\\sube", "\\subseteq");
defineMacro("\\supe", "\\supseteq");
defineMacro("\\Tau", "\\mathrm{T}");
defineMacro("\\thetasym", "\\vartheta");
defineMacro("\\weierp", "\\wp");
defineMacro("\\Zeta", "\\mathrm{Z}");
defineMacro("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
defineMacro("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
defineMacro("\\plim", "\\DOTSB\\mathop{\\operatorname{plim}}\\limits");
defineMacro("\\bra", "\\mathinner{\\langle{#1}|}");
defineMacro("\\ket", "\\mathinner{|{#1}\\rangle}");
defineMacro("\\braket", "\\mathinner{\\langle{#1}\\rangle}");
defineMacro("\\Bra", "\\left\\langle#1\\right|");
defineMacro("\\Ket", "\\left|#1\\right\\rangle");
var braketHelper = (one) => (context) => {
  var left = context.consumeArg().tokens;
  var middle = context.consumeArg().tokens;
  var middleDouble = context.consumeArg().tokens;
  var right = context.consumeArg().tokens;
  var oldMiddle = context.macros.get("|");
  var oldMiddleDouble = context.macros.get("\\|");
  context.macros.beginGroup();
  var midMacro = (double) => (context2) => {
    if (one) {
      context2.macros.set("|", oldMiddle);
      if (middleDouble.length) {
        context2.macros.set("\\|", oldMiddleDouble);
      }
    }
    var doubled = double;
    if (!double && middleDouble.length) {
      var nextToken = context2.future();
      if (nextToken.text === "|") {
        context2.popToken();
        doubled = true;
      }
    }
    return {
      tokens: doubled ? middleDouble : middle,
      numArgs: 0
    };
  };
  context.macros.set("|", midMacro(false));
  if (middleDouble.length) {
    context.macros.set("\\|", midMacro(true));
  }
  var arg = context.consumeArg().tokens;
  var expanded = context.expandTokens([
    ...right,
    ...arg,
    ...left
    // reversed
  ]);
  context.macros.endGroup();
  return {
    tokens: expanded.reverse(),
    numArgs: 0
  };
};
defineMacro("\\bra@ket", braketHelper(false));
defineMacro("\\bra@set", braketHelper(true));
defineMacro("\\Braket", "\\bra@ket{\\left\\langle}{\\,\\middle\\vert\\,}{\\,\\middle\\vert\\,}{\\right\\rangle}");
defineMacro("\\Set", "\\bra@set{\\left\\{\\:}{\\;\\middle\\vert\\;}{\\;\\middle\\Vert\\;}{\\:\\right\\}}");
defineMacro("\\set", "\\bra@set{\\{\\,}{\\mid}{}{\\,\\}}");
defineMacro("\\angln", "{\\angl n}");
defineMacro("\\blue", "\\textcolor{##6495ed}{#1}");
defineMacro("\\orange", "\\textcolor{##ffa500}{#1}");
defineMacro("\\pink", "\\textcolor{##ff00af}{#1}");
defineMacro("\\red", "\\textcolor{##df0030}{#1}");
defineMacro("\\green", "\\textcolor{##28ae7b}{#1}");
defineMacro("\\gray", "\\textcolor{gray}{#1}");
defineMacro("\\purple", "\\textcolor{##9d38bd}{#1}");
defineMacro("\\blueA", "\\textcolor{##ccfaff}{#1}");
defineMacro("\\blueB", "\\textcolor{##80f6ff}{#1}");
defineMacro("\\blueC", "\\textcolor{##63d9ea}{#1}");
defineMacro("\\blueD", "\\textcolor{##11accd}{#1}");
defineMacro("\\blueE", "\\textcolor{##0c7f99}{#1}");
defineMacro("\\tealA", "\\textcolor{##94fff5}{#1}");
defineMacro("\\tealB", "\\textcolor{##26edd5}{#1}");
defineMacro("\\tealC", "\\textcolor{##01d1c1}{#1}");
defineMacro("\\tealD", "\\textcolor{##01a995}{#1}");
defineMacro("\\tealE", "\\textcolor{##208170}{#1}");
defineMacro("\\greenA", "\\textcolor{##b6ffb0}{#1}");
defineMacro("\\greenB", "\\textcolor{##8af281}{#1}");
defineMacro("\\greenC", "\\textcolor{##74cf70}{#1}");
defineMacro("\\greenD", "\\textcolor{##1fab54}{#1}");
defineMacro("\\greenE", "\\textcolor{##0d923f}{#1}");
defineMacro("\\goldA", "\\textcolor{##ffd0a9}{#1}");
defineMacro("\\goldB", "\\textcolor{##ffbb71}{#1}");
defineMacro("\\goldC", "\\textcolor{##ff9c39}{#1}");
defineMacro("\\goldD", "\\textcolor{##e07d10}{#1}");
defineMacro("\\goldE", "\\textcolor{##a75a05}{#1}");
defineMacro("\\redA", "\\textcolor{##fca9a9}{#1}");
defineMacro("\\redB", "\\textcolor{##ff8482}{#1}");
defineMacro("\\redC", "\\textcolor{##f9685d}{#1}");
defineMacro("\\redD", "\\textcolor{##e84d39}{#1}");
defineMacro("\\redE", "\\textcolor{##bc2612}{#1}");
defineMacro("\\maroonA", "\\textcolor{##ffbde0}{#1}");
defineMacro("\\maroonB", "\\textcolor{##ff92c6}{#1}");
defineMacro("\\maroonC", "\\textcolor{##ed5fa6}{#1}");
defineMacro("\\maroonD", "\\textcolor{##ca337c}{#1}");
defineMacro("\\maroonE", "\\textcolor{##9e034e}{#1}");
defineMacro("\\purpleA", "\\textcolor{##ddd7ff}{#1}");
defineMacro("\\purpleB", "\\textcolor{##c6b9fc}{#1}");
defineMacro("\\purpleC", "\\textcolor{##aa87ff}{#1}");
defineMacro("\\purpleD", "\\textcolor{##7854ab}{#1}");
defineMacro("\\purpleE", "\\textcolor{##543b78}{#1}");
defineMacro("\\mintA", "\\textcolor{##f5f9e8}{#1}");
defineMacro("\\mintB", "\\textcolor{##edf2df}{#1}");
defineMacro("\\mintC", "\\textcolor{##e0e5cc}{#1}");
defineMacro("\\grayA", "\\textcolor{##f6f7f7}{#1}");
defineMacro("\\grayB", "\\textcolor{##f0f1f2}{#1}");
defineMacro("\\grayC", "\\textcolor{##e3e5e6}{#1}");
defineMacro("\\grayD", "\\textcolor{##d6d8da}{#1}");
defineMacro("\\grayE", "\\textcolor{##babec2}{#1}");
defineMacro("\\grayF", "\\textcolor{##888d93}{#1}");
defineMacro("\\grayG", "\\textcolor{##626569}{#1}");
defineMacro("\\grayH", "\\textcolor{##3b3e40}{#1}");
defineMacro("\\grayI", "\\textcolor{##21242c}{#1}");
defineMacro("\\kaBlue", "\\textcolor{##314453}{#1}");
defineMacro("\\kaGreen", "\\textcolor{##71B307}{#1}");
var implicitCommands = {
  "^": true,
  // Parser.js
  "_": true,
  // Parser.js
  "\\limits": true,
  // Parser.js
  "\\nolimits": true
  // Parser.js
};
var MacroExpander = class {
  constructor(input, settings, mode) {
    this.settings = void 0;
    this.expansionCount = void 0;
    this.lexer = void 0;
    this.macros = void 0;
    this.stack = void 0;
    this.mode = void 0;
    this.settings = settings;
    this.expansionCount = 0;
    this.feed(input);
    this.macros = new Namespace(macros, settings.macros);
    this.mode = mode;
    this.stack = [];
  }
  /**
   * Feed a new input string to the same MacroExpander
   * (with existing macros etc.).
   */
  feed(input) {
    this.lexer = new Lexer(input, this.settings);
  }
  /**
   * Switches between "text" and "math" modes.
   */
  switchMode(newMode) {
    this.mode = newMode;
  }
  /**
   * Start a new group nesting within all namespaces.
   */
  beginGroup() {
    this.macros.beginGroup();
  }
  /**
   * End current group nesting within all namespaces.
   */
  endGroup() {
    this.macros.endGroup();
  }
  /**
   * Ends all currently nested groups (if any), restoring values before the
   * groups began.  Useful in case of an error in the middle of parsing.
   */
  endGroups() {
    this.macros.endGroups();
  }
  /**
   * Returns the topmost token on the stack, without expanding it.
   * Similar in behavior to TeX's `\futurelet`.
   */
  future() {
    if (this.stack.length === 0) {
      this.pushToken(this.lexer.lex());
    }
    return this.stack[this.stack.length - 1];
  }
  /**
   * Remove and return the next unexpanded token.
   */
  popToken() {
    this.future();
    return this.stack.pop();
  }
  /**
   * Add a given token to the token stack.  In particular, this get be used
   * to put back a token returned from one of the other methods.
   */
  pushToken(token) {
    this.stack.push(token);
  }
  /**
   * Append an array of tokens to the token stack.
   */
  pushTokens(tokens) {
    this.stack.push(...tokens);
  }
  /**
   * Find an macro argument without expanding tokens and append the array of
   * tokens to the token stack. Uses Token as a container for the result.
   */
  scanArgument(isOptional) {
    var start;
    var end;
    var tokens;
    if (isOptional) {
      this.consumeSpaces();
      if (this.future().text !== "[") {
        return null;
      }
      start = this.popToken();
      ({
        tokens,
        end
      } = this.consumeArg(["]"]));
    } else {
      ({
        tokens,
        start,
        end
      } = this.consumeArg());
    }
    this.pushToken(new Token("EOF", end.loc));
    this.pushTokens(tokens);
    return start.range(end, "");
  }
  /**
   * Consume all following space tokens, without expansion.
   */
  consumeSpaces() {
    for (; ; ) {
      var token = this.future();
      if (token.text === " ") {
        this.stack.pop();
      } else {
        break;
      }
    }
  }
  /**
   * Consume an argument from the token stream, and return the resulting array
   * of tokens and start/end token.
   */
  consumeArg(delims) {
    var tokens = [];
    var isDelimited = delims && delims.length > 0;
    if (!isDelimited) {
      this.consumeSpaces();
    }
    var start = this.future();
    var tok;
    var depth = 0;
    var match = 0;
    do {
      tok = this.popToken();
      tokens.push(tok);
      if (tok.text === "{") {
        ++depth;
      } else if (tok.text === "}") {
        --depth;
        if (depth === -1) {
          throw new ParseError("Extra }", tok);
        }
      } else if (tok.text === "EOF") {
        throw new ParseError("Unexpected end of input in a macro argument, expected '" + (delims && isDelimited ? delims[match] : "}") + "'", tok);
      }
      if (delims && isDelimited) {
        if ((depth === 0 || depth === 1 && delims[match] === "{") && tok.text === delims[match]) {
          ++match;
          if (match === delims.length) {
            tokens.splice(-match, match);
            break;
          }
        } else {
          match = 0;
        }
      }
    } while (depth !== 0 || isDelimited);
    if (start.text === "{" && tokens[tokens.length - 1].text === "}") {
      tokens.pop();
      tokens.shift();
    }
    tokens.reverse();
    return {
      tokens,
      start,
      end: tok
    };
  }
  /**
   * Consume the specified number of (delimited) arguments from the token
   * stream and return the resulting array of arguments.
   */
  consumeArgs(numArgs, delimiters2) {
    if (delimiters2) {
      if (delimiters2.length !== numArgs + 1) {
        throw new ParseError("The length of delimiters doesn't match the number of args!");
      }
      var delims = delimiters2[0];
      for (var i2 = 0; i2 < delims.length; i2++) {
        var tok = this.popToken();
        if (delims[i2] !== tok.text) {
          throw new ParseError("Use of the macro doesn't match its definition", tok);
        }
      }
    }
    var args = [];
    for (var _i6 = 0; _i6 < numArgs; _i6++) {
      args.push(this.consumeArg(delimiters2 && delimiters2[_i6 + 1]).tokens);
    }
    return args;
  }
  /**
   * Increment `expansionCount` by the specified amount.
   * Throw an error if it exceeds `maxExpand`.
   */
  countExpansion(amount) {
    this.expansionCount += amount;
    if (this.expansionCount > this.settings.maxExpand) {
      throw new ParseError("Too many expansions: infinite loop or need to increase maxExpand setting");
    }
  }
  /**
   * Expand the next token only once if possible.
   *
   * If the token is expanded, the resulting tokens will be pushed onto
   * the stack in reverse order, and the number of such tokens will be
   * returned.  This number might be zero or positive.
   *
   * If not, the return value is `false`, and the next token remains at the
   * top of the stack.
   *
   * In either case, the next token will be on the top of the stack,
   * or the stack will be empty (in case of empty expansion
   * and no other tokens).
   *
   * Used to implement `expandAfterFuture` and `expandNextToken`.
   *
   * If expandableOnly, only expandable tokens are expanded and
   * an undefined control sequence results in an error.
   */
  expandOnce(expandableOnly) {
    var topToken = this.popToken();
    var name = topToken.text;
    var expansion = !topToken.noexpand ? this._getExpansion(name) : null;
    if (expansion == null || expandableOnly && expansion.unexpandable) {
      if (expandableOnly && expansion == null && name[0] === "\\" && !this.isDefined(name)) {
        throw new ParseError("Undefined control sequence: " + name);
      }
      this.pushToken(topToken);
      return false;
    }
    this.countExpansion(1);
    var tokens = expansion.tokens;
    var args = this.consumeArgs(expansion.numArgs, expansion.delimiters);
    if (expansion.numArgs) {
      tokens = tokens.slice();
      for (var i2 = tokens.length - 1; i2 >= 0; --i2) {
        var tok = tokens[i2];
        if (tok.text === "#") {
          if (i2 === 0) {
            throw new ParseError("Incomplete placeholder at end of macro body", tok);
          }
          tok = tokens[--i2];
          if (tok.text === "#") {
            tokens.splice(i2 + 1, 1);
          } else if (/^[1-9]$/.test(tok.text)) {
            tokens.splice(i2, 2, ...args[+tok.text - 1]);
          } else {
            throw new ParseError("Not a valid argument number", tok);
          }
        }
      }
    }
    this.pushTokens(tokens);
    return tokens.length;
  }
  /**
   * Expand the next token only once (if possible), and return the resulting
   * top token on the stack (without removing anything from the stack).
   * Similar in behavior to TeX's `\expandafter\futurelet`.
   * Equivalent to expandOnce() followed by future().
   */
  expandAfterFuture() {
    this.expandOnce();
    return this.future();
  }
  /**
   * Recursively expand first token, then return first non-expandable token.
   */
  expandNextToken() {
    for (; ; ) {
      if (this.expandOnce() === false) {
        var token = this.stack.pop();
        if (token.treatAsRelax) {
          token.text = "\\relax";
        }
        return token;
      }
    }
    throw new Error();
  }
  /**
   * Fully expand the given macro name and return the resulting list of
   * tokens, or return `undefined` if no such macro is defined.
   */
  expandMacro(name) {
    return this.macros.has(name) ? this.expandTokens([new Token(name)]) : void 0;
  }
  /**
   * Fully expand the given token stream and return the resulting list of
   * tokens.  Note that the input tokens are in reverse order, but the
   * output tokens are in forward order.
   */
  expandTokens(tokens) {
    var output = [];
    var oldStackLength = this.stack.length;
    this.pushTokens(tokens);
    while (this.stack.length > oldStackLength) {
      if (this.expandOnce(true) === false) {
        var token = this.stack.pop();
        if (token.treatAsRelax) {
          token.noexpand = false;
          token.treatAsRelax = false;
        }
        output.push(token);
      }
    }
    this.countExpansion(output.length);
    return output;
  }
  /**
   * Fully expand the given macro name and return the result as a string,
   * or return `undefined` if no such macro is defined.
   */
  expandMacroAsText(name) {
    var tokens = this.expandMacro(name);
    if (tokens) {
      return tokens.map((token) => token.text).join("");
    } else {
      return tokens;
    }
  }
  /**
   * Returns the expanded macro as a reversed array of tokens and a macro
   * argument count.  Or returns `null` if no such macro.
   */
  _getExpansion(name) {
    var definition = this.macros.get(name);
    if (definition == null) {
      return definition;
    }
    if (name.length === 1) {
      var catcode = this.lexer.catcodes[name];
      if (catcode != null && catcode !== 13) {
        return;
      }
    }
    var expansion = typeof definition === "function" ? definition(this) : definition;
    if (typeof expansion === "string") {
      var numArgs = 0;
      if (expansion.indexOf("#") !== -1) {
        var stripped = expansion.replace(/##/g, "");
        while (stripped.indexOf("#" + (numArgs + 1)) !== -1) {
          ++numArgs;
        }
      }
      var bodyLexer = new Lexer(expansion, this.settings);
      var tokens = [];
      var tok = bodyLexer.lex();
      while (tok.text !== "EOF") {
        tokens.push(tok);
        tok = bodyLexer.lex();
      }
      tokens.reverse();
      var expanded = {
        tokens,
        numArgs
      };
      return expanded;
    }
    return expansion;
  }
  /**
   * Determine whether a command is currently "defined" (has some
   * functionality), meaning that it's a macro (in the current group),
   * a function, a symbol, or one of the special commands listed in
   * `implicitCommands`.
   */
  isDefined(name) {
    return this.macros.has(name) || functions.hasOwnProperty(name) || symbols.math.hasOwnProperty(name) || symbols.text.hasOwnProperty(name) || implicitCommands.hasOwnProperty(name);
  }
  /**
   * Determine whether a command is expandable.
   */
  isExpandable(name) {
    var macro = this.macros.get(name);
    return macro != null ? typeof macro === "string" || typeof macro === "function" || !macro.unexpandable : functions.hasOwnProperty(name) && !functions[name].primitive;
  }
};
var unicodeSubRegEx = /^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/;
var uSubsAndSups = Object.freeze({
  "\u208A": "+",
  "\u208B": "-",
  "\u208C": "=",
  "\u208D": "(",
  "\u208E": ")",
  "\u2080": "0",
  "\u2081": "1",
  "\u2082": "2",
  "\u2083": "3",
  "\u2084": "4",
  "\u2085": "5",
  "\u2086": "6",
  "\u2087": "7",
  "\u2088": "8",
  "\u2089": "9",
  "\u2090": "a",
  "\u2091": "e",
  "\u2095": "h",
  "\u1D62": "i",
  "\u2C7C": "j",
  "\u2096": "k",
  "\u2097": "l",
  "\u2098": "m",
  "\u2099": "n",
  "\u2092": "o",
  "\u209A": "p",
  "\u1D63": "r",
  "\u209B": "s",
  "\u209C": "t",
  "\u1D64": "u",
  "\u1D65": "v",
  "\u2093": "x",
  "\u1D66": "\u03B2",
  "\u1D67": "\u03B3",
  "\u1D68": "\u03C1",
  "\u1D69": "\u03D5",
  "\u1D6A": "\u03C7",
  "\u207A": "+",
  "\u207B": "-",
  "\u207C": "=",
  "\u207D": "(",
  "\u207E": ")",
  "\u2070": "0",
  "\xB9": "1",
  "\xB2": "2",
  "\xB3": "3",
  "\u2074": "4",
  "\u2075": "5",
  "\u2076": "6",
  "\u2077": "7",
  "\u2078": "8",
  "\u2079": "9",
  "\u1D2C": "A",
  "\u1D2E": "B",
  "\u1D30": "D",
  "\u1D31": "E",
  "\u1D33": "G",
  "\u1D34": "H",
  "\u1D35": "I",
  "\u1D36": "J",
  "\u1D37": "K",
  "\u1D38": "L",
  "\u1D39": "M",
  "\u1D3A": "N",
  "\u1D3C": "O",
  "\u1D3E": "P",
  "\u1D3F": "R",
  "\u1D40": "T",
  "\u1D41": "U",
  "\u2C7D": "V",
  "\u1D42": "W",
  "\u1D43": "a",
  "\u1D47": "b",
  "\u1D9C": "c",
  "\u1D48": "d",
  "\u1D49": "e",
  "\u1DA0": "f",
  "\u1D4D": "g",
  "\u02B0": "h",
  "\u2071": "i",
  "\u02B2": "j",
  "\u1D4F": "k",
  "\u02E1": "l",
  "\u1D50": "m",
  "\u207F": "n",
  "\u1D52": "o",
  "\u1D56": "p",
  "\u02B3": "r",
  "\u02E2": "s",
  "\u1D57": "t",
  "\u1D58": "u",
  "\u1D5B": "v",
  "\u02B7": "w",
  "\u02E3": "x",
  "\u02B8": "y",
  "\u1DBB": "z",
  "\u1D5D": "\u03B2",
  "\u1D5E": "\u03B3",
  "\u1D5F": "\u03B4",
  "\u1D60": "\u03D5",
  "\u1D61": "\u03C7",
  "\u1DBF": "\u03B8"
});
var unicodeAccents = {
  "\u0301": {
    "text": "\\'",
    "math": "\\acute"
  },
  "\u0300": {
    "text": "\\`",
    "math": "\\grave"
  },
  "\u0308": {
    "text": '\\"',
    "math": "\\ddot"
  },
  "\u0303": {
    "text": "\\~",
    "math": "\\tilde"
  },
  "\u0304": {
    "text": "\\=",
    "math": "\\bar"
  },
  "\u0306": {
    "text": "\\u",
    "math": "\\breve"
  },
  "\u030C": {
    "text": "\\v",
    "math": "\\check"
  },
  "\u0302": {
    "text": "\\^",
    "math": "\\hat"
  },
  "\u0307": {
    "text": "\\.",
    "math": "\\dot"
  },
  "\u030A": {
    "text": "\\r",
    "math": "\\mathring"
  },
  "\u030B": {
    "text": "\\H"
  },
  "\u0327": {
    "text": "\\c"
  }
};
var unicodeSymbols = {
  "\xE1": "a\u0301",
  "\xE0": "a\u0300",
  "\xE4": "a\u0308",
  "\u01DF": "a\u0308\u0304",
  "\xE3": "a\u0303",
  "\u0101": "a\u0304",
  "\u0103": "a\u0306",
  "\u1EAF": "a\u0306\u0301",
  "\u1EB1": "a\u0306\u0300",
  "\u1EB5": "a\u0306\u0303",
  "\u01CE": "a\u030C",
  "\xE2": "a\u0302",
  "\u1EA5": "a\u0302\u0301",
  "\u1EA7": "a\u0302\u0300",
  "\u1EAB": "a\u0302\u0303",
  "\u0227": "a\u0307",
  "\u01E1": "a\u0307\u0304",
  "\xE5": "a\u030A",
  "\u01FB": "a\u030A\u0301",
  "\u1E03": "b\u0307",
  "\u0107": "c\u0301",
  "\u1E09": "c\u0327\u0301",
  "\u010D": "c\u030C",
  "\u0109": "c\u0302",
  "\u010B": "c\u0307",
  "\xE7": "c\u0327",
  "\u010F": "d\u030C",
  "\u1E0B": "d\u0307",
  "\u1E11": "d\u0327",
  "\xE9": "e\u0301",
  "\xE8": "e\u0300",
  "\xEB": "e\u0308",
  "\u1EBD": "e\u0303",
  "\u0113": "e\u0304",
  "\u1E17": "e\u0304\u0301",
  "\u1E15": "e\u0304\u0300",
  "\u0115": "e\u0306",
  "\u1E1D": "e\u0327\u0306",
  "\u011B": "e\u030C",
  "\xEA": "e\u0302",
  "\u1EBF": "e\u0302\u0301",
  "\u1EC1": "e\u0302\u0300",
  "\u1EC5": "e\u0302\u0303",
  "\u0117": "e\u0307",
  "\u0229": "e\u0327",
  "\u1E1F": "f\u0307",
  "\u01F5": "g\u0301",
  "\u1E21": "g\u0304",
  "\u011F": "g\u0306",
  "\u01E7": "g\u030C",
  "\u011D": "g\u0302",
  "\u0121": "g\u0307",
  "\u0123": "g\u0327",
  "\u1E27": "h\u0308",
  "\u021F": "h\u030C",
  "\u0125": "h\u0302",
  "\u1E23": "h\u0307",
  "\u1E29": "h\u0327",
  "\xED": "i\u0301",
  "\xEC": "i\u0300",
  "\xEF": "i\u0308",
  "\u1E2F": "i\u0308\u0301",
  "\u0129": "i\u0303",
  "\u012B": "i\u0304",
  "\u012D": "i\u0306",
  "\u01D0": "i\u030C",
  "\xEE": "i\u0302",
  "\u01F0": "j\u030C",
  "\u0135": "j\u0302",
  "\u1E31": "k\u0301",
  "\u01E9": "k\u030C",
  "\u0137": "k\u0327",
  "\u013A": "l\u0301",
  "\u013E": "l\u030C",
  "\u013C": "l\u0327",
  "\u1E3F": "m\u0301",
  "\u1E41": "m\u0307",
  "\u0144": "n\u0301",
  "\u01F9": "n\u0300",
  "\xF1": "n\u0303",
  "\u0148": "n\u030C",
  "\u1E45": "n\u0307",
  "\u0146": "n\u0327",
  "\xF3": "o\u0301",
  "\xF2": "o\u0300",
  "\xF6": "o\u0308",
  "\u022B": "o\u0308\u0304",
  "\xF5": "o\u0303",
  "\u1E4D": "o\u0303\u0301",
  "\u1E4F": "o\u0303\u0308",
  "\u022D": "o\u0303\u0304",
  "\u014D": "o\u0304",
  "\u1E53": "o\u0304\u0301",
  "\u1E51": "o\u0304\u0300",
  "\u014F": "o\u0306",
  "\u01D2": "o\u030C",
  "\xF4": "o\u0302",
  "\u1ED1": "o\u0302\u0301",
  "\u1ED3": "o\u0302\u0300",
  "\u1ED7": "o\u0302\u0303",
  "\u022F": "o\u0307",
  "\u0231": "o\u0307\u0304",
  "\u0151": "o\u030B",
  "\u1E55": "p\u0301",
  "\u1E57": "p\u0307",
  "\u0155": "r\u0301",
  "\u0159": "r\u030C",
  "\u1E59": "r\u0307",
  "\u0157": "r\u0327",
  "\u015B": "s\u0301",
  "\u1E65": "s\u0301\u0307",
  "\u0161": "s\u030C",
  "\u1E67": "s\u030C\u0307",
  "\u015D": "s\u0302",
  "\u1E61": "s\u0307",
  "\u015F": "s\u0327",
  "\u1E97": "t\u0308",
  "\u0165": "t\u030C",
  "\u1E6B": "t\u0307",
  "\u0163": "t\u0327",
  "\xFA": "u\u0301",
  "\xF9": "u\u0300",
  "\xFC": "u\u0308",
  "\u01D8": "u\u0308\u0301",
  "\u01DC": "u\u0308\u0300",
  "\u01D6": "u\u0308\u0304",
  "\u01DA": "u\u0308\u030C",
  "\u0169": "u\u0303",
  "\u1E79": "u\u0303\u0301",
  "\u016B": "u\u0304",
  "\u1E7B": "u\u0304\u0308",
  "\u016D": "u\u0306",
  "\u01D4": "u\u030C",
  "\xFB": "u\u0302",
  "\u016F": "u\u030A",
  "\u0171": "u\u030B",
  "\u1E7D": "v\u0303",
  "\u1E83": "w\u0301",
  "\u1E81": "w\u0300",
  "\u1E85": "w\u0308",
  "\u0175": "w\u0302",
  "\u1E87": "w\u0307",
  "\u1E98": "w\u030A",
  "\u1E8D": "x\u0308",
  "\u1E8B": "x\u0307",
  "\xFD": "y\u0301",
  "\u1EF3": "y\u0300",
  "\xFF": "y\u0308",
  "\u1EF9": "y\u0303",
  "\u0233": "y\u0304",
  "\u0177": "y\u0302",
  "\u1E8F": "y\u0307",
  "\u1E99": "y\u030A",
  "\u017A": "z\u0301",
  "\u017E": "z\u030C",
  "\u1E91": "z\u0302",
  "\u017C": "z\u0307",
  "\xC1": "A\u0301",
  "\xC0": "A\u0300",
  "\xC4": "A\u0308",
  "\u01DE": "A\u0308\u0304",
  "\xC3": "A\u0303",
  "\u0100": "A\u0304",
  "\u0102": "A\u0306",
  "\u1EAE": "A\u0306\u0301",
  "\u1EB0": "A\u0306\u0300",
  "\u1EB4": "A\u0306\u0303",
  "\u01CD": "A\u030C",
  "\xC2": "A\u0302",
  "\u1EA4": "A\u0302\u0301",
  "\u1EA6": "A\u0302\u0300",
  "\u1EAA": "A\u0302\u0303",
  "\u0226": "A\u0307",
  "\u01E0": "A\u0307\u0304",
  "\xC5": "A\u030A",
  "\u01FA": "A\u030A\u0301",
  "\u1E02": "B\u0307",
  "\u0106": "C\u0301",
  "\u1E08": "C\u0327\u0301",
  "\u010C": "C\u030C",
  "\u0108": "C\u0302",
  "\u010A": "C\u0307",
  "\xC7": "C\u0327",
  "\u010E": "D\u030C",
  "\u1E0A": "D\u0307",
  "\u1E10": "D\u0327",
  "\xC9": "E\u0301",
  "\xC8": "E\u0300",
  "\xCB": "E\u0308",
  "\u1EBC": "E\u0303",
  "\u0112": "E\u0304",
  "\u1E16": "E\u0304\u0301",
  "\u1E14": "E\u0304\u0300",
  "\u0114": "E\u0306",
  "\u1E1C": "E\u0327\u0306",
  "\u011A": "E\u030C",
  "\xCA": "E\u0302",
  "\u1EBE": "E\u0302\u0301",
  "\u1EC0": "E\u0302\u0300",
  "\u1EC4": "E\u0302\u0303",
  "\u0116": "E\u0307",
  "\u0228": "E\u0327",
  "\u1E1E": "F\u0307",
  "\u01F4": "G\u0301",
  "\u1E20": "G\u0304",
  "\u011E": "G\u0306",
  "\u01E6": "G\u030C",
  "\u011C": "G\u0302",
  "\u0120": "G\u0307",
  "\u0122": "G\u0327",
  "\u1E26": "H\u0308",
  "\u021E": "H\u030C",
  "\u0124": "H\u0302",
  "\u1E22": "H\u0307",
  "\u1E28": "H\u0327",
  "\xCD": "I\u0301",
  "\xCC": "I\u0300",
  "\xCF": "I\u0308",
  "\u1E2E": "I\u0308\u0301",
  "\u0128": "I\u0303",
  "\u012A": "I\u0304",
  "\u012C": "I\u0306",
  "\u01CF": "I\u030C",
  "\xCE": "I\u0302",
  "\u0130": "I\u0307",
  "\u0134": "J\u0302",
  "\u1E30": "K\u0301",
  "\u01E8": "K\u030C",
  "\u0136": "K\u0327",
  "\u0139": "L\u0301",
  "\u013D": "L\u030C",
  "\u013B": "L\u0327",
  "\u1E3E": "M\u0301",
  "\u1E40": "M\u0307",
  "\u0143": "N\u0301",
  "\u01F8": "N\u0300",
  "\xD1": "N\u0303",
  "\u0147": "N\u030C",
  "\u1E44": "N\u0307",
  "\u0145": "N\u0327",
  "\xD3": "O\u0301",
  "\xD2": "O\u0300",
  "\xD6": "O\u0308",
  "\u022A": "O\u0308\u0304",
  "\xD5": "O\u0303",
  "\u1E4C": "O\u0303\u0301",
  "\u1E4E": "O\u0303\u0308",
  "\u022C": "O\u0303\u0304",
  "\u014C": "O\u0304",
  "\u1E52": "O\u0304\u0301",
  "\u1E50": "O\u0304\u0300",
  "\u014E": "O\u0306",
  "\u01D1": "O\u030C",
  "\xD4": "O\u0302",
  "\u1ED0": "O\u0302\u0301",
  "\u1ED2": "O\u0302\u0300",
  "\u1ED6": "O\u0302\u0303",
  "\u022E": "O\u0307",
  "\u0230": "O\u0307\u0304",
  "\u0150": "O\u030B",
  "\u1E54": "P\u0301",
  "\u1E56": "P\u0307",
  "\u0154": "R\u0301",
  "\u0158": "R\u030C",
  "\u1E58": "R\u0307",
  "\u0156": "R\u0327",
  "\u015A": "S\u0301",
  "\u1E64": "S\u0301\u0307",
  "\u0160": "S\u030C",
  "\u1E66": "S\u030C\u0307",
  "\u015C": "S\u0302",
  "\u1E60": "S\u0307",
  "\u015E": "S\u0327",
  "\u0164": "T\u030C",
  "\u1E6A": "T\u0307",
  "\u0162": "T\u0327",
  "\xDA": "U\u0301",
  "\xD9": "U\u0300",
  "\xDC": "U\u0308",
  "\u01D7": "U\u0308\u0301",
  "\u01DB": "U\u0308\u0300",
  "\u01D5": "U\u0308\u0304",
  "\u01D9": "U\u0308\u030C",
  "\u0168": "U\u0303",
  "\u1E78": "U\u0303\u0301",
  "\u016A": "U\u0304",
  "\u1E7A": "U\u0304\u0308",
  "\u016C": "U\u0306",
  "\u01D3": "U\u030C",
  "\xDB": "U\u0302",
  "\u016E": "U\u030A",
  "\u0170": "U\u030B",
  "\u1E7C": "V\u0303",
  "\u1E82": "W\u0301",
  "\u1E80": "W\u0300",
  "\u1E84": "W\u0308",
  "\u0174": "W\u0302",
  "\u1E86": "W\u0307",
  "\u1E8C": "X\u0308",
  "\u1E8A": "X\u0307",
  "\xDD": "Y\u0301",
  "\u1EF2": "Y\u0300",
  "\u0178": "Y\u0308",
  "\u1EF8": "Y\u0303",
  "\u0232": "Y\u0304",
  "\u0176": "Y\u0302",
  "\u1E8E": "Y\u0307",
  "\u0179": "Z\u0301",
  "\u017D": "Z\u030C",
  "\u1E90": "Z\u0302",
  "\u017B": "Z\u0307",
  "\u03AC": "\u03B1\u0301",
  "\u1F70": "\u03B1\u0300",
  "\u1FB1": "\u03B1\u0304",
  "\u1FB0": "\u03B1\u0306",
  "\u03AD": "\u03B5\u0301",
  "\u1F72": "\u03B5\u0300",
  "\u03AE": "\u03B7\u0301",
  "\u1F74": "\u03B7\u0300",
  "\u03AF": "\u03B9\u0301",
  "\u1F76": "\u03B9\u0300",
  "\u03CA": "\u03B9\u0308",
  "\u0390": "\u03B9\u0308\u0301",
  "\u1FD2": "\u03B9\u0308\u0300",
  "\u1FD1": "\u03B9\u0304",
  "\u1FD0": "\u03B9\u0306",
  "\u03CC": "\u03BF\u0301",
  "\u1F78": "\u03BF\u0300",
  "\u03CD": "\u03C5\u0301",
  "\u1F7A": "\u03C5\u0300",
  "\u03CB": "\u03C5\u0308",
  "\u03B0": "\u03C5\u0308\u0301",
  "\u1FE2": "\u03C5\u0308\u0300",
  "\u1FE1": "\u03C5\u0304",
  "\u1FE0": "\u03C5\u0306",
  "\u03CE": "\u03C9\u0301",
  "\u1F7C": "\u03C9\u0300",
  "\u038E": "\u03A5\u0301",
  "\u1FEA": "\u03A5\u0300",
  "\u03AB": "\u03A5\u0308",
  "\u1FE9": "\u03A5\u0304",
  "\u1FE8": "\u03A5\u0306",
  "\u038F": "\u03A9\u0301",
  "\u1FFA": "\u03A9\u0300"
};
var Parser = class _Parser {
  constructor(input, settings) {
    this.mode = void 0;
    this.gullet = void 0;
    this.settings = void 0;
    this.leftrightDepth = void 0;
    this.nextToken = void 0;
    this.mode = "math";
    this.gullet = new MacroExpander(input, settings, this.mode);
    this.settings = settings;
    this.leftrightDepth = 0;
  }
  /**
   * Checks a result to make sure it has the right type, and throws an
   * appropriate error otherwise.
   */
  expect(text2, consume) {
    if (consume === void 0) {
      consume = true;
    }
    if (this.fetch().text !== text2) {
      throw new ParseError("Expected '" + text2 + "', got '" + this.fetch().text + "'", this.fetch());
    }
    if (consume) {
      this.consume();
    }
  }
  /**
   * Discards the current lookahead token, considering it consumed.
   */
  consume() {
    this.nextToken = null;
  }
  /**
   * Return the current lookahead token, or if there isn't one (at the
   * beginning, or if the previous lookahead token was consume()d),
   * fetch the next token as the new lookahead token and return it.
   */
  fetch() {
    if (this.nextToken == null) {
      this.nextToken = this.gullet.expandNextToken();
    }
    return this.nextToken;
  }
  /**
   * Switches between "text" and "math" modes.
   */
  switchMode(newMode) {
    this.mode = newMode;
    this.gullet.switchMode(newMode);
  }
  /**
   * Main parsing function, which parses an entire input.
   */
  parse() {
    if (!this.settings.globalGroup) {
      this.gullet.beginGroup();
    }
    if (this.settings.colorIsTextColor) {
      this.gullet.macros.set("\\color", "\\textcolor");
    }
    try {
      var parse = this.parseExpression(false);
      this.expect("EOF");
      if (!this.settings.globalGroup) {
        this.gullet.endGroup();
      }
      return parse;
    } finally {
      this.gullet.endGroups();
    }
  }
  /**
   * Fully parse a separate sequence of tokens as a separate job.
   * Tokens should be specified in reverse order, as in a MacroDefinition.
   */
  subparse(tokens) {
    var oldToken = this.nextToken;
    this.consume();
    this.gullet.pushToken(new Token("}"));
    this.gullet.pushTokens(tokens);
    var parse = this.parseExpression(false);
    this.expect("}");
    this.nextToken = oldToken;
    return parse;
  }
  /**
   * Parses an "expression", which is a list of atoms.
   *
   * `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
   *                 happens when functions have higher precedence han infix
   *                 nodes in implicit parses.
   *
   * `breakOnTokenText`: The text of the token that the expression should end
   *                     with, or `null` if something else should end the
   *                     expression.
   */
  parseExpression(breakOnInfix, breakOnTokenText) {
    var body = [];
    while (true) {
      if (this.mode === "math") {
        this.consumeSpaces();
      }
      var lex = this.fetch();
      if (_Parser.endOfExpression.indexOf(lex.text) !== -1) {
        break;
      }
      if (breakOnTokenText && lex.text === breakOnTokenText) {
        break;
      }
      if (breakOnInfix && functions[lex.text] && functions[lex.text].infix) {
        break;
      }
      var atom = this.parseAtom(breakOnTokenText);
      if (!atom) {
        break;
      } else if (atom.type === "internal") {
        continue;
      }
      body.push(atom);
    }
    if (this.mode === "text") {
      this.formLigatures(body);
    }
    return this.handleInfixNodes(body);
  }
  /**
   * Rewrites infix operators such as \over with corresponding commands such
   * as \frac.
   *
   * There can only be one infix operator per group.  If there's more than one
   * then the expression is ambiguous.  This can be resolved by adding {}.
   */
  handleInfixNodes(body) {
    var overIndex = -1;
    var funcName;
    for (var i2 = 0; i2 < body.length; i2++) {
      if (body[i2].type === "infix") {
        if (overIndex !== -1) {
          throw new ParseError("only one infix operator per group", body[i2].token);
        }
        overIndex = i2;
        funcName = body[i2].replaceWith;
      }
    }
    if (overIndex !== -1 && funcName) {
      var numerNode;
      var denomNode;
      var numerBody = body.slice(0, overIndex);
      var denomBody = body.slice(overIndex + 1);
      if (numerBody.length === 1 && numerBody[0].type === "ordgroup") {
        numerNode = numerBody[0];
      } else {
        numerNode = {
          type: "ordgroup",
          mode: this.mode,
          body: numerBody
        };
      }
      if (denomBody.length === 1 && denomBody[0].type === "ordgroup") {
        denomNode = denomBody[0];
      } else {
        denomNode = {
          type: "ordgroup",
          mode: this.mode,
          body: denomBody
        };
      }
      var node;
      if (funcName === "\\\\abovefrac") {
        node = this.callFunction(funcName, [numerNode, body[overIndex], denomNode], []);
      } else {
        node = this.callFunction(funcName, [numerNode, denomNode], []);
      }
      return [node];
    } else {
      return body;
    }
  }
  /**
   * Handle a subscript or superscript with nice errors.
   */
  handleSupSubscript(name) {
    var symbolToken = this.fetch();
    var symbol = symbolToken.text;
    this.consume();
    this.consumeSpaces();
    var group;
    do {
      var _group;
      group = this.parseGroup(name);
    } while (((_group = group) == null ? void 0 : _group.type) === "internal");
    if (!group) {
      throw new ParseError("Expected group after '" + symbol + "'", symbolToken);
    }
    return group;
  }
  /**
   * Converts the textual input of an unsupported command into a text node
   * contained within a color node whose color is determined by errorColor
   */
  formatUnsupportedCmd(text2) {
    var textordArray = [];
    for (var i2 = 0; i2 < text2.length; i2++) {
      textordArray.push({
        type: "textord",
        mode: "text",
        text: text2[i2]
      });
    }
    var textNode = {
      type: "text",
      mode: this.mode,
      body: textordArray
    };
    var colorNode = {
      type: "color",
      mode: this.mode,
      color: this.settings.errorColor,
      body: [textNode]
    };
    return colorNode;
  }
  /**
   * Parses a group with optional super/subscripts.
   */
  parseAtom(breakOnTokenText) {
    var base = this.parseGroup("atom", breakOnTokenText);
    if ((base == null ? void 0 : base.type) === "internal") {
      return base;
    }
    if (this.mode === "text") {
      return base;
    }
    var superscript;
    var subscript;
    while (true) {
      this.consumeSpaces();
      var lex = this.fetch();
      if (lex.text === "\\limits" || lex.text === "\\nolimits") {
        if (base && base.type === "op") {
          var limits = lex.text === "\\limits";
          base.limits = limits;
          base.alwaysHandleSupSub = true;
        } else if (base && base.type === "operatorname") {
          if (base.alwaysHandleSupSub) {
            base.limits = lex.text === "\\limits";
          }
        } else {
          throw new ParseError("Limit controls must follow a math operator", lex);
        }
        this.consume();
      } else if (lex.text === "^") {
        if (superscript) {
          throw new ParseError("Double superscript", lex);
        }
        superscript = this.handleSupSubscript("superscript");
      } else if (lex.text === "_") {
        if (subscript) {
          throw new ParseError("Double subscript", lex);
        }
        subscript = this.handleSupSubscript("subscript");
      } else if (lex.text === "'") {
        if (superscript) {
          throw new ParseError("Double superscript", lex);
        }
        var prime = {
          type: "textord",
          mode: this.mode,
          text: "\\prime"
        };
        var primes = [prime];
        this.consume();
        while (this.fetch().text === "'") {
          primes.push(prime);
          this.consume();
        }
        if (this.fetch().text === "^") {
          primes.push(this.handleSupSubscript("superscript"));
        }
        superscript = {
          type: "ordgroup",
          mode: this.mode,
          body: primes
        };
      } else if (uSubsAndSups[lex.text]) {
        var isSub = unicodeSubRegEx.test(lex.text);
        var subsupTokens = [];
        subsupTokens.push(new Token(uSubsAndSups[lex.text]));
        this.consume();
        while (true) {
          var token = this.fetch().text;
          if (!uSubsAndSups[token]) {
            break;
          }
          if (unicodeSubRegEx.test(token) !== isSub) {
            break;
          }
          subsupTokens.unshift(new Token(uSubsAndSups[token]));
          this.consume();
        }
        var body = this.subparse(subsupTokens);
        if (isSub) {
          subscript = {
            type: "ordgroup",
            mode: "math",
            body
          };
        } else {
          superscript = {
            type: "ordgroup",
            mode: "math",
            body
          };
        }
      } else {
        break;
      }
    }
    if (superscript || subscript) {
      return {
        type: "supsub",
        mode: this.mode,
        base,
        sup: superscript,
        sub: subscript
      };
    } else {
      return base;
    }
  }
  /**
   * Parses an entire function, including its base and all of its arguments.
   */
  parseFunction(breakOnTokenText, name) {
    var token = this.fetch();
    var func = token.text;
    var funcData = functions[func];
    if (!funcData) {
      return null;
    }
    this.consume();
    if (name && name !== "atom" && !funcData.allowedInArgument) {
      throw new ParseError("Got function '" + func + "' with no arguments" + (name ? " as " + name : ""), token);
    } else if (this.mode === "text" && !funcData.allowedInText) {
      throw new ParseError("Can't use function '" + func + "' in text mode", token);
    } else if (this.mode === "math" && funcData.allowedInMath === false) {
      throw new ParseError("Can't use function '" + func + "' in math mode", token);
    }
    var {
      args,
      optArgs
    } = this.parseArguments(func, funcData);
    return this.callFunction(func, args, optArgs, token, breakOnTokenText);
  }
  /**
   * Call a function handler with a suitable context and arguments.
   */
  callFunction(name, args, optArgs, token, breakOnTokenText) {
    var context = {
      funcName: name,
      parser: this,
      token,
      breakOnTokenText
    };
    var func = functions[name];
    if (func && func.handler) {
      return func.handler(context, args, optArgs);
    } else {
      throw new ParseError("No function handler for " + name);
    }
  }
  /**
   * Parses the arguments of a function or environment
   */
  parseArguments(func, funcData) {
    var totalArgs = funcData.numArgs + funcData.numOptionalArgs;
    if (totalArgs === 0) {
      return {
        args: [],
        optArgs: []
      };
    }
    var args = [];
    var optArgs = [];
    for (var i2 = 0; i2 < totalArgs; i2++) {
      var argType = funcData.argTypes && funcData.argTypes[i2];
      var isOptional = i2 < funcData.numOptionalArgs;
      if (funcData.primitive && argType == null || // \sqrt expands into primitive if optional argument doesn't exist
      funcData.type === "sqrt" && i2 === 1 && optArgs[0] == null) {
        argType = "primitive";
      }
      var arg = this.parseGroupOfType("argument to '" + func + "'", argType, isOptional);
      if (isOptional) {
        optArgs.push(arg);
      } else if (arg != null) {
        args.push(arg);
      } else {
        throw new ParseError("Null argument, please report this as a bug");
      }
    }
    return {
      args,
      optArgs
    };
  }
  /**
   * Parses a group when the mode is changing.
   */
  parseGroupOfType(name, type, optional) {
    switch (type) {
      case "color":
        return this.parseColorGroup(optional);
      case "size":
        return this.parseSizeGroup(optional);
      case "url":
        return this.parseUrlGroup(optional);
      case "math":
      case "text":
        return this.parseArgumentGroup(optional, type);
      case "hbox": {
        var group = this.parseArgumentGroup(optional, "text");
        return group != null ? {
          type: "styling",
          mode: group.mode,
          body: [group],
          style: "text"
          // simulate \textstyle
        } : null;
      }
      case "raw": {
        var token = this.parseStringGroup("raw", optional);
        return token != null ? {
          type: "raw",
          mode: "text",
          string: token.text
        } : null;
      }
      case "primitive": {
        if (optional) {
          throw new ParseError("A primitive argument cannot be optional");
        }
        var _group2 = this.parseGroup(name);
        if (_group2 == null) {
          throw new ParseError("Expected group as " + name, this.fetch());
        }
        return _group2;
      }
      case "original":
      case null:
      case void 0:
        return this.parseArgumentGroup(optional);
      default:
        throw new ParseError("Unknown group type as " + name, this.fetch());
    }
  }
  /**
   * Discard any space tokens, fetching the next non-space token.
   */
  consumeSpaces() {
    while (this.fetch().text === " ") {
      this.consume();
    }
  }
  /**
   * Parses a group, essentially returning the string formed by the
   * brace-enclosed tokens plus some position information.
   */
  parseStringGroup(modeName, optional) {
    var argToken = this.gullet.scanArgument(optional);
    if (argToken == null) {
      return null;
    }
    var str = "";
    var nextToken;
    while ((nextToken = this.fetch()).text !== "EOF") {
      str += nextToken.text;
      this.consume();
    }
    this.consume();
    argToken.text = str;
    return argToken;
  }
  /**
   * Parses a regex-delimited group: the largest sequence of tokens
   * whose concatenated strings match `regex`. Returns the string
   * formed by the tokens plus some position information.
   */
  parseRegexGroup(regex, modeName) {
    var firstToken = this.fetch();
    var lastToken = firstToken;
    var str = "";
    var nextToken;
    while ((nextToken = this.fetch()).text !== "EOF" && regex.test(str + nextToken.text)) {
      lastToken = nextToken;
      str += lastToken.text;
      this.consume();
    }
    if (str === "") {
      throw new ParseError("Invalid " + modeName + ": '" + firstToken.text + "'", firstToken);
    }
    return firstToken.range(lastToken, str);
  }
  /**
   * Parses a color description.
   */
  parseColorGroup(optional) {
    var res = this.parseStringGroup("color", optional);
    if (res == null) {
      return null;
    }
    var match = /^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i.exec(res.text);
    if (!match) {
      throw new ParseError("Invalid color: '" + res.text + "'", res);
    }
    var color = match[0];
    if (/^[0-9a-f]{6}$/i.test(color)) {
      color = "#" + color;
    }
    return {
      type: "color-token",
      mode: this.mode,
      color
    };
  }
  /**
   * Parses a size specification, consisting of magnitude and unit.
   */
  parseSizeGroup(optional) {
    var res;
    var isBlank = false;
    this.gullet.consumeSpaces();
    if (!optional && this.gullet.future().text !== "{") {
      res = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size");
    } else {
      res = this.parseStringGroup("size", optional);
    }
    if (!res) {
      return null;
    }
    if (!optional && res.text.length === 0) {
      res.text = "0pt";
      isBlank = true;
    }
    var match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(res.text);
    if (!match) {
      throw new ParseError("Invalid size: '" + res.text + "'", res);
    }
    var data = {
      number: +(match[1] + match[2]),
      // sign + magnitude, cast to number
      unit: match[3]
    };
    if (!validUnit(data)) {
      throw new ParseError("Invalid unit: '" + data.unit + "'", res);
    }
    return {
      type: "size",
      mode: this.mode,
      value: data,
      isBlank
    };
  }
  /**
   * Parses an URL, checking escaped letters and allowed protocols,
   * and setting the catcode of % as an active character (as in \hyperref).
   */
  parseUrlGroup(optional) {
    this.gullet.lexer.setCatcode("%", 13);
    this.gullet.lexer.setCatcode("~", 12);
    var res = this.parseStringGroup("url", optional);
    this.gullet.lexer.setCatcode("%", 14);
    this.gullet.lexer.setCatcode("~", 13);
    if (res == null) {
      return null;
    }
    var url = res.text.replace(/\\([#$%&~_^{}])/g, "$1");
    return {
      type: "url",
      mode: this.mode,
      url
    };
  }
  /**
   * Parses an argument with the mode specified.
   */
  parseArgumentGroup(optional, mode) {
    var argToken = this.gullet.scanArgument(optional);
    if (argToken == null) {
      return null;
    }
    var outerMode = this.mode;
    if (mode) {
      this.switchMode(mode);
    }
    this.gullet.beginGroup();
    var expression = this.parseExpression(false, "EOF");
    this.expect("EOF");
    this.gullet.endGroup();
    var result = {
      type: "ordgroup",
      mode: this.mode,
      loc: argToken.loc,
      body: expression
    };
    if (mode) {
      this.switchMode(outerMode);
    }
    return result;
  }
  /**
   * Parses an ordinary group, which is either a single nucleus (like "x")
   * or an expression in braces (like "{x+y}") or an implicit group, a group
   * that starts at the current position, and ends right before a higher explicit
   * group ends, or at EOF.
   */
  parseGroup(name, breakOnTokenText) {
    var firstToken = this.fetch();
    var text2 = firstToken.text;
    var result;
    if (text2 === "{" || text2 === "\\begingroup") {
      this.consume();
      var groupEnd = text2 === "{" ? "}" : "\\endgroup";
      this.gullet.beginGroup();
      var expression = this.parseExpression(false, groupEnd);
      var lastToken = this.fetch();
      this.expect(groupEnd);
      this.gullet.endGroup();
      result = {
        type: "ordgroup",
        mode: this.mode,
        loc: SourceLocation.range(firstToken, lastToken),
        body: expression,
        // A group formed by \begingroup...\endgroup is a semi-simple group
        // which doesn't affect spacing in math mode, i.e., is transparent.
        // https://tex.stackexchange.com/questions/1930/when-should-one-
        // use-begingroup-instead-of-bgroup
        semisimple: text2 === "\\begingroup" || void 0
      };
    } else {
      result = this.parseFunction(breakOnTokenText, name) || this.parseSymbol();
      if (result == null && text2[0] === "\\" && !implicitCommands.hasOwnProperty(text2)) {
        if (this.settings.throwOnError) {
          throw new ParseError("Undefined control sequence: " + text2, firstToken);
        }
        result = this.formatUnsupportedCmd(text2);
        this.consume();
      }
    }
    return result;
  }
  /**
   * Form ligature-like combinations of characters for text mode.
   * This includes inputs like "--", "---", "``" and "''".
   * The result will simply replace multiple textord nodes with a single
   * character in each value by a single textord node having multiple
   * characters in its value.  The representation is still ASCII source.
   * The group will be modified in place.
   */
  formLigatures(group) {
    var n = group.length - 1;
    for (var i2 = 0; i2 < n; ++i2) {
      var a = group[i2];
      var v = a.text;
      if (v === "-" && group[i2 + 1].text === "-") {
        if (i2 + 1 < n && group[i2 + 2].text === "-") {
          group.splice(i2, 3, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i2 + 2]),
            text: "---"
          });
          n -= 2;
        } else {
          group.splice(i2, 2, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i2 + 1]),
            text: "--"
          });
          n -= 1;
        }
      }
      if ((v === "'" || v === "`") && group[i2 + 1].text === v) {
        group.splice(i2, 2, {
          type: "textord",
          mode: "text",
          loc: SourceLocation.range(a, group[i2 + 1]),
          text: v + v
        });
        n -= 1;
      }
    }
  }
  /**
   * Parse a single symbol out of the string. Here, we handle single character
   * symbols and special functions like \verb.
   */
  parseSymbol() {
    var nucleus = this.fetch();
    var text2 = nucleus.text;
    if (/^\\verb[^a-zA-Z]/.test(text2)) {
      this.consume();
      var arg = text2.slice(5);
      var star = arg.charAt(0) === "*";
      if (star) {
        arg = arg.slice(1);
      }
      if (arg.length < 2 || arg.charAt(0) !== arg.slice(-1)) {
        throw new ParseError("\\verb assertion failed --\n                    please report what input caused this bug");
      }
      arg = arg.slice(1, -1);
      return {
        type: "verb",
        mode: "text",
        body: arg,
        star
      };
    }
    if (unicodeSymbols.hasOwnProperty(text2[0]) && !symbols[this.mode][text2[0]]) {
      if (this.settings.strict && this.mode === "math") {
        this.settings.reportNonstrict("unicodeTextInMathMode", 'Accented Unicode text character "' + text2[0] + '" used in math mode', nucleus);
      }
      text2 = unicodeSymbols[text2[0]] + text2.slice(1);
    }
    var match = combiningDiacriticalMarksEndRegex.exec(text2);
    if (match) {
      text2 = text2.substring(0, match.index);
      if (text2 === "i") {
        text2 = "\u0131";
      } else if (text2 === "j") {
        text2 = "\u0237";
      }
    }
    var symbol;
    if (symbols[this.mode][text2]) {
      if (this.settings.strict && this.mode === "math" && extraLatin.indexOf(text2) >= 0) {
        this.settings.reportNonstrict("unicodeTextInMathMode", 'Latin-1/Unicode text character "' + text2[0] + '" used in math mode', nucleus);
      }
      var group = symbols[this.mode][text2].group;
      var loc = SourceLocation.range(nucleus);
      var s;
      if (ATOMS.hasOwnProperty(group)) {
        var family = group;
        s = {
          type: "atom",
          mode: this.mode,
          family,
          loc,
          text: text2
        };
      } else {
        s = {
          type: group,
          mode: this.mode,
          loc,
          text: text2
        };
      }
      symbol = s;
    } else if (text2.charCodeAt(0) >= 128) {
      if (this.settings.strict) {
        if (!supportedCodepoint(text2.charCodeAt(0))) {
          this.settings.reportNonstrict("unknownSymbol", 'Unrecognized Unicode character "' + text2[0] + '"' + (" (" + text2.charCodeAt(0) + ")"), nucleus);
        } else if (this.mode === "math") {
          this.settings.reportNonstrict("unicodeTextInMathMode", 'Unicode text character "' + text2[0] + '" used in math mode', nucleus);
        }
      }
      symbol = {
        type: "textord",
        mode: "text",
        loc: SourceLocation.range(nucleus),
        text: text2
      };
    } else {
      return null;
    }
    this.consume();
    if (match) {
      for (var i2 = 0; i2 < match[0].length; i2++) {
        var accent2 = match[0][i2];
        if (!unicodeAccents[accent2]) {
          throw new ParseError("Unknown accent ' " + accent2 + "'", nucleus);
        }
        var command = unicodeAccents[accent2][this.mode] || unicodeAccents[accent2].text;
        if (!command) {
          throw new ParseError("Accent " + accent2 + " unsupported in " + this.mode + " mode", nucleus);
        }
        symbol = {
          type: "accent",
          mode: this.mode,
          loc: SourceLocation.range(nucleus),
          label: command,
          isStretchy: false,
          isShifty: true,
          // $FlowFixMe
          base: symbol
        };
      }
    }
    return symbol;
  }
};
Parser.endOfExpression = ["}", "\\endgroup", "\\end", "\\right", "&"];
var parseTree = function parseTree2(toParse, settings) {
  if (!(typeof toParse === "string" || toParse instanceof String)) {
    throw new TypeError("KaTeX can only parse string typed expression");
  }
  var parser = new Parser(toParse, settings);
  delete parser.gullet.macros.current["\\df@tag"];
  var tree = parser.parse();
  delete parser.gullet.macros.current["\\current@color"];
  delete parser.gullet.macros.current["\\color"];
  if (parser.gullet.macros.get("\\df@tag")) {
    if (!settings.displayMode) {
      throw new ParseError("\\tag works only in display equations");
    }
    tree = [{
      type: "tag",
      mode: "text",
      body: tree,
      tag: parser.subparse([new Token("\\df@tag")])
    }];
  }
  return tree;
};
var render = function render2(expression, baseNode, options) {
  baseNode.textContent = "";
  var node = renderToDomTree(expression, options).toNode();
  baseNode.appendChild(node);
};
if (typeof document !== "undefined") {
  if (document.compatMode !== "CSS1Compat") {
    typeof console !== "undefined" && console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your website has a suitable doctype.");
    render = function render3() {
      throw new ParseError("KaTeX doesn't work in quirks mode.");
    };
  }
}
var renderToString = function renderToString2(expression, options) {
  var markup = renderToDomTree(expression, options).toMarkup();
  return markup;
};
var generateParseTree = function generateParseTree2(expression, options) {
  var settings = new Settings(options);
  return parseTree(expression, settings);
};
var renderError = function renderError2(error, expression, options) {
  if (options.throwOnError || !(error instanceof ParseError)) {
    throw error;
  }
  var node = buildCommon.makeSpan(["katex-error"], [new SymbolNode(expression)]);
  node.setAttribute("title", error.toString());
  node.setAttribute("style", "color:" + options.errorColor);
  return node;
};
var renderToDomTree = function renderToDomTree2(expression, options) {
  var settings = new Settings(options);
  try {
    var tree = parseTree(expression, settings);
    return buildTree(tree, expression, settings);
  } catch (error) {
    return renderError(error, expression, settings);
  }
};
var renderToHTMLTree = function renderToHTMLTree2(expression, options) {
  var settings = new Settings(options);
  try {
    var tree = parseTree(expression, settings);
    return buildHTMLTree(tree, expression, settings);
  } catch (error) {
    return renderError(error, expression, settings);
  }
};
var version = "0.16.22";
var __domTree = {
  Span,
  Anchor,
  SymbolNode,
  SvgNode,
  PathNode,
  LineNode
};
var katex = {
  /**
   * Current KaTeX version
   */
  version,
  /**
   * Renders the given LaTeX into an HTML+MathML combination, and adds
   * it as a child to the specified DOM node.
   */
  render,
  /**
   * Renders the given LaTeX into an HTML+MathML combination string,
   * for sending to the client.
   */
  renderToString,
  /**
   * KaTeX error, usually during parsing.
   */
  ParseError,
  /**
   * The schema of Settings
   */
  SETTINGS_SCHEMA,
  /**
   * Parses the given LaTeX into KaTeX's internal parse tree structure,
   * without rendering to HTML or MathML.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __parse: generateParseTree,
  /**
   * Renders the given LaTeX into an HTML+MathML internal DOM tree
   * representation, without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToDomTree: renderToDomTree,
  /**
   * Renders the given LaTeX into an HTML internal DOM tree representation,
   * without MathML and without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToHTMLTree: renderToHTMLTree,
  /**
   * extends internal font metrics object with a new object
   * each key in the new object represents a font name
  */
  __setFontMetrics: setFontMetrics,
  /**
   * adds a new symbol to builtin symbols table
   */
  __defineSymbol: defineSymbol,
  /**
   * adds a new function to builtin function list,
   * which directly produce parse tree elements
   * and have their own html/mathml builders
   */
  __defineFunction: defineFunction,
  /**
   * adds a new macro to builtin macro list
   */
  __defineMacro: defineMacro,
  /**
   * Expose the dom tree node types, which can be useful for type checking nodes.
   *
   * NOTE: These methods are not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __domTree
};

// node_modules/katex/dist/katex.min.css
var katex_min_default = '@font-face{font-family:KaTeX_AMS;font-style:normal;font-weight:400;src:url(fonts/KaTeX_AMS-Regular.woff2) format("woff2"),url(fonts/KaTeX_AMS-Regular.woff) format("woff"),url(fonts/KaTeX_AMS-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Caligraphic;font-style:normal;font-weight:700;src:url(fonts/KaTeX_Caligraphic-Bold.woff2) format("woff2"),url(fonts/KaTeX_Caligraphic-Bold.woff) format("woff"),url(fonts/KaTeX_Caligraphic-Bold.ttf) format("truetype")}@font-face{font-family:KaTeX_Caligraphic;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Caligraphic-Regular.woff2) format("woff2"),url(fonts/KaTeX_Caligraphic-Regular.woff) format("woff"),url(fonts/KaTeX_Caligraphic-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Fraktur;font-style:normal;font-weight:700;src:url(fonts/KaTeX_Fraktur-Bold.woff2) format("woff2"),url(fonts/KaTeX_Fraktur-Bold.woff) format("woff"),url(fonts/KaTeX_Fraktur-Bold.ttf) format("truetype")}@font-face{font-family:KaTeX_Fraktur;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Fraktur-Regular.woff2) format("woff2"),url(fonts/KaTeX_Fraktur-Regular.woff) format("woff"),url(fonts/KaTeX_Fraktur-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:normal;font-weight:700;src:url(fonts/KaTeX_Main-Bold.woff2) format("woff2"),url(fonts/KaTeX_Main-Bold.woff) format("woff"),url(fonts/KaTeX_Main-Bold.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:italic;font-weight:700;src:url(fonts/KaTeX_Main-BoldItalic.woff2) format("woff2"),url(fonts/KaTeX_Main-BoldItalic.woff) format("woff"),url(fonts/KaTeX_Main-BoldItalic.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:italic;font-weight:400;src:url(fonts/KaTeX_Main-Italic.woff2) format("woff2"),url(fonts/KaTeX_Main-Italic.woff) format("woff"),url(fonts/KaTeX_Main-Italic.ttf) format("truetype")}@font-face{font-family:KaTeX_Main;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2"),url(fonts/KaTeX_Main-Regular.woff) format("woff"),url(fonts/KaTeX_Main-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Math;font-style:italic;font-weight:700;src:url(fonts/KaTeX_Math-BoldItalic.woff2) format("woff2"),url(fonts/KaTeX_Math-BoldItalic.woff) format("woff"),url(fonts/KaTeX_Math-BoldItalic.ttf) format("truetype")}@font-face{font-family:KaTeX_Math;font-style:italic;font-weight:400;src:url(fonts/KaTeX_Math-Italic.woff2) format("woff2"),url(fonts/KaTeX_Math-Italic.woff) format("woff"),url(fonts/KaTeX_Math-Italic.ttf) format("truetype")}@font-face{font-family:"KaTeX_SansSerif";font-style:normal;font-weight:700;src:url(fonts/KaTeX_SansSerif-Bold.woff2) format("woff2"),url(fonts/KaTeX_SansSerif-Bold.woff) format("woff"),url(fonts/KaTeX_SansSerif-Bold.ttf) format("truetype")}@font-face{font-family:"KaTeX_SansSerif";font-style:italic;font-weight:400;src:url(fonts/KaTeX_SansSerif-Italic.woff2) format("woff2"),url(fonts/KaTeX_SansSerif-Italic.woff) format("woff"),url(fonts/KaTeX_SansSerif-Italic.ttf) format("truetype")}@font-face{font-family:"KaTeX_SansSerif";font-style:normal;font-weight:400;src:url(fonts/KaTeX_SansSerif-Regular.woff2) format("woff2"),url(fonts/KaTeX_SansSerif-Regular.woff) format("woff"),url(fonts/KaTeX_SansSerif-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Script;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Script-Regular.woff2) format("woff2"),url(fonts/KaTeX_Script-Regular.woff) format("woff"),url(fonts/KaTeX_Script-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size1;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size1-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size1-Regular.woff) format("woff"),url(fonts/KaTeX_Size1-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size2;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size2-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size2-Regular.woff) format("woff"),url(fonts/KaTeX_Size2-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size3;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size3-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size3-Regular.woff) format("woff"),url(fonts/KaTeX_Size3-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Size4;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Size4-Regular.woff2) format("woff2"),url(fonts/KaTeX_Size4-Regular.woff) format("woff"),url(fonts/KaTeX_Size4-Regular.ttf) format("truetype")}@font-face{font-family:KaTeX_Typewriter;font-style:normal;font-weight:400;src:url(fonts/KaTeX_Typewriter-Regular.woff2) format("woff2"),url(fonts/KaTeX_Typewriter-Regular.woff) format("woff"),url(fonts/KaTeX_Typewriter-Regular.ttf) format("truetype")}.katex{font:normal 1.21em KaTeX_Main,Times New Roman,serif;line-height:1.2;text-indent:0;text-rendering:auto}.katex *{-ms-high-contrast-adjust:none!important;border-color:currentColor}.katex .katex-version:after{content:"0.16.22"}.katex .katex-mathml{clip:rect(1px,1px,1px,1px);border:0;height:1px;overflow:hidden;padding:0;position:absolute;width:1px}.katex .katex-html>.newline{display:block}.katex .base{position:relative;white-space:nowrap;width:-webkit-min-content;width:-moz-min-content;width:min-content}.katex .base,.katex .strut{display:inline-block}.katex .textbf{font-weight:700}.katex .textit{font-style:italic}.katex .textrm{font-family:KaTeX_Main}.katex .textsf{font-family:KaTeX_SansSerif}.katex .texttt{font-family:KaTeX_Typewriter}.katex .mathnormal{font-family:KaTeX_Math;font-style:italic}.katex .mathit{font-family:KaTeX_Main;font-style:italic}.katex .mathrm{font-style:normal}.katex .mathbf{font-family:KaTeX_Main;font-weight:700}.katex .boldsymbol{font-family:KaTeX_Math;font-style:italic;font-weight:700}.katex .amsrm,.katex .mathbb,.katex .textbb{font-family:KaTeX_AMS}.katex .mathcal{font-family:KaTeX_Caligraphic}.katex .mathfrak,.katex .textfrak{font-family:KaTeX_Fraktur}.katex .mathboldfrak,.katex .textboldfrak{font-family:KaTeX_Fraktur;font-weight:700}.katex .mathtt{font-family:KaTeX_Typewriter}.katex .mathscr,.katex .textscr{font-family:KaTeX_Script}.katex .mathsf,.katex .textsf{font-family:KaTeX_SansSerif}.katex .mathboldsf,.katex .textboldsf{font-family:KaTeX_SansSerif;font-weight:700}.katex .mathitsf,.katex .mathsfit,.katex .textitsf{font-family:KaTeX_SansSerif;font-style:italic}.katex .mainrm{font-family:KaTeX_Main;font-style:normal}.katex .vlist-t{border-collapse:collapse;display:inline-table;table-layout:fixed}.katex .vlist-r{display:table-row}.katex .vlist{display:table-cell;position:relative;vertical-align:bottom}.katex .vlist>span{display:block;height:0;position:relative}.katex .vlist>span>span{display:inline-block}.katex .vlist>span>.pstrut{overflow:hidden;width:0}.katex .vlist-t2{margin-right:-2px}.katex .vlist-s{display:table-cell;font-size:1px;min-width:2px;vertical-align:bottom;width:2px}.katex .vbox{align-items:baseline;display:inline-flex;flex-direction:column}.katex .hbox{width:100%}.katex .hbox,.katex .thinbox{display:inline-flex;flex-direction:row}.katex .thinbox{max-width:0;width:0}.katex .msupsub{text-align:left}.katex .mfrac>span>span{text-align:center}.katex .mfrac .frac-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .hdashline,.katex .hline,.katex .mfrac .frac-line,.katex .overline .overline-line,.katex .rule,.katex .underline .underline-line{min-height:1px}.katex .mspace{display:inline-block}.katex .clap,.katex .llap,.katex .rlap{position:relative;width:0}.katex .clap>.inner,.katex .llap>.inner,.katex .rlap>.inner{position:absolute}.katex .clap>.fix,.katex .llap>.fix,.katex .rlap>.fix{display:inline-block}.katex .llap>.inner{right:0}.katex .clap>.inner,.katex .rlap>.inner{left:0}.katex .clap>.inner>span{margin-left:-50%;margin-right:50%}.katex .rule{border:0 solid;display:inline-block;position:relative}.katex .hline,.katex .overline .overline-line,.katex .underline .underline-line{border-bottom-style:solid;display:inline-block;width:100%}.katex .hdashline{border-bottom-style:dashed;display:inline-block;width:100%}.katex .sqrt>.root{margin-left:.2777777778em;margin-right:-.5555555556em}.katex .fontsize-ensurer.reset-size1.size1,.katex .sizing.reset-size1.size1{font-size:1em}.katex .fontsize-ensurer.reset-size1.size2,.katex .sizing.reset-size1.size2{font-size:1.2em}.katex .fontsize-ensurer.reset-size1.size3,.katex .sizing.reset-size1.size3{font-size:1.4em}.katex .fontsize-ensurer.reset-size1.size4,.katex .sizing.reset-size1.size4{font-size:1.6em}.katex .fontsize-ensurer.reset-size1.size5,.katex .sizing.reset-size1.size5{font-size:1.8em}.katex .fontsize-ensurer.reset-size1.size6,.katex .sizing.reset-size1.size6{font-size:2em}.katex .fontsize-ensurer.reset-size1.size7,.katex .sizing.reset-size1.size7{font-size:2.4em}.katex .fontsize-ensurer.reset-size1.size8,.katex .sizing.reset-size1.size8{font-size:2.88em}.katex .fontsize-ensurer.reset-size1.size9,.katex .sizing.reset-size1.size9{font-size:3.456em}.katex .fontsize-ensurer.reset-size1.size10,.katex .sizing.reset-size1.size10{font-size:4.148em}.katex .fontsize-ensurer.reset-size1.size11,.katex .sizing.reset-size1.size11{font-size:4.976em}.katex .fontsize-ensurer.reset-size2.size1,.katex .sizing.reset-size2.size1{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size2.size2,.katex .sizing.reset-size2.size2{font-size:1em}.katex .fontsize-ensurer.reset-size2.size3,.katex .sizing.reset-size2.size3{font-size:1.1666666667em}.katex .fontsize-ensurer.reset-size2.size4,.katex .sizing.reset-size2.size4{font-size:1.3333333333em}.katex .fontsize-ensurer.reset-size2.size5,.katex .sizing.reset-size2.size5{font-size:1.5em}.katex .fontsize-ensurer.reset-size2.size6,.katex .sizing.reset-size2.size6{font-size:1.6666666667em}.katex .fontsize-ensurer.reset-size2.size7,.katex .sizing.reset-size2.size7{font-size:2em}.katex .fontsize-ensurer.reset-size2.size8,.katex .sizing.reset-size2.size8{font-size:2.4em}.katex .fontsize-ensurer.reset-size2.size9,.katex .sizing.reset-size2.size9{font-size:2.88em}.katex .fontsize-ensurer.reset-size2.size10,.katex .sizing.reset-size2.size10{font-size:3.4566666667em}.katex .fontsize-ensurer.reset-size2.size11,.katex .sizing.reset-size2.size11{font-size:4.1466666667em}.katex .fontsize-ensurer.reset-size3.size1,.katex .sizing.reset-size3.size1{font-size:.7142857143em}.katex .fontsize-ensurer.reset-size3.size2,.katex .sizing.reset-size3.size2{font-size:.8571428571em}.katex .fontsize-ensurer.reset-size3.size3,.katex .sizing.reset-size3.size3{font-size:1em}.katex .fontsize-ensurer.reset-size3.size4,.katex .sizing.reset-size3.size4{font-size:1.1428571429em}.katex .fontsize-ensurer.reset-size3.size5,.katex .sizing.reset-size3.size5{font-size:1.2857142857em}.katex .fontsize-ensurer.reset-size3.size6,.katex .sizing.reset-size3.size6{font-size:1.4285714286em}.katex .fontsize-ensurer.reset-size3.size7,.katex .sizing.reset-size3.size7{font-size:1.7142857143em}.katex .fontsize-ensurer.reset-size3.size8,.katex .sizing.reset-size3.size8{font-size:2.0571428571em}.katex .fontsize-ensurer.reset-size3.size9,.katex .sizing.reset-size3.size9{font-size:2.4685714286em}.katex .fontsize-ensurer.reset-size3.size10,.katex .sizing.reset-size3.size10{font-size:2.9628571429em}.katex .fontsize-ensurer.reset-size3.size11,.katex .sizing.reset-size3.size11{font-size:3.5542857143em}.katex .fontsize-ensurer.reset-size4.size1,.katex .sizing.reset-size4.size1{font-size:.625em}.katex .fontsize-ensurer.reset-size4.size2,.katex .sizing.reset-size4.size2{font-size:.75em}.katex .fontsize-ensurer.reset-size4.size3,.katex .sizing.reset-size4.size3{font-size:.875em}.katex .fontsize-ensurer.reset-size4.size4,.katex .sizing.reset-size4.size4{font-size:1em}.katex .fontsize-ensurer.reset-size4.size5,.katex .sizing.reset-size4.size5{font-size:1.125em}.katex .fontsize-ensurer.reset-size4.size6,.katex .sizing.reset-size4.size6{font-size:1.25em}.katex .fontsize-ensurer.reset-size4.size7,.katex .sizing.reset-size4.size7{font-size:1.5em}.katex .fontsize-ensurer.reset-size4.size8,.katex .sizing.reset-size4.size8{font-size:1.8em}.katex .fontsize-ensurer.reset-size4.size9,.katex .sizing.reset-size4.size9{font-size:2.16em}.katex .fontsize-ensurer.reset-size4.size10,.katex .sizing.reset-size4.size10{font-size:2.5925em}.katex .fontsize-ensurer.reset-size4.size11,.katex .sizing.reset-size4.size11{font-size:3.11em}.katex .fontsize-ensurer.reset-size5.size1,.katex .sizing.reset-size5.size1{font-size:.5555555556em}.katex .fontsize-ensurer.reset-size5.size2,.katex .sizing.reset-size5.size2{font-size:.6666666667em}.katex .fontsize-ensurer.reset-size5.size3,.katex .sizing.reset-size5.size3{font-size:.7777777778em}.katex .fontsize-ensurer.reset-size5.size4,.katex .sizing.reset-size5.size4{font-size:.8888888889em}.katex .fontsize-ensurer.reset-size5.size5,.katex .sizing.reset-size5.size5{font-size:1em}.katex .fontsize-ensurer.reset-size5.size6,.katex .sizing.reset-size5.size6{font-size:1.1111111111em}.katex .fontsize-ensurer.reset-size5.size7,.katex .sizing.reset-size5.size7{font-size:1.3333333333em}.katex .fontsize-ensurer.reset-size5.size8,.katex .sizing.reset-size5.size8{font-size:1.6em}.katex .fontsize-ensurer.reset-size5.size9,.katex .sizing.reset-size5.size9{font-size:1.92em}.katex .fontsize-ensurer.reset-size5.size10,.katex .sizing.reset-size5.size10{font-size:2.3044444444em}.katex .fontsize-ensurer.reset-size5.size11,.katex .sizing.reset-size5.size11{font-size:2.7644444444em}.katex .fontsize-ensurer.reset-size6.size1,.katex .sizing.reset-size6.size1{font-size:.5em}.katex .fontsize-ensurer.reset-size6.size2,.katex .sizing.reset-size6.size2{font-size:.6em}.katex .fontsize-ensurer.reset-size6.size3,.katex .sizing.reset-size6.size3{font-size:.7em}.katex .fontsize-ensurer.reset-size6.size4,.katex .sizing.reset-size6.size4{font-size:.8em}.katex .fontsize-ensurer.reset-size6.size5,.katex .sizing.reset-size6.size5{font-size:.9em}.katex .fontsize-ensurer.reset-size6.size6,.katex .sizing.reset-size6.size6{font-size:1em}.katex .fontsize-ensurer.reset-size6.size7,.katex .sizing.reset-size6.size7{font-size:1.2em}.katex .fontsize-ensurer.reset-size6.size8,.katex .sizing.reset-size6.size8{font-size:1.44em}.katex .fontsize-ensurer.reset-size6.size9,.katex .sizing.reset-size6.size9{font-size:1.728em}.katex .fontsize-ensurer.reset-size6.size10,.katex .sizing.reset-size6.size10{font-size:2.074em}.katex .fontsize-ensurer.reset-size6.size11,.katex .sizing.reset-size6.size11{font-size:2.488em}.katex .fontsize-ensurer.reset-size7.size1,.katex .sizing.reset-size7.size1{font-size:.4166666667em}.katex .fontsize-ensurer.reset-size7.size2,.katex .sizing.reset-size7.size2{font-size:.5em}.katex .fontsize-ensurer.reset-size7.size3,.katex .sizing.reset-size7.size3{font-size:.5833333333em}.katex .fontsize-ensurer.reset-size7.size4,.katex .sizing.reset-size7.size4{font-size:.6666666667em}.katex .fontsize-ensurer.reset-size7.size5,.katex .sizing.reset-size7.size5{font-size:.75em}.katex .fontsize-ensurer.reset-size7.size6,.katex .sizing.reset-size7.size6{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size7.size7,.katex .sizing.reset-size7.size7{font-size:1em}.katex .fontsize-ensurer.reset-size7.size8,.katex .sizing.reset-size7.size8{font-size:1.2em}.katex .fontsize-ensurer.reset-size7.size9,.katex .sizing.reset-size7.size9{font-size:1.44em}.katex .fontsize-ensurer.reset-size7.size10,.katex .sizing.reset-size7.size10{font-size:1.7283333333em}.katex .fontsize-ensurer.reset-size7.size11,.katex .sizing.reset-size7.size11{font-size:2.0733333333em}.katex .fontsize-ensurer.reset-size8.size1,.katex .sizing.reset-size8.size1{font-size:.3472222222em}.katex .fontsize-ensurer.reset-size8.size2,.katex .sizing.reset-size8.size2{font-size:.4166666667em}.katex .fontsize-ensurer.reset-size8.size3,.katex .sizing.reset-size8.size3{font-size:.4861111111em}.katex .fontsize-ensurer.reset-size8.size4,.katex .sizing.reset-size8.size4{font-size:.5555555556em}.katex .fontsize-ensurer.reset-size8.size5,.katex .sizing.reset-size8.size5{font-size:.625em}.katex .fontsize-ensurer.reset-size8.size6,.katex .sizing.reset-size8.size6{font-size:.6944444444em}.katex .fontsize-ensurer.reset-size8.size7,.katex .sizing.reset-size8.size7{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size8.size8,.katex .sizing.reset-size8.size8{font-size:1em}.katex .fontsize-ensurer.reset-size8.size9,.katex .sizing.reset-size8.size9{font-size:1.2em}.katex .fontsize-ensurer.reset-size8.size10,.katex .sizing.reset-size8.size10{font-size:1.4402777778em}.katex .fontsize-ensurer.reset-size8.size11,.katex .sizing.reset-size8.size11{font-size:1.7277777778em}.katex .fontsize-ensurer.reset-size9.size1,.katex .sizing.reset-size9.size1{font-size:.2893518519em}.katex .fontsize-ensurer.reset-size9.size2,.katex .sizing.reset-size9.size2{font-size:.3472222222em}.katex .fontsize-ensurer.reset-size9.size3,.katex .sizing.reset-size9.size3{font-size:.4050925926em}.katex .fontsize-ensurer.reset-size9.size4,.katex .sizing.reset-size9.size4{font-size:.462962963em}.katex .fontsize-ensurer.reset-size9.size5,.katex .sizing.reset-size9.size5{font-size:.5208333333em}.katex .fontsize-ensurer.reset-size9.size6,.katex .sizing.reset-size9.size6{font-size:.5787037037em}.katex .fontsize-ensurer.reset-size9.size7,.katex .sizing.reset-size9.size7{font-size:.6944444444em}.katex .fontsize-ensurer.reset-size9.size8,.katex .sizing.reset-size9.size8{font-size:.8333333333em}.katex .fontsize-ensurer.reset-size9.size9,.katex .sizing.reset-size9.size9{font-size:1em}.katex .fontsize-ensurer.reset-size9.size10,.katex .sizing.reset-size9.size10{font-size:1.2002314815em}.katex .fontsize-ensurer.reset-size9.size11,.katex .sizing.reset-size9.size11{font-size:1.4398148148em}.katex .fontsize-ensurer.reset-size10.size1,.katex .sizing.reset-size10.size1{font-size:.2410800386em}.katex .fontsize-ensurer.reset-size10.size2,.katex .sizing.reset-size10.size2{font-size:.2892960463em}.katex .fontsize-ensurer.reset-size10.size3,.katex .sizing.reset-size10.size3{font-size:.337512054em}.katex .fontsize-ensurer.reset-size10.size4,.katex .sizing.reset-size10.size4{font-size:.3857280617em}.katex .fontsize-ensurer.reset-size10.size5,.katex .sizing.reset-size10.size5{font-size:.4339440694em}.katex .fontsize-ensurer.reset-size10.size6,.katex .sizing.reset-size10.size6{font-size:.4821600771em}.katex .fontsize-ensurer.reset-size10.size7,.katex .sizing.reset-size10.size7{font-size:.5785920926em}.katex .fontsize-ensurer.reset-size10.size8,.katex .sizing.reset-size10.size8{font-size:.6943105111em}.katex .fontsize-ensurer.reset-size10.size9,.katex .sizing.reset-size10.size9{font-size:.8331726133em}.katex .fontsize-ensurer.reset-size10.size10,.katex .sizing.reset-size10.size10{font-size:1em}.katex .fontsize-ensurer.reset-size10.size11,.katex .sizing.reset-size10.size11{font-size:1.1996142719em}.katex .fontsize-ensurer.reset-size11.size1,.katex .sizing.reset-size11.size1{font-size:.2009646302em}.katex .fontsize-ensurer.reset-size11.size2,.katex .sizing.reset-size11.size2{font-size:.2411575563em}.katex .fontsize-ensurer.reset-size11.size3,.katex .sizing.reset-size11.size3{font-size:.2813504823em}.katex .fontsize-ensurer.reset-size11.size4,.katex .sizing.reset-size11.size4{font-size:.3215434084em}.katex .fontsize-ensurer.reset-size11.size5,.katex .sizing.reset-size11.size5{font-size:.3617363344em}.katex .fontsize-ensurer.reset-size11.size6,.katex .sizing.reset-size11.size6{font-size:.4019292605em}.katex .fontsize-ensurer.reset-size11.size7,.katex .sizing.reset-size11.size7{font-size:.4823151125em}.katex .fontsize-ensurer.reset-size11.size8,.katex .sizing.reset-size11.size8{font-size:.578778135em}.katex .fontsize-ensurer.reset-size11.size9,.katex .sizing.reset-size11.size9{font-size:.6945337621em}.katex .fontsize-ensurer.reset-size11.size10,.katex .sizing.reset-size11.size10{font-size:.8336012862em}.katex .fontsize-ensurer.reset-size11.size11,.katex .sizing.reset-size11.size11{font-size:1em}.katex .delimsizing.size1{font-family:KaTeX_Size1}.katex .delimsizing.size2{font-family:KaTeX_Size2}.katex .delimsizing.size3{font-family:KaTeX_Size3}.katex .delimsizing.size4{font-family:KaTeX_Size4}.katex .delimsizing.mult .delim-size1>span{font-family:KaTeX_Size1}.katex .delimsizing.mult .delim-size4>span{font-family:KaTeX_Size4}.katex .nulldelimiter{display:inline-block;width:.12em}.katex .delimcenter,.katex .op-symbol{position:relative}.katex .op-symbol.small-op{font-family:KaTeX_Size1}.katex .op-symbol.large-op{font-family:KaTeX_Size2}.katex .accent>.vlist-t,.katex .op-limits>.vlist-t{text-align:center}.katex .accent .accent-body{position:relative}.katex .accent .accent-body:not(.accent-full){width:0}.katex .overlay{display:block}.katex .mtable .vertical-separator{display:inline-block;min-width:1px}.katex .mtable .arraycolsep{display:inline-block}.katex .mtable .col-align-c>.vlist-t{text-align:center}.katex .mtable .col-align-l>.vlist-t{text-align:left}.katex .mtable .col-align-r>.vlist-t{text-align:right}.katex .svg-align{text-align:left}.katex svg{fill:currentColor;stroke:currentColor;fill-rule:nonzero;fill-opacity:1;stroke-width:1;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;display:block;height:inherit;position:absolute;width:100%}.katex svg path{stroke:none}.katex img{border-style:none;max-height:none;max-width:none;min-height:0;min-width:0}.katex .stretchy{display:block;overflow:hidden;position:relative;width:100%}.katex .stretchy:after,.katex .stretchy:before{content:""}.katex .hide-tail{overflow:hidden;position:relative;width:100%}.katex .halfarrow-left{left:0;overflow:hidden;position:absolute;width:50.2%}.katex .halfarrow-right{overflow:hidden;position:absolute;right:0;width:50.2%}.katex .brace-left{left:0;overflow:hidden;position:absolute;width:25.1%}.katex .brace-center{left:25%;overflow:hidden;position:absolute;width:50%}.katex .brace-right{overflow:hidden;position:absolute;right:0;width:25.1%}.katex .x-arrow-pad{padding:0 .5em}.katex .cd-arrow-pad{padding:0 .55556em 0 .27778em}.katex .mover,.katex .munder,.katex .x-arrow{text-align:center}.katex .boxpad{padding:0 .3em}.katex .fbox,.katex .fcolorbox{border:.04em solid;box-sizing:border-box}.katex .cancel-pad{padding:0 .2em}.katex .cancel-lap{margin-left:-.2em;margin-right:-.2em}.katex .sout{border-bottom-style:solid;border-bottom-width:.08em}.katex .angl{border-right:.049em solid;border-top:.049em solid;box-sizing:border-box;margin-right:.03889em}.katex .anglpad{padding:0 .03889em}.katex .eqn-num:before{content:"(" counter(katexEqnNo) ")";counter-increment:katexEqnNo}.katex .mml-eqn-num:before{content:"(" counter(mmlEqnNo) ")";counter-increment:mmlEqnNo}.katex .mtr-glue{width:50%}.katex .cd-vert-arrow{display:inline-block;position:relative}.katex .cd-label-left{display:inline-block;position:absolute;right:calc(50% + .3em);text-align:left}.katex .cd-label-right{display:inline-block;left:calc(50% + .3em);position:absolute;text-align:right}.katex-display{display:block;margin:1em 0;text-align:center}.katex-display>.katex{display:block;text-align:center;white-space:nowrap}.katex-display>.katex>.katex-html{display:block;position:relative}.katex-display>.katex>.katex-html>.tag{position:absolute;right:0}.katex-display.leqno>.katex>.katex-html>.tag{left:0;right:auto}.katex-display.fleqn>.katex{padding-left:2em;text-align:left}body{counter-reset:katexEqnNo mmlEqnNo}\n';

// node_modules/katex/dist/fonts/KaTeX_AMS-Regular.woff2
var KaTeX_AMS_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Caligraphic-Bold.woff2
var KaTeX_Caligraphic_Bold_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Caligraphic-Regular.woff2
var KaTeX_Caligraphic_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Fraktur-Bold.woff2
var KaTeX_Fraktur_Bold_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Fraktur-Regular.woff2
var KaTeX_Fraktur_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Main-Bold.woff2
var KaTeX_Main_Bold_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Main-BoldItalic.woff2
var KaTeX_Main_BoldItalic_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Main-Italic.woff2
var KaTeX_Main_Italic_default = "d09GMgABAAAAAEJcAA4AAAAAg7QAAEIBAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmAAgkQIWgmcDBEICoHQZIGgdAE2AiQDhAwLgggABCAFiHIHgxcMgTIbxmlFB2LYOADg423SKEoWa2UUJZS0W/H/7YCDMQRzoOb7BEQo9UW0o+Nvq6XQ9C69R8s62L8g/NwIr+M4XlUdd07swxd2sLCFh4CH1W1dz7uGbB5epsGsW1R9zn9YC0+ijGJMO0Jjn+QOz6/N/37dv/59lRxHX1BxTRxxcHfQkp6gYhRGgeIQE124xqilMafTBYt2m7EKXQULFw38/3PU7rtvxldb9gyzOKoRDiQg6oRpn+fT83vjlQrMbKaPx3dJl6y4n2rqO3Od98sDK69sOQatbOlHBmqsxA7yrMatPrHKIF2llhdMCRu4BIYwjHadKiU+XMhUWdoPBZqILFlOwbdsp0xlSr7/2ttlbP6PC/yfunKvlbzdgJxDlVPpUqycw+uvnWk17Z/5AxLBh0AC5EMbWZu4KfOOgXGunfzg/Ujp1tumwWAcxi18PDiMQ1uCwf/Ulb5AUQEp8JR/QHaIHNLSIegHpVvfFvUWZUZd9eTjn9/fe8/AUm4b1L7gB2hkbfP51pr4zF3TkMgkUlrB5XXyr/8fbWYX85BWEuKhnJXA/2/T3va90Qd5QtoNeRXAjxX3IajSJl1SNCln3h3Be09jW28WpJHtrGb8QaMFaeT9sUdLggUt6iOUAQCt7IUjL39CroIlAZYpynR1fhmqUjR9inLLhNvAf3Oi/e/fHYVESJcQaBMmpmbk6LZmTboFKycRAuvvtjGrwW2NH4fnNLIxIoSA5XvZH1O+G3pz2uUAGQZJICnBvn8MIBgczm4wCILHfRwI2m68bnANZ2BI73oj0I8r9P0vdN5EnnUqHoxXOWKcfFqd5u8LBO16LwSB894PBBlZXfwIRNnEQTUKBQ5a8cXVCYMIyEIRJbTRyWrWM8kxTnCOF3iXT/iSP+NM1Dxf9FXf96Pe3H29s/d0sgd7pMcvrFFl1JnkM0P6rkmihDI66MbDDS/+BV/2XT/s3p0e7rELY1QatX873D513TWf+NgHzjvtAYftc5Nha8zlGvo/67/9n975+37nb38yFrSZWw1cS1zr+2QpBCAdU+7ynAKCOTOfnm+NOBRDlDTA++d3H835ZEwpCD0K1tG/jfv3jMKkdBCK+54Cq5eQ7Fwlfv/TM3uP9tcwQoq/EI54RQihdyhHxlpCLYT80m0hwB9cSQAa26gkDLFiSyJAc4Ks3ylchwwRgsvwesflpKGfMPfGoMQJsxMbojfjFh4MGBxNs0e2Kb+VbUz4HqGQJ65llAkoI8VQxB9ryyvcL0LzkCRHz8og4kPtcg0acOqGV1V+tnaVsjfsEa/ejmRCd355zjep2Ri5eaEeFMw3J+W/KrJKx4Z2CtmUkORgDjiaysEIaTwWkIgGnxkBTGRKuSg3EVQ7WhAOSjgk1OAJhQ/UulFDkt6tP4+XpAxhDS8x6VFtohJkCoWB9MwgT3FaEgN6IBqxAQXc8hS4I+HOWNtpt5J41BVG6WTBxKENGXXMjILUE4TbnCZ2ZltOPJGM/ycmMjvGSUTLtg9bJu6oF7UKeu49M8NOaEDDlRSAQi60EJxsROQK3QkIpR1FwpMRwU+CgrPZFAI+e2QcXqLSAxyLnqYtjdCtViZCK1wTf8/N2/xB4tJ8ikmwkiCl6iUaAb1k6amFmAtIk5apNO7RE7cEkYjFuj0tivQpcVpHMVRxi2RkXKs6ka4IUlveGrE6b2WAHBkeVPaF0yVJzFGAKefKc9S/jjslacMNnBQNUQbJ2KwKl6j0JksnxYDUZVGqDckqaazu+YxOuzpJ6UzGe5Tx+7b96u4pbuzsY7bNIkN0Zz9K5x6C7kiljsyBw2X5GZMDCDYFRCKxHEU30XBpHL2nyTMr3WFLzIAQrGZwzVXKOSAJaq1MyqpJ5IgZgm5Jl4CESlugejnLOBQZXHuetDv0KHNHqRNuDuFCuT0BUcWtwjnHA2IbE/TMLqRx28LeM6UcHhniFh5IIQGklGCkkhCkllCkkTCklXCkkwRILxHIIAl70yAiNCXeVve8oCL4nDMHLZneZkt+s98nzdjSttnfm8yIgmsG20fQz05ElQSJTdiIzdiwBRu2YsNJ2LANG07Ghu3YcAo2nIrNzgTqvEVZ+YHKho4UWSexZCqyzMId4ACzklln+jgngEFlSS2JH2R5rx7GDAfIpR2tLJurZTcUnWcZ042ef6GhcneU5gBoZwNv/e/JQaEWUolNgvSocqMF8aeQ9nS/yoecrVzAb5JcoMYgiAQhv92LSuahuleXzO+QJuCwa2ABMiz8FCo1CVnmzJ7LaXzglxPhj8zaO9Bdm69g4/Y85ReCEE/FHkfjBq0TWSLFhmIuHKdMB+qUD0+haCwq1N2Ju3Mxwa6VZaDn1p+gdtNocqfcVKtbb7MiIlncEtIPtkBOWhbWPO1tUwOUoRFijI2ppXg0zMJ6V9YxGQUjOUX68YOZTRH7b7cMEan2NWDLRFGps5CSJBYxK9vWJFqGIgVF8tB6Ohvh7lqymBGK2jisqITUHxq2LDEoAkX7QPomUnaUAmBMGt+Kv4OYr1CLNZETg3c62i6Oh1ez/B6MlsqKJR+SjHnmd5Q9QILQlYV3c8qOPJxoxwNBxaWSrVpBv2V21KPWKjuUXYg8ufd5d8zWwn0IVbu9yn6wMPvNDYBFmYwrKbT9mPI7KKE0KzrGUNCA+CKNFf4TkZJFiwC5TSuoUckHEncIWTQK13FuZ/ZvxaCUSWBkNXvZWj4YWzTjrHqLKJd7UeHODa14yjrOyo6EVBIJXI1xk1+00DyP3qr6Q6lPS21wfTEjsDEMO+nGIqN/UHMi4ksogH4KcyZai3kdZ02h8movtggKKR0DdRtAz9l9IOUeDKVhAxg57/HiCYIgvzAJoGkHmEX2HGzgheOlgVcGe01M0JuxEdEASGdTQCpMDyWmAbDO4bwjYH5eJHQAMXIkNRRyACkdQI38tcWMitN4dNuXmSkNstuM/azI3db7B4CyC8IpkPtDJdh4WYKfJSdQ887tuuuuQPcFz8N+lfKYpTxlKc9ZystSei3QW8HzDlcZH1nGZ5bxlWV8L6WfAv0WuCT7D6eO37897ifw/akdkWCzxRqr6kvjwecJ5BEZv8luUrKGAJSZGeSQbtsEBQAODXMBgsxPQJC9BdK7YCEImQ3BEId3L3wBCWVBWg5eSBVrYyUFEG1f3S1S18ySTTXunexxeevIit6XgnFQKvjx7+BRlJPo9QuIQgXFrJPr9cZomoGSUJzKNX9WZU0OH0hm2QJaIpEYpJJySbeiWpzHM8F0zbx5rTtLS8bK+vt4TZnaaRB3azrqmoND431FWq2eyVMl8bleZYY8WqKolhRKCgYylzRSiiouV1kUDNWVdHTVNtnEUkqSvFvmYPhFAYrKlNKFg8oyhirSKyie1kooiY3jvCzBs7kNKWlZiUDHXIlkQydLqvQajV5vs/vJHrdjkT1qjvgMiqspEBarIrDQ9yF9LlgDzSDLhLN5fxZjDbSAQqmWSQK4xBBGBdhRAEixYsKODTZ8ac0INvYQ5FIqlZ6nt782jlgDt2D7ArUCjSQ+wQoJOE/mhJofPoVDfSQ4bxxTQbgk7mrMelYkX8VYozL5GDQRmYOEUShoeuEvf3FpgH//O64dE+7LU1JqqSbfCoY+MLRZXNIolYAXhTIhuO8jrfp1XkH0gYQwW8IIB2ZhP+Fjl6Oqvoaaj1VPmU/TZVKs4puBzuH+47TDSHxY7f7okApiaE0YbLyJETPbnZOkJAqowue7bNSchWCHz1dLy0YqYZiSnojjm3ShCz+nbfJlDamA9htVx6iTs4SZQVTBBWjmFf5jDMJEgiJcdBL3FNKAPQriylxKzO+6KKFARiGV9lKahL43gJLk0BBBR54Jh4N9qeySTH7O5rqPLfjNr1dj9TGBgvvwFKE6evdTnfsxP9pNz210PUf3njCBaprQC0hQG6ZAkiBCwXtjnAqc2u81W0+5zD8pG81qSkHyK9xTo+uS1SuvhFJG8bCaq+XSaFHEyXEnYrYnQXss7r8qkPHygY49ZiCyFAq64/PlEP0PK6xoz//zCkwdOkuyrNEoc/hq9yd0BWT10l1lMBbjkvCOkUpdr3L+UJQ6s6RTTRSeZoqx036yEk0HhDrGxiKRa6H4mNHtMbGIJbePj62+2F6jdmQgt5sGg+GynXnaHl+OYVPrXaoPDAh/tul3Wi+FKKAiJskU02zfk2PDLhHSDd0WIi78KcTgUuCOTgykNd31PRvDKbAya0lGTNekB1UBNAeGrf2AcLEURjSgSm0RiYa6j1wgEyEQ1EmStd7pplx5BTTQzbaT1SN7/POEthEsfkrYFHE5ijE1J0yuyu1IDvqklo+D9jYAykSBTVwEpWwwN709dKMrD9qYm7YqkJ2U90uyqkR3RYRxSWowbrhXq1nZIAZGemfBGRYjYYZu3eJoIDkNCSU45Ijt555HOyTMTGWG5sywf51uwx2YEm4ZYZims9jz2eYKkkgWJjGAT6FRwhsm+2q9sZqH0mRNW0zdBoOlGMyw81l5NgItFP3dCJqpLTMBUqiNMojfQg+FNCGsY6bJBflEt5AJJUM2RJtqvWcjuqw0mItEOXzUwMx6uBtrfY1ExGYxw3JCnG3vYqy+Rh+CwkbEqJGzm97wE1oqFf72ppsIZY2Rt+8p9IUDdLADCONbQXlNNopPwQRVaoGNEs+49iYjzCQ/kEEedaaC3FyYf8hSsZGw2ErCMgUuBRPjzi5OPotsJ/2/QG5rZ2Phu6r/RbF8kq/GM5WFikQ97O/3IoP6oCwD8pwmiO0kmhiulKHupOBHcADnfm1dzYkuBr9B+JPEQBLWiNDlobpT9HFwQaKv/HKSgqwk3KM1UtnbAFlGOSCXCUq0DHIsS2/F46RR3AfZp83QqZAUFAkcep5M0VCsu7W5R5y0pPtRG8WHfJDSyAcFyOpvTy3zXbyWgTEvl/1/6ZHYvwUKLDPxoT8ZA39eJwK1nsXQBBXgD2XfIUbDijU7QUW7R44uBScng4BQuhTsGgo7zFVska/2DsIOQrW+WkY/kRY5w4kIhMPLUE4J/L0ui19LiEm8l9kuqU6JOAo55Y6d62EjSpRg1CtdNu/yn4XmpU+z7di0npnIVjgxZZnNhKERzuGLIFuBIvhKfffMtwqI0UVEqwgyZoovTEXSAHXo5xLsux9uuJ+nYHW9P7+GqGIEu/zSZOm8tcZTSBPy0kTPVIts9vh8IQIFVhAazDyUF2Cs9jT/ceIeQkK3izWx283cMFqjBMWpGY16LMzA3axltncVwUC5oKjfeGYLeckTYVMja6uLkp5FLKd9H98g2xVnUTpvb5d0wRbxUuxMc3/UniH3F8clMYEusE2kerUMeNkPgtiJY4FCWuGiNMaqGLxpBbFffdOtJDJIuUd3u0YHrTTI4EDc7h6d4qlmMCzVaUoo2H6SVH60Kzsv6aeIe5rlMqSirqpTXZO1FaoSB+Hh51R26c+BcNzsHGQVZ/IIyyIGVa/Mc5oxMccJ9YtnocdDvmc7DqpfnXWa6R1Pa7SDIk4TAdaqhOixUVURrZx0ld1dwRBX5r5AjHjpZZUfoSQ3KtH9A0B96eYqZxK93d3Y6HgGjZa303zYPzKlNBzh/F60Ii6aW5pXNv8mqESYZjiFeh5JjA+AIqXzAMitT2lVoXkkvvqGd8OWLrgAtvj8f5/PxP8ryT+QnTvS3xUFw8Tt+IuJj0wQ0MM+YdT3x06FjQbDJtgF+nnvlA+BpE1irK9LDXe2NPqjmo/8TTQMe+mC4zgl5/O4AHTLjlGppYzNtu/YF45ipyhR7Dgh1GIAS8F6j2Rzu4WkMr0jkik4XmZRj5Anqflvo6OqJuOVl43QlWmYZggrLzSvSjMz6QHKF5FzZizIkj5a6XCIiiCqkFpGO5uLICUE2PIhLup+y2MCr51U7xFMKsWRH1hmEEMh2h0+aII0baTDtk/ucm3idbba06SRZOvbldan0Q+6bnUux6rqFybIe8Wu2Sa5bxFvB8X0esg5XFtxzhdxak0mFksedTLCINwLzYWTDUVUrUFmJLYR53RoQol/4DFFaBmqcpKX3GJZbInR+cj5oPxtslkvzsYpGBLwyWzIKQItc0p8TBgsERTdUlEk3M9Yxaq8cVnTp+mOHprHZ+qZMAjRT61Iv1Y0G0zp+Y4oL54gYZjPpGIQINc80Y/JwR9OgZC/2xrOMOD2QcuQGzD9l32jMGc0DOern4yPOor0aIq0b5r8BrdSmekLqFDLYL8rVVUQXxPkCbrX1VN1leTQ5oZ7mb15FpRFOqXISsxxVF7eCwKej1retf18yjTAmbeP0UrZzBh3hxW/1+jLF+eT7z54IMk6TnSn0vxx9BpacF/EGAF/a6Kp4BDIT0/yu1c2ds70VhZ704aYvQZ//IUYoo8djyZh9KveAoRLZECeKXV6GPNDflaSIga93qw3HfqgwHvNQFcFPsAdSmGIHw5VrQrH6lCdGcgIEn7mEgxSCK3VGjPxf0GHsLS7Rv9DKazdDcupRXIvpBdttjuMHNPp/3ZteeN9mKaydIRRzgSGApmoMGHb0U5RDwsatUwWvsknrIIGnnd4gyaGiPyfZWMJG+fQKYduGO7vg1pEBKeOVCCVSnTrz1p4odVJB2Pf2y9y5clGm4oxsPzU5MDx6XeJjxmX8YibwfM0l3lneyJ4BdubDhKp32zHfaplxs3Y3oX3PNuO5Rkw6HTgh7JCkX49sLKF+F0JRu/3/JctGIoNGJhxgBSec+ugCu0dGaxYY+MmLoaqGQPKCHwNhGluuYXfTaz9scXnN+5GVAEXifsYs40kQfom0M+z/iahAdSspYXnPSvQ9bot1SfsVYwlBr/OPjoBMvFUKIzAMCyWPw9u4pgw6XV8i63smNnPJRIAVMSteM3Ec+d2hAaY6327Rs5bcojTKfATBa0pGClJGWvK7+Z2FPuL19xYR0WJVGbEVsNSg/CQZvnnwRxpHc0r0EMkWpOpAWU82uFwYJl0iQSztxFffDuCttHxyGMiaQ9hZ5Y5HFv7YVucMzXXU0kSC+sv8j+zIV0CdB9XexHFDekSeJG0Cl5hYjmzEatIQdCXR7eFRCwuDIlkPDBL9nWhSNeoBZdNUVMymCYANZujP0NW9c0tjZmAUQyUniZtug8IH2GcKlldHncqBWoRX0w4WGCqCMJQvTLfp0OepapUw2x/e7xE2LQtYXxKUT9NyJYgmFmszDXpbsg5s3K7iOyFRbePhdNxtu/udyBhPogOsRHf3JbjNR5uqPpGiK0nO6B2wZZsLhy3kTPnGyYgMxM2vcgieZXT/tb2zA7JHqQyCbktzKeVyHfAj+BEm83WPAfQu7lkCUM2favHvMv44vWFc9DjdIAaqXFtm6ARU9ezDvNf60yRueHnEhH7phGoPLKcy/mOXLBnVrvT6Y1Bd2nGshAnG9dJEkqwcfPI2mP9TFkxUkqcrnhzonmI6MQ5YYfMd971hGCt6iWWcNtVuMVPMdJ766H5aD7KWScoXEf6B2p8fHgYJVh7fDmNUOW6jazv515lBG6Qo4J+Ent5emKs3rkuNcxCY6AzpFI6OihFhvvXY8uRArDzZi4w1sUQBP5DFq2S+3TwJlsrLxwdS9MaRGXZFXoVwiiFQvTU0N2vW+Wn52hv03uigk1NLsn7XFUPPmXGnY60Gj4IRQCKUK3rAXVozLGqrqG/eepB+bPq4W4ev4OiGA+je528GaWg/oNEnqCC+rnieZr1RYQd+QnhPVIx+ohqtWRCf9prSc8MbEix7r1XJ5cLdJGWGBivm3bodm7UyxotLSYEphVRZvv3a06MiZxmSK7RvQm6b6KvMRvZnp5symttk3UWqGUSLbIfntsi/AXASR/J+6rvFf3kzMINLNBh7CHbiaQpkV/KT6DbxwFZee3Q3/br2JKFNMvy9cU2sh3QCxuD5LjCjd2lpkTB0kYuJQdIYkAMT8SFxJCz4M/qCdBujHNdoJ7I46lImhDzY2tGIKaWPWvzgJE3Mav4mjd/RgzZNFEUnqsstZ+cEa3pJoy5Qi8DHgV0SgrP23TaR0KGYol/F72TbFOwjsZuz4Mt1JFxB4UUmoZq9LjsrSj3mPBQPvNazieLkMjvYlhHRx9aU60JlTdZ18gM+63c3+V36qTHC/X7dYnYrKq/cekmOOJPG1CvhtRyQIEVn22NnEAJoiibAzRvOtcE6GRO/yj/8N3EWEqiP2YajFXCRBQNn0qdSZrkgvVqDTlmyBcQJAHVp+1teRo6YIxh7c6dLdUwUU832TzoLDNawtHdl81sa+mJFJeuX18zvzkZuWcKwxCjqopQI69FezqpJWcg9XuPi8yl1WvCVkkfTxKPA28K3P79rEjnMq48RuBwV3996+m/UuuNmGMC5pcFQyeC3iFVyBO41Oa9R2kmXZIOs3R+0rVBGF9Ee0VpM+8WEy7UC3YKxrnUPYcxO3kNQsrbIF1/P4U/KDdbrLBf7UbrB/Id2+ygatZLDI9JqxmRcVv4ohNKPkseS+vNrebioaQgMdWpPIdZoEniPPfWLDJpiIiYJSayVw/BohsPUlRp9cMYFskZOrv3exHyFZYzKtNdE1rbo5TbLNY5SkdzIvWdz/MRxNvkTn4r+bo2vx5pfxHB6lT+q6KEpZk+Gf1iOlwwE88nqyMqyPTy0WDmeQnPUdEBLBZhjLCgQzv/i1r0In8eV5bAz9/yTbsMTS7hLLU3Jyiz4tQcq6fCrH6U6m5m/W6fYJumR3oNAKjEbxEQz7QDgP79Ln1+ZYH5l8I3uznqJNVQI6rUqksmajEp26AosDFkSwnHUUNBhQSEcBAJwzgVp6S9x4PfZhgQTvw62QyOQ2GW2Uw8F9aWStgMDorNlQW/RqkN8jNc+DFFP2fdC+2EKCkCf49JSIdCvfqcyPiYfVm4zL2LnzKfXAGSweSesRd54TiXzdZdY+Kbl4h1MLpdI6QU6teZAnSrM9bUcl2YqjoW413Vhpp0Ig+nq9dV11jVumr0WfH9X/wgzuDnJSedyE9y+cGQokfKzA4KPLR6ybECS40rG1/3M5VEsL+/px+rOcRz8pKuCjvOM7PE89IkdBHJSDfB6KYznj9MIrWfEDa5SjP+QNg3mxbYm2eT7lfog0q6uHluFxEjzEAMpsrMVEus1AJeOEZAGD+8IosLI65YVbKS0zQr6r3b/TW71+Ovsyuf6LrDqn2n/ZTsMsb6wCn7osLdj1Ng5Q730oSq14NakmhokquKE/Icx0no/zNzWrBG+zAdYgsl2O2KyAzDCIKaCsYlsF4pj5PUoE6lRT6OaS0RAcQ4I20uCNJ0P6OVoA18eYOWknWw1Mmwlxzpj/1z+F0mUB8z+V+SkSseJ5EJh05lyrgQPtVf9ne++XTUncsMiwh3zLMv+WAviwPdvIZWm+BNAwq7siV5gzxcVmy9eF/14844kuYcDrRLI4qFVENUKAfGKaHvWhA0r8xQu6DHjTnw/WyBhjoRdeQk+/rpjtWOpb1n7IjbPQ2Er1deN3MsR1c8Ydv3oHFJPbz43X3pK3WKV3j1RzruPCEoVhzj9RcMimfUQl7NtnjKty+69YG5AHs5kKetehx3mM6ceexZB+CzjViyT/TXw0nVSWEwO2F6RCo5Y1q8qOaeyP64kHiSQLybZkzBQTB8ZCJACN5fEUCqbqm8uQaqfY99/ljVb/TH6bj/RMvC2nuG2R++P7zByj4TWabm8B2RxXZ2S2019OWHjx2Gv/8Dnmj5ZFClXP9rTnCWsqtH6q143VEPC14RIoCr3VS1lvLjxOMEzFnVIc4L9kIO931f0XXJNZmzAly3nKxXJfuzSQyvqt28oyHw+qFnXl5RxkSogJ6wfjQ2JfpixZi3lFpjkOKpKaHcKs82/k9ToSa0zeRxL0uYG9c2p+LG7LapJ9+dMWW2nfltlsWfXCNdnKZ0akC/pThnbPSJRG4rgCWYTEEqLCZxqranJuDKDAU1FLft3MHbqhblTn+Yr3+P853Z1qNQqqWNC8f8ogmhM9/jss0YqD6KfZCtR2BBKp37338wGUhtJZR642NKzW8a2z/ESTy5EOUapowVbaFaX8Oq9LRd1zLSb1RpYcGNT7s57CUT1WCWKycNLKv/KI4BwMA/E2lgaErV5of+uHLL9mYEe+yrtseEn2H4T3995NrXWks1OX8ZPVbR6M+QEF0WDI0uGwgdrb1ATSnMtZq5P2djBIub//p2e3UXyKcVJnce7vOgmGSpP3xqqGbnjdEj/liFA5+eI7+PBA7g2Xc80n9XMDH0LFgE1zOYsvr0I1evfm1swEUzYt5qkMv1cGaGOyCVHZER0boaRFJ5RzBxgYLFH4pA1l5mbX2DQK1VMxXtW4OG9VNl7hD+mwVFGx6RwKX/2+HNo87DysPO8a0I7BchLWLivBA3DhtHRkdNZ6TiM6bxcdOY6Sb89MpsP61hOkpD16KiT4lj2nt2pRUB2PS5RHGU1+aNgt14zd8JBH2KZic7FrvcCNbUnMDv4s4rdI/puVd43St44Is8MUS9sPnZp3Ka6NeV//w/z/jd+25+2KOZZz/oj7k9FfRy1Rh6KO+8ejS5MaVlbeFXb+cm3W2QYQ9Nv+q+Yj+UbnhvhYfVuX9/1/WaYd0yG/HHt6xYtgE1wuMBbU7FKuBEZeSeMCLoOgiZm2FyMCCmW4DZFAdmMdwPOHUB29W//BJY9hj+Tp3qZzWhmFQ3jEE/NCQHG2dVKVuP507PKz1W8pN3FcBNbSGpgfGcvTxZFBArAnC6IpZ1zqnoRB/sOyWUDn2/vwjmOHKoky3vW1ue2pD1z1Fx9SylfcQqPnWuLj7rb7V8rrhBNwcRygcrGFiPic/QcsWXJbVXcaYMmQeQk7ouRzuv2KXgKis1530K+QfZDH0nLV0795VjmPALmTlkUd/Qk5zY48v2ZIVyQlnvDfGK3e97Kg+/9XVD2/b1TUSXLNeX+xDGNpZYfOoflyC+92w57/3E1D6jdu6oh3ASluH/HjLdEYBXHrEX1Gb1mH5DCMNk4PK5lnnvW2W0FKBgtjocv3H8+BxZ2rs8grG1pH/l0EeMNEtCcK1cMwQLdWMjvlV3YoJf15OU3P/21jkfsTr82aw+DIlF4fw/Cjb/9QgKx2Hm9ovtGY86JZpD3Wha6p1+Lt5fmOf13aJTJrbv7yARL1YQLC/t8jNxSmVVIALXq0n4ZZHmba6FClgNRzXlOYE5Xgl+SZ9KAkuA+l7lePu6dQGMDeWVViYFw6nKdqkvv1Uw5StMerBbywgrDBn3Lp4VKqgQiLUeBWq1myklHbQ/o7+sE5xMKg4VnmQHVEaB3v6Shg/rH1tKTIufM876TM0UzGl6cR5EUTTACDRv2dljJEXGkc9Nrl15EbFGE/UfMYkyvR10romK4AIyjqB3H77R2rn4IqVMZkRe18tH8En83ttLwmX5s+b495yGulY2+YW8zNPW94XIml/tfL9PaX08qX0w74VX/lSry/+Z0/mN5yV3rCJL2l399k31sYAxmoEU6JLXGP9Oi6cUtoZPYaRiUSvV+Sc6UelUVY2Ljm2lAiS7E3ViXxFq2amaDz26BJaKwP7sSnU3ZSqQZEWd2vvZ+P0VoUoCJvF1+LG4YW76geU94cJgeMMCmdBE1N1dVeRsYddQQa5NZ4B0tul3DSdMxNc53AVW96qOe4XTfTCQk6Vl7zj7+GO8/n59ZjHfxkSLylfRzs1rViPI/zNxsxRaGbu6CMdwgv/aYnaWt7TFsvma993K4jykPuS0WIhvH6L6SLTs39CcJ/6JOn/OKQnkK5v0L47FPZ8keK1Czse/v4vjyDgimvj/rEXzrqH4Tqh7vu6TF3ccSSI1Nwq0Wd1v6bxh7y1FapdjTYH+a2j/OWk+IXkRVTUqG0I40x5bUS7+hXI29qbd9uFIfWDhoZeTdZ+1i9pte1X8BEJs9s51DclnZ3auWinpIowmIbWza3mStzs6Vwxfw1b4YtmhThXnsw97U33F7txKFAC/a2dBWVVrYMEdD7Uk33Wy0kEwQsy0yTjqyAvohMa3L7ZZK6vqVtxKKd5gjvHtfBtG2ghE+rOieOqn/TjaCnHUZ++3QHCkhaS9JnOcovx0pRMCyzOpGF9aHJdeb2BrIJokEA2shK2OLsyjwNPRirf/1MK5hHpCkkRnZTR+iwDBHsEugET2RG8BHR3E+7cVxx89A53sp5m4gtV2XuusefjA/vxgeQ4X0/TP8slnLzoAJToxKHSmx+dBZQLj7ApmPA0FAI7n0TH+7t6qByJVtEcBJvOYol8puLoampBU1OxRrn3K0doEweYd5m0AjUH+k796KmaXpcwRTX0fLmwtm9PeDBsrU3qECQHfOkVVRdZvVjakR+Uch85RNwxvbmBHzZpIjai/m6m+ycYpyK2dS+1nEvElYtK8KCTNS4LD1b7PMMKL8WyDnIwLOEkO/t5txfGHT3c1CBKbZy8tGSya05p/NijeeBrqbN3Jsziw+8HgJCXHsVJjjoDsc2aN6jtF1W5pMFD/DuCvaa9xrm0q7sgnShIoOZitd8yuMG81jwUVEsdIxMjRWR4nNTPzJLTvAJ6TL0exzDqzw/471ZvruWSji39GgKGxWu5NS7LQVC6ALpuG73wrAJGkOerfQFOv/1GUHhBK0TDU+lmduOGqrXOfySmTOuMo0jkNqt0mHI9DTCtkMkYguYxzIWLKTF3aOJqVlrjx3ZnbJ4BRIVauzDnSAO9m5aYImLJZDRsMGx27f0vcch+sgll8kUDehyGlM8zQpwgJbNKkmf1bvsOw3rBG9gxsZvbj4j4W38rNG9u7wve65khPwuPGdnVYWOFTRtv7Ihm1aUj7A48LiBPRdN6Hpykg5joB1+AVxtGs4rg0rSPnkhVBp6nnqqrwEJdGB6Bd6AdeZ8Fi0Yut6dxHG3YougZmSkvhkZHir0ggVrj/9JcEdI6+POt4GoZYvJFJQoYZODrL6zQK2ThQdQyL1mwMfAQMRkaMW0ybCfh4fl2ijVI3nrZIkqpQxLuZi5QPt1VcmzTVCyr/STLvPl3fTI+noYL9z6TwuUi632HE2Hag7jwpttmhXbrI6K6uAPiFJaIoO4zSmQ4fST3dqQxAMnF5KszxgB+hF7UlrfrcntRV900XWxjKd9k6TOwtsMa+xGOeidvk3nP5b9na3ib+BFDUQrQUCJXD1VO4WOiH1rFyS9gBDmxd01+bqwCyBpKvXJ2sUrIcKNzOa0sEXHMSG3mnJe4EnZFZdXZzV8kxdTl4fpIJwcbiuOTpCjoMMVKOTi8LiTPVWA+JHLyKgPSHxIjv5EYO08ZlP8qdx+eVmbpUbRBHCejrKzF58vDSfHibA0Y9gT4/7W82tJT0m5phpOlfiFFPncfvA4wHkkuFygTL/ALnbqKwGY9GV5fJDFxWZD9dPx7ZCt0MnZ90aNVGuCXaH07cMbJIG4KNaQmZqZmvhmgJR1hHazxlTifUSDNcbhz2zHgIYDxIPnN1kF7HGbIcsNVe4Zi3pE/+C5y3RWe8boojxuJ4c0WEpU5OQ4ApGXiK9J7Iviw2eEkRllYcF4/kihyE6MQ1mPD5zyKko6igM6nKVm4EPE8l3LvGn6q6c8AM1v6BGPYyHJ0FeIQBJsSBa56S6C43Sfq391eoKs2Ju491G37M6pguL1+7bvOHHcW17q8v1VX0+MnYur5ZpmBWj3wDpwsXdBZGaH7xf0OhUPIyfbugRkCU+v6BAF7Pkyeg/XGZySu3JhWM9NS8PjoLatStuA6VgM0p/hn6yeqIB5JDO7C7HJi3U0EqCHuDXb8FLpKhxwU0dj9xFX89vdPKX4zFBBLd5WbJnG3zOJxYf8/12VmHsILcgFGURjWuKSSESsHdGRONYocoDDfqaiz7CuzF/nRb6oD61kZv1qimVhjJocNlPSsjkmh1bVtn0pnTud0fX0PBXQLLhEFVoTaZTTkiF7+K7z0KfUoO/1BZ6zLNVLUFTrmiS30Syc2w+m2Of/PGZnW6iMh/B33eIykL5+ax3/0vLSK7r5UaRowbg7BBTq8DZxqBsm1CnWFdNBRZJJmk7eY4fx4TpmveAru1xbnTl+g3lhDH9qSFSsro7q2hyB61omSz71IFlzah91RLdg60PPqzKLb94+2vUXGJIP9zs5kkBPUMKkDzdSOD+S3dJZq7Qlvs83/wUDJzI+lr6r9NYp09vZXa+oTbShpRWEIgBV8xlosHzSrHTz4SYDDfK3WJh9egABLg1ncgxEkZzSQjdG8tTh7icjI8Xgu1LQOFzYkgZM9VDz2xQt8PKemT9gU4ctLYdfhCgA/SAgSpz+hJazF03O7GV3H1ifkRpRvv24uux/WN1GNPq+d/AHvY7FZn6OoedRTpXCXTp/1RJ9wNE5A/yZWzVvJ1h3/5p7JoBb4hAadcR8HYl2PfWm0CxVKxxe3CkWzAbSQpxDzlSUKPqaclwbE5TM4qSGeXsRydBSsBC3tR7NPshb8Y00DiwR096/ImiW+vkSHgbAkOB0dcHTCCy7dtksxdIP25PJu8RGBnj6jwYp7bG41zVByi30e/XNN67Gvfah1IsOQyAapcDvK71DztTiOlwqWXdmP3mau49CBEKKmj5LKr3+T0ygGDaM1yuTnqL46Le/IXwMKxuky3Cb8V2FK7Ba9HryR6LQybqf7VPUuLbBk3pW8wj11Sk8TNTbynULxbJDEaYdGYNy0+OSGw83DZeXj0HstcgbhkSmyj02ElwpImFJFXwKqck8YRgTJhpfYM/G3fcGt23v7cSffWS7pcON3vNJ6AqjU1kFzK0lmlsRPI08Z3cVD7OXRqf1M/nStQUrJo9Eku4z9nyMnyzK4Ca95uVCbcD2Y/yKy6pLfBGY5s2ZX8xbCo4p5WZmLvBA7H9fBL/2SD/ThrlIoEKQo4N4JLf+GzFvPKdZ/qm1l718pbVYn+5weBcPhUCkhw2UnAz98XQCSD8B+pf6R4oC6BV65+W9+ZKBfjx3vhohHcaXqEInF+CHxGz2RD4xXVUFe5cFVcUdNncsoUIgSUvONGUepN/InLpJi6UFBgcsMiufsNv7nwARXPKIrHEFjm3wXByfjPzz/2F7M8BT+EoW6oM/319/8cXRGNkp8D3EzdsQHqCVDxoXIG71WRH68YRAGgXRSziHz5oy2lavziYUkdH1JmKnjd088+bqGrog6jEKMov1MRn07oHBsvCQH0RvXk0twOZ12B/g7S17CgZYk2afGWX1N2PfBPsuFao9ZL+uk6DZHVfYxiiqYOPt3DNSt7cSlx930ghAYxiVBsusm8BY5fSSsKtvpjjvqazdLM7EAsoDYMPCyJHpzi4ojRpylpyJd27zzp4lupimSevz9Z+PmugWbSp55H3L1+yQj3m48zNayStQiYSmM3bf2+d+OdhJuxfjyrid5sUA6v9sR9mnJZVc9Kv1KnFLVRHlauw9RUD5VkwCPndAjLui5iq36AEyCIhjAJubcOYwzPBODtM/UL1/iki4N1uz9lugWvGaTP5/n3Wp0vYVLi4scz5jqvQ84N10uzvXb+Xbk4NFu2UVWaoJqSNnzSMvvPfy+DEwiS3LvTJjWUZgXP3Vr4VYbyBxXN+XhdzXkRULXBxKxOfaMNI1/Il3rU4yDbHeNLS/yRHPW45bF3FN0/Tc/zkpa3jJrftFSMNgRhFpN9ufBWaWUm0ypI1exQboLT02N8aVoiIxNGuRwlv2bOs/MmBJbfjDpUQ8XwgVpyKamEGuElXj029sQDyNdvAQBdyY0O+sB37gYPHGvfOfP/CHwJu7GgHwJ5T0gmM9mC7wo+gUvfvq3TWTjqU/lmP12TIxnZHrgbgh3PIsK+X9IIx4tP/q6eSwWI7e35dsLjIxyxg/eqB9SD9674iJEaJXticQCI/HxAh5TwcpEn+wWn9om/tREpqUFpis66k/akBcQ4RUU9psVVisWk7YKN+yt93XIl/k0jZ1FQsymFl6fikucl/WIjtU1c5oJoMoCWKGLZNS7a+qCNRuHmX+EoyZKMccn0ExZpRigXxAhhE4usaMv1ooulg+ey4ohgxtlbLZ0gSmNdMrXj+eOaBc+CmWhItZizTBrULgXVQ5qeqcc0fd/+VNQzLsyQGhU2acGXHSQpFCT+9+5k383mUckadLfNpP3CYP5bR/aQioezNzaWN0RnbZyaOteLeCMLVXXy0gUKQsvKI/jsgZjHSGAwLMC8CEI5tJ7FX5ApyWnCfiLzTe+zHhQoetjoeDBj+MoA6BekkRqu3KEUU6oc8+tWFv1sHHlZfypSp9YZP3Cvaq5hffL7xVoiqMLUnDr8Jq9Z+7zFc+9GVf/0xV+bL9CJTZx0B8o2AMBKUZiKY6pHtS3FHpkX/bXg/qHdJ6Gx8xWyn0VziW5c+8S/ujo5A+OAIXO0g2kByRG87xX12EFT0kcWkYYbK0zfuERpywrx2hI0Q2Liqemj/2/4QQkR/wsn+vVlfRyLXkxUuJPmrH53Y3l+TaChvap9+HgHc4Mvj7RVacq5efnPpPqs+s+Xqps17a7MIbce2Q3b3k+jmW4iwq07w0rz9an+od5c/Dr52c1NhpCKXvxeC8M2sFGUIAWoKoRkpTWKyHJAB0xsYB1RB1nFrHgXzxSZOPGDQbszq4+IYznaBvwCE8a50zps2kp8JioItvlU2ZLKpvUPLNHmzYyNaEhERG5zIit9gi1zOgSyAFCrfJBUZKWzymJU1pEoF2fqtpxYupSWiEOfOZjmjLa52CEMplx4QMgrUu5L0vBqsoe0/9cDTxuEjj/tdetN46ab8mPQjyX8C5Q949UVrwoaTdjL/+pcc0co/oMhvnyrnMqwJZUva63o+GCdwvClluqjrHLS6ATY2GqXac28H1X8x9P7KjbbPI7p1xoyPkzRXFHocPViKSkm6DBTC8EZmQ36d5Buy+74w5sGPQBjjE+f/n3Fe6LCXjlFxRYee/fa2DW93WKXWveYt0NwRkYcySyB2KnkLLpO7h0f+giXCAt/yLde/LVyfrqcMxPBxtOBLdOW1PdTMImle227IujMEOM4UmmzwfmrvCoFz6R1pDjxwwtiEsQpioomlL1//8H3zHk9Bdx3FB8ZZq2Zq3U2uk63LNW/ae8XyWU+T5GJDuijs1I3O+X6hdXKbpIw70zCJLrIvlFtdRFx8s7shVxsngp78iJeu9wn0CS2UTP/ZnOFh+MdfEabFQSKfMHSUrdjdNGz0dq33kQ2eIX1386uJBEeNRZ8mfSKQa/F6Wrj8KSOl+hQlf5ekWHtrSteCeleZ2qy8u6LSidFDdV8VtPAwRuR0NlVdzrtVrVFh2vIHjK1pGHFrZS450GdPedKVqbcmS5anKnzvIGDOMXC0JLQ7rx2+EdD6eWcOdlJqb2kwgwwQ3t3auy8Lx1B72iUYd+RYU9Z0m3WvYWt4IGj6pq1iYB9xSJUqBfM/U/+KXeZEvo0tp/1HJcCl8uCv3zkgIFYHLtr2y/Dy/et6EBIXEzG0QWZV44Nzjueu2qSbCvmTdvusjfIRV1+lJG8Nv8NnWTk4Pf3uynp1yVlFxxiMo7PT6kcXr90sfB7Ea/0lXGkWa4kMPsNXPgGOi1q9JFfXbmCDK0gFen3HzuOI/GZ6kUsKqn/EnJtdgo1Rz/EkWbVHbrUsG6rjn3suiq1Wn1j+QTKHuMMzxMPv2p908gMH5yOkMUZvDxpenljzJGa9ehVozpNM76LeAvPFaqNMb6s5MEMy+i5ET2OYySAaaAqcjlNu8ceMOs/o0TwMzgiva4omYK6rXA6jKb6ZVclum2/3ibSnRiqczb8bs7Bde+BbFrUFcQRps0k/M/wdboV96CqgiTTqGksqSTfFj+mVn0sxPCyBRz/5Tsem2Gtfh2Mm035P8dFgUet7cf7ZuLDD0lqY2Mykb3GsEa3cmtRf9EAmydQT4gsAS8Pvi9LnY+7PcOwACTdRYGSE6YtxKWc4orBdaMfdpSUZ1aLF2lqW0Yhd1ltvOHoXxVVbQBkW7JD8zhcuPno54NZY57aO6PF7YigSAAYcyD+qvtMFXoCjhDBwCeWOYZucbPQmH21svmN/30NTRlff0duPiCHly/P6/oj4cpelz4gX8Mo0icBCkSReeabUY8z/PBb6k2eagSkp1NGbmYGoOZTzYX/6bN3yxA7C5GwaaS3vFE4q73Y/wz25aNKrGJuX2ly2Kp8mNcU6db6AHL7q5xw7w9cg1fOjj5lBosyktLumv7kuz5lyGxMNmTcED/3UjdGeTRd993/Urfc4DLof9dSMfzpjy/oCx7o1VKRoMzpHxDAQYDQe0WenHDxKWvJ7WapTII4gStAZHTZQosxuXL3vzUL346QwbMqqUECp90SLc74ISWDkrXSUfjCRuX3WpKt4E0N53EgTbn5DUvhDYmjVLaHTKnKMazRLgVwVcS+bB1V1yTaq95QNWvRgahJpEn+ZaR+AYgdOSPAYwtRaaZOwCsF4o6S6h3RnHz7p0uhcDhcFb2FaE5anrN/yKqsrks1bSU9NmUNvPjOsTobCoojOZVL7sTeFfGWlJCqpnO7QPThBtl0PuEF+38MMAIPRLE2ns5cQqp+J2qdpnHzDtQDtSrv+fpdU+OTS8F3di6gnGcPQeS+xwyaZXVk99aetZve6yirctYKPYSTUm/1MAeQpx+CTphtWAZctRmOpjs0coW0U2G0SqdYcCIP1q/+9zs492mw4u03MhJ/DZq1yVS2nywLDaxkT+tSuhqR0oKPtimb6+vK3EeIz5jCYIffcBdVHl+6ZvsN6nqVvh4yxi+22ZLtzPvYhAKGwhWwUf2kJaPVKjvll7gCh3xRt5njVdJFPBf53hJyB7n6tQvakp/UJNd9q57LNlqrXXRRpzauDIprDAq76h+tyNP4ZsoVHOjCoEV3nBVxh+XJPluWUuGhFv+YSjPIYaDXwN/DTGYCUo5Hz/CIR64MjP1v792ZjlH0Rqn6lY8D45y+y20CCtdiL2GAAXs6nSjZMO3AsSEC2b97ZGEZ/mOYvCdWgzGKODMFjd4d40syceSczC2Tb80NF+h2Laa2oNjKj+zUxG2ml3DjOP0dTU1WeHcBZInPFXX2bmCT8E1wdkkoL/U2s5gWYUkC2xNJjmr/d4UxESOEFf8M9OI3Gi+H9g9eR40HgDADfz+BjJ5DdMLcvDxvgR/EvvpdgKVWFhGblwLy0M2qrx0e+P33PzTrwzFTLW/f/AcbhkoW25htGajgGdisEykTVinfA9Q9E3j2Sz6KCzJbHhLjCBWpo8wMfP2UhalY5Pzf9T8Avf/DrxD6ZIPv3qkvnxvobB6orn+he+c5Z7m7XZ7ENYTDbW3Jpz7YtAdWqcHAQEZJXK4QIjJvWjw9lUUAZZbLRgTfX2yiPy6nlk7g5oDL4yFR69xasD/93lSI8fpIOtvCDSili65qeSGsAQqEhcyIA5EGgUZddSVyMtIdcWnepOBb/FsawMs/GLx4OAXjMXg3jHd1zir8lzvhxJZFKIBKaEYRygp3EaQpmtsjEaC/vPIY1LPshrdRgvYzrr7APrb4GhSEbHdxDMvTiyF48yiCTEAsQ+UCaFPNVNOQ2ZhAYFSBeEc3QX5f4uczCRTR3wpDmB0S0uQSOAcIMSCRLmT3uReuGJvD78WaRPga79L022BgNv0vius+FRQ8sFj454tcNqQJKiDYXgUE3pGLvrIGfK1jRxzA/QBFKQwrv4BBZ0mQzRnbV4+cWDgbJleYIATYdm3ZPT4fWliOvPD94wl9Y2pU7sDRpin7kpok0oRht+bBaXpcregH+sHL0q7dVVPhfWsiORCysBGfCZ8920Yv7jIXL3GoSDesUtR705X2UEFLjOKEACTThKNiVZ/II86Q9jzqksmXKlWYJqJzDU2nHK6wIMRUNFOVi6TDCt1sOgy/spDYuzH56mXH5P6Euh1wlFj7mHASGSqMAkT8R6fK5Htfz/e9aPb4BzUvETAFszF4wQeqbXtFEX4O0M0z3O97/gdj5tu9zQAg0nfSKwufr+cpTFp1cFGXaP/9d+jXAaS7q422hc8WpKf8JbqcofoLVDshPB5njcGzopGn4LnHcQBAfNLELw4HjpKgnlyUkvawclbFWZ/VIK7Q1BGq9D8u00Fr+eAG5vID9yOWbqrccRyQCOgfSF6Z/PBNrHXkJ39KPNkxujpd9/DV9A6vqgufuN9lEaiMwFZiEWq4qL7Ld79t5dTJIXGEMEo6VjaQ4Uw1iRF1FV2/fV1SsWwpBmhz2pqd1bcYKVLeh6HBO0hTLBoTlPLhqk2OxpqU1qoSX0Wx/OT4I4vantMJRkzZEt961uOP9gkk+DaI5/BeTZetADAByLSO5NBinYbcYnTDtLLUYXr2Wfsn5z9XZwfjlR0pX2zZvkqw4pq5UkMB5wuU4hyn+wj/HqgO23PekF4n+RRA9x0W+Uib34RvtbuU7hYm65PIOzNXSvyZiiInvdgnddXPN20xDIdfMUgWSmRLXgDgVyFFk8xQfO2mhyS3UmIU+eTP192dIiARCrRLYDDX1G9ABBcIySHTcusSs9xbOqJQwonD5XnenGxF5kjGOpKXrhJrJVdSo1JWln/eEfrJDunmZ3QKAtKVdibLQmHGmCULKplleUSLepvrK0pUAH0bM7wu15I+TWEgyULIx8iFtKyAZQLyCXxYUgzAF0GrQgjJWqmcJZZL0+UQK9JwaNCXZ9e0FfGDzlaWuJNpCIExgUKH3T5DSbDhjtVSRpCXi+BgXaVdHBzsKUgZE6tTQIPONtUGCzUwsopcHUmwNIOEucI/bqz7WJ9CThX5LHXd+sYJpSqLfcamlHgwrtpL5DTU+FPFvlpLE0UKCtlvrHPgPMkWSrbzshbxqXzqOilaN5QyiwAg9NH5WSrLZWMRdJGsaQrW+lKZYIHTxPgqrXBpntUmG6SpIgPBTsrMEEHL5YisRsxiCUCUJEEdIwRWYzhFYNj+PKOQjgvgksJIh6SSVHUSuC4HKdmlkh2AkywFKbEADihpIhJQ6o6b1Zy5wv4yZzIli0hohN5OV2NtyMW6zwZK87Ps0maRxbgF1ywsytheR6zSK4bqeIInrdhkEUCSiG8GDkEwrPkR8c7Qc2UYktJSK0SA4olet0UpQRChDGamyGFZAcklBLcDtrd21fJ5XpFcLR+XzwsW8QcLYJ4QAfamEUwtCwIQtWWP1vmjvdwpL/4j5MjXnLuvfTkTY7WuwdFep4EgAoIhyE1xlVoaau3/EbQY0Ep0dhN/4+qQrAFylg0BN/OEoRN1sTTLTDjDhkrmrdzObshQmeFZwNudYBLEnFTw09EXbHAV7sKZeC5eicdwL59XtbsJqi9DPHH7/Ioip8j3Ird6Q55HyHUHOcWhWwMblpsRnEqh2gIox6XkdpiiKs3+gN4ywPMM/F6+iyovcn+APpP5X6v/otixwxecTX3cVG5rfs5M0DZaHjc7F5mvz7HQeSH6zYMEQINDOEyvkeIMgqCmugibGZnZYDw5O0fcwbdTnWqaVAG9GMT7spcozJcAmov8D4aBPJ78YKa9SynE6ObBwExH48gKSNN9jwPu5L5UzzUnyiD6PJ4IYhOlw86vLcu76CpyATMpF0E2HvcIBe5LfkUu+WukbyG998EuViR4T/+3NG6eF9cShm6IXuBje4AcQFmMvgcKhRRQ2jEJ0i8SSO8ptMT21jaE+IBm2QpgHdgKJvHoVgif/61Q5qBbYXyxzY83biVtfaD/xMpk94v8NLqAScDh2TC7XmePpIvjShXIuFGnFRoFMCwHqiqKqogZSuX00ueV1eG7JsJ/uFM2zqfhICewsTdJoC2jCNQdPHjcxFqTCpSsspXKmKGUaD63jayJw5DwTJ8PvZARpebqMKcwOkJuBu/Tkk6ZGS160mWJsmHqYErDI2jh8hVQmp8dkW4pbC+h9AOgpYoNvcpcG0Rgkic+qO9qzPyOpKTIUo5WnwetIfal9Ml0ojgXvDOxhuCAVermL6FhGbeP1SIoFYWB0kqJxLiutZxp9IlZ6iVs6hgGEgJ3ukVIlwOnfeDYK85gJKsaaNbRHUrxa6tx0GU1BRHL9K8yeRbr5gZC5RyR0DAbL7yb1szqWlQyY0QSqUZ1ollXailKOqqrQvzah06Z6bf8G3VKGo7GFv0iZzYVLh2b/khX+L91uzoRhETEJKRk5EgUGoPF4SkoqahpaOnoGZlZWCWxSWaXIlWadBkyZRXbfa2LW7YcufLkK1CoSLESpTyycgqKSsoqqmrqGppa2jq6evoGhkbGJqZm5haWiMDQTpt8bLcJW03a7x0nnEyhd10PCjCAQx/40Efe80kEgABCIAJiIAFSIANyQAIKOuW0R531iDPZCJYvGHC8+PHCeMir1+8f0Pm4+Y9Ch5V3Dw52207E649vbsb6Zy/rxqu7B3v6uuHmATgygEUH5rQ1ji9aOjB/4QIk0j+ARHatG//x1GPgevmiX9R/6KXLnwTZqQS/R77ZcxISzNN2CJZq9j+jIeQoLDo8IgnnYEs4LwjexiRh4g2JHwF5ZFo+hhBQ4LWCsW1/wvO/+YD6JHv3OYKdCwrcmnxyyDlPfBVghMf37r1M9KrP6AgKhWWp52A+OPrOg8X9YR84FDgAAAA=";

// node_modules/katex/dist/fonts/KaTeX_Main-Regular.woff2
var KaTeX_Main_Regular_default = "d09GMgABAAAAAGagAA4AAAAA0lgAAGZHAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmAAhlQIWgmcDBEICoLXJIKILwE2AiQDiHQLhD4ABCAFiHgHjkUMgTIbracHZF4Lnrsd2PH+Ms9+JELYOIBYG7aPRNiETSqb6P//vKQiY6bZTNMNFRBQ/blSCatQNSrOgpeJiUJlHLKRhjMn7i7ko8jo8gxzFR801TSw0i0Tat37bi+vKqaOBz+5uGKeanHTsl+X8UYhIVJBUVEKJwyTI2zsIvkh6xfj98GIibTjsk28o20/ozGZ+q9xI7q5M/7Ff/5jhriYoIYFajzorm4vUYsO8bviPnAGto38SU7e4WlO/91dcrn4SRwIEQLBQgQSpEDiEAIkkODFrIZVqFIqUKpUxNdV1nWV/dZ/dZW/Ma1uaydtZ+1+p4XguZ93v3L1vGhiI98Eh2UyhsYKnv/n/ts+5743Y1N/+vzFAg00DDhrpQkmmNFYJdT/vtM+O2ke2DNseG8R0IkfAHwukHT2z95l6cqxU44dwJYDbaYdLqAlLcI30KCb/SchWCgh4IWaUVGuR3s9E3+6v+3vusx/FFvfvH2oaLpEJvR2O98orrkqHEYgDRbjgnAYhyUA/vqmVr/sX/cuNwgMiYXmtWMZQugA90zbq9tTwlXnZRjdsXTHI8mJAmw5wLChAcMC8S3a1czbwX6Y8W9+/lr2DDEJ2ZNM0w1i8vX10JR0jVgN0X8xN/JK+oiptYl4qYhXjh7Jb3D+wXkTU3+sEw6nd/d2e2drW7fQljpUVEAKjLKpHi5AhgvtPSRsszYo+c9f1F/U6qrRmfsiRG77S4aSFxQHIqJac4m17YPaHJCyO89oyy3p6bkWwB8g8cfO0LJqBRART934F3hBDEETBBjoCtxN10wShPTvT369Lqtbs/hbWhRUbU6UbZSYtXWIQepnZ68dSv8v0YyPI8bKx9IRVH6V3/+Zara70AXyInUhh9en6lx0zkXpcvbPAIuZWYDALCBhF4xL6RlckM8ElroD9xIJQMzSpZggiEqg5KcjlSLlHEKVm9qlm9JFGVPvunVXhaJxa3v+fp/OzDn3p8oWyJq9yK2mCquyCl2BxAVKYN5797Ys/GQos0RRi2OV4mEsxoRJ/rZsdnm/UWqXSHQ3kq5buZPXjT2hzwh195fVd1FlySpt0ogIxZs5XP96jLlCs/Fj97yZKeEJJxwjsl/2YxnT+mV7+9fudFZR2AkkoP8a6FU9eQW4bEkxDwDOLj9BB+DPDgGwiN86tGcIzMPh+4CfOuD55Vnjfx2/EFkp9oYo/qkVM5AzwwwsfeEAgL7bAIDCuFKGoIKFQ9lo2sz+crlJH5RPjZm22mGvg4543weu8BkPecobexbXEvy3N/pF78/KCSaaiZma2UmmdoMqCsXAJrYwWbS9/cRXdtXTWHOd9NZu7deHOq+b+gSgGlWsylSlqs+UJYYjsOPMHQcucsjHTx1NjGEacxhgCevYxV6ucJWf+EXNVk/cJxwLJ8OH4WL4KTbECen79FP6M+bvuOxt9R++fQtQqDNG3rP24VGfyv+Xi57ylV7rZ/1qVry/4qnewIpc0bexzc1m8mvnfTqjc/IduXK6e48BiyNPB2+knan0M3/0MNvlS/LLJ8fUY1cdujaOS9+ll4nv6nn7Zfr26z9tjM6cfP/okZ0rlwxOacIv8932zDTMz//+Z3/7Nz/58Y8a7NmxafU2ue5aXXq42N/Py10ficHi/OYXzx588+CUkz5wwnHvOuSgA/bZa481Vlpu2FILLdBrsm5NaoxWKiRfHr1aGPPflv8yKJC/vHJyJHnhW4opUEnF6x8Za5PiP3nQvCKl8hsATWjz/wceBk9CipCUW6Ff3/T/XbP8i/Jd/l7j18zvNJcJTsPYgC9ngJ58oXD2MzCaY+0mzpFPr4ksnUvSLflM9p33BJcEyzLqABRGHRKCuWQ+JIJ48UNyQHvIjV9f0oYmEaMWNN5oKVeXibi9ABNKxCa1xMeLDlUqjMp8edfXpnZ04sLSXcQpop0ZzBpiHx8chAPrnIB6lHAK57QZEI1IjrdFS4cW/K7hzOLPrhZUjmdjChvBsxvNNn8FTHX5YpkHx3d0QQjGpab4xlBYfWpZk94Kqnu6rCsofW+BOfKPaSwRGgss18RIyTOUhrFo1lqCyJjgjOAoEGwvqc/9Tnoy6Zm9dMZkJlDwjJfMrE1G6MFrgGRzQYeiNiQPjEFsqV3qRK4HrFOlhIbzvqchGVKwN0LJ7SJmir0wXM3pD5sYUWLryXf84+ITOff6e/DSrZeJ40aI6y5tWhDzBi6cBWSOFq8uAw0pgjL7HUBulqSWsqqAYDlYIsrmhHmMYseaMoA2lXJ2hiVrUVZzITGmx1E+I4JOHhSOtecDR1I6BpKWADGgS7mO2GLWnIspWmsLEDgEpehTuWCxGDljaKM++qMeHmZpSAY55xKFAc3sUO2X6sZ68E689TxlaCiossEXXv2QDNYPMDV+7kCJbFUjq8hHnPlL0lGCrVIIZ1jyXEypc8ifLQqoQZKZGviyHQouRvaIaimLgmSO2whfttZh5+0oc68WCjC44zdOF2Gq1N2GZCPTol3JLINwUkDOFlbsFyK+M/OPy/3Ws46XPl9Zc80SUjy+SRg1Tg0SSjGLs/Jx4aAFAFNHhCSY+4QhXI+YjaUC2tgONFQxJlWlqkSJIp560xfAiFwVVSVAsgoTpsXqbvAnn3tosoWDAmwPgXAF4QkhKQ6+MALxSElAWiIykpCVvNiA0P8lheTLdhBUhA/JEpn7zb1Nx597tpoVf/m0HJbYupnrhOnxOmEXzGOeORYSjqIQSuJQFkZFPKoSUJOIUBLqktfaQB2w6OyN9BI0ch1qXJochUPtmBUMdVH1u/V3kjulB2AKb1qSluXEnr8Ac8ZLfbKyCm1sRNzU2OsUPkyMwxMzUhvYJ3+Rhgh4ibx6Ckusjw2VyDLHkrveAs43eHCtvJXlEgXb1DtlCNSY4o8RLGtkEtOobtafSYrbooAqSnvmCAXJpKFSJkExWRKf8o9betgJYd+NupmqXRzgxLWeTB2DwHl3tzC2N24XKwm5FlTYP8htBeocw5HMRFDBhSgUfMLowh7GlMyFk3CIl6/k3GnHK77pSJskRC5KxGQSda88Xlkc7ci7UgHM2Ap5plYrl3ByyOJIl1XGSAJ2iyiTtOysSTh5x9IJlZxhxJwJo1Jh0RkGb8lnbWUSRy08RrnTO5K2U+W3LTihgqIY5SOLSb38tO6sTtLsnwD0Cl4MzjXhwRCiUeEgJ6FCLd6pawZcAdwiLFjW49NnF+LEnNHu9RbTkA/O3wP5vhsWP+BkHbLPxfYCBBWJyM/cZVh3mxZQW1W6wepXM/ZeHLzp1p9ekr22xIeXwbH3eH4FnPGcW65j7Jk5bruHAit2JVangROfI5H4hcTElA09uT0qqFHJMvzBNRRSMz3klkP6X0yjODEpGcde1rLsfLzMesOJ9UUwdlLqjSyaZ70UuTGlDbg5Yh/3Ux1I8OpquTXsDGRrexsFwMskp7Ha4dSjD3b/As6GoMIkFyV1ZE0pCOjoMY73qPgQGEVNhN4B0BCHTBGyshIGuwOgI+518SMgkugZ4XcBDIxDoZhAkSgWJTKUqiStLMmRdwAsxKFShJyqhKHuANiIwy1cpKzN1iFlXbYeW59twDbknRFeZBw4PK5MPpjxCfGhqdXTjEQ1exgFEcwD2CIAlvPIgnLllmu3QxuW3XGb32EXAPsA9WFrOh7d8eSOZ3e85AzXALgFqO/Q9Hy459M9X+75zhk+ARDrjwF6yw0/4VP5ZDtTCnMdrlQ3gnjnzXQ5tlSSW1tfnK1LDYsBEOi/BQCArjZh+CmRvlqnfmTA8Y4eDuMEkD8wDhcGgqZ7h1glzEkWQMRxRZXFLOctNKqLfATUTSVSUvO8ZVXsWVCOQjQELJdJOFeb1kYI7/iQHWNPBFfuZU5lWaVyESLDqoJcjQGESMxzUKTWxOmQ594RaBnpUJ9Lvv2mf7AhuOlX71TCmFHfPyG7GokN3do2mJ9MzTs+psxOF+LjEl5r24OqafccSmnSU1R/QK+tSC57xkIQbC1frdVXnrpbQ9+tOsM8PbSO5ia944fFjqRJNl5gdXsQsrIy2mLJU5ql5YfmDye2OU9Dc22rPNvZv1/qL5OZzJt8oCc0aujZanChdPuqdnVIDSrRjsqyN25k0LLNsG4HLb+yMprW0kQ/SIy9hN8Zb24pytMjxik/CHx/aW2GUqqX70e7sXFg/qp/CwfV4fLTaDSZnxpGSc+1XS9eGMSb+roRCLHtRqZJpU5PyjFtizKaGVg1zfSJbuYz9XAUVZokUtR+N5dTVEokkiYeCYLT00q90+5IH6QwZxCdmKYruxVxVdVNECK7esL1GdOZVrAE2hErhM5CukEv80GuMdGFJDEEU8wEk1Ytx8481SV3omNWhmF1YxK7i1OXodSQdIVXsIuhJX0SHsXHiR9FeijB5ND3YNyNBAlmDQAOx71NSSEVxg8xj0HbB6+6iNzfjBLSMKc4FvqyFIy4F/WgsaxnUKF8ilCCw4KDiDOGFEsV344soB+aTEQAau1iHOI8LKNcX9dRAQdZcSNmZmsvm+VCbwPcoZUmXU0YH90ahGhQwNwE2EwaddAthS2V92zEai3jIFjDMKZdhkW0Ob01jjGDiyeQGzGaYfoiYKLsd5NOxzQy6gLmEAFwJzLi5VyjaSEVe4DhROn/kS6zYHHp4h8xdcjyQh0zWl1t2OU1Yl45ArTLjxm90aEWbzMB4p2O0eVLYVwA5oyIsyUbqepKg2umfVG9VsUhHNSmxIUueF5FzE6ajiKMHmVrxG+VqiarLTzolpFiOoBapu4EzBOI/IQpAzgH8M20IZv4DAZvODXPec6rqjt8OrN5CIdYIW6Dkop1CQQHzST9o0YTtk+sL+cD1l+WJOvp0p2E/JMOHMdtPSKiogQHQIQxarMC20y8mzmVa5sFYzFCHd5CwwpxkB2ZfJ4UMDdyt3ylQImbFCd1mRFnmaI36ImsS/FsPurFTipnM0lO5yCOlUrCbaUWQnA/3c0RxuKtyJEORvoMRf4Ywv8TkvisWjVHZLd1FVP34fN+QT0VrVoSWUgxX1NeI17ZWKcmAQ4Mzh0zzKCm5hEmcqSr4zS1cUZFsDTLrFJiJnEvytBu2FqRhtCUqzO/lPcF87OAaiKV28OgpJK1EuBgjiKUGMSxETn/RLJaeB0NQZswyq4H44TNO5hOTZh8pbYEjV3igzugmAyN77ClP5dXRFbcAYYkmM3EpAYd7uB3REyqqX0gmGCguabXUKzKmGAxMoyO10XPruRd2KYDOFTFpRM1bUxJkhyG7QJJ5DgnTn0hFAszbCnXiN8BOqTMEYnPykPvqDd6o1I02ReJt/TsQRTF8EzNHI6DYYJYqroUxQphsNhaGzN6gBQXjxKvjdaBKtbGmXIxMTE22GdxGZwo0FSWJOpEOVKlbQVLpWqoj2qkxBMcRaiC2y0H4O9YnA+KQSYtENllukHCMxGhCYVvNkKeMayKtNBpnydT7C8M9iG7lQ3ACNDhELeMnfsDhQpBA2VYGjlWxl4ELUEAfWjk8WqHfMa1cGEXkshKEu+e4xR9L4vHrxI/vHsdoCQ8Fg+7nm2VLE2sx61LgnjSmSS1kYO4GGD5HH5IvYeRmXpXL5w2tH8dXy2J9bZ8msZzdnph3XciohVykJmn4lthUP+OlqeN1tz7tFmcpS9whf4n/nu6XTMGTX4XMY/K1lNTGSDmafyjDA/W1XYqG3lQHMNsfhVlS0j7qb30k8iyjmDWQ5Zb1QuYYcrFWBkOQjNPzrAclBWJiwFAF/oWZmt6/FTYWuxyp9h6T4kkEu1gEDlUqYri/BCli9zw6I3+E1wda6v1JpmFrT3Wsv7+gG2aMvqGtgjgkC7uAL2gXeoijB5Muriof8uoX/8obGysD7zDLrfs1hURSxo8MugUMZkMi9MlHsVOo5fal9qTwh0lKGTZZsJecdvLoqBBIs3JUTXAk6ZiWbKMGUYeElJLFX/GHo/xWeYbO8Ifj0qWWuTCmZxgyhTR5iKrTEVBoY/YGzL2XIYn1aLbkysxYEOhMsKGnhYi0/u3bQ+KllewRt9Pw7CJru/hKCrbS1XLgt7eFob1oOKqWzsZiIRqYvZQ5c5eOgKd/PrKlcs27QsneL39B/sPr9pq5aF9jVtrNBPSBY9zxFqumPh+4l253SApUALnbplUWNXWRcvAfBqlDDRywEGt87abpiO64HfXU0e5Q3dZY/2GGBrf/PKyuWjZ+JPx73REbsNu2+TAE2xF/4/3QcTxkdsQE5Nxbi+FIGH0YkJUTpdiZ6xLwulcmUyCxrAkDBfpYNeq7vd0yhKocuvfOyUAOI4Zmi0PQcuo2ixw2MtKB7uslTYfRiyjt3fQOMSs5vtIhegNcdA2MQv0fcse483xKeCkmIC0bNLb4uP+RrZdhfP5JHExQLqY+Vv0KbkqYTpQt3lMUT/cewTHfkNJit+jdBoGWse1hLrU6LdPvtVzwZh7rait5bPv6G0cWdhFt2U6ajnin/JMDVVPIksJpLBKdSKmHa5VU9kDfb35mrUJa7vrceUcCfCJHvs5h2hm2bhydjFM+GT9HA5cr6NwuYLW2nmeI20dWwKzKiovTCXoYnPEr5Uq3lLcgqwGgllRL5uBclHHt4iHenUmq5Q2SgJzajkqkwtUIzWGqLwC0k08UgH42kabCFG21KKxPyZhVbkkbTa+NaRxVY1SDFfndCJI8KCD4wuPha2CJqNEsMSEmmcczD0jAa9TvwqgOjUb1FlOo+AuNeYOHWDrabT8tSwnNEhSYsz6QFpWVNPJENU4KBCSwMgGSgoFYwRnPxBpmQt6UDI2shtmRb3R1BVMDsj60JJes7+/C3kTgK6ILHa+ZrQqA2l2Y0wiLx++5laQ0kGlINC/m6ODUPcQ1C3MyUIH/dpIT6rbQwnSS37FpDar0OsUVCg6an3rj7F3owSDPQmFybsWqm+acXiT24iovXcx1HmvWt6VMHBoa8ZE668BPJygaRH9huUC+uxA+/P0PdTfhyBxtfCfNWGgpkzR3jdjeHqK7wc4Yz5iELNziyftuLk7pMtdzbMfsJRYEv3rcMvkYfMEYE31S1VBx0I7JI5dKDz51D4202QU0g1EylkPhoKXLABN/f1AmhpMMbx4owneY5LAPjb+CyKikfg1odqeoLb30a+aHBVqwPQvfI4UqEG4ZY/QUEi/vxf+CBGlFdMVyArHAUOekslyGhzBPOZTOwBULkVJCBjZaJJKV/CJ1zDRi2gYk/aBH9UmM+G7kKyBJLFvsoqCZbdmW7cQk0h7mTbZ5OH8DxeLEsxRhsJaMUp8LPNPAkrmPwL9jNnlUowOkeoN4pFBgOVIgieq0khH1yF8gMKDtrGODq1sgxVnxU5ZVNPBiulHYQYQe1RFi2Xtm0MaVrWQ4S3i12rtBxE9IUY1fxR+hlZNtLsff8Wpn4AdKbYUOvC+8QMVUiANIh4lmpYu27PuRL+LvHcUp06zUou0fMQTSIVIqG0T02XJiHg3IxPTBwILtdOtggRVtjaiaUwOkHK6YTwPOTj42yy2ygBQySJ2H1C77ofecIm3OOgk8eN+lvTNYB7xkPbkHLb6bAuiEldjQcCxcs3PAPMQyUYBgTqptv1jxhwSDDzchDlsOBAZqxFjqYFyji7UYAcVdYBMYM8EzuOyjdo+E9IFLBiY7v7gk8fNl9NSRMk2TwiP4uYxiikEUR1T++pxI16zq+wKjsq6m82Ke4lM2bZntB3c0Vftsg9//VXJjZNriaJ4Tz3TM1wF4mr8UDaS7GhmQ+xPZflyYz1jaadPN12lztCB9qHbrm5SUzItZvFEK2KNg6lsCXRj18w3VD0nGKT1pOseXg2mrc1nw3RLyO55nlRs4iOPA5UJCw7iUf/8Lk9xMj7a9EtfuARZairBoBW6l8Xfyi5iO4QqIdUbsfm4N/Zq2EEEgxgkdBhYftPwnG0xeX4XgWM7ewm+iWkeyYOxy6Hr/rkCc4RisS/keRbJYuPlG0jLVRGGk/CVsNA/SOCaQqbNhG9tiAnVzDpkr2AjxZWV3MrwlK7TmztT7x2pHPXaslnxIAJTEMRDJBwpSXQ3LFXsy4YypTlloItlHqJCsYRUVd9WET+H0A9ODUFe3xGSStFNfPGsZxJhV2btTwnRtHrRbe7f0gtp0Q+93NGEjI7L8rv97nPC8CiJIAmJ1kg29qMhKx72wl4VV2xPV/obOwZ+buBWd7EoKbyTW+gteR64VM8odek6CYgK00SxTT7ZSQmjePqyg99YKATFJNGC1cjgSRWDZVmeC6yAcRMgNFEVf1XVqnLe7kdWKhvKRrhlhgXPICOz+Uho82CZVqWCH0dUwAIDj2RfdzCzMKyY62d5JUVUOVKRLmEPk982lz2EFSAmV6xox3xG7RTPtugqfMOjg5g5SO9l4zbxTIgtZnlIp0xpED3ALJG3aUm1UMvhvTJr4bxLEa/QHG7ilbZpoujQLQ5zSB8zalgWruzEsV+/7Eoh1QrnMThmCd4esVVgWkXEQgY4hE5qaAvBcrPTpMQkPeuF3Oe5K8dLQ1f6uY0VrxhKEmgkGPakSzxEM8SScrUovQMI+WBkkmCOmmxvESE0zYi9GUTAwdot169Wj9NIwuARMfhDkZyiPGH2zKCxsYO40xoiatYhqG2L+lCLyfVp8QGmIzEf9zuNI/hEXeHtET/3q8lD/SwEZyi0SEHNH42uEa+jvUfIXhtyW83fDAgD5psVLI7SET+pMNGqFShUHnwNn4oPmZO8xa7y012bbxYdYU+X4je+TVeBgdkYbTBNd0tOWQ+JDqVWqpbIWAm/xiTYr9tey97yJ7/MQMSoa+wxJ/KN++HArub+IZxAX8rda+5d5e2oIG0h2EGNgGRwJADXxJo99qqiGIf0Avq4XaFcDcPqIhgFg/xwajBMUzp5nnkWi8Zgk24gJemkr6Pl7KDmoRZceorP4No3WjCIJDYIxk2iRXsp88eWXe26uPcPuuW9j3SzHnG31kUtkVEoBuLCDAeaE4Rarx7mOU4QxXL6I8Ds9Ua1ZoIzLJsMb8mRItKWCSFmUxvBoxXioxt1mmgmoErXYjAIRKdNPaXrDcMOWU0tOIZcYvupP+AEdmymE9QzqYGYFkpfIDCHNQd2P5gp5uKVHHO1vGQVEXwp3CWSpddRWTJq4G0CRei5+Nf0JS4m68yMl6vfRLupPWuIYwEhtQ/sQuR9toCnhkcz5BzexwFTNpHhrvsLijJ8HvAxF6EG4hiHvbj0aXhOScMltkpdEL+iVrElRjVdlYSinMCGJKgqL1NNPtiuUpfa1ujpe1E5ygXYoPZM3ZKD+mBazKxsKIAcF48i8Uo0oN5hyGoI3Zgqp5MrCNOn1RglSczK8OevY14vKiF2eY/4yBFgnpgM3KNh/yITa8FZ7gRiaIk3+jb55FqO9EuZ49SH3KsW0nE1ekZXtwUErisaCblyMXT05ElmoCgAFN9MjN+QET2CXAM8WeFlp8yj9pJBjpPYYSP6n7CuWmI4CQt/DFCnE5FfO1JeeJk05+4MBqySWw49Aj4TOtvmE4QW8AOpyZPSiCyGJdRlid70TGKDraQ577RZJMU3Yg3S0QEQxKK9vZkP/jR18KMngtiHaUmHvAxiwnOpS9lb8cgF/AtdNpICrOXwd0pWIylNNbmj8bRc2kIHwgPzSnbjPyIsJ3QzsasWGntu6uyx5fJsdf6fJRZVbt/ilIN4buTWukK3sGB3FErOBuJhqGGxZXtvpfQ2P3L1cuVI4ZxQ7VFk9xDyWUfh0Ewm5BxUp9lp6oxxFvAaZtWBDFCmnZAPTlHJCRU+EuY0V+76I5CFPoVvo/YVE7pGh9/U2vQffJitMG7XWVCpGzTqL74Y2Zo+CQxesjTp0dImANeydpCMzfA7wlJxcRCfVQuZPjQKmcb0iFSz/smm6BR8WtpDTzBwqqiVPotvAilzxhfafadqFWLjjKMuqtd3LasRZRMAv1Qchdihs3cVTckLniZVCASk00oZNLrQAwzz/i0AgUklfRpA72NC5rriaY0D5D2Pr1oI6GEl7gxZODlsbLGM5DsEIr44z0Jdfz66Strup32o04u5pRN+JsNuQXLKo3RFVoh3YxHRuFyCnT/vNCJLZipbIgCBqFQNbFgsvJb2WMyssEyA3ngrjQyc8lVmrks0wJBzUfYEbMziTkUHTUcNIjCLpGLmeio3CLNidEOGJEDZDGxUFSWP0rNpEGOXFl9+OpP+AdyPJWJ6vWQG8oX9veM3loA/jEL6EuEE0C+i37YBuTSLOyDo19PVKuL8KcLwQB+pKXXpe7HQbwA2hrWY9UfEXT3WLDCIFGAL9vO5B0GnZBfVjLgVeNNo0JIVndhrKoVQA4aGGSgVGWjfVC6ODkQc8wPGrlYcHH0ZoGws0zRrWlBTPwo7Pr7ofcPTdp+wtrodPXzYy8L1Y3oAxIVzeM9LUfNwjE6eXDr0Gt9DDFxw28X3kunF7pa1g6GVa/4obLpHrPtCUKgB4+RGJv43vdQIpvhAeNcH5UrmRr5XRQ5KxYZs8iFQXKiTCsVLiHd8K/GRbOi9uAdCpqgnM7dZSBUtQEED4U1Xs8Wpog2pJZtoot1sgyEdiCKaAeq57dw7hoviYRUjZJFRbdsmG5HDVlkNlWCkc78NIhXMMmRyw+gOJAqZwULetbQ3bvBNcFESt6trW7200IlnlWcUsmpV3n+zpQAwo5Fu6VWzXE5IJZI4o70+SASp+5s6Um2+cUR8A6MUAcS0imQXIF+yGkwNYhWlM4eYN0uAkkI4V/0plKbT43OaQpaZ8xpi/VuMS82rCR89w+kiM3L9al3Priyb+zMkRtMPJoszVtBNOqmX5aEv5JfTLU+AsMNEgEWF474/AhynwjK6yY+obsmu1lAmxxCcfcB3Dww1bYB/VkUcxrTjjOT/DeNUBVLxuYxneUZzHOHsAylZlpLG6dYDJHO5ZC6dE0dTBWMok0H/24egp8TMqAOZDN0a61I8V0r3NTcpTg96uyREgJcURe/Z3OA9mYcgxkpe9NSTPmKYpmGmzENKHEVlILFsKtstssm9ny3voZndFIz0bKyRarBkaBC+8+0grxvMdkuYTcjvGbrsiwwUJL8v3zMWAHGuBqAezBy77nciMxhQJ9lGy7O1v9pjXI+0WIz4QDHdJYNn8eY028WKfEqvYF5RhnnImAClp71vaMm/JCQNS6SLOaG4nnwRFeIcXSjk55V/i1Riiw5tpx8FdWAKSiFMpkgdHQHbcjNiqpRP4eWKVkfRcdeNn/N3wXLSyYWpRbYhAI9jzzq+pyfKbiUm7vpgLwD0O89FYpKz5LYYnWZKya+G/xsplkDXD5UR4LXGpFm9P2lRH+LgpWiAXI11aFMBx3rMcA4Y3kOj9Gyj6TLxzTxDu4exHiWwnPzJ+pAxY0YPt4WkOLvn1IMbvHYNL9qd4F9wZ5z52rn9eaxu9qLRbXaoUWSsfiNkewdvdDLd4hIwsv/HK3ckZdenmSsAhEY+ACtkZcuD1h+C6mU8KSo89kgGzao127otwycUydWbOqHdYcZtWwqq6iNdUHi49aHYCALZ2ULOsU/NZ+bpZl8B35puZaxjxYtuH8thXDHMadVSEi9A/ziF67PMbMsEy7DGaZgbGhMLY+1cMk+JMoSDdb7Z6ag+vReiBi03V7pJK/BrYVSHYUr0mK0+A2FIispQ+bB16tOphnm9xTzdDKbY1lYHu1XGVLNIeEt3MovHUyps5Bn02tRq1cH9gXLOz65X7E2GktnxQ3yamSt3ZDn/4hTbM6S2Xj8p0xur1uqYWBhp53bH9I6Ty9HuPCwE+7iIuhN8ugj/nf96WxNkDhB6CVbwYsCSxuslIGdIEy0BrQcNaXkluoQc0VIJTKuqGfDKic+mM3jhraQ42bOxjjoaH0K+Jl9k+VxO78YZRc8ztyyZzegBNmpAhZZUKD1Z+kKrXiM8bWjkvrHLn4eHQPI9RAtZg/51dy64pXfViA9tuAqvA/tjcwO13ZtyqyOSH7ZrL/lVsTCBrp1wUmkIBGSNEEPEeqwd8qZJAGy6+xYHDa/JM8ZI5YC1EFzHIRQyEkp0G3ATfe3X79ETWd14JDAb6rizrNnKVgyj8QnIKKPfgCbrvFb5WjcK0aowelLDCmcldY6sB0qNLnRXor8Wwf1a7LAbUSYSfE26AGW1tKMCkzjUc9c0NVKPDlVZjjpf9DNMabvN4Jgz+7rreglxu79ihSsUdoJitS1d4rFnwC3jaBsteU8gT/x9rThq7K0atxyF7OWH7LQ2YUuMiC/UU9UbfiuJyEOkDm+9NDTiOSYqF1fiRB72t5K5W3fk61uML/YIBjnWdsa+ekObiwlAWH/Hsp/cNsLLyIfuP8mEYhXnfxY+Isu5bVP9AVGTPWCDsiVhf0lq4c5CDTN9qnP69NTpOzyup7AP9/cnIuJeavdqWOXu9r9jqLgL70SfbZdcMAoGd2pHLEb16FbxS0ncB7dr2g6mHBYRlGddCkM8s3lXDTWpfEwbD8hSNJOvRWOjdSSRpDEbZMuWkwrmn1Tyo8biEl4A+EUiNs5yoOWiklk6h1UbvFNP+jkTqRloCkvfC/eJ2arAE7g7jCbTWXyxu3w3pAC0QSwvexAEwyXJRMExvBaKEXoF2nWVRoAR9XDScNRq3fGjDLxuDXwADucge0PxtMNYTJJuAOcf0z1YnMn97HD689hGMDwAadxB2Zjofd5vBNF8rYKept1qqhDPEYxC62VlnEMHAZy30lnKzrlC3MlWQmCFxegYgg+nNo/pflqE7YqLGHAEUBLRAE5IR4yZ89rC1suSlXKqcAKGtei2IC6QZLImrp5rf2TKDmpP/IlvNa1l3z11Gk+sijuGd1jtM/DgGdoXloS+O0qTuI0QlNxI8tg/2DuHiBNCAf9e9bZ0/GSK77ozbP2A+4neq/tfcLb7T55dUKt4GGFDv35wbxSMaIc+CsCJAfuoVHIWt3Ct+KRTkDDSMO+hcSzreIInjUKfgEHFvNPDZ6Rr/C7FzquBAYf+6RGETduTlkLx3qd1+VGxMibMbTdAvKbOOJOXw8m+bTLGaw/0ykU+rXTRh9AYsbn6F3iju86xT3zhMBQPhwADU9Jfo4kR4iKPshoDmTTW8jtuk0z21k+AAwjyqp0cuHIorgh12/gE+Hl8Lrdoye2xYndK/1W/704t5AjxskXDJGx247xseLf5TiiP7pw4ZMVT2Ty2SZJn1TzbZpXPpfzhKwSD7xvuEjhwVd4XiAXizj0zLxVk5xaG4TQxmuOeRFwx08kn3Lm+spkXPpX8erJJK21ULmR/E+qUjgvn0JZ7D1BJdt2crcWMHpM0uz1btOHjUEF7r2yl1UwjyyWOBHyYLQDkUBQRqp59VPBwiAg58F+JCl8zdqzwnoGMNTsuk1jSSXKvZ+0Wd0FpzhQYBz+ImKsV1PlpUjm6OldgcrE4+gg65q0WdRhOHpl8fUTBGQ4jWUiqP7m8VITY/zfvbeMd9n4lguQer62dCgcceTYJX1TR8gYmeWvv23Ic7v2epPe0Lvv7wG+TSdFgHV8f3UV6giVXJKMH08nu/6LduMWcC8I1lIccpjZ4w4nGo5TpasfbeAqqCuX9CFYsqu8EGHBvztu3ZBDHOSfg/8dM/pMgRq5HYUqXMCcIvX6TQ5x0irC5Nz0G/8XUBlD4DdtZrYrgmFpTgNd+WGbGQO2khmqD3i5rZO7ZyCWX5bJJoKrhYzlxGFANyotgS/pshl2Mtt/+Cfw772O0LQxx7+qcVT64PCTcjUkbXkI+/eFT65+kP1uwzJKHLTh/b1a1XygAe7JQCG4PRoWNQA7jQSWVdB/H+qo1FCvooEXmIDozehTZLUVZGsS4HNrEsQr+ix4dwhCjYlMHuIBEVobGR9u2Cd+uY6LjNpVKtXCkE3VZlcMTVQFdCnf71AhRIXS8rJQsGtXaO/iGtlbeqmYiqmyMlGMlYJMLC1Lc0IyDNg6l1zF7mNMiUbomgQPcsjISU9GiCyAM61Wv5tq8idc+mNnSR+xtCAN8QocPOk0mnrvON2Mx/I84pK7EVOPWW20IivyEXtUce87drTzqs0wz+FcCZgD8xPcFa8dQ/ICHLEdx1YLm8RsZfItllqXFxfF2SVpKCh+A561ve9BnylYUvMYeqQmXgc4bFPqzAL4zX4BzdEO23+Ab9hPCbQom4UpPOc6V1Ih/Kd6afdjwqcyo8hw1rCYi2X8x86G2Q7oFATdAOvkvrUv5sLpfcbOruS0VhAyBnw7apbjBWG2glWt8lLYQkzvdSMn+XRr/FjXoN2maqyiT4ltkzFn95p0nTXR70QfP2+BJOsemrHV+LDmj8lQXi2/RHHbt4cdOjH5SztMj53MOFlyl1jdRV05UH3302URPjfqaPesWoehJtmVp7nLG3L7lajVfK6+0ECKQv5eLGJtBl0Wz4jhCpvsN3NYPZLT9H4Eo5Vjgc6zkQ5byX2eemFXwa3gFbpOjmB9oKfrxavT/egbswTe/Za5emUaYL3xKqcQqYsScgcUEKYZjzmQJZv8bFnXoKhXLEPLCk7CcqTQ1etpqQ8o4EIuSqmRSWBbV9DYx83jqzZfXmoaHWSq4I7/FbtSuT0nlkATq19KgD7dXtIyFXmWwC6MR6OhTLmdlUXUNlSfwQT1dRavY3Ke/iTiuMbiFUbBMh6rj6AiX/+rMTavurldf0KHD8evfNNi2U6KHYhS5cveiXqiHbLMVpVRscVp8Vmbl7xWlsE6nOxfgXD+lJWjGy5T4pVj0QKyHwx2lLP2fT4aGFybVpHhy2+buYyFJOh06mih/kUTS7Ffi7lrzJsG06IQvtDG6DYoADqf39iPQ3LmnRuXUGp2srL7z8WWtHnOkptA8vTB3QusResxLd1aI40+vreKl5hIeQq2wIswPmQoTvcfEwA5gKAl/6Wnb1LEHas102CIURXheskkopjRnJ3FsJkJAo1Qv6+pv/1aYO771CGpqbi8t70Gc4Yi5zWutDs/uwgC7+E9BfR33QkV0Y1WxaTCF34/Fek1yeJcr52Z0bfOs271W58QkjKiX0nVMsr3oAqrj59NWgOnflXumfd4KCLzpk7joHjWmZXoLvNYi2Dfqg70F2WW+tkpbwqp2f+HmTgVDXaXLE7mzphSVrIYxhKdYdOf/2RZfgvV+D/yysP0/L4bBzR7WxECRjDK59Yuk7B2ZqO9nJsltsh27LN3U8MbEja01TXIVlxNCaPvX7+hYv2M/mvFcT6dzBHadFl6fuCmTw2nAwIb1W3veL7ANAEMb1vLdfN5ebbd5bpZqDS6q+GSXoaMIcFexDFyens1dVfNiRLHrkwoRvmbAVqYd2cujaq5DqHdqZil4/KTb/69bhFqey0biV4NVG5nc8XFxzyTP4uLGycbFxaP5KiMii04yUJHcsnfv05C3atqBB/QKDmS/zJOhrKO5rFx0oUwtEb2bfPF/pm0CmRFd/XUut+M0ShceO51bzsJOYSzhxQ/RmhyLvy63bl9sVNHwhrjAyfKV8d3JrXGBDaMlU0DW7eDDEr4N8qPAJqoVIq6/Q+/Exb4T+htxCWtFwIZCfr4N2wovWQRzdLJ0uONPOlx0t4/SUcVwl/QmKWiKB/EvjUqZDh13MPw3Wc7YZl9JRxXHS/DTVSeDOVl/78kDm1bqi9PXIlok7H2kmxKQUFHV2ClP7RU+u7MsK91EmaNguvRriRRGZ34U9jgsrdy3m5/92qbgxBIZOVUNNiveea64KiM5OTTQ5bI3WeQrU+2ycFOYeDhYV+W2vAecgpq33x4sU5JcTggO//h4YkmmTZMvM1YY1qrVCr1hm0gC0I/udU+5x9RFbl3RaYGSjYhu9dO1z3CCIkM3q3RVpliucxKI0B25V/CFbyzA2j+RAKk4UsiI+unzOM+PUZUtO5ZFF8Q4zPVsQkgdkIMAOxUlYKFV6vRYw7rpGMn1106PnDd8cPEoKmjHgxMLK2fOGZ19NP7j8Znhb9GeslCX+0eddQEyfaFbpwpllHaFRZJixynqoPc3CfWkkgi+N29s3jZHQig73Z1plt7S35Amws+OJWiawbjyI5v+UJp2fdNrwfG0Xsx8DeK389thgYDGuu9F5vTGOKq+KcogTX7mQCpw8zhMpv4ZKTkXwU/jzc8fyM4uezD60DxDQ3E6DiFa9EABP9mVFv93VdBscTa4T9BJkZhny0vCGyB8IuHNKA9M6iqfllY+xyQW8/L8KcUz/ns0ftrkWlmKab4iPtW5cxWYGapgaDJCvrRYu5LFjIhXTPbqP6PN6zn+XXov62CNMA/WQ5/p21RU3V9QyxDDo3V4/RbnRYkjOV2eGzJ5UAMh7PQTicG4koWLMmpj6rPM2b70jhTxjcbXw2T0ftdNr9Pj4kVHvDvpoKqg0zcOG0oJ9l7E21n3P4+DVDIss3WGm7j+mkE0kkIO/nczXR0JqfTh2HESXcLTLFjiWOpsZLF7RhE8xhIUawKBaMXgjnzxv03oOWPRZjzlsj/NBFmvjvFfTQeNqmga9+mMEawY8BahjOGKpY4lhQWNhHIwcgAlSLomOezl/xMnJA9Yv5cko3Mg3XNxztG2SzBOp82LKXguz24bbacqPdHhYQYFG4+CEtg/pZbfJjdHcRN36FPzVAr9UKw4c/dZ743sbpUecwsdv6ldwwAB4PTYWOWN3blj8wsciTkluJ8qMxdpJFJcj3F7lvq6SP7q8vm1qtyk6vL4M5mjzvg01atbTLdERdOnhPgmZebSSLQ+Y12wNVc2JX5mvkOZp2kaZtcylcuPXJnJ7iB8NX+z1giTt2znsxRfpLQ5ipVUEvtoJqP8ZjkDe0vWlR9l6Pge2Ay3JDcbQQzO1KeAs2lit8a0Ty/XMZ90zH7C0nHdJCz2iN3fp6ejdHVVrYiuW1MRXlKTblhlXA01NWP949ap+5S6a1fB+TJqWf2pcFMgaOMvdzEa82/QSbH4el2xk3n+EzCiU/ap1027mJTsWANJa6NqZfC5aPWMGcXFYFhRFxhncEoFaRmFPzSCxgULIYoMVhvihO8Yc1krQIhPKx+zICi8EqVZNUG4dg8xDVMpmXjvur0TRK8p+DAiGc7hBG+M7DRBfoQRkoRUIRYWyJ/cFR3Z6nIVFOzp1bh+6HJ4cse0st05FCOEztZ6uPtBR7BOMHcXdxylo7jjF28dQ5y/Cq7p6sKyYDGQA5Gew5TIYMlwZ6nNS43Ktx5tip8+8Qw2qx3i5WYUjdvN7aZpaTDBHm13BmjL0hs7+2Khqb1mK/jmRKpUoJVoBdLUE99YgXn+AISogjpTxZ3V1gTuxwtTIUSLwNE0EslVGUA7XSfxUWcFPvyunR9cWaOPD6oQaPas5GXFyE5CiPMqJHYixcuS+8Csya8Ob9WE6TjLF81SsWG+dD+Hdw2yrCz2zz/DmI7HihpDtTSHENrn1eBG0l9v05orNM7joY3efI9vQpI7djjWmPxnx68ZMh06a22x4X9h1bfP0QZ6p0a8qqs2tDmqBN/18SMGwED2kUZzfsV+ZetEMduPekixiPQc3R4j0rGLDUXiHxrQssNhRrnktkNBvFMs4fVfbcuBIo1sn0qaomOrZBijXEVmhus4RctYHSKAw5gOZ8fOgH5gbJ4Q8KCzkTJP5jQaK9Kk/Q8gkcSMQxvB+uHFw0soUix6H66FaDoW3IUdZmD+wxCq43mRY84jB+Avcso2fypdJtRh8KNHAj1zqp2tw3QyVPNu/uSSfsf9tTe+qqlWT906PFXVM4zsW0lydGGarYdfTQZiCYyogm7Pqq2WfFYOXauGBQI6KQYknZBaa85Hob3N6LyjgUKPC+5FFN51Gtvaad3s1ze/frXI8721FPxdmzlFkfJ9KwlVuHMA91gOQuiYF5pbL2A6woG80KBbhaNoy7PCdLdV+P4/g9OPup1qO8zeC0Y2NF9gosFBj4IYrdLE46tCS/M8NAB39sqB3g2uufi/IVlDG752K9mREzcQaPu6xptZg/UR48o9/nu2AK+b+Fc6O1pry3W2M715af9rDmDZIr+Dm20r3ZOWJ1iLpeDH2ulztT76pHKOXSwSij+oKXoebATVUyaT93WiVL6qfZSM00dCd6LVixd78v12utmWm3QBmyMcOv+/NUqMO8EewvBKrSe4E13Fy5Zdhq55zidGi5QcJr0R8iTX7gtQsYMnv/iRP7xhdrnGpiFa7XsrT/S6gtuXJhenBMs5tVxbFVdoK910qT3USYNhODqYLTxECTcIlfv2Iqzt2awBvLK8exKoFMNXVdVJ3CIaOzVYvBy34riqyxOD2xBqGtJgoxu4dO5+Uwy7mcvpYUXFDb2WraSL2mRgWnBo/pphG7DPAf2ejM6cVTyfW+5vKNGU8/3QuWj13LnpeR7OfrBPq8DKnoQY5V2NNTHXntrjE9zxq6LAirxGx6jM0SPd2kLoe1WB+91k9RH8fH8RItkpCnxGsbYwOtluT1FJflpZTLlJ27ycVk9ReUcOb1jWbktz4snVEgjHGKGJkyEBiapPQcRDGG1AX78/aVGEQmsX0SqcqWHi7VpIKJgKG81yHdfutnN1crMRnioQQtrt4rCkZbvn/slopxBUOyoMfuNRKmaNum4lfj2V73/XfPNMoNUwL9yZPy+uyJPAbAME4YXTOkK2/0xIE07HwD20c8x+gTVCx7w3fkoRWye8s8+IwMd+hPbfZlArv39sBdeXbP/dyPCWQY9qgKYThxFCA6GG/gNka/5RVMf9NTRZE11nqIknnAQZTWz4DtTk/5Z6jDILQAq4NlldvvV/0YSOORya9Jit4+r+vxyl5f3gfZ51wXoTFuaE1t8J12H32nvtLB3XQ67+bPERAUz91c/WobwLPfVHMR1RBv+esvk3CD4iVMnNPIGO+WTC9CK2jk6sFyCTTsFQy1ao4uajJ5iOeUBGACZVrlZbs97nzWzVlOO1kWXT6iV0SRiIpzMnR0Vselr01NYAAwbvdQDToeivfTPjYiZbp0a1tjcfbHlHdV8vFIyJXzv6+mVA/qyDg0tDS/Jm5fdDJDPif0wdc1u9y8DQ8YuQg6B6S+W61jYq5t6TJJEOdZ5ism6EfRLi8gHZHSDC08pAnxVzWK5WoDlMLQbxaQj2y89AGcXlUWcSTsZAy87l0bwulscigAXoxD++W6CtW1unRS1fUBS73Cy8+CGDeRJLZHUSFV7WLmjxVx364fS9k2dPg0tabhlq8sdf39M8kbh9a50JzdL8pkGH9LqHIl7n9fyIVHttxk/5cF09yBnN446ujI/SxjBEC18ppfWtNJXAhNmSA/H/66KSmpvlDnkbnSdS1SwTahxYdYRoxbZ0CMEHMY1nh1T1j1q7tF+ECffTVrBgZM1aSKkaV0Q+cXOrp5RRkRx/1/hQfnvzMDk2B8rRC+ISEdVYiBSLzZIuhntd6S/uh88vklbX1IlHrd73CrAuQ8J9kfilE+pbITbdfjm+6OUilzR25RtxMZcXQqgBg6fSeKXeSE2iJ6PM/NYJPib0Mzpb6NDyxGi8DsutN8LqsRCpg1cy9QzLpKW57uoRbhkjrG7a7BLvsubWxcuiN/iR01C8AHdlTVj7KEn9WpGCbX7FaJbxvSnq3LL426Z340JcAYumVRfZR1Fzh8oDscc0VWNmFjD1rMrq9oANG2sV1d9J5meXMT7CCHJc/b13OynuH6Pt2zw6jx3Ypb8HHFcgQFf+oRKf1p0Wk0La7PPdrZuKgdc+QTd263bI0rlia6QOzVl7Ok36QIabcEV+hBuCIL21O7sHJkhMH7tb56zVx+8g1cvmgUfFoKcDp6rFFCm8NyO9oOij+3eE/NjnLxm7slJ0V05b4nYX5GmSTCffnWYW6xQd3iSn4ow9Ylle0nejq1tMEY7LqU1CtnbSJDelVFCe+c0Crool209fwYIQT6a3aBq7A53bB82IY+M67MKVC5gOx1JwaBDMZ0x4rkgkVEFITZfwlUwhA21FBj07jBkeDUwZYZpiYLMoIBufF+3f+El8PjwvaEtZMDI99+PDYh22fXQlSViLpavTuk3sjmPAthQqeEFfx4JoMPiSF69gYFRqokMXK76veymWdn+Mcvo3M3LCNtJN63GBWByAL9Rn4Nvjx1PKMNJO1zEvtDNqOYplEF3HddKe5mbRoJkftN5LjGTr0KN59RcwHaOTYJijRi+ATn61OjXd8Nrtl7YPan26YawdnZ84bD99OQtGMjKFBVnVUX7XW8sO0ZZ9cGqjIZDia6iFhTmCGaok5wxbl8Pm9WS0zvfHA4bjBZHALRZr0tCFsMdq0PXQz5ewTyq7+/3MX5ilb129BoH3P2VVPzVFyJu85OgpFHpAKj8wjeUndDUxf+dO3aGwuW9iwkPe+lyUMSfdyBcNu7ije0upSKbVN/rK5wpnxqRQKdTrwAwplJCYIlF500EEtP4aGx7uMVl/0no8cYLSBldm2x491qM/nZ9anrHw/0OuMbkrouW1ds78Uuj33zVyBeASQZVwMKLMwUYOw0e09nNuu6X9QIDg+518RS4+ecmyu5L+Fx2e3qARfRV3Q0RMpSDC9f9JE+mlMWg4N4JOovQEDjCTH1unnK2u9ojR+UtNdIau21Bl41ID7322IO8F4aSTnqDHN+rYpMFQcB/GCBVaaQacx3XET5SrsuoKIohf1yBPp6bZ5O8g7O5FXINB++DZ/OvzmCM7NxQeQheV8rUfDOgGloHpoHpEncB0M6LVWrXOsccWb/7Tji5eUKhh2jc+dLi8eqGOgxN0LxEVrt3A9EN8Q4IB56tOj9Gj742V8vCvD9fytmiV1aVbgYLZYCzTs8XIFovRwCFbfFRaJ13H7hJQ/QFBjoDKWdhKS3t2pEOiQ5eX1jzBdLzaRJpxjnGOvCBjC4avwGk69GKfHsfK3wq0k2J7UeKCAdMxLhQ5i+g6FNqKPP1zot9CUmaQNJA4L/hstZukLLO72l9tFenQ7YEKwJfOAB+KnxU/AzlELFQ1+ReoB3GBDl3urbrH0KHXngS921Edz00DphdfpuWn+4lBEr0brmMYHAkpAUyXzEaySifP3oaYmfj7uEFP1zEulPj60YZZ/vw0NLPtMvkqM2gtJV5mEPufcSVVJFOHsCtQyD8ejAqozRj7JxYsFqNJtrgzQt4fOwyGBi7/ky8tKpbnfe+p8YlMvo6xPVQNYzpmEtH4FkrsjO9k4l0kokNn+yzDdB27R0UUfzb6h2/HVFrxWGuMGI1FYeZ6GAuGWBzAQO2Vf/Yf/Tmra09aHloYCQkEKMQ/DdB3DwFlFJMLCFoTmW4HtHkPJqGFTC165Ck3RPrGGi+LwAKhApSlA+g/joRYdkgWYsc6Ev6TwQQTwaBoVs/pMhSuRQUhDldF8rp8WUW+gX46M3+carwG89L7B3wbHOrZPFKFrnkjG/cUfDtdOqzrqPULbgqL6W9LuacFPMYKlykBeAoxzvh3fCzQAxa8FqW4k425uewUzOCO3UIDg2CAKGoKY2G156Qx0itI3+LWGrAUdHHSaLHw/DaJemPzl19AFlQ7Qoi3HVn+N/8u+nceeUyNCwJkQX7i5OYolig1I29UmzWalDwO+BlNuXGZjofRie/BUEJCCEaWANVoqsi6Jis4odLihXpWnfpxhODr559dlu7gSzBYLBldnCnlHzo/9r6VM5tKep6HIdI5XqORDOJ6GMJlbYKgNWR+JZISuPCJbi/mVGXkl08Wa62x/1yXUaUUMZmUnzAozez+dUprnC7J0xV9yHlHnqTzNBx3J1Q6SGtJlU3z04teTetd7fJHP2S/huUkZjhWroXi7cbAD6yOJ7E2Q1luHK7AIay6QQRLJbBIDEvn/XxeKdiqhjpgsVIsUYpFSZjFLhvh1ff+cpPBWgTax7xGV8yfbo7yra4iqarVnpjQDITHb87WLJfHPrNK6OcgaUlYxL5TfVJ26fhVq6hyDnMdbdKKuKeyp3HEtHd4xsiDn4AlMX9UNW92BQMiDqsTRQufcdi7DSqVbZxsnM29GflbN2GIEf5XITmunOfSox+5DUEhLeXKJwnhUMoAoj+noSvUJWBgLRF1jcZHAVl/wWoJsNx5lvd5gVydgQaFfQvRtAwbYb9t52TmXnRxDA5ovW+TpkeGkvTWG+ydBsX2deZl5/D4YueWtIst5aRGezEh8Fyb2rsmqm0wuiBf+b2UrlszZrHYStMvTBqAYIcTmxiOnWbSI32+lpbW1rYWpQHBbmCwUNPc3OLQGdJQN9IZI6BsqyNo6/NF0pmnMZplQYsiXigWNGkR5E78taeHCaVo3pTfAsUFAUFXtTYuh+xYu7UNd4SXFxktpdAr6MyZwcZKfBlmDyaxz/Zyz1jrqe4/1I76bJ/Nvy8kHfN809+b/0GCh1MNee1QxhsI+f3KZymmKv17rH648ijie1Ut0BXkgvx0SPBRZXp6WokxdV9EstV3d+7SnCmFvrpWN2IPVvMECyhygArzKiFGGEPRmDe+PHbmPtDFDLG5rsO/mh2pxU3f8DTX61GgViOIYisKAPu/ox/kyJMjDV7Ozum+mITCijEhSGkK4yyo0v4Yrsh8X2pSyVRB//sLMtZIKrPdLStq4jJC56dHpe+91o51yyGhmlE480qdOMxP/9XvB0AF/SsWHUSEroxo4tcxYRDc0oLKxfuwuXRWBG/r13W6T9N5kWdVyZ5RrMy7kaXyZBDDU4QUhsgY+ohsZPozybPp/7/495/ssCr3Zo+DYfj376il7HHfqBpNma6qmll9oy1zHd165dx5SiVk64QdzvHxVabctp9rUsy6fkURlIJM2O6XFqjcllCjtHzjxP7DKQQ077LVHN4maZhgqRyysCIPgcbPIJo5zCOjaTBy4ybo2ybyylpC2VOryB2YnZo4MR73vWhb32VwWXWXggaJ2Airjjf5y2yJV78sFprWO8oOQY2f4azho8av9kB2aNTAIBS7rNMd8HJ/tFOzYEz4Guk/JznMtHNwkNV1bFpP7elc6RqpoaGfkas4/p6SkYM9f401h3O2TZN2krmS4jT1wvyUjhUutGaENRWS8fYya3Fjlr3IjLcxJHIp19fcWsDgFCxqOOuGTCnZBZVFZRN2xNiTtEcubXXaydxr3Hi96fa48VEmdOzH+sfkx6/xghAPbm1hpRyCxvnFhM/5zno/ND4Lbux7AyV/q7HrnfpPKlBnpK5Nh1adwk8S+H3gzXSnvbgPQUZ7ijtFgLYtIU4R/P1QzWorBCCT8794Ri1fC8B9dPb2Gf/oVCt+vi+ma9ipGaUPzWHh5ocZpalsDR1iootw/VlHcTt3FhYvDiYfix+dpj4gmBaqYiaEQ7BuIG3Ph3/wkcXrEO8/SMxGOM0FmR2BzmEJLAZCDregyUaHi06ozRKxW63L8MEP022rK5DXry0djqGpf70G2CW4NZsUf1REOwy7WY0T+UWbXbZJHF9++/y/FKbK1Lv6onl1sjxvefDN4Bat6i+V9mbJWNkXPSQC8+o0RH1Wgy0l2dhpYPtxWpgOe9I+BTNX3BwKGf4EErmeiDtFnQhVVSeh13aC6wPb0UHttGfgbDOq+xtGF6NQAvQ6PC1MTan/+OjH9VMoWFv5/5NaU7JJmw+9D0HQtQyBAE4cEx9adnTo6LJQ/JhEWCDYHWBZjZ+eQOpNN118fZkRciCvW2F03e+k+DlJi1SpIUoT9esv2Z5zUxfO2D/1HS7lUCoik24uuTVZ/iDWMKetZUlHSt6Fu2b1K/E/1pA2uZRViTB+VXuRNKqxFVzeXBIdm5ufJkjujNC8pwMRks7ml7bIjSApX8duwKkoiAbJXerkxxR7JrRjmwurVHGqy7sL8PGelYeyieNNhJ9Uu1AeGU3Wz6wcBo89jLuhJDyXTpH0EyX+u/nxHwO4PGg/9uhRN2r7mbyaXH7Xx5zq6vtRofqhL6A0erdc1ffrCSG3I9fJpJsQVsqMZNerz5wsu8fjyHDfOI/TTSzn30yXCFafV8fXaU+uYcIzQ/u+64c+/bSXZwUY+RSiV1Qk0LYz15zU1iUkmJTSiWj9nqtw3H8TZq8Qn0/kGNjekNfxik/D0Cfw1T2oD+KF+EEC1tLomWNnJisv+ROQodkjN7ObX69UyKcKvYvHVjP8TP7ict9swjZVrlj5Ort57L+0QiTBf8kQNX56Jp2mhQlekB+Cq7y1AooVMXuyvDqydnVb2OJm04q45pTgowJV8erIWnn15D45t/kU+mYyCX1Jz+bv8gkpJY12/5tIRbDzrm4KFO9fR0P+OHAT/hTICPSfBPX0O0Z1/2N/niRDbzyLkr1U7e+q/7Ossgfn2H+0ViBRLM8WDh0e2CAi50dNoiTTJXSEYc+7ZTlN3IoNhYdiP21OW27l2RkIvYY4L1ySmEyJNuz9hcbZwvJECT5E3ztXlBS++wwBQfByZ+dNkppIsWfNX0VIvZ3O5TCAOf/ZHSEqiy4TRew+XTR6JcSHMhshb95I3JOErytKijjVktaPqktVWsupw0mjqkX7616w/y/0d0/ln3dZl5NkxWK6FD34LmGatJbGGH8+9yFaP3WiELvBczoKVn69m80M7dr1BrhwNaykwdhJJvXswH5wlcW4CcqNzD8CM5gswWFhCFHYMWgJC+KwmOIKuKrqGYf1x3mEKiTzoJs+iy0lWazrT5yBi7i97HDOvbhiroCXekrv/lkrjZFr8A26KRyHTpxhIDvtXGNgrHJ+5Oy865GcCRx2Nj1yumI6rIrCvwHmP4umdAcLvKZguvfXz9mRkADr4sAQE7VqUM7YpbUJ3SsszoyDuZJw88Y0+zRUmLNEamW62Rw3yzeljO/UN+zkNrAljxRcw79WaXSrn7WvRsi6HuWu4vdljhoOxmGL5vf+ygqxCRvGqGXx/NDFmXu4ezdea13yrp/kW3oCR/d08DCXW4HHmHJN6exGFihrwX5l8YMFmWWCeTroOo2+oRRbN5+PQiwkXVSm2eTrSsr9Hq6Fk86IpbKI8N0HTk2JIuQZFE/otAqjR+bLJWEqMaqfIrfJXfGHCBcN+im1tb1fNugCbWOFlcLnorjWElHZvwpNhFKEWnlTGhPzW+DSkrwNu3P3ytJzxjD0WF59QVSL/1JqxehDpztpHIxbSTHr1/oiGmOiGTV7B83JpojSMlVHe6j8umIwQvtclBEtAW9TLDHL5mUruHmQvYQgRfFDUjCzne7saqBf4RUw/O7/Ho4sjxd5EuRGpfjnd86MZsiQYV/4SwWzR9LNiiPZL/0MVC1uzxUtEhMeVacvB2tRPbhhykmbhiEKGpfAF7FghHAO5Zhh1jUhGknX/jbpZxWCzlQJKCjkUwKe+XX1lUg6jiK0Bno9Y1w6CM7DqxBCG//0O8jQuW8KDaPTaCYalnkBVr68fIkD5cYH/OBVqYaBjOoa+fTIi5i1oPg4i6vPmMqMNMXI3wes+cqXv4myF9p76AnTPOWDqq8cSeseCMiUhKc2houFbN0Go1hY2F6cgrC3iz+7Gp6ETkExrj5DNWHq/OUbnMi18ThS8vUTMR5xlGa1xD2iIC5bReLElxRZN0E1TS0Y/WFS8Tbo7f9/H0/jRWStBBkQKnn2t6q5IHJqCGELOY1SkZTIaex0h30bxaXcYY2dRA4chsQYO1EhGwlFTGotUv0NZJtYFI2OkLANrsN91IQpHD+r6IoOootgPH9Ml5fE62AbTCJ0moCF9ndHWmvbHoyTjXvQlujK14jA/5tG5h93crR36UwYgdgCTqNE3SO0N7U6RP14v0PU1Cq0NxqljZw+71U+fUzhP+Cz0PzjwkuO6cLzYREd0l3xczj+CVN81MwxYQJVwT28PnmB5nfA+jm2mGOCvbm9MHK6wROnehI2W+eydCD7UbcBxndz85UmFY0ptcfjGNudS2j/oupbbNTbUcqkqUwqnm9cN5GBf0lc46Y8xIQuTiqodu1Ng+mT9G9zAXawuq7SEBPCYDnjilgGPKoRXrT4n38WDtEg2rfM54xhaMjn+/rJVze9crzFUrYVuD5ATOhn3U7mE2Xm56tQTIKk73VVJxUsRk0IY6u5pE0mMbPRABr6TA0NGQIwdgajQYKhoX//XbgIatTghiKWM44Far5Ee521phFauPjff4YWUhCCvYOhytdCEMPLCgqKix0QkDPlbeaSrQztZ5eOSDB01eeZyidOZjcI7znTUtYioOQAcoygMTQ6nhhYUN/7NJCFC//5Z9FiuDFqFmIganDa1S4HC1bYFhhWQPpJdDjNhHdlIHVvHI6tQzLzvom2T0G/yctE1pHr6EMHgP3x4sZie9oRMr/vbXksUu1ZPkwKZGnArG0M2tOkAnJ4dyeG/mpKA5nfhhhYyuoBf8ZyCM7Q99Fxodqf1N9SqOI+kzwD5reMUEO05rnOH5rz8tW1frUQ5xTnZ62YW7g6BRz9jS3gBH0ZiybmZYCeKLy5YUQ2wtMEOsf50rBoQzODt2MomDHsC3JgE+MDHRre0NFbcaanLetvhDPAOu7ThnUalTOPhgnY9am5w0tcK79cHmQFlzdJN/YnVlbYuDgTyVM5Nesa/k5V3ANy1qCOCGOgxbJm2X+qXv7A10dBispoQ7CDwGA4FXj5XxRu5nJSdpXG9W+V1UNChML1MGaV1fdvLY3blcLhNsPof9/KKaA3LuLwrIsW+iNslGBt4ULgAZYK7og+s86lsYWMetJduHmn85/3aTgNDzsnsSK1iCPAaPDn3crFN9Nf/AosO85ZZAT6U/q3OmSWxfdtDGuy4tYvFKGLr/eXu5eBUwZgUDc3vIpW5wD3ImuElRKs9S9cPB7E/e0r5hIchiXMmmyDXr+C1KZPw+x5NJaoNpCS6lg11wWn7MB3pMBDeZlLU1MCtSIWLU/0Mb56XbECX1FwQV5C/IBFdXHVqkJ5MAbkhfSCAspfyRjSjmC1EYG58wKK9wkuWWdFP7emgFUJYNXXf6HWOpJLvH913NzH4WPr8Lqx4RuvLTnRLkPkjEhoLGtMWDTR1dM7saQqNMnq/kNNfQtP2T0l/2UHtmFnMJZbFd8T362P61rffhvK4REkDdmncgvcanj3RgjCoYH6qVZw7S9qLska9W1OTsJcBkfpL+LVD7VkCAOm98oDfm99iitqb029JExRKmr2OhyZNo5aLDfbRLgjjioydxeo9odH/xY/XxnmvH6tzc+3svU5SSkGYQnhUdY0cvw+js6nSJAAy0rZyLY10WsFe2+DuyPWmB85ZVtzUyLnA++JUTOzphfhNOwavm336QVoTMmuzZpQ3H2/K0p+DBpVuKvYiDbFJp/KKD/vNy+LKJK6l0ms8b9MQ5YfJY2Fndy+DiGXgczvL4pIil+7fWb2unit/IywAq5ncIX6waj4dhguDgeJO2j2L+y079jCrZu/Yg3lQ28gwZt/oT/eBoo/Jm/d1MWGfk6WNDzlsq62gPFgpZdsqyWcpVz4zDPJszMwt5RwtDfk8HeNB61X2dyndeO6K3lDM4gSNyhibHu4S+Rxu8mqdbMbGLXNdU+57Kut48HK///jneBMEQY623RENrKNs60+d6Yt4Coofi4bcT2TPHMBy71EnqHHEROsA66YRHOGME4FtWpV/DRr3+Cvwn2CH+hXL/gmgjMPp6ZAHfC5JA7BmYk6Tm3fUYRyPbJ1xKxRgU/K4wd5fAEfMyi7i5khri6L6Lg3G+zYflJgdSpv2eSfTMtmBU6/CXR3FAQXlvoDHRMCoUC7vi0lsdyWVOj3oV49InsG/kKh11OQrFZg61H0uyc/fGvmM1Xnd1l1dBylWU1OIyAQRu7BXujWvo/ejRoHLJ+WNwwWNRU3PJk4Ji5njCcDi4qhdeLkcBE3s34Nk55e+vD4ojAhgZhWkR6bKTbeDgDkGRNaNlPFY2R1RrlzHWMzhJ0hfkat8Nf0jOCNuzy2/vP0WlDonFNqzSwpGFWdda/NWR9QvBuj/GJ13kRfQWHPN3sjS3x71kja5QfW/Eabt7DNbuHvMpc9e9ObX3M9x5bXYB+VVn+rVJSsX7X6anEVnzwC1lHcp87fubCwzTJUhNOZ1zE0GbgKBzdZc7nJTMC+Cn4FWQow92E+zqqgrlMVHCwEDGDahMeXGOUcprPc8DSFMDl/FV4HmQXNTKwE9Kv6tShBoj1RlvTSC11QhCNrcf1XMeUHOy1RPShJoM8Pbr8KmB02Pmf2Mu4WuLv6TgGlAtm425EGMC8TguZ/XT7FkFM0JwPem0q/dW08l7XIBVGuzY8et0Wnz3LnCkbTblwFBSH2EokV8U7XuwvmjSJW5aM3wdVFLPai2+CWlGuf7wvNvnrHA3OH6JT2tIAshwPwAsW1Z5+seYwf4szDO8TbBNVhc3N4VmbC2JsRrZ73byT7Z/NXi//W/0KUi/YbY06Di+N5StLUmVxgexCOhZc+zLNXz1gbk2g3vR5MknN4SjbKyM2v2zvMpo6uGv3HF3sXO0GyXeWM4vQBs4Ufbs+pz5XoN8f5tL7BNG5gncm/bagu293sLu5rU1y+1rtg8axHwMXbPIXVVmU1UyzV82pn8s8RP8pp5oIcTURHIqe43oGt2y26XWn5dCbfk8LunreG/2rq71zOsxkj4KJP09s3v5Y7MuMZ58/LBHTun/Ai0zL9SXvDlPk/uBKjPr86pZYytvLU4QbBrFMWLj1oIeDDtHgxPt33waD/6YPwqxCri/F9uALPPlGSa5Xa4OTAzIDt8fF/eusH8CNS8d35eDIXJ/EDGEJTE814uWe03CPKyvZoQWmxvYK+WxanMD3HJVx/FJ4zsQP4yd76+fhdsfTIEDGp7sB+gj9mnzZ/3eWCOLCcJqGJ+/vUV+dOhueawX2H3mOv7Q0gzIP4n769/9tOaOgkgYZSykGikcM63h2PZr9gf+c4RHK9PYpa0UUMLGowYhD88fta4n+bwSei34zMjMFPYfQ5cwWrocWUmqeOUsfZ9ArkYx4WUgEJLANmegtEzzCVgERXjuCKZA0dTabw1QM583MaMIrCQpAtarb7LoAABACEv64N8tmp3t4f/PI4IIKb9Axw/yr1szGQy57D4DguEeAe/tzVGVP1j5EYw2rRakOMHfjQn8TB5vHT5Qs5pJBR8Mxb+Z/oKnGg2T85I3JsC9jGxU6x2LuZb9FKuIZ6YxLu9+ACyWol1sonpyvGdfJFJK1oJTl9fLD5Z7EXdQCW/9ybRj2KMUo2LJdoM9gDYFDrp8aN5RQywmSMzXm1Y3iXk/ULwJabw67bVNvIXDuLrCLb0kyVbdKxcR3f0g1aC4zx1m2KJKnITV5YT3ecbT7nnkLlat+hqZOyEcMzyTMDKGrRoB6CINira7VQl3ltV7QDZ166Bx4p7+yT8VzuT33DZv65PVBEeXlYKJlmC2x/I3qTS4E6Li+dCkXB6DEZx/KfSZ6lvEpOiCIFtiFAMm/xX5VUSpSPgOwK2UhBfW9cb33BJ/ETmV6lcK+xvyttLNXIG7eVsyUChLU20NZEp26lyO+A/GMZd3DOeyWLvBM5XjY+VbAXALD6m+a6/sWNdTXNc0UR7JYZK0eH/2sMeNSeqNr5rDI0HeV1a+fg9NlH8iLq5zL8WA6D1bZ0ST3nLoTguMWCE1i1Dk5nYDqGQHdTJCa620jtNMkv7r/Iwxsryf4hViOWq8dyMVb78JImTq0srLaJMww0Aj8WeVPHhjcGcXDuXE1tbY1yrWGgpobQtKZM8PhPOatrHFwk1zzA7gKal+MLHcbZs7Ktx9U1a5bbreJR11GD6yeU63MTaaOrOjs/uqVc+x572v690wy6kTuuMkh3xsGJ+gVmz7lFYC/KLmjNHjg7odzFfS9rZ7YUUXPI3DJHzleUvHIFdJiGLFCqDqiMvnGg2rUlVm/hbB2X+uFT2dMPgdsdTOKMZRdbu9dvAU83jNkivukq0QjuRUpW+43oTVxju9M0xX8ACnacEeohCNro1fvCHeCXb+c0GO7fp2JiqLWAoWGO7csvNRaL4DSuf3fG1VXV1FTR+YChD88dq+WuFI44D9FouzMiLkJnI+kQk0N/abDP6TaUJVQeQVfXAbdL/GB3g7rVKFLxTg+jPIECEIcJgWTcuAwuvQKXXMYHZnLgAL6j+mr3OXB63J3JGAwIKOB94A1ABICxO5M3VT55fKlzVw0egDkzb/7EfrepZdQbaBmEl1wGQxGITke8bvuISwF/p0yjnxecP10907vj81LgnfsZx8aONeyS7DLU1h5xhQk4P7z6D4uSyuNc9nHl+HFrosGHfxzLuOoY/5F73LpuLPjzRVbgumDvWFC2dR3G5aGH38mHt4C8KdhNlLkxzuYxz63fSddPpXVnt47KrtnIRG9izCPzznC4884cAeYmbAOTs3lU4d1y1p3yUYVntxIkHUpf1NAUWhwea7VJl4Q3hRoWpUPg5Yy2cIg9oSdHY0vM82mYbILNUQJFeSbeGQGWxnDkELNnDo3mK+7+rV6gYnK7SzPI7gjw8m/AhUG+VhIvo7MxGszvq8rq5jJVgtKEhLJZSnpTDOiEGdMlcftfjLOqsusxBIZgFg2CaTAzX5Pg1bidPcB0TsAd+foNm6aJbl1PCqlGwwehE0Ef5G2AchsgIP3O2zO4MamZYGDGNVe6Q+G0s1/6fCQyHjO/+3qEi54InQwpjTyj4R3b+8Hpluvc1VBuA5zbAD5jhlRx6PrEa93GuaK59qVP7aEzJuZEyP1vIBjznk2YGTw+LXbXHXyJMCxPnKvp2r11QtiPqfHvlfDW1hu9tlredFZ0gcitalu5rm/tntsv1pJ9sUlDPRG7Tgim2WPTDovrZq2r0LgjCkS/7CTa5/pqeP0UuHejxdrrTHZp68Q0mhHLE+XZ6MzdBrthN4tuFeXlYUaafL7NzsKF3LByeIw6l+MIjfPaAnmG2aN7Wew9htmBvFJfWYINddDB/Rtpwcw+MiqmwPKtnpOa57UsQWGY2TFuaq/HZSrLrG8oorH3ZZaZPK7ecVOZHTCMFujHXHkkbSZ3+mKdhR3jVjOGEbXg5TjG6kLfKldV5YezzHsnD1r47KHEPmve534pU08DnddoV1F6Q1vKTLjr4cGtX5Ffvbe397dUWerE5zs3nro5XzD/GjV3Ue2p/4ZvWrW8+1O1YNyt1StwvPyjNsjKMrsTk8yfaPnFkYQ7o+mBSGwgCBMOvJWrwDTSJpN8WFBy1Y/HPQrEkE0yvYyTO965ajfATQSRLJ8xR19jTa7M81lMent8DoO2Xwog7wV7onne1FST07aNLpFhwnU3l/zJ5YZA7zTIfPhAjVn6us/DnLPD69VWbAC5NUgoniB3vJ4S1hLbrEWgeV/+zaO7b8C3isLGHnEDaM9uaHQ0nAkc1XBjUEm++tbpTNlxud4ATNbiyM1DSmjHJasNT86GbIFvJzNUYfb6/ksjHSp6c8vdaKygfk6toPkmH4dt4sJ6CImmQSJQLnVPC66He8SZKVjzR/mLiucMA8ksj37/PmvKjI5qUCAQSTCKpw9+3GuVswjD6jSNP6dbP7oStdWSudoVAVp6nj+wfJGALTSMcCSyo1PPQtP/fYzpKYzTXTYK74oCg3MSuC3YyQ3i4Jnk2dl5F3nx1MrFFlSAyVyl/eYDO7k1yw5C0JmaVRMHfznfTY5LE7HBS++Wp8JjL8beC7Cs5b/yHwYXRN8VAAgaBbJe8bkjj6dUb8/jEUAcDNzpopuzj4sh5eTljibD5YG0m/C/2IJ+sFTa290uzp0VKKdHIIwfgqUyeCheKBGSPLIYLy7CiyN0VSqbG4VikfBFIoTbaqSlQMC18OQ2COUKtULe4g8EPRwUYwY5eBDYgwDnBJngeKFYwO6N/KpySz+JfagdfBOKtdRENd9fyAu3jf9K9G9L6VO9NWm8lshetkBcRHm/QHxv+QUh1TCfRY9A5hmMDIrAzNfCjlWDB2EFnShARlGzkXr7feYL+MDbR+FV8C1gecuBmuDveQn4+fHjIpwFw8b447EyPuC1FSEjY8+JutEVBdkyRD5kZbVs+puzvaVRmeL7dh/vj3cm/PhfGk6kMg0jG3UBlQAhTCyVXfdPyVEhyoxX52X4zAuEhrpyyQLepJDXxZ1isjSF9/23NZlqBCK31E76YWbhH5uKgKPHlDqqHVAlVGHqxGiQlEUmXm+O13nteJqCTf9tLEaNjAnGUlzXyFi8WUZjpjdYT5laGS3gxyXm8CxkGY8BiMFKoNtxIgpTvIoNN+eH680E4sGb4z44buYxj7NRlpRXLLnBgLOQNGKMY8xAdfVbi1XRb1gGYzNbN6hraLod5m2SyWdtNyc7XThoIEhZoZDk/l9VX5nEDUsZW6wu52h4cHk+B1o3bKVMU7/FGd93IR0O8ikATFVlnLiYwVhCyFOYds1Z+OfT2zoBnzg7aHA8cHUfMnEhMAhCahwxZgpKbvDhmqL3AmRi3ObSzCCNvbJdXf/19eoopFwSl/UsJqO25cl44Ph/EejaD7ce2f7f4db8VNevT9Js1A1CmIQMoZb3CqBLGhI4Wixinh/UNSHa4oZT9UBHng2RLVZLSY8gNbr/0cHeQG6Kuz2tpDOmRQE+Mua26ZAr2SYGpXx0E9E8dpVaB5Q/14KeC08RYqWFIj0CD5e/JZ9pO+qKaeGemZn+uOnLv/qb/vvzVgm3AMDAgITMZXFMxdZRLXn7H6o58LABuuBPjKwUejZc/nNK5xTklWpsUoPH0jAs4uqNeao9tQC1lkalVudjy4A4jQFa7GWjHNc9vCxbPPGQQ2YNi2IY4FY+YylPoS8pekl476VT/zus+0i7mHSIplRp2ggL55RVljs3WSUCy8b3CePSI1cTsPSeqCbFN1ILDVJQMbjZnbNExCTMipBFtANkQFVjcUHOZLKqMTxGZIJG5FQKKN2n8X+tOAJrbKT1YCbIKSKmzGAoz5AxD1mSpQbVe+kmOGyAVPi2LSImc6ALaK9HQllNdsVruoFKvsIUwJp6xvQZoMhxnSKaBb1HU+bhWIzf3TmLwOc1R+4COHpD0HagVbzmwr4M7iM+lb64jU6N832KbhBHl3GPGSAPpHKaIM4FkJ84iYI9z1IxbpJ/q8+xxoLcB/QxSx5eVpamTCEH/p3C4eh7T6Zuw+iSI2VaE/X5Lj4oEdZOXdvCInLyTFhkaWbt63kqIzlQ1j2Se1QHaQIAPiGOxCmYXd8Ngh5iUAtSqWayNWCJfzkHQ2PcxG907lgPy7PItvhVgkfUMZP1a6d6ilWsRG2vxRzgvGXZyjKfQT4rA9qAqap4A7YAywc2MiuyMtDfZoWZl6FDPijiPvrKshEJJTV6ZYxRWfCMApzZTGHh6a/4gI3L40He8054kyuSzYJbR1lOjadu7dy29KVwkyzFFo1C+4Cu2I+Ox6oKicVNQL7j8JBg6oKs5Usubyfl3SEC23eH8by/O8Lp0u40UcF2p7MnoTtavzu3i4xfXJ7kucfhKqmab/AsZ0GQDAUjnTzipdgtTWkndGlTlCpK3iAh05Q8abTAR9lFiyPAW6aycpFOOBwHlVsGTumE7E/S8u3OR3RGeUnX+c6sLTUafbXELU6NMqcV8DheWvY5AXqJLSdehO6BG8aPUo1U3NNKQq2FMhxqC1TjnDQxlztCtOgvzkyI7MkVXQJMvOo+NsZlXBicEKq9OC0/J/WQX7IpDIhCPfBFR8VGFGFyHhcHYrlJJ3XOWgq8uE+Y43Jur0BsQToByT1NObpJZIa73gJ5IkClwEnSAqYqagOnlHPAw2lpYzQV5kIT7QjccwogR/OIBS2OLLdaG3DHBBxNowmpOxDCcYXx1qpsW2XEO4qkmqCJI26SXqOaQpLHlWvLSxTf/UQ4KuTmk/Fh255dvb0ZRdAV12MC8PGvg2FiYePg4uHDEUgUASERMQkpmTDhIshFUlBSUYuiES2GVqw48RIk0kmabP87jUySpTCzSJUmXYZRMmXJZmVj5+Ti5pEjl1cen3wFCvkFFCkWFFKiVJlyFSpVGa1ajVp1gZlnviV2mmOFQQ9Y5meGLbDVB7b5lMOOJMtnPJZmbMKXfMV9PuehDDNzC0sraxtbOxKSUgoUKlKshKOOed8J7zmu3wUO5FZlhhluhHIjVahUpdooNUYbo9ZY44yPHqJi4hKSUtIysnLyCopKeRAVVTX1/HlNOAKJyleQkxCLwxOIpHxEFCotPxmDmUt+JZvD5fEFQpFYIpXJFUqVWqOlraOrp29gaGRsYmpmbmFpZW1ja2fv4OjkrNZodXqD0WS2WG12h9Pl9nh9o7ptEYpUnAhRCdw8KFvr6hy/gezLdqfHMalWHx3yGmlNzS4N99nvbnPfsLabl7GOYZge0Vu6AoAOBg4ZcKWH1HZ/hvqsyr3x63Ljea/bPYrDnS1d91Ocvm9h+D5K85OOKvN/7T8Ao+GWwfdQe8XFqDViY9QaoTVaGS6IW+ZhukDAxVPQE07OcJTKpygBDcoU7vlZuZyyyT1nr+qRjESPpI0eOpvRaTvLZF5vTkjP01IjoCYX7/SI1nKhum8t54nMCDBJwphUKUiyELB+b/hOiJbEg+m66kZ306EGXblE81vm8Ehnv5tJwhQWtKh8DBuZD9mR46xogIs9maaTPC0D4lInC5P1EpmY6y2QmVhm7ZF1audS9OwZVtmGQkOzTeV2YbEZe0l7m7q28yDHs9FXrnnO+n3aKUFaT6g6eZDqEpFmACOYwmTW6jsQraXrVmbmJRaJZXvdbarG04TNCKYjk7kA+O7ZTXSBI5nROKGnJ0KHWXiqcLm4O+Y2VJr0qZAGNm4XRiM3CbueGSpT7CZI407r8N7qctO7O+oaB2HYbDZonpEGvOnarFMFF3NXWlypkAYu7hbuFDCDBVIhDWzMUWEzucGm6/QNLr1RD/I+AFeLyo5A0JLywxAY2mMdRwDDfkwLYBBn2Xo8DOPTYNahXoMK4fVM+2kGoIGmNJtS7KweWIH105MAAcB5JAoaDJQdtg6WHQoaHe3ABxjYUYiJ8rAjMYc1p7A+ANF4UUPQh57vH4/ACBrMi/sAejtvB23xEXjaeIzeiAKnEw==";

// node_modules/katex/dist/fonts/KaTeX_Math-BoldItalic.woff2
var KaTeX_Math_BoldItalic_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Math-Italic.woff2
var KaTeX_Math_Italic_default = "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";

// node_modules/katex/dist/fonts/KaTeX_SansSerif-Bold.woff2
var KaTeX_SansSerif_Bold_default = "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";

// node_modules/katex/dist/fonts/KaTeX_SansSerif-Italic.woff2
var KaTeX_SansSerif_Italic_default = "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";

// node_modules/katex/dist/fonts/KaTeX_SansSerif-Regular.woff2
var KaTeX_SansSerif_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Script-Regular.woff2
var KaTeX_Script_Regular_default = "d09GMgABAAAAACWsAA4AAAAAQSQAACVZAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAABmAARAgwCZwMEQgK1QDDVQE2AiQDfAtAAAQgBYkIB2gMgScbSTdFR2iPA8nAVVD8f0jgZAyeDdR6ACNKVO1drxHs6KTonuZm+4c2Arsg/MxxHMePqq7FcR7xoFNewc3CMoY12D9/0T+gwFCKd/0ISWaHaM7aWYvYbhKS4DGChSgkQQIRJ5CQECRQILi2TsWgInZWhfbu/2onVru7r3x7Zj3VnpeH5+/V8+7NGqCbIjJ1FQNSLlhpU0nXAIpYRcrf/7SZ60BRASnwlB/27AboYEMyHYJ+UDrvuahd1Oqqp3WOuiL3prOXrtJ17PHGbAfsxN5PSocNvNTGEP1S+rZ+havBW2+tNmUV08xmE1K0ZHk/eJqK0VbktPeAemhK4J//U080XzPAAqDVPL1X261j6QJZYGn+ExceTs0vTagc/aBdA9AF6AKwBEyLWvSky+pOYuWlZqwfy/25fJ8rYCVYXp4GCB94uy3C/TW1l763llNav4pSeQUkAIeQ9dPJo93VFctXpFWa5Js/tuyZk+XffHcpV1ILLLgWVO/8i3+tKL0AnOGZUBIAw2gm7E/QBzwA8cDg2FhadkypxCCO3v6uncs05ToUuWq93pgQzDnAAANYeXV3JyA448omGAh+jEsgaN3jlcEfbYGh4YqTEPQ9wb75lu1H8NLZClmIHULElUmi8UEpGBXQxgaEJYTPoJQnF3oi+FyB0/EojaBeCmatRh16aMysqYefeNFijvnuUHVeoQTyprhX/QDHgQr2/UemhkkJQhE/UGD1HGJfrxK//eGZu8+M5zBBijwRjnihxl62jOXIWEuolpBd+i0ExB5cSQCK28R2gyFWbFsEaGbIxo3C9cgjAnjxDG/0XE4bZz33piDTl+3pxYbo1bSFx8YYHCU/9+yz+pa92Tm5h61OXMvTdaCVEAr6Y20FOrYsoHVIMo4+8EEQWPOSBg343FZoV360GbrIwXhAvHo7Ugnd+elDvUk1xuBVRVicS9O4ZnpW5E0YG2Z4a4pDTCM17PBcAhOkqfgCdBFkKWaQ9DEzgMELqh3rIRxkckwo5AmVnoQVbeNZSjrlNJ4TMmbbxDkmzapNVIJUtQP0w6CA4rQkBgxANGIDUrjlSXFHqjtjbWeplcSdzgNknCkjhzlktGOMoO8eQZtCYkPbsu9EEv/PdDJrJoNo2fZhy8Qd9aJWQcutD9KAYym0qpIUkMZuC8HeBmqS5k5AaL1EJDyaEHx5pAwnTQN0TrI5PkeleRJQ0JamM4uhv1sbHS1tSewD99LGDzBmxpPDFOWDFHV1RCNgkGQdGpe7UKJfJijep8VtHpHAnP5CD4T1lgLlowjNuQc2mZWYsRYEqS3trRGrL21JDjI8VtkKhyUJTDas5nDlPbln7E5JTGFIEUEDskjCNe1wjkpLknUkGZCayCbbQNpysbrnM/rd18dk/ch0t3ny+LZf3b0UjJ0yvO58ZIjb27e5fBJB50imGhbD4TLnisRKBFsCIrHK7MQ00XBpCouHxNBKd37CMUwA55h5Tyo5HJGwOW0Wn83HkxvMEHRN+gQkVNwC1dtHFocig+ueJ9cdBmS7I8sJmkM4E+10hCyuFc45GIC/PwRd5s8kp7v7j7SkABmK65YUIoMRiBgM8QyBBIZCIsMgieGQzCiQwqiQymg3ZUOCsCjxtrrnBRXBe87wfE/lnEMFxu+Vcw5VGH9vmBgFh2ntOEF3cqHNDCtRgmKUoqEMDeVomIaGCjRMR8MMNMxEwyy0kgqo4xbUqUBRQ08R2fMspaJUIXdIA8TO6e0ZltQCGCGkkcQ5Ke/zZ5MGAtD1naPMnqq4a0XtMGO6OfCv1VZH76T5M5ZygQ/635iHYnM/VbImSI3mfhpBgn/QMKn/ReZyrm5a/IYYgBojKzxCdvoFlTSiulWXNL0QEnDctXI+MiyCJ6iSJiTLmfJymhr5FUf4I0O9K7trTaqb11/6+gIQElC4F9C4mbPbZ6bYyGD3OKkcqJPJXE3hMCqhS4i749FgE7GsbLn2M9SumuFxubqnjm6rdCLJ+DwZBrpPJq0MlNfXmhZAGRohxtjMNvoQRpCB7mbl9KNgJFFkGOfMpOkctq0inbIeN2AvZSNEl8EnPhaRzTpXEy2qsBAIt+j0DhJt3QeKABHQRrCy8aSeazjUXCSdyR5aWppCOVDMYJrUBzeXL1bpK9RiDV0saAcxj/jEQ7rX8gqmz5dzYt4KmfTIv2eJPgP0mgx9zqyG5z3tWSAwQclZeyH9ltlRj1qrrNGNLnJV63V3zNb92wTMm+8F28GCXDbpAAsziRdC2hNMphc4FLKiZgycRUiAUqfAX4tkunMAxemyghqVzElJu5DpE+FevKsj+3cxwjJZRmT2zFrmjEXNiFVtwX0TVNCFRngkvoxYOZBNMxyBXicu+d0WynP7mnqYYXhtfOVSZAi8FWgMoR/Mf0DZmiDBQFBhmGQdZG454rrAspe6AFoIGiYMMgAVRwDBEFMZZsQRq6QNRI4AglVM66sxg6CiF7EmA6D2SCAYzaisY2YdVs+UzWGANTCVjZJxwJqwshg6WTNWCW1hRA9rRQ9rQw9rR4/q0A4dmU50ZLrQkelGR6YHHZledGT60JHpR8fEADJU+1ENThXyoiUbQ2iVw643t2izR+oOYDyMowY4kmNZAONjkFk0ThhmnGuY1byN+cD51gMWZAEszAKxaD+0GBcbxbjEKMZJoxiXWhtYlgWwPAvECntoCa40SnCVUYKrjRJcY21gbRbAVBaUppVnGevbxAye+ILC5eZrZBJjtdaWPUNtm0Hkx7k1e5EcCAAViGM4ItVhxVZhArHPIPIJGg5jOuseBJtAIeDLADxBAq1JRO8Jvg5eICC0VnMuS8TbxSNGiVY+Yw3T0kZdwTlFhAXtPP4Z2giHvTwqjmxgDcTt5HLxBu68ya6ps+vOkiQDY6BVDMQ8FmqlCmPbNpzzKJbORMhKIiJKpVVmYcERJ3lE7QhxSbNRFIEAUddiREH7dLQEJGiwPG7XS6XHmKsC+4MsjxMJ628pUvzt5lwC4GfLgKmvpAwiepeVLKme+1QIvoiOSk3ZZjzWvkh48LvJs0LZV6SlCNeklgEhog3GIRLXGCAiwW0eE+RKMwAREJUZqWKedEkcCtKFUOdI94MgfcyT99JjO6+KIWKeSfFAbSlWrOSu9mNBK+lppx1gpFP+XV8i4hEpC/CjEDrpB90m/QO3xtNQuiRiV65WW0EZClEExSOY8uUf8VEQiXh3Tio+xHFFipJ+BjqWh2uMUw+JdvsThxqJuSX11vp4KfIcF8AolzGWATgosC1Ppms6ULrKsFDIjIk+8p2rNk/Ns4s8xki/E9rDIV3SrIyR1c4XyXueR/MUqyVpqSIDQVQTHGTHeXT6OEZLMBLY0zqLXWkq8kGuWOVj8qMgSeQcIivSuGQyrDAm6ERe4P4javyAvIK7RAWiONWUZlnxv0aWmgAKZXhf5UFWw9QgXdedDcF1jwXe03tOR7pQe3gHVmU7IfEypETZGg2sN5GU7raCzmXNPmT1qSPrjYt2wyoAi45usHUozi+2Uug1XFLlcdvxhlpNNJZJab7aohnfgVFub41O29WYYaKgiGdaumnSXsQTiFbb50GORCQekee9MTUuHaWaG4FpG0uzJ2pLSXGxlXzIUNtv9GYI+S3gB0GexaplGH+9kJGQRzwpd7LQLTrghgHgJMDFixJSrhfz1ttw5v5WQmfR02ZvdE3qogDcFxoV1jLDVGjh8hjKPhENp58Jni6iES/2xEUaRxN1JzRSmDngsDo7cgbj3cNOOrvtZKzKfALTwD9QQDepYLkVNvd6iRJ7Qc8mT4YVR4tOHhIWvf4a5bZv2vlBO+ix8mtiaTYNuOgzctpOIkt7RYTJzJMPniiJIlGHOiRG/hTGMUqUpQrBv+wHMfG431tqynOSBYiItLTubwia7WXwjtqTmIGmNJap05i0EkEEXuFSnCLeQdEWkEkege/8NkPE2VSWSqYF5X8UlitkSTzS7+c/TKHwtzHquyMjLh75RBn1HFnt8tjVdPeriyof6NHT/QIyC9CBD0dtI4Z4M6mX90H3F1km0mjVZWLEPjb5rS2LLMAkiQLB7t2+HMkVLumU6U7dctYeaCrou8wLE0ggU2X/lBrgb8p3sxRub3ChDtQ9l/nSntznWcrFLaN4WoPzxpd1ouzXNzFpszEGDl8uCvUOg7N6TXJ4QlFePEoh0FQET/CWihGeOIGEcNNh27o2Ca5QFqOQG1TQNR5uHJ8cXQwCIT4wisE0Itao/6QXGYQ0MEPaEQvtieykJtAhnLSNwwLquSyB3xvwRBntO5/+jURZk1pqfSjmedSgXViMt+hXTIHokG6XN+kn1FLzUo/7uHXQwwUs3p+7C4dpJG0f71x3KJW2mUOHpHcQT+w7EZ/BZ6VSugeiVoD9j8RddzrN1LcHjCzxmQfIxTy7VlKH0wksfyowo1fiRvjW5INlpN7BLlVpGDJ/0r5ySKStp4UWQmoMls7niqvcg2k4BDGRU2oLifhLuC9k8GxRkaXK3PVpuHBtQLF61RwtAP3rBPGc3CiiXE5SwRHl3NWXSair/R/OU2bmGUdgRdFomRYTFyTQwPp2URmgbFuXebVrrrprJTg0XWDmzDCqfsjqf4LaO/HahqKr26V6UTGjkfQ4EYgJWJLYwCUl6Fws0sy7ulDIXqhE3NqmV5ETI8r2UCuIbGX/KuaBLpBm6iJJSvdtcg1L8lWZ3gCmD1xcEx8Vc7H3YaDG1yj/xTyQ16htdNopM9ckvuJWH7fU3HbshFW9//X7G4taNxNR3CfEETiAk0vrjMvUzt1x0q4QHBzWAeDyuSnve3S9zmKtvh5VKhNZxSemb7hU/dJHqJ2cBVvy0DIHbmsjQXO1YErVckRT1U0QSY1HFfbbpZJ9kxVsHqtzd58mieanqRNp23jkThCHeVptIy2DT5OjrJKuuQOvHOFJHw+2xFKVHVLY7og58pSsAXmIFLTPVNqH+a0zd+dKta1R8Ik2DCWvoFSWlOhKM4dy68lN3q5V6ecAZeACwMe6p1vXbYtYOoPKruVU7d3lVlNGexbrSss1yi6JS02zKX0omoKdTxfyqxA0vjioMDUkK5DAO7Sht77MTiCVmObOl1ie/I7f5GINwMENlwW68zQBzMiRLMGZPmipT2qpc0TCdxQg5Ky6r0+w3HKLqpWhcfNkSDRLyeNmgzrROwzrzgZuHXFvdCzbf4tjuhTFPjWGRpw+MGiZzh8T1qM4kxeRL23bPh20YfN0od50RMpQ/SjXahvUbRUgouBAteUhFaz18coaICRdLktSB5BIqsGJmu/FarAAlFhleXkMqMSZYoXPjibMuU6vlkbF1MUj96Jcayyw4hYcBTu9FlQ0JTP8Q5WTy7lccsqtkDpH027Tw6GXBlix6kzqkigRwrpEFTEo5lPknat7p9PrVLibu8c+gCioDLnLS0tTvfjyBPjF7I7JDrQiD1kx4C69jk7JDUBV00TQzQWBJdnnwICVf57YD3AQDkn3wrCMM93Sp+601Ax2jfsosl0xrzkSnaFEjb/6YGCsGslfev/i0iGg5VJlpyOAshlCeTg95uaAOB6nFw76bpzo+QisnBgo15FDZIOSRsLVWvq8mFuvRfh13M8IediYlu6p8lzw0mrFbdWeYbV9H+yoZ1rJE0V01XjGZZ7XAl2gxJr5uPREEKiYkxYeILT1f5GXOjdDJdfeE/X+3U4T6YdOeEqcQRP4O9lmNVSNYmk5d0lIxUOrS3QB7sUC6+gqrBZEdLnMZcjSqNgd8uBRZQU04XnFKzExObzHWv9r5xOE1OG6O1MHWdptK7/MHEpJzl8MoYL6qOaXw4f9AEnYsyGwNCd9+kk40Idd8kZqAoyHDu+lAtKNsSeTdzFKqbWpYEs6cAdz9SpiqLmNsEm6DzIL+w2rkOxq7SSLWt6B8c5ShQo7tFv/7sgpwyXBGtWePD3pB7ZumdZxksG1LQGnziKS1j9KNEfW2jGgRaub1UGlhf25Rq/+sQi0ZeeM22asVNqa2j5ZfX7v1JurrqzfDxEEDDOtFOSU8DnjSzXLXl2jZYULJt71cM5xq9NIQKhVlYL1+2FenpUKH32rrTSgbv9XSC4Fl9M5XAfJ6xLR7uhfSIOQvzY397aStQCuwqZfnn550S/tHYy4L36P2/1Sdpwk+9ySp3VQVeSIs9Hv/jdvfzVzrcO99g3Z2mU7yjESsQz7jXbWQ6yxlotv9PUfWT/6KHkL20SnjLjFL18RYHi5OvzlY8fbdIJxoSNku/F9UVyCoKHWHXWXyZ4XJ8idFb+WAQJH1i2w3qxGMkrfIdMMtuJAoK1QcVD3+UKdUIY2eVodlpLNgbtNRNrjP+cp9RNibpv0eNxTUlbSX1m0W6c83tdLauqWucIN/XX28zBDXJnJ97M2liou5wQXCUmjPZ/ZqnLq/DK2lexAqQQpSD5RHZxTWRydID+7aP/+2MPUFEwndddZwogG02AWBs5oopCLIDYIvgM0dONRhCIJ4qh07329pwGmIrUn8RkqgE8Xh0O+R7cPscGH2EfqZMHuz+8EYq8U5FDRO7m+N+UenXxVWvKeX225zj0IlbddSCwrxI8mE1//x0XuRWgXvxOmDO0oL4ouE5Q09JGUHBM8VnrlR67N6bFzunleY+QM4K3Y/V5WXrRpQa6BvCmSpLPuz9RUXfO13adpbn+oCc7jUv/k5N7XFqm8aGbE1hl/Q3vcNLwTdDIIHFl/ioI8jmRLE2iMtoK+/N4qb0tojqL62DmfJvmQCz7scRt7VK9t/crpL+urnuewX+yXZC44wOfGOJXeK3cKvCwnRhRaGeI4X/5hg43rRFDBrEa8DKNQ4AhZtmSjI/mbWzM4n33ho+hie+Ov3nCZGl5jEMoOLzcGTuh7y8o2yxJ/FmBNVExMF65fmsgXcvxL5pWLTrCZuztY6LQnMOsmk3ISkrKsS+9+wmav7bQtfe6CAwzRhRJRw9uM5hhH8O+F0rhgJ+PPgrCRKw/RDLoJGv+zJF1aK8xIx0pb2Zfj6ebynoJvXzC69gnYTL6yiF9xUWmbpyTAbpRCFWD532tFMa7BpRhGGER2nPtUe8jdrP27JSG5PWfLE+Y9HBA8hH5ILN0EQyTVzJ1mUbDCeD1ES1zz+Xlf6srNcrO2N62k8V+JssQczP1veiKcBpNDYs3Y5gw29v6XVe7xujI2NlWSX3qpP0JpIpPtj9mSzj/43cA1mSmpS8oNmbtLrL5+lb0Lb4t38LqreawIgn+3a6my6keQ0GiqbJ2qfW80nJmBYsiSifbsGJ+xOTxbs+fzu8zUVOaB8pb/Q8aUEkvMgELFfqMiljZI3Xj9iZb4V6SW2owcjWPF4ey0uLki4gRCP8uD0TUU+mvm1Fk4Y3Hlh10L7nbX2xizdG8hW9i9oXpsKmzNuCseJsTkApoiR/OHZN5iWAtTWqhA31B367mZFXVC2xZi2uIoDKe83cflD7yab38XGL8CEqOgjLStbqGGP7T90XsXs3wRngvs3OC6RVOfVFCRsKThIaRJr5M53MYqq41FRefvpxL79pQ0HNBwe4fzI/zUFOnFvidHD09qonvLhx4rp1IeMJK19/KR8vCNCwjFnEHVWg69Ce39kD/dvurEdIA1JPKZiexjb88ZvUMgg0GAbbXUiXWVGnU+39HAjchIQJJk7dQX51fRl5IDaEd896oHL+vdIpDwYf58bmHY3TK1aHn04GOyVn8Gk22ded2kv2Tmb5ggQ7kjAdkEB1njhwtC3iZ2fFe80Z7bSZICHOkKDVwQcYG+38F1ArInPZLNPltMsglOpDPhdCWVIsApe/J8d0UsanI0Ie7PI0cWpinoqDtx0WG9hZycPNK0RVgcVFM/+7AmuZqV+kT1ojWegZRJ2eSTCB7I5h0drCxtCaXXhd8ccgvVlk1ZggSjVLIWwdIlZWTyO0MDgf0vznfObbanVGcGtN6UJQgtwydX/98Z1kgMUAT7X89jEr+Ux4Uj1zNnTLv/QYLx8zNPXM5rahQQ6pGj4vV53pI2U1lVhOq0XdsKKMUZKJK0vTe4dDzVkbZ9kJeWzgMVsYcr31mHMHgGLiD34qinkcuPQRMxK/vjhW6D4wYFHvKlC5wsLgWN3I5VdYnlUt7C9avmhEyXDvMCTr5gSOl88t3hVFWXoPWTRSdwicZ/LStlNiH45WiPtiFhoVRCgoCoXbJOaYmdr+Slf5Ik9ZROmMPhsP4TjyofaYIfcZr6G/1tEIxG42aV8AfntAi9PYNiR+Dian9/vzdmKc9zpYt45aH7X4CoMKVXyRecJl9zNJb1eqo6p1HZ1lJZ4vGHl5iMB9l0Zhz1StOu52FA6hCs9/+WvEoxNbU3XpSwEGcl5Ve0dFRxq96P7CYghNJMRfLc+28jEIEQGo7iH2RsZTS/Y8NfA24M3oSIftNEDJvgGUQWVb/gvNLx17yO09uzYpz9/+6LN+UxKlzW6v2kEEfn4xcCgT+3MPSLDfqt1z/Ig8/2qACDEd/MnKQWcl/LpClyFpU0rTDtcHF4YF1gEHvbrb4GvPzq1Gs+4bVOUohjHX82eaAeadLgaCR5zbavHXStIvlQFSKlpdX902YwRpqOhgG8+bsbHTf7p6673kqYWnQgjaYnAmc3hJNduQdq9DBsQSTBDM57MldKaue3f0ymyaRfhDo9dZHvPrcXVwg5bTTdtReY8mVr5f6yBd+imhdUaBDPaTnPr7UqVpcw6QHVzXRB7LLDxbUEXdUdTseReX0hW/5fuBfk7uMOLJdwPw425ZYe3sDFRNHtM9bSaH3AE9o3//guhDpPgRR6ivx3suzaWNFYyZzCahVdTpNZC689JTUAK04lIjA2qbOaq2r49rAv164vN7UGbly/+b278j7zXjPNqoyaIsc+NVfmAqiXWe38aG75HFv5xDsNz392WGBu6GKn8CRkM8mfEuB/QQnOksTMsmSXe9eDrl6ns1T6pKRCgcajsB5+MD0QMkYX73+v9952KSkl8yYVvgqhAnMro6dOzx74IHv5wX75LgGjpRwcUAtT9mbxN3vI2vopf6/ypI0kiAh6SBPEG15gD7x3XI4nVhY4tz2Jiw3xjubpgc7aKGuSXwpXVfgJnN5RuXj81IkqS+rtLv+u5NAChk9b1hmdX7G/SD2u5ZztPrOnqKpyQli6hgZvuvnH86tJFDn+LnI3vsNNhVFE+KGZtYxeVbrN4DT2MUpzCZCMwBGY3sdvL64Pz+/xKH5fylFd35GFwNroznkI9fwzCB0mKVIBWSMz8Cko+/h5bN7hgvnNx9t31tTIe7LdoVNZ3h4rMyEphTHrWvThTqNL1IJzCfI4TEsgRfFLv1M5N/e98yM1R5md0JbaM1Y93XOIJTB+2E+/0vLEtwjFnIWHXyOBfkGRVeNmTdgeDIl4zzkDNRV3YvWdZQ78L3tSwEy2cuLWxkvkvIT8tIKNXret5X/C8S5zSY+rRM54MKqAm5Z1bILoh4J+5nJcRPUuM3nqLKHRk8WcxJvtfKT6M80rbz+dkjimGNum/T4ntHJpUpbXNLzaHcwKUgbJ0g695TVF6qPJ7f97b63fZtMB8LuPdaujXH+uk4QRppX5cdCe+7KLy/LWyAR6npNnMYbkkhyHBNdldh1f8P72ydLBHY2LuRE1P8+fa5HsGE8KDxq9W+Iv6FhyNv/uf8SprsOZjwP4y60/DWG3qEvmxc2Lp4s1JBVbm5WoDigmjk3+pzHW5cj9hjfXEHW4BCuUocb/ZfnrMZbJJpiz5NK6jNqdJI2EVDCNRBNrnLG3xXari2ah5xRl84XsioqKSGSBukFeOeaUv3IdD8QD7Isrc/lKQfZJeqlTfszk5sn74mj/LFHbq7qSRZwJB2ApImWNReX8XH9JtIVKgQhYdI7zuXHO4mWVWSsvfMZjBklSwPdfnJCQrWePyx7K/h7y1an9d8VUKQI2hxL1ZZB/2XMkKXFOvVLpSIyjIxJIsqDMvySmBRAgWLaCpNMZnJEuQf+Q++9WbyfgzMXsytAulKVMe2FcUZtcAfMceHeNngAYYpmUX9d8U8BUP/ygk7nxc/uuO3PJWTxbTVadtNQP1Xm75HewOKNvmePTB9MDW3iDyXMOHIxjWXLr2zbdLqR38O8792odCqfRcwfc7VNbgtGsCmpWGXwWYaX6eFn6MmGFoTXqJzBe9P65hewgmcKluFJ3XjGlrMR++5znV3yCoKiv+o7teGY0aKt6an6A8bEwP7RCOdjIXfNTU8qJCmnbqiR3r635KuvWV3ComSh2pAg3pWTe9bCWNHJ+5Mb3vJyU7LATWc5T6XASBZc1yn/OYAZDlCcGDaEVBwUEh38lM/0+f4MpvEMrhohLOJVKGeEP2vKtBUH2bJxFKiRIIVHxzEyf/IjS6ispZCbT7Rq34RK9WuXOYFPhW3k1hSKycPSRtWes4Rk1tQnlUgAAcPa+lyYeKar88xMWwHbeSL1TbeWQufi8+7HyYg8D06iJx45+4czS2Kv0P8qbJys61TbutzicztK8v0LFzSOlYgyl8Kho7vZG+66l/AolkbuOhRFbMy681earL+35W08IKMi8QO5HgsbbtMqN4IkbXrvZZwhVLFxLBFeiWLgQx0bunDngaFU5j+1yeKxNVR98sPqEOAKj79dY9wgHWLav+cK4b9Obs4R7L+OfP2CmZguOzZQ0uD0XCT2CzhVmBCQOzTzNcH13sGFjTcxV2koSnCCOvqjxaoaV7VnBHEflgk4e9OYXnvbwMVFeQ6b7Kb3TmX6TCkdg1Aqk09osZ1V26QvB73a/N1Y/ECG+IwQ4Np84fyz4pJenC/1GgRduvvJpY8tlAC38a3SYHW3/KhqfPfpOWk0my9DFJfnbA2ZzRDtESvYJE06ewBsaFGukyTeXtHdaUl7NmRQ3tTkGiqS20sMbagbjm4YWs/gPksgIB8/H7HdeVPs95a2jII2iQThMGCUJpXLfWVsz5qGHqlH+Z46kQP+0PoihAOYzvHOeqfAUfm4hQjeMykcIcrW0vKxcdfDtoMhL/iBKuJldKFCk0XmcHPowlXN8wkQK7EnhlnOGsmVJJJeG4BJCKjVWvGxqKVENaPSd5pUayxmUqdKxhwxPDxjLmRZEAMPkM4C2nOSo2M7BfjtzCN8jzPFn84Tc+qHW+9O2e5zWNdD7ibihbUfn9+9P22B4R5CcwjU0dzatO/YzvvjNE9YMjGJGEb7Udr0u3jNtHl9h9B1Z4I8nVLawIgh9JvyU6bxePY/ajFBoHmEO0zKHMb7+JqKBb1F9PG82M/6qMc/vaNxyW1xUT/wYZB7syS0/k5kwR8Ld+JLGoXVdEtBEADwLY18GMgVslG4zeXxflpXg+obMe4pPoJ/cCmeHv5VKcNCcFdL4okMM8tSK+UXeTYsXHOarvu8jeFveGWtemv4jgSiuJMIyLuiDeBAM+HLuXogwF3WuW1r31n0nV5ddk11H5soAF5t/wqfNPc6sWaHo+TcO+R6E0tzVVwGd5+huzlnIO3+nZtAKEjetmOU6SSmKJojvnBx67tXJeUJCeJVJyJLHGgRlwYdZThNCURayluddazihZkHgeRh931jP5x6oe+n+Q3KwhrZKE3SyRbeV+wAg7101yzH/ufy3S3JB/j8E9+y6lyHxDYhB9BYEQZCs+h35PV5fiunr0Y7mWkcCqlucPXny6J4wE9EtThaNNSbBcq+F84Y6ZPQzNk0vovZ6/JEd7UZlZf1KIxMuznjqdBUtaqrUM9h6LZ8/0uEBwVNn53D2mFqxYFwJhbM5HMAP17PikxzJ9YI72rqx2zs6fWwgmLbQN/ql33PHj+xZ60Zrp3c1lRr0LI//utur+X5EZcYRPlomdHghPXV2/ev3WiOiAoDuCz/R3zfQyCn6p3KQL5xLFs73Pzea4t9/92tvxQf/dkBHk4+LXAtFayYELmh65hCn+lN0m8PBDv78EJEpWa6TGnskJA5ZQ0eVS6D0aIaYeU1yZiqsJanPLcLFuyF2zSQlV21DfKwpfxXNEciQoYf/Iq2b+BreXjFj9EOmTKPKGR3xivzME5ZYhIAeJ/wfQk3NfZH1/PiUAZOGZpphCFCjOThiTXQAIkc6YGwXOhAeVztQGYXowNiK6Z740w5WdIL5+8qWmx+zGzBonmFdOnQaJZahRWbh62iuIF/OWGipUcyhzQiH6E8Y5g7bRAsXSll5t09NhS7+VK1cNIlSUMVEo9WPaSW/zzyVJ1EpBDUapZJQMZhESOnZYUyvmO8y8AE1OhLDqmqTpVSaP7kCYlH3kXO6a5hFlaSG4cgM+FoqJgpLMbqKdlCMOX9A59rfD4AaZxUm9nTqZcL/UClPJCwoMvHFJb9PzPudugsxV+wD6Q9SLDNQs8nt72G9V+w4U75QUjChSzslhleNgCrGuWhd8yHtLlYupm++YSTEBXSVcN97RIAIl9guJlYc7heziV6rWuDDEWzFMdWqhxJrptpE+F5+pwMGOWaKv7dfDCrngQpHpd/c0itiMeNWdeHq+Ga99xRDo2JyA6uKieqoAvQwcS8GnVBf9xyBQowQ6TDYC/ZbXy3Axc9ZhA3X+3B5oTOQ+h+m208ujUK6DJmyZFPKoaKGm09aRy9XHgMjk3wFChUxF5gy1t+l0XzXQKVf0NXQp7MAbDjNgN8/R1ezEOU3rK6sn7VzbBTQD0fy4Wbq+gLyHIBBQDsSsqz3G0JAjmc5WHNRM2NZUzMJrSxDP02FDjQvOiXOpp8SF6iTQA0eban8Ow3tzhEoYGd9gYcRXf8M7+lXrBWHHFs=";

// node_modules/katex/dist/fonts/KaTeX_Size1-Regular.woff2
var KaTeX_Size1_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Size2-Regular.woff2
var KaTeX_Size2_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Size3-Regular.woff2
var KaTeX_Size3_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Size4-Regular.woff2
var KaTeX_Size4_Regular_default = "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";

// node_modules/katex/dist/fonts/KaTeX_Typewriter-Regular.woff2
var KaTeX_Typewriter_Regular_default = "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";

// src/fonts.js
var FONTS = {};
FONTS["KaTeX_AMS-Regular"] = KaTeX_AMS_Regular_default;
FONTS["KaTeX_Caligraphic-Bold"] = KaTeX_Caligraphic_Bold_default;
FONTS["KaTeX_Caligraphic-Regular"] = KaTeX_Caligraphic_Regular_default;
FONTS["KaTeX_Fraktur-Bold"] = KaTeX_Fraktur_Bold_default;
FONTS["KaTeX_Fraktur-Regular"] = KaTeX_Fraktur_Regular_default;
FONTS["KaTeX_Main-Bold"] = KaTeX_Main_Bold_default;
FONTS["KaTeX_Main-BoldItalic"] = KaTeX_Main_BoldItalic_default;
FONTS["KaTeX_Main-Italic"] = KaTeX_Main_Italic_default;
FONTS["KaTeX_Main-Regular"] = KaTeX_Main_Regular_default;
FONTS["KaTeX_Math-BoldItalic"] = KaTeX_Math_BoldItalic_default;
FONTS["KaTeX_Math-Italic"] = KaTeX_Math_Italic_default;
FONTS["KaTeX_SansSerif-Bold"] = KaTeX_SansSerif_Bold_default;
FONTS["KaTeX_SansSerif-Italic"] = KaTeX_SansSerif_Italic_default;
FONTS["KaTeX_SansSerif-Regular"] = KaTeX_SansSerif_Regular_default;
FONTS["KaTeX_Script-Regular"] = KaTeX_Script_Regular_default;
FONTS["KaTeX_Size1-Regular"] = KaTeX_Size1_Regular_default;
FONTS["KaTeX_Size2-Regular"] = KaTeX_Size2_Regular_default;
FONTS["KaTeX_Size3-Regular"] = KaTeX_Size3_Regular_default;
FONTS["KaTeX_Size4-Regular"] = KaTeX_Size4_Regular_default;
FONTS["KaTeX_Typewriter-Regular"] = KaTeX_Typewriter_Regular_default;
var fonts_default = FONTS;

// src/main.js
var t = (strings) => typeof openclip !== "undefined" && openclip.i18n ? openclip.i18n(strings) : strings.en;
function stripDelimiters(selection, mode) {
  const text2 = String(selection || "").trim();
  const pairs = [[/^\$\$([\s\S]+)\$\$$/, true], [/^\\\[([\s\S]+)\\\]$/, true], [/^\\\(([\s\S]+)\\\)$/, false], [/^\$([^$]+)\$$/, false]];
  for (const [pattern, display] of pairs) {
    const match = text2.match(pattern);
    if (match) return { source: match[1].trim(), display };
  }
  return { source: text2, display: mode !== "Inline" };
}
function fontFaces(html) {
  const classes = new Set((html.match(/class="([^"]*)"/g) || []).flatMap((c) => c.slice(7, -1).split(/\s+/)));
  const families = /* @__PURE__ */ new Set(["KaTeX_Main", "KaTeX_Math", "KaTeX_Size1", "KaTeX_Size2", "KaTeX_Size3", "KaTeX_Size4", "KaTeX_AMS"]);
  for (const [, selector, body] of katex_min_default.matchAll(/([^{}@]+)\{([^{}]*font-family:\s*"?(KaTeX_\w+)[^{}]*)\}/g)) {
    const family = body.match(/font-family:\s*"?(KaTeX_\w+)/)[1];
    if ((selector.match(/\.([\w-]+)/g) || []).some((c) => classes.has(c.slice(1)))) families.add(family);
  }
  return katex_min_default.match(/@font-face\{[^}]*\}/g).map((face) => {
    const name = face.match(/url\(fonts\/([\w-]+)\.woff2\)/)?.[1];
    if (!name || !families.has(face.match(/font-family:"?(\w+)/)[1]) || !fonts_default[name]) return "";
    return face.replace(/src:[^}]*/, `src:url(data:font/woff2;base64,${fonts_default[name]}) format("woff2")`);
  }).join("");
}
function parseMacros(text2) {
  const macros2 = {};
  const invalid = [];
  for (const raw of String(text2 || "").split(/[\n;]/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(\\[a-zA-Z]+)\s*[:=]\s*(\S.*)$/);
    if (match) macros2[match[1]] = match[2].trim();
    else invalid.push(line);
  }
  return { macros: macros2, invalid };
}
var SIZES = { Small: "1.2em", Medium: "1.6em", Large: "2.2em" };
var LIGHT = "background:#fff;color:#000";
var DARK = "background:#1e1e1e;color:#f0f0f0";
function themeCSS(theme) {
  if (theme === "Light") return `html,body{${LIGHT}}`;
  if (theme === "Dark") return `html,body{${DARK}}`;
  return `html,body{${LIGHT}}@media (prefers-color-scheme:dark){html,body{${DARK}}}`;
}
function renderDocument(source, display, settings = {}) {
  const math2 = katex.renderToString(source, { displayMode: display, throwOnError: true, output: "htmlAndMathml", trust: false, strict: "ignore", macros: parseMacros(settings.macros).macros });
  const style = fontFaces(math2) + katex_min_default.replace(/@font-face\{[^}]*\}/g, "") + "html,body{margin:0}body{padding:16px}.katex-display{margin:0}" + themeCSS(settings.theme) + `.katex{font-size:${SIZES[settings.size] || SIZES.Medium}}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>LaTeX</title><style>${style}</style></head><body>${math2}</body></html>`;
}
function base64UTF8(text2) {
  const bytes = encodeURIComponent(text2).replace(/%([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const out = [];
  for (let i2 = 0; i2 < bytes.length; i2 += 3) {
    const a = bytes.charCodeAt(i2), b = bytes.charCodeAt(i2 + 1), c = bytes.charCodeAt(i2 + 2);
    out.push(alphabet[a >> 2] + alphabet[(a & 3) << 4 | b >> 4] + (i2 + 1 < bytes.length ? alphabet[(b & 15) << 2 | c >> 6] : "=") + (i2 + 2 < bytes.length ? alphabet[c & 63] : "="));
  }
  return out.join("");
}
function action(selection) {
  try {
    const text2 = typeof selection === "string" ? selection : openclip.input.text;
    const settings = typeof openclip !== "undefined" && openclip.options || {};
    const { source, display } = stripDelimiters(text2, settings.mode);
    if (!source) {
      throw new Error(t({ en: "Select a LaTeX math expression to render.", "zh-Hans": "\u8BF7\u9009\u62E9\u8981\u6E32\u67D3\u7684 LaTeX \u6570\u5B66\u516C\u5F0F\u3002", "zh-Hant": "\u8ACB\u9078\u53D6\u8981\u6E32\u67D3\u7684 LaTeX \u6578\u5B78\u516C\u5F0F\u3002", fr: "S\xE9lectionnez une expression math\xE9matique LaTeX \xE0 rendre.", ja: "\u63CF\u753B\u3059\u308B LaTeX \u6570\u5F0F\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }));
    }
    if (/\\(documentclass|usepackage|begin\{document\})/.test(source)) {
      throw new Error(t({ en: "Only LaTeX math expressions are supported, not full documents.", "zh-Hans": "\u4EC5\u652F\u6301 LaTeX \u6570\u5B66\u516C\u5F0F\uFF0C\u4E0D\u652F\u6301\u5B8C\u6574\u6587\u6863\u3002", "zh-Hant": "\u50C5\u652F\u63F4 LaTeX \u6578\u5B78\u516C\u5F0F\uFF0C\u4E0D\u652F\u63F4\u5B8C\u6574\u6587\u4EF6\u3002", fr: "Seules les expressions math\xE9matiques LaTeX sont prises en charge, pas les documents complets.", ja: "LaTeX \u306E\u6570\u5F0F\u306E\u307F\u5BFE\u5FDC\u3057\u3066\u304A\u308A\u3001\u6587\u66F8\u5168\u4F53\u306B\u306F\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u305B\u3093\u3002" }));
    }
    openclip.file({
      data: base64UTF8(renderDocument(source, display, settings)),
      filename: "latex-math.html",
      mimeType: "text/html",
      ...openclip.input.isSecondaryClick ? { action: "copy" } : {}
    });
  } catch (error) {
    openclip.toast(error instanceof Error ? error.message : String(error), "error");
  }
}
module.exports = action;
module.exports.action = action;
module.exports.stripDelimiters = stripDelimiters;
module.exports.parseMacros = parseMacros;
module.exports.renderDocument = renderDocument;
