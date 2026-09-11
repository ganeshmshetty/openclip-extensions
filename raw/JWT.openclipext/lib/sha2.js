// SHA-256 / SHA-384 / SHA-512 and HMAC in pure JavaScript.
//
// OpenClip scripts run in macOS JavaScriptCore, which has no `crypto` object,
// so HMAC verification of HS256/HS384/HS512 tokens needs a local implementation.
// All functions take and return plain arrays of byte values (0-255).
// SHA-512 uses BigInt for its 64-bit lanes; constants are hex strings so the
// file parses even on engines without BigInt literal syntax.

var K256 = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

var H256 = [
  0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
  0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
];

var K512_HEX = [
  '428a2f98d728ae22', '7137449123ef65cd', 'b5c0fbcfec4d3b2f', 'e9b5dba58189dbbc',
  '3956c25bf348b538', '59f111f1b605d019', '923f82a4af194f9b', 'ab1c5ed5da6d8118',
  'd807aa98a3030242', '12835b0145706fbe', '243185be4ee4b28c', '550c7dc3d5ffb4e2',
  '72be5d74f27b896f', '80deb1fe3b1696b1', '9bdc06a725c71235', 'c19bf174cf692694',
  'e49b69c19ef14ad2', 'efbe4786384f25e3', '0fc19dc68b8cd5b5', '240ca1cc77ac9c65',
  '2de92c6f592b0275', '4a7484aa6ea6e483', '5cb0a9dcbd41fbd4', '76f988da831153b5',
  '983e5152ee66dfab', 'a831c66d2db43210', 'b00327c898fb213f', 'bf597fc7beef0ee4',
  'c6e00bf33da88fc2', 'd5a79147930aa725', '06ca6351e003826f', '142929670a0e6e70',
  '27b70a8546d22ffc', '2e1b21385c26c926', '4d2c6dfc5ac42aed', '53380d139d95b3df',
  '650a73548baf63de', '766a0abb3c77b2a8', '81c2c92e47edaee6', '92722c851482353b',
  'a2bfe8a14cf10364', 'a81a664bbc423001', 'c24b8b70d0f89791', 'c76c51a30654be30',
  'd192e819d6ef5218', 'd69906245565a910', 'f40e35855771202a', '106aa07032bbd1b8',
  '19a4c116b8d2d0c8', '1e376c085141ab53', '2748774cdf8eeb99', '34b0bcb5e19b48a8',
  '391c0cb3c5c95a63', '4ed8aa4ae3418acb', '5b9cca4f7763e373', '682e6ff3d6b2b8a3',
  '748f82ee5defb2fc', '78a5636f43172f60', '84c87814a1f0ab72', '8cc702081a6439ec',
  '90befffa23631e28', 'a4506cebde82bde9', 'bef9a3f7b2c67915', 'c67178f2e372532b',
  'ca273eceea26619c', 'd186b8c721c0c207', 'eada7dd6cde0eb1e', 'f57d4f7fee6ed178',
  '06f067aa72176fba', '0a637dc5a2c898a6', '113f9804bef90dae', '1b710b35131c471b',
  '28db77f523047d84', '32caab7b40c72493', '3c9ebe0a15c9bebc', '431d67c49c100d4c',
  '4cc5d4becb3e42b6', '597f299cfc657e2a', '5fcb6fab3ad6faec', '6c44198c4a475817'
];

var H512_HEX = [
  '6a09e667f3bcc908', 'bb67ae8584caa73b', '3c6ef372fe94f82b', 'a54ff53a5f1d36f1',
  '510e527fade682d1', '9b05688c2b3e6c1f', '1f83d9abfb41bd6b', '5be0cd19137e2179'
];

var H384_HEX = [
  'cbbb9d5dc1059ed8', '629a292a367cd507', '9159015a3070dd17', '152fecd8f70e5939',
  '67332667ffc00b31', '8eb44a8768581511', 'db0c2e0d64f98fa7', '47b5481dbefa4fa4'
];

// ---------------------------------------------------------------- SHA-256

