/* Pure planning logic that used to live inside the UI code: progress, the what-if budget sliders,
 * vendor estimates and the achievement badges. No DOM access, so all of it is unit tested in Node. */
(function (root, factory) {
  const api = factory(typeof Util !== 'undefined' ? Util : require('./util.js'));
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PlanLogic = api;
})(typeof self !== 'undefined' ? self : this, function (Util) {
  // ---------- progress ----------

  /** Number of ticked checkbox keys of one kind ("t" for timeline tasks, "v" for vendor items). */
  const countChecked = (checks, kind) =>
    Object.keys(checks || {}).filter(key => key.startsWith(kind + ':') && checks[key]).length;

  /**
   * Completion figures for the progress rings.
   * @returns {{tasks:number, vendors:number, spent:number, spentPct:number, td:number, tt:number, vd:number, vt:number}}
   *   tasks/vendors/spentPct are fractions between 0 and 1.
   */
  function progress(plan, store) {
    const checks = store.checks || {};
    let tt = 0;
    let td = 0;
    let vt = 0;
    let vd = 0;
    plan.timeline.forEach((t, ti) =>
      t.tasks.forEach((_, ki) => {
        tt++;
        if (checks[`t:${ti}:${ki}`]) td++;
      })
    );
    plan.vendors.forEach((v, vi) =>
      v.items.forEach((_, ki) => {
        vt++;
        if (checks[`v:${vi}:${ki}`]) vd++;
      })
    );
    const spent = Object.values(store.spent || {}).reduce((sum, v) => sum + (+v || 0), 0);
    const budget = plan.meta.budget;
    return {
      tasks: tt ? td / tt : 0,
      vendors: vt ? vd / vt : 0,
      spent,
      spentPct: budget > 0 ? Math.min(spent / budget, 1) : 0,
      td,
      tt,
      vd,
      vt,
    };
  }

  /** "42%" for a fraction. */
  const percentText = fraction => Math.round(fraction * 100) + '%';

  /** stroke-dashoffset that draws `fraction` of a ring with the given circumference. */
  const ringOffset = (circumference, fraction) => circumference * (1 - Util.clamp(fraction, 0, 1));

  // ---------- what-if budget sliders ----------

  /**
   * Moves one category to `value` percent and scales the others so the split still adds up to 100.
   * @param {number[]} pcts current percentages
   * @param {number} index category being changed
   * @param {number} value requested percentage (clamped to 0-100)
   * @returns {number[]} new percentages (the input is not modified)
   */
  function rebalance(pcts, index, value) {
    if (pcts.length <= 1) return pcts.length ? [100] : [];
    const v = Util.clamp(Number(value) || 0, 0, 100);
    const others = pcts.reduce((sum, p, j) => (j === index ? sum : sum + p), 0);
    const rest = 100 - v;
    return pcts.map((p, j) => {
      if (j === index) return v;
      return others > 0 ? (p * rest) / others : rest / (pcts.length - 1);
    });
  }

  /** Whole-number amounts for each percentage that add up to exactly `total` (the rounding gap goes to the biggest). */
  function amountsFor(total, pcts) {
    const amounts = pcts.map(p => Math.round((total * p) / 100));
    if (!amounts.length) return amounts;
    const gap = total - amounts.reduce((a, b) => a + b, 0);
    let biggest = 0;
    amounts.forEach((a, i) => {
      if (a > amounts[biggest]) biggest = i;
    });
    amounts[biggest] += gap;
    return amounts;
  }

  /** Writes percentages and amounts onto the plan's budget categories (in place). */
  function applyPercentages(categories, total, pcts) {
    const amounts = amountsFor(total, pcts);
    categories.forEach((c, i) => {
      c.amount = amounts[i];
      c.pct = Math.round(pcts[i]);
    });
  }

  /** Copies each budget category's amount onto the vendor that is paid from it (in place). */
  function syncVendorEstimates(plan) {
    const byName = Object.fromEntries(plan.budget.categories.map(c => [c.name, c.amount]));
    plan.vendors.forEach(v => {
      if (v.key && byName[v.key] != null) v.estimate = byName[v.key];
    });
  }

  /** Text alternative for the budget donut chart. */
  const donutLabel = categories => 'Budget split: ' + categories.map(c => `${c.name} ${c.pct}%`).join(', ');

  // ---------- achievements ----------

  /** Display data for the badges. Unlock rules live in `UNLOCK` below. */
  const BADGES = [
    { id: 'start', icon: '🚀', name: 'Kick-off', how: 'Create your plan' },
    { id: 'task1', icon: '✅', name: 'First step', how: 'Tick off a task' },
    { id: 'half', icon: '🔥', name: 'Halfway there', how: 'Finish half the tasks' },
    { id: 'all', icon: '🏆', name: 'Fully planned', how: 'Finish every task' },
    { id: 'vendor', icon: '🤝', name: 'Vendor pro', how: 'Complete a vendor list' },
    { id: 'whatif', icon: '🎛️', name: 'Balancer', how: 'Use a what-if slider' },
    { id: 'spend', icon: '💸', name: 'Spend tracker', how: 'Log some spending' },
    { id: 'guests', icon: '👥', name: 'Guest list', how: 'Add 5 guests' },
    { id: 'seat', icon: '🪑', name: 'Seating pro', how: 'Seat 5 guests' },
    { id: 'invite', icon: '💌', name: 'Designer', how: 'Edit your invitation' },
    { id: 'palette', icon: '🎨', name: 'Colourist', how: 'Apply a theme palette' },
    { id: 'pop', icon: '🎈', name: 'Balloon popper', how: 'Pop 5 balloons' },
  ];

  const UNLOCK = {
    start: () => true,
    task1: c => countChecked(c.store.checks, 't') >= 1,
    half: c => c.progress.tasks >= 0.5,
    all: c => c.progress.tasks >= 1,
    vendor: c => c.plan.vendors.some((v, vi) => v.items.every((_, ki) => c.store.checks[`v:${vi}:${ki}`])),
    whatif: c => !!c.store.pct,
    spend: c => c.progress.spent > 0,
    guests: c => (c.store.guests || []).length >= 5,
    seat: c => (c.store.guests || []).filter(g => g.table != null).length >= 5,
    invite: c => Object.keys(c.store.invite || {}).length > 0,
    palette: c => !!c.store.palette,
    pop: c => c.pops >= 5,
  };

  /** Ids of every badge the user has earned right now. */
  function evaluateBadges(plan, store, pops = 0) {
    const ctx = { plan, store: { ...store, checks: store.checks || {} }, pops, progress: progress(plan, store) };
    return BADGES.filter(b => UNLOCK[b.id](ctx)).map(b => b.id);
  }

  /**
   * Compares the saved badge list with the current one.
   * The first time (no saved list) nothing counts as new, so reopening an old plan does not celebrate.
   * @returns {{badges:string[], fresh:string[]}} the list to save and the newly unlocked ids
   */
  function diffBadges(previous, current) {
    if (!Array.isArray(previous)) return { badges: current.slice(), fresh: [] };
    const fresh = current.filter(id => !previous.includes(id));
    return { badges: fresh.length ? [...new Set([...previous, ...current])] : previous, fresh };
  }

  return {
    countChecked,
    progress,
    percentText,
    ringOffset,
    rebalance,
    amountsFor,
    applyPercentages,
    syncVendorEstimates,
    donutLabel,
    BADGES,
    evaluateBadges,
    diffBadges,
  };
});
