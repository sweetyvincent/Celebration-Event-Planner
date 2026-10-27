/* Small shared helpers with no state: HTML escaping, ISO dates, colour check and DOM shortcuts.
 * Loaded first in the browser (global `Util`) and importable in Node for unit tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Util = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  /** Escapes text for safe use inside HTML content and quoted attributes. */
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ESCAPES[ch]);

  const pad2 = n => String(n).padStart(2, '0');

  /** Local calendar date as YYYY-MM-DD. */
  const isoDate = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  /** Parses YYYY-MM-DD as a local date at midnight. */
  const parseISO = s => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const todayISO = (now = new Date()) => isoDate(now);

  /** The date `n` days after `from` (default today) as YYYY-MM-DD. */
  const addDaysISO = (n, from = new Date()) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    d.setDate(d.getDate() + n);
    return isoDate(d);
  };

  const clamp = (value, lo, hi) => Math.min(hi, Math.max(lo, value));

  const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  /** True for CSS hex colours such as #fff or #ff6b9d. */
  const isHex = value => typeof value === 'string' && HEX.test(value);

  /** Short random id for list items. Not a security token. */
  const uid = () => Math.random().toString(36).slice(2, 9);

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  return { esc, pad2, isoDate, parseISO, todayISO, addDaysISO, clamp, isHex, uid, $, $$ };
});
