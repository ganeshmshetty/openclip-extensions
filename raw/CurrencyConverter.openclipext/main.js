// Currency Converter OpenClip Extension
// Converts detected currency amounts into a configured target currency directly inline.

var RATES = {
  USD: 1.0,
  EUR: 0.87,
  JPY: 154.4,
  GBP: 0.74,
  CNY: 6.73,
  AUD: 1.40,
  CAD: 1.39,
  CHF: 0.82,
  HKD: 7.84,
  SGD: 1.27,
  SEK: 9.76,
  KRW: 1347.0,
  NOK: 9.33,
  NZD: 1.73,
  INR: 95.7,
  MXN: 17.1,
  TWD: 31.8,
  ZAR: 16.3,
  BRL: 5.15,
  DKK: 6.47,
  PLN: 3.76,
  THB: 33.2,
  ILS: 3.05,
  IDR: 17661.0,
  CZK: 21.0,
  AED: 3.67,
  SAR: 3.75,
  TRY: 48.6,
  MYR: 4.08,
  PHP: 62.9,
  VND: 25928.0,
  HUF: 316.7
};


var SYMBOL_MAP = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "元": "CNY",
  "₹": "INR",
  "₩": "KRW",
  "₺": "TRY",
  "฿": "THB",
  "₪": "ILS",
  "₫": "VND",
  "₱": "PHP",
  "Kč": "CZK",
  "zł": "PLN",
  "A$": "AUD",
  "AU$": "AUD",
  "C$": "CAD",
  "CA$": "CAD",
  "NZ$": "NZD",
  "HK$": "HKD",
  "S$": "SGD",
  "NT$": "TWD",
  "R$": "BRL",
  "Mex$": "MXN",
  "RM": "MYR",
  "Rp": "IDR",
  "Ft": "HUF"
};

var FORMAT_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  KRW: "₩",
  TRY: "₺",
  THB: "฿",
  ILS: "₪",
  VND: "₫",
  PHP: "₱",
  CZK: "Kč ",
  PLN: "zł ",
  CAD: "CA$",
  AUD: "AU$",
  NZD: "NZ$",
  HKD: "HK$",
  SGD: "S$",
  TWD: "NT$",
  BRL: "R$",
  MXN: "Mex$",
  ZAR: "R ",
  SEK: "kr ",
  NOK: "kr ",
  DKK: "kr ",
  CHF: "CHF ",
  AED: "AED ",
  SAR: "SAR ",
  MYR: "RM ",
  IDR: "Rp ",
  HUF: "Ft "
};

var ZERO_DECIMALS = {
  JPY: true,
  KRW: true,
  VND: true,
  IDR: true,
  HUF: true
};

var PATTERN = /(?:(A\$|AU\$|C\$|CA\$|NZ\$|HK\$|S\$|NT\$|R\$|Mex\$|RM|Rp|Kč|zł|[\$€£¥元₹₩₺฿₪₫₱])\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?)|(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?)\s*(A\$|AU\$|C\$|CA\$|NZ\$|HK\$|S\$|NT\$|R\$|Mex\$|RM|Rp|Kč|zł|[\$€£¥元₹₩₺฿₪₫₱])|(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?)\s*([A-Za-z]{3})|([A-Za-z]{3})\s*(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:[.,]\d+)?))/i;

function parseAmount(str) {
  if (!str) return NaN;
  if (str.indexOf(",") !== -1 && str.indexOf(".") !== -1) {
    if (str.indexOf(",") < str.indexOf(".")) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(/\./g, "").replace(",", ".");
    }
  } else if (str.indexOf(",") !== -1) {
    var parts = str.split(",");
    if (parts[1] && parts[1].length === 3 && parts.length > 1) {
      str = str.replace(/,/g, "");
    } else {
      str = str.replace(",", ".");
    }
  }
  return parseFloat(str);
}

function parseCurrency(input) {
  if (!input) return null;
  var m = input.match(PATTERN);
  if (!m) return null;

  var rawSym = m[1] || m[4] || m[6] || m[7];
  var rawAmount = m[2] || m[3] || m[5] || m[8];
  if (!rawSym || !rawAmount) return null;

  var code = SYMBOL_MAP[rawSym] || rawSym.toUpperCase();
  var amount = parseAmount(rawAmount);
  if (isNaN(amount) || amount <= 0) return null;

  return { code: code, amount: amount };
}

function action(selection, options) {
  options = options || (typeof openclip !== "undefined" ? openclip.options : {}) || {};
  var targetCode = (options.targetCurrency || "USD").toUpperCase();

  var input = "";
  if (typeof openclip !== "undefined" && openclip.input) {
    input = openclip.input.matchedText || openclip.input.text || "";
  } else {
    input = selection || "";
  }

  var parsed = parseCurrency(input);
  if (!parsed) return null;

  var fromCode = parsed.code;
  var amount = parsed.amount;

  // If the selection is already in the target currency, swap to alternative
  if (fromCode === targetCode) {
    targetCode = (targetCode === "USD") ? "EUR" : "USD";
  }

  var fromRate = RATES[fromCode];
  var toRate = RATES[targetCode];
  if (!fromRate || !toRate) return null;

  var inUSD = amount / fromRate;
  var converted = inUSD * toRate;

  var decimals = ZERO_DECIMALS[targetCode] ? 0 : 2;
  var formattedNum = converted.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  var sym = FORMAT_SYMBOLS[targetCode] || (targetCode + " ");
  var result = sym + formattedNum;

  if (typeof openclip !== "undefined" && openclip.input && openclip.input.isSecondaryClick) {
    if (typeof openclip.copy === "function") {
      openclip.copy(result);
    }
  }

  return result;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = action;
  module.exports.action = action;
}
