// Currency Converter OpenClip Extension
// Converts detected currency amounts into a configured target currency directly inline.

var RATES = {
  USD: 1.0,
  EUR: 0.92,
  JPY: 155.0,
  GBP: 0.79,
  CNY: 7.25,
  AUD: 1.52,
  CAD: 1.36,
  CHF: 0.90,
  HKD: 7.82,
  SGD: 1.34,
  SEK: 10.5,
  KRW: 1380.0,
  NOK: 10.7,
  NZD: 1.65,
  INR: 83.5,
  MXN: 18.2,
  TWD: 32.2,
  ZAR: 18.0,
  BRL: 5.45,
  DKK: 6.88,
  PLN: 3.95,
  THB: 36.5,
  ILS: 3.75,
  IDR: 16200.0,
  CZK: 23.2,
  AED: 3.67,
  SAR: 3.75,
  TRY: 33.5,
  MYR: 4.65,
  PHP: 57.5,
  VND: 25400.0,
  HUF: 365.0
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

var PATTERN = /(?:(A\$|AU\$|C\$|CA\$|NZ\$|HK\$|S\$|NT\$|R\$|Mex\$|RM|Rp|Kč|zł|[\$€£¥元₹₩₺฿₪₫₱])\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:[.,]\d+)?)|(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:[.,]\d+)?)\s*(A\$|AU\$|C\$|CA\$|NZ\$|HK\$|S\$|NT\$|R\$|Mex\$|RM|Rp|Kč|zł|[\$€£¥元₹₩₺฿₪₫₱])|(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:[.,]\d+)?)\s*([A-Za-z]{3})|([A-Za-z]{3})\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:[.,]\d+)?))/i;

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
