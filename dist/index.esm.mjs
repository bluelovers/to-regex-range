import { isUnSafeNumLike as t } from "@lazy-assert/check-basic";

const e = Symbol.for("SymCache");

function toRegexRange(n, r, a) {
  if (!1 === t(n)) throw new TypeError("toRegexRange: expected the first argument to be a number");
  if (void 0 === r || n === r) return String(n);
  if (!1 === t(r)) throw new TypeError("toRegexRange: expected the second argument to be a number.");
  n = String(n), r = String(r);
  let o = {
    relaxZeros: !0,
    ...a
  };
  "boolean" == typeof o.strictZeros && (o.relaxZeros = !1 === o.strictZeros);
  let i = n + ":" + r + "=" + String(o.relaxZeros) + String(o.shorthand) + String(o.capture) + String(o.wrap);
  if (toRegexRange[e].hasOwnProperty(i)) return toRegexRange[e][i].result;
  let s = Math.min(n, r), u = Math.max(n, r);
  if (1 === Math.abs(s - u)) {
    let t = n + "|" + r;
    return o.capture ? `(${t})` : !1 === o.wrap ? t : `(?:${t})`;
  }
  let g = hasPadding(n) || hasPadding(r), c = {
    min: n,
    max: r,
    a: s,
    b: u
  }, l = [], f = [];
  return g && (c.isPadded = g, c.maxLen = String(c.max).length), s < 0 && (f = splitToPatterns(u < 0 ? Math.abs(u) : 1, Math.abs(s), c, o), 
  s = c.a = 0), u >= 0 && (l = splitToPatterns(s, u, c, o)), c.negatives = f, c.positives = l, 
  c.result = function collatePatterns(t, e, n) {
    let r = filterPatterns(t, e, "-", !1) || [], a = filterPatterns(e, t, "", !1) || [], o = filterPatterns(t, e, "-?", !0) || [];
    return r.concat(o).concat(a).join("|");
  }(f, l), !0 === o.capture ? c.result = `(${c.result})` : !1 !== o.wrap && l.length + f.length > 1 && (c.result = `(?:${c.result})`), 
  toRegexRange[e][i] = c, c.result;
}

function rangeToPattern(t, e, n) {
  if (t === e) return {
    pattern: t,
    count: [],
    digits: 0
  };
  let r = function zip(t, e) {
    let n = [];
    for (let r = 0; r < t.length; r++) n.push([ t[r], e[r] ]);
    return n;
  }(t, e), a = r.length, o = "", i = 0;
  for (let t = 0; t < a; t++) {
    let [e, n] = r[t];
    e === n ? o += e : "0" !== e || "9" !== n ? o += `[${s = e}${(u = n) - s == 1 ? "" : "-"}${u}]` : i++;
  }
  var s, u;
  return i && (o += !0 === n.shorthand ? "\\d" : "[0-9]"), {
    pattern: o,
    count: [ i ],
    digits: a
  };
}

function splitToPatterns(t, e, n, r) {
  let a, o = function splitToRanges(t, e) {
    let n = 1, r = 1, a = countNines(t, n), o = new Set([ e ]);
    for (;t <= a && a <= e; ) o.add(a), n += 1, a = countNines(t, n);
    for (a = countZeros(e + 1, r) - 1; t < a && a <= e; ) o.add(a), r += 1, a = countZeros(e + 1, r) - 1;
    return o = [ ...o ], o.sort(compare), o;
  }(t, e), i = [], s = t;
  for (let t = 0; t < o.length; t++) {
    let e = o[t], u = rangeToPattern(String(s), String(e), r), g = "";
    n.isPadded || !a || a.pattern !== u.pattern ? (n.isPadded && (g = padZeros(e, n, r)), 
    u.string = g + u.pattern + toQuantifier(u.count), i.push(u), s = e + 1, a = u) : (a.count.length > 1 && a.count.pop(), 
    a.count.push(u.count[0]), a.string = a.pattern + toQuantifier(a.count), s = e + 1);
  }
  return i;
}

function filterPatterns(t, e, n, r, a) {
  let o = [];
  for (let a of t) {
    let {string: t} = a;
    r || contains(e, "string", t) || o.push(n + t), r && contains(e, "string", t) && o.push(n + t);
  }
  return o;
}

function compare(t, e) {
  return t > e ? 1 : e > t ? -1 : 0;
}

function contains(t, e, n) {
  return t.some((t => t[e] === n));
}

function countNines(t, e) {
  return Number(String(t).slice(0, -e) + "9".repeat(e));
}

function countZeros(t, e) {
  return t - t % Math.pow(10, e);
}

function toQuantifier(t) {
  let [e = 0, n = ""] = t;
  return n || e > 1 ? `{${e + (n ? "," + n : "")}}` : "";
}

function hasPadding(t) {
  return /^-?(0+)\d/.test(t);
}

function padZeros(t, e, n) {
  if (!e.isPadded) return t;
  let r = Math.abs(e.maxLen - String(t).length), a = !1 !== n.relaxZeros;
  switch (r) {
   case 0:
    return "";

   case 1:
    return a ? "0?" : "0";

   case 2:
    return a ? "0{0,2}" : "00";

   default:
    return a ? `0{0,${r}}` : `0{${r}}`;
  }
}

toRegexRange[e] = {}, toRegexRange.clearCache = () => toRegexRange[e] = {}, Object.defineProperty(toRegexRange, "toRegexRange", {
  value: toRegexRange
}), Object.defineProperty(toRegexRange, "default", {
  value: toRegexRange
});

export { e as SymCache, toRegexRange as default, toRegexRange };
//# sourceMappingURL=index.esm.mjs.map
