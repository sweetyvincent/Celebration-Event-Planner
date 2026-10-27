/* Pure guest and seating logic: RSVP totals, table capacity, auto-seating and filtering.
 * No DOM access, so all of it is unit tested in Node. A guest looks like
 * { id, name, group, diet, plus, rsvp: 'pending' | 'yes' | 'no', table: number | null }. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Seating = api;
})(typeof self !== 'undefined' ? self : this, function () {
  const DEFAULT_TABLE_SIZE = 8;
  const MAX_TABLES = 60;

  /** Seats a guest needs: themselves plus any plus-ones. */
  const seatsOf = guest => 1 + Math.max(0, parseInt(guest.plus, 10) || 0);

  const sumSeats = guests => guests.reduce((total, g) => total + seatsOf(g), 0);

  /** Seat totals by RSVP status. */
  function guestStats(guests) {
    const by = rsvp => sumSeats(guests.filter(g => g.rsvp === rsvp));
    return { invited: sumSeats(guests), confirmed: by('yes'), pending: by('pending'), declined: by('no') };
  }

  /** Guests who still need a seat (everyone except those who declined). */
  const seatable = guests => guests.filter(g => g.rsvp !== 'no');

  /** Seats taken at table `t`. */
  const usedAt = (guests, t) => sumSeats(seatable(guests).filter(g => g.table === t));

  /** Seats free at table `t` for `guest`, counting the seats the guest already holds there. */
  const freeFor = (guests, guest, t, size) => size - usedAt(guests, t) + (guest.table === t ? seatsOf(guest) : 0);

  /** True when `guest` fits at table `t`. */
  const canSeat = (guests, guest, t, size) => seatsOf(guest) <= freeFor(guests, guest, t, size);

  /** People per table. Newer plans store it in meta.table_size; older ones only mention it in a fact hint. */
  function tableSizeOf(plan) {
    const stored = plan.meta && plan.meta.table_size;
    if (Number.isInteger(stored) && stored > 0) return stored;
    const hint = ((plan.facts || [])[1] || {}).hint || '';
    const match = /(\d+)/.exec(hint);
    return match ? +match[1] : DEFAULT_TABLE_SIZE;
  }

  /** How many tables the plan starts with. */
  const defaultTableCount = plan => Math.min(MAX_TABLES, Math.max(1, Math.ceil(plan.meta.guests / tableSizeOf(plan))));

  /**
   * Fills tables one after another, keeping groups together (guests with no group go last).
   * Does not modify the guests.
   * @returns {{assignments: Array<[string, number]>, tablesNeeded: number}} [guestId, tableIndex] pairs
   */
  function autoSeat(guests, size) {
    const list = seatable(guests)
      .slice()
      .sort((a, b) =>
        Boolean(a.group) === Boolean(b.group)
          ? (a.group || '').localeCompare(b.group || '') || a.name.localeCompare(b.name)
          : a.group
            ? -1
            : 1
      );
    const assignments = [];
    let table = 0;
    let load = 0;
    list.forEach(g => {
      if (load + seatsOf(g) > size) {
        table++;
        load = 0;
      }
      assignments.push([g.id, table]);
      load += seatsOf(g);
    });
    return { assignments, tablesNeeded: table + 1 };
  }

  /** Guests matching an RSVP filter ('all' | 'pending' | 'yes' | 'no') and a case-insensitive text query. */
  function filterGuests(guests, filter, query) {
    const q = String(query || '').toLowerCase();
    return guests.filter(
      g => (filter === 'all' || g.rsvp === filter) && (!q || `${g.name} ${g.group}`.toLowerCase().includes(q))
    );
  }

  /** Catering cost per planned guest, from the food or catering budget line. */
  function foodCostPerGuest(plan) {
    const line = plan.budget.categories.find(c => /cater|food/i.test(c.name));
    return line ? line.amount / Math.max(plan.meta.guests, 1) : 0;
  }

  /**
   * How far confirmed guests are over the planned head count, and the extra catering that could cost.
   * @returns {{over:number, extra:number}} over is 0 when within the plan
   */
  function overCapacity(plan, confirmed) {
    const over = Math.max(0, confirmed - plan.meta.guests);
    return { over, extra: over * foodCostPerGuest(plan) };
  }

  return {
    DEFAULT_TABLE_SIZE,
    MAX_TABLES,
    seatsOf,
    guestStats,
    seatable,
    usedAt,
    freeFor,
    canSeat,
    tableSizeOf,
    defaultTableCount,
    autoSeat,
    filterGuests,
    foodCostPerGuest,
    overCapacity,
  };
});