function rotr32(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function sha256(bytes) {
  var length = bytes.length;
  var padded = bytes.slice();
  padded.push(0x80);
  while (padded.length % 64 !== 56) padded.push(0);
  var bitLength = length * 8;
  var high = Math.floor(bitLength / 0x100000000);
  var low = bitLength >>> 0;
  padded.push((high >>> 24) & 0xff, (high >>> 16) & 0xff, (high >>> 8) & 0xff, high & 0xff);
  padded.push((low >>> 24) & 0xff, (low >>> 16) & 0xff, (low >>> 8) & 0xff, low & 0xff);

  var H = H256.slice();
  var W = new Array(64);

  for (var offset = 0; offset < padded.length; offset += 64) {
    var i;
    for (i = 0; i < 16; i++) {
      var p = offset + i * 4;
      W[i] = ((padded[p] << 24) | (padded[p + 1] << 16) | (padded[p + 2] << 8) | padded[p + 3]) >>> 0;
    }
    for (i = 16; i < 64; i++) {
      var w15 = W[i - 15];
      var w2 = W[i - 2];
      var s0 = rotr32(w15, 7) ^ rotr32(w15, 18) ^ (w15 >>> 3);
      var s1 = rotr32(w2, 17) ^ rotr32(w2, 19) ^ (w2 >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }

    var a = H[0], b = H[1], c = H[2], d = H[3];
    var e = H[4], f = H[5], g = H[6], h = H[7];

    for (i = 0; i < 64; i++) {
      var S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      var ch = (e & f) ^ (~e & g);
      var temp1 = (h + S1 + ch + K256[i] + W[i]) >>> 0;
      var S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      var maj = (a & b) ^ (a & c) ^ (b & c);
      var temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + temp1) >>> 0;
      d = c; c = b; b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }

  var out = [];
  for (var j = 0; j < 8; j++) {
    out.push((H[j] >>> 24) & 0xff, (H[j] >>> 16) & 0xff, (H[j] >>> 8) & 0xff, H[j] & 0xff);
  }
  return out;
}

// ---------------------------------------------------------------- SHA-512 / SHA-384

var big = null; // lazily built BigInt constants

function bigConstants() {
  if (big) return big;
  var B = BigInt;
  var mask = B('0xFFFFFFFFFFFFFFFF');
  var toBig = function (hex) { return B('0x' + hex); };
  big = {
    mask: mask,
    zero: B(0),
    eight: B(8),
    sixtyFour: B(64),
    K: K512_HEX.map(toBig),
    H512: H512_HEX.map(toBig),
    H384: H384_HEX.map(toBig),
    shifts: {}
  };
  var needed = [1, 6, 7, 8, 14, 18, 19, 28, 34, 39, 41, 61];
  for (var i = 0; i < needed.length; i++) big.shifts[needed[i]] = B(needed[i]);
  return big;
}

function rotr64(x, n, c) {
  return ((x >> c.shifts[n]) | (x << (c.sixtyFour - c.shifts[n]))) & c.mask;
}

function sha512Core(bytes, initial, outputBytes) {
  if (typeof BigInt !== 'function') {
    throw new Error('SHA-512 requires BigInt support in this JavaScript engine');
  }
  var c = bigConstants();
  var length = bytes.length;
  var padded = bytes.slice();
  padded.push(0x80);
  while (padded.length % 128 !== 112) padded.push(0);
  // 128-bit big-endian bit length; the high 64 bits are always zero here.
  for (var z = 0; z < 8; z++) padded.push(0);
  var bitLength = length * 8;
  var high = Math.floor(bitLength / 0x100000000);
  var low = bitLength >>> 0;
  padded.push((high >>> 24) & 0xff, (high >>> 16) & 0xff, (high >>> 8) & 0xff, high & 0xff);
  padded.push((low >>> 24) & 0xff, (low >>> 16) & 0xff, (low >>> 8) & 0xff, low & 0xff);

  var H = initial.slice();
  var W = new Array(80);
  var K = c.K;
  var mask = c.mask;

  for (var offset = 0; offset < padded.length; offset += 128) {
    var i;
    for (i = 0; i < 16; i++) {
      var word = c.zero;
      for (var k = 0; k < 8; k++) {
        word = (word << c.eight) | BigInt(padded[offset + i * 8 + k]);
      }
      W[i] = word;
    }
    for (i = 16; i < 80; i++) {
      var w15 = W[i - 15];
      var w2 = W[i - 2];
      var s0 = rotr64(w15, 1, c) ^ rotr64(w15, 8, c) ^ (w15 >> c.shifts[7]);
      var s1 = rotr64(w2, 19, c) ^ rotr64(w2, 61, c) ^ (w2 >> c.shifts[6]);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) & mask;
    }

    var a = H[0], b = H[1], cc = H[2], d = H[3];
    var e = H[4], f = H[5], g = H[6], h = H[7];

    for (i = 0; i < 80; i++) {
      var S1 = rotr64(e, 14, c) ^ rotr64(e, 18, c) ^ rotr64(e, 41, c);
      var ch = (e & f) ^ ((~e) & mask & g);
      var temp1 = (h + S1 + ch + K[i] + W[i]) & mask;
      var S0 = rotr64(a, 28, c) ^ rotr64(a, 34, c) ^ rotr64(a, 39, c);
      var maj = (a & b) ^ (a & cc) ^ (b & cc);
      var temp2 = (S0 + maj) & mask;
      h = g; g = f; f = e;
      e = (d + temp1) & mask;
      d = cc; cc = b; b = a;
      a = (temp1 + temp2) & mask;
    }

    H[0] = (H[0] + a) & mask; H[1] = (H[1] + b) & mask;
    H[2] = (H[2] + cc) & mask; H[3] = (H[3] + d) & mask;
    H[4] = (H[4] + e) & mask; H[5] = (H[5] + f) & mask;
    H[6] = (H[6] + g) & mask; H[7] = (H[7] + h) & mask;
  }

  var out = [];
  for (var j = 0; j < 8 && out.length < outputBytes; j++) {
    var hex = H[j].toString(16);
    while (hex.length < 16) hex = '0' + hex;
    for (var p = 0; p < 16 && out.length < outputBytes; p += 2) {
      out.push(parseInt(hex.substr(p, 2), 16));
    }
  }
  return out;
}

function sha512(bytes) {
  return sha512Core(bytes, bigConstants().H512, 64);
}

function sha384(bytes) {
  return sha512Core(bytes, bigConstants().H384, 48);
}

// ---------------------------------------------------------------- HMAC

var HASHES = {
  'SHA-256': { fn: sha256, blockSize: 64 },
  'SHA-384': { fn: sha384, blockSize: 128 },
  'SHA-512': { fn: sha512, blockSize: 128 }
};

function hmac(hashName, keyBytes, messageBytes) {
  var spec = HASHES[hashName];
  if (!spec) throw new Error('Unsupported hash: ' + hashName);
  var key = keyBytes.slice();
  if (key.length > spec.blockSize) key = spec.fn(key);
  while (key.length < spec.blockSize) key.push(0);

  var inner = new Array(spec.blockSize);
  var outer = new Array(spec.blockSize);
  for (var i = 0; i < spec.blockSize; i++) {
    inner[i] = key[i] ^ 0x36;
    outer[i] = key[i] ^ 0x5c;
  }
  var innerHash = spec.fn(inner.concat(messageBytes));
  return spec.fn(outer.concat(innerHash));
}

// Compares two byte arrays without short-circuiting on the first mismatch.
function constantTimeEqual(a, b) {
  var diff = a.length ^ b.length;
  var n = Math.max(a.length, b.length);
  for (var i = 0; i < n; i++) {
    diff |= (a[i] || 0) ^ (b[i] || 0);
  }
  return diff === 0;
}

module.exports = {
  sha256: sha256,
  sha384: sha384,
  sha512: sha512,
  hmac: hmac,
  constantTimeEqual: constantTimeEqual
};
