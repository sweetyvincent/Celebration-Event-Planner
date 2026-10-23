/* Planning engine (runs fully in the browser) + optional Claude AI layer.
   Port of the original Python engine, so the site works on static hosting. */
const Engine = (() => {
  const D = typeof EVENTS_DATA !== 'undefined' ? EVENTS_DATA : require('./data.js');
  const CUR = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
  const RATE = { INR: 0.012, USD: 1, EUR: 1.08, GBP: 1.27 };
  const VIBES = ['elegant', 'rustic', 'fun', 'minimal', 'traditional'];
  const KEY_STORE = 'soiree_ai_key';
  const MODEL = 'claude-sonnet-5-5';

  const pad = n => String(n).padStart(2, '0');
  const isoOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const today0 = () => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); };
  const diffDays = (a, b) => Math.round((a - b) / 86400000);
  const fmtNum = (n, cur) => Math.round(n).toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US');

  // seeded RNG so the same inputs give the same ideas
  function seedFrom(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); return (h ^= h >>> 16) >>> 0; }
  function rng(str) { let a = seedFrom(str); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const shuffle = (arr, r) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };


  // ---------- day-of run-of-show templates: [minutes after start, title] ----------
  const RUN = {
    wedding: { start: '16:00', items: [[0, 'Guests arrive, welcome drinks'], [45, 'Ceremony begins'], [105, 'Ceremony ends, family photos'], [135, 'Cocktail hour and live music'], [195, 'Grand entrance of the couple'], [210, 'Dinner service'], [270, 'Speeches and toasts'], [300, 'Cake cutting'], [315, 'First dance, open dance floor'], [420, 'Late-night snacks'], [465, 'Farewell and sparkler exit']] },
    birthday: { start: '16:00', items: [[0, 'Guests arrive, welcome drinks and music'], [30, 'Icebreaker game'], [60, 'Entertainer or main activity'], [105, 'Food is served'], [150, 'Speeches and surprise video'], [165, 'Cake cutting and Happy Birthday'], [180, 'Dance or karaoke'], [225, 'Return gifts and group photo'], [240, 'Goodbyes and cleanup']] },
    community: { start: '10:00', items: [[-120, 'Setup crew arrives'], [-30, 'Volunteer briefing'], [0, 'Gates open and registration'], [30, 'Welcome and opening ceremony'], [60, 'Performances, round 1'], [150, 'Food and activity stalls at their peak'], [240, 'Talent show or awards'], [300, 'Raffle and thank-yous'], [330, 'Closing and feedback collection'], [360, 'Teardown and cleanup']] },
  };
  const hm = m => { m = Math.max(0, Math.min(m, 1439)); return pad(Math.floor(m / 60)) + ':' + pad(m % 60); };
  const uid = () => Math.random().toString(36).slice(2, 9);
  function runOfShow(type, start) {
    const t = RUN[type] || RUN.birthday, st = start || t.start;
    const [h, m] = st.split(':').map(Number), base = h * 60 + m;
    return { start: st, items: t.items.map(([off, title]) => ({ id: uid(), t: hm(base + off), title, done: false })) };
  }

  function validate(d) {
    if (!D[d.event_type]) return 'Choose a valid event type.';
    if (!d.date || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return 'Please provide the event date.';
    if (parse(d.date) < today0()) return 'The event date must be today or later.';
    const g = parseInt(d.guests, 10), b = parseInt(d.budget, 10);
    if (!(g >= 1 && g <= 5000)) return 'Guests must be between 1 and 5000.';
    if (!(b >= 1)) return 'Budget must be greater than 0.';
    return null;
  }

  function humanize(days) {
    if (days <= 0) return 'Event day';
    if (days === 1) return '1 day before';
    if (days < 14) return `${days} days before`;
    if (days < 60) return `${Math.round(days / 7)} weeks before`;
    return `${Math.round(days / 30)} months before`;
  }

  function tierOf(type, perGuest, cur) {
    const [low, high] = D[type].tiers_usd_per_guest;
    const usd = perGuest * (RATE[cur] || 1);
    return usd < low ? 'budget' : usd < high ? 'standard' : 'premium';
  }

  function budgetOf(type, total) {
    const out = D[type].budget.map(([name, p, tip]) => ({ name, p, pct: Math.round(p * 100), amount: Math.round(total * p), tip }));
    const diff = total - out.reduce((s, c) => s + c.amount, 0);
    out.reduce((m, c) => (c.amount > m.amount ? c : m), out[0]).amount += diff;
    return out;
  }

  function timelineOf(type, eventDate, today) {
    const daysLeft = Math.max(diffDays(eventDate, today), 0);
    const ms = D[type].milestones, maxDays = ms[0][0];
    const scale = maxDays ? Math.min(1, daysLeft / maxDays) : 1;
    const merged = [];
    for (const [d, title, tasks] of ms) {
      const off = d === 0 ? 0 : Math.min(daysLeft, Math.max(1, Math.round(d * scale)));
      const last = merged[merged.length - 1];
      if (last && last.off === off) { last.title += ' + ' + title; last.tasks.push(...tasks); }
      else merged.push({ off, title, tasks: [...tasks] });
    }
    return merged.map(m => {
      const due = new Date(eventDate); due.setDate(due.getDate() - m.off);
      return { title: m.title, when: humanize(m.off), iso: isoOf(due), days_before: m.off, tasks: m.tasks };
    });
  }

  function vendorsOf(type, cats) {
    const by = Object.fromEntries(cats.map(c => [c.name, c.amount]));
    return D[type].vendors.map(([category, key, items, questions]) => ({ category, key, estimate: by[key] || 0, items, questions }));
  }

  function ideasOf(type, vibe, tier, notes, r) {
    const ev = D[type];
    const own = ev.themes[vibe] || [];
    const others = shuffle(Object.entries(ev.themes).filter(([v]) => v !== vibe).flatMap(([, t]) => t), r);
    const themes = [...own, ...others].slice(0, 3).map(([name, description, palette]) => ({ name, description, palette }));
    const sections = Object.entries(ev.ideas).map(([title, items]) => ({ title, items: shuffle(items, r).slice(0, 4) }));
    const extra = (notes || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 5);
    if (extra.length) sections.push({ title: 'Inspired by your notes', items: extra.map(i => `Weave in: ${i}`) });
    return { themes, sections, hacks: tier !== 'premium' ? ev.hacks : ev.hacks.slice(0, 2) };
  }

  function factsOf(type, guests) {
    const f = D[type].facts_pp;
    return [
      { label: 'Venue space', value: `~${(guests * f.sqft).toLocaleString()} sq ft`, hint: 'Seated layout with dance or activity space.' },
      { label: 'Tables', value: String(Math.ceil(guests / f.table)), hint: `Seating about ${f.table} per table.` },
      { label: 'Food portions', value: String(Math.ceil(guests * f.buffer)), hint: 'Includes a buffer for extra guests.' },
      { label: 'Helpers needed', value: String(Math.max(2, Math.ceil(guests / 25))), hint: 'Day-of volunteers or staff.' },
    ];
  }

  function tipsOf(type, daysLeft, tier, guests, perGuest, sym, cur) {
    const t = [], first = D[type].milestones[0][0];
    if (daysLeft < first * 0.4) t.push('Your timeline is compressed. Book the venue and caterer first, and decide quickly on everything else.');
    else if (daysLeft > first) t.push('You have plenty of time. Use it to compare vendors and negotiate early-booking discounts.');
    if (tier === 'budget') t.push(`At ${sym}${fmtNum(perGuest, cur)} per guest, prioritise food and venue and DIY decor and invitations.`);
    else if (tier === 'premium') t.push('Your budget allows a premium experience. Invest in a coordinator so the day runs smoothly.');
    if (guests > 150) t.push('With a large guest list, assign zone captains and share a run-of-show with every vendor.');
    t.push('Get every vendor agreement in writing, with payment milestones and cancellation terms.');
    t.push('Keep the contingency fund untouched until the final week.');
    return t;
  }

  function buildPlan(raw) {
    const type = raw.event_type, ev = D[type];
    const guests = parseInt(raw.guests, 10), total = parseInt(raw.budget, 10);
    const cur = CUR[raw.currency] ? raw.currency : 'INR', sym = CUR[cur];
    const vibe = VIBES.includes(raw.vibe) ? raw.vibe : 'elegant';
    const eventDate = parse(raw.date), today = today0();
    const perGuest = total / guests, tier = tierOf(type, perGuest, cur);
    const daysLeft = Math.max(diffDays(eventDate, today), 0), first = ev.milestones[0][0];
    const urgency = daysLeft < first * 0.25 ? 'rush' : daysLeft < first * 0.6 ? 'tight' : 'comfortable';
    const name = (raw.name || '').trim().slice(0, 80) || ev.label;
    const notes = (raw.notes || '').trim().slice(0, 300);
    const r = rng([name, raw.date, guests, total, vibe].join('|'));
    const categories = budgetOf(type, total);
    return {
      meta: { event_type: type, label: ev.label, emoji: ev.emoji, name, date: raw.date, guests, budget: total, currency: cur, symbol: sym, vibe, city: (raw.city || '').trim().slice(0, 60), notes, days_left: daysLeft, urgency, per_guest: Math.round(perGuest), tier },
      budget: { categories },
      timeline: timelineOf(type, eventDate, today),
      vendors: vendorsOf(type, categories),
      ideas: ideasOf(type, vibe, tier, notes, r),
      facts: factsOf(type, guests),
      tips: tipsOf(type, daysLeft, tier, guests, perGuest, sym, cur),
      ai_powered: false,
    };
  }

  // ---------- optional Claude layer (user's own key, stored only in this browser) ----------
  const store = () => { try { return localStorage; } catch (e) { return null; } };
  const getKey = () => (store() && store().getItem(KEY_STORE)) || '';
  const hasKey = () => !!getKey();
  const setKey = k => { const s = store(); if (!s) return; k ? s.setItem(KEY_STORE, k) : s.removeItem(KEY_STORE); };

  async function callClaude(system, messages, maxTokens) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': getKey(), 'anthropic-version': '2023-06-01', 'content-type': 'application/json', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages }),
    });
    if (!res.ok) throw new Error('AI request failed (' + res.status + ')');
    const j = await res.json();
    return (j.content || []).map(b => b.text || '').join('');
  }

  async function enrich(plan) {
    if (!hasKey()) return plan;
    const m = plan.meta;
    const system = 'You are an expert event planner. Reply with ONLY valid JSON, no markdown. Schema: {"headline": str, "themes": [{"name": str, "description": str, "palette": [4 hex colours]}], "personal_touches": [str], "menu": [str], "activities": [str], "pro_tip": str}. Give 2 themes, 4 personal touches, 4 menu ideas, 4 activities. Be specific, culturally aware and budget-realistic.';
    const prompt = `Event: ${m.label} called '${m.name}' on ${m.date} (${m.days_left} days away)\nGuests: ${m.guests}; total budget ${m.symbol}${fmtNum(m.budget, m.currency)} (${m.currency}), ${m.symbol}${fmtNum(m.per_guest, m.currency)} per guest (${m.tier} tier)\nVibe: ${m.vibe}; city: ${m.city || 'n/a'}; notes: ${m.notes || 'none'}`;
    try {
      const text = await callClaude(system, [{ role: 'user', content: prompt }], 1400);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) { plan.ai = JSON.parse(match[0]); plan.ai_powered = true; }
    } catch (e) { plan.ai_error = String(e.message || e).slice(0, 200); }
    return plan;
  }

  function fallbackChat(message, plan) {
    const m = (message || '').toLowerCase();
    if (!plan || !plan.meta) return 'Generate a plan first, then I can help you refine the budget, timeline, vendors and ideas.';
    const meta = plan.meta, sym = meta.symbol, has = (...k) => k.some(x => m.includes(x));
    const cats = plan.budget.categories, money = n => sym + fmtNum(n, meta.currency);
    if (has('budget', 'cost', 'cheap', 'save', 'afford', 'money')) {
      const top = [...cats].sort((a, b) => b.amount - a.amount).slice(0, 3).map(c => `${c.name} (${money(c.amount)})`).join(', ');
      return `Your biggest spends are ${top}. To save: ${plan.ideas.hacks[0]}. Keep the contingency of ${money(cats[cats.length - 1].amount)} intact.`;
    }
    if (has('timeline', 'when', 'schedule', 'deadline', 'start', 'first')) {
      const t = plan.timeline.find(x => x.iso >= isoOf(today0())) || plan.timeline[0];
      return `You have ${meta.days_left} days to go. Next milestone: ${t.title} (${t.when}). Start with: ${t.tasks[0]}.`;
    }
    if (has('vendor', 'book', 'hire', 'caterer', 'photographer', 'venue')) {
      const v = plan.vendors[0];
      return `Start with ${v.category}: budget about ${money(v.estimate)}. Ask: ${v.questions[0]}`;
    }
    if (has('idea', 'theme', 'decor', 'food', 'game', 'fun', 'entertain')) {
      return `Try the '${plan.ideas.themes[0].name}' theme: ${plan.ideas.themes[0].description} For decor, consider: ${plan.ideas.sections[0].items[0]}.`;
    }
    if (has('guest', 'invite', 'rsvp')) {
      return `For ${meta.guests} guests, plan about ${plan.facts[2].value} food portions and ${plan.facts[1].value} tables. Track RSVPs two weeks before the event.`;
    }
    return "I can help with your budget, timeline, vendors or ideas. Ask me something like 'How can I save money?' or 'What should I do first?'";
  }

  async function chat(history, plan) {
    const last = [...history].reverse().find(h => h.role === 'user');
    if (hasKey() && plan && plan.meta) {
      try {
        const system = 'You are a warm, practical celebration-planning assistant inside an event planner app. Give concise, actionable answers (max 120 words). Use the plan context below. Do not invent vendor names or prices.\nPLAN CONTEXT:\n' + JSON.stringify({ meta: plan.meta, budget: plan.budget, next_steps: plan.timeline.slice(0, 4).map(t => t.title) });
        const msgs = history.slice(-10).map(h => ({ role: h.role, content: String(h.content).slice(0, 2000) }));
        return await callClaude(system, msgs, 500);
      } catch (e) { /* fall through to offline answer */ }
    }
    return fallbackChat(last ? last.content : '', plan);
  }

  const api = { validate, buildPlan, enrich, chat, hasKey, setKey, defaultBudget: budgetOf, runOfShow };
  if (typeof module !== 'undefined') module.exports = api;
  return api;
})();
