/* Pure helpers for moving a plan in and out of the app: share links, file names,
 * the calendar (.ics) file and the guest CSV. No DOM access, so all of it is unit tested in Node. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlanIO = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX_SHARE_CHARS = 4000;

  /** A safe file-name stem for a plan name. */
  function slug(name) {
    return (
      String(name || 'event')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'event'
    );
  }

  // ---------- share links (#p=<base64 of the UTF-8 JSON inputs>) ----------

  /** Unicode-safe base64 of the wizard inputs. */
  function encodeShare(inputs) {
    const bytes = new TextEncoder().encode(JSON.stringify(inputs));
    let binary = '';
    bytes.forEach(b => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }

  /** Reverse of encodeShare. Returns a plain object, or null for anything else (bad base64, bad JSON, too long). */
  function decodeShare(text) {
    if (typeof text !== 'string' || !text || text.length > MAX_SHARE_CHARS) return null;
    try {
      const bytes = Uint8Array.from(atob(text), ch => ch.charCodeAt(0));
      const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch (e) {
      return null;
    }
  }

  /** Full share URL for the current page address. */
  const shareUrl = (href, inputs) => String(href).split('#')[0] + '#p=' + encodeShare(inputs);

  /** Reads the inputs out of a location hash such as "#p=...". Null when the hash is not a share link. */
  function inputsFromHash(hash) {
    const m = /^#p=([A-Za-z0-9+/=]+)$/.exec(String(hash || ''));
    return m ? decodeShare(m[1]) : null;
  }

  // ---------- calendar (.ics) ----------

  const escapeIcs = text =>
    String(text)
      .replace(/\r/g, '')
      .replace(/\\/g, '\\\\')
      .replace(/[,;]/g, m => '\\' + m)
      .replace(/\n/g, '\\n');

  /** RFC 5545 line folding: no line longer than 75 bytes, never splitting a character. */
  function foldLine(line) {
    const encoder = new TextEncoder();
    const parts = [];
    let current = '';
    let bytes = 0;
    let limit = 75;
    for (const ch of line) {
      const size = encoder.encode(ch).length;
      if (bytes + size > limit) {
        parts.push(current);
        current = '';
        bytes = 0;
        limit = 74; // continuation lines start with one space
      }
      current += ch;
      bytes += size;
    }
    parts.push(current);
    return parts.join('\r\n ');
  }

  const compactDate = iso => iso.replace(/-/g, '');

  function nextDay(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    const pad = n => String(n).padStart(2, '0');
    return `${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`;
  }

  /** Builds an iCalendar file with one all-day event per timeline milestone. */
  function buildIcs(plan, now) {
    const stamp = (now || new Date()).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const stem = slug(plan.meta.name);
    const events = plan.timeline.map((t, i) =>
      [
        'BEGIN:VEVENT',
        `UID:${stem}-${i}@soiree`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${compactDate(t.iso)}`,
        `DTEND;VALUE=DATE:${nextDay(t.iso)}`,
        `SUMMARY:${escapeIcs(plan.meta.name + ': ' + t.title)}`,
        `DESCRIPTION:${escapeIcs(t.tasks.map(x => '• ' + x).join('\n'))}`,
        'END:VEVENT',
      ]
        .map(foldLine)
        .join('\r\n')
    );
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Soiree//Event Planner//EN', ...events];
    return [...lines, 'END:VCALENDAR'].join('\r\n');
  }

  // ---------- guest list CSV ----------

  // Spreadsheet apps run cells that start with these characters as formulas, so a guest named
  // "=HYPERLINK(...)" could do harm when the file is opened. A leading apostrophe makes it plain text.
  const FORMULA_START = /^[=+\-@\t\r]/;

  /** One quoted CSV cell, neutralising spreadsheet formulas. */
  function csvCell(value) {
    let text = String(value ?? '');
    if (FORMULA_START.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  /** CSV text for the guest list. */
  function guestsCsv(guests) {
    const rows = [
      ['Name', 'Group', 'Diet', 'Plus ones', 'RSVP', 'Table'],
      ...guests.map(g => [g.name, g.group, g.diet, g.plus, g.rsvp, g.table == null ? '' : g.table + 1]),
    ];
    return rows.map(row => row.map(csvCell).join(',')).join('\n');
  }

  return {
    slug,
    encodeShare,
    decodeShare,
    shareUrl,
    inputsFromHash,
    escapeIcs,
    foldLine,
    buildIcs,
    csvCell,
    guestsCsv,
  };
});
