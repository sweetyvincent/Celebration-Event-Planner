/* Soirée · Celebration & Event Planner front-end */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const KEY = 'soiree_v1';
  const COLORS = ['#ff6b9d', '#ffb347', '#7c5cff', '#3ddc97', '#38bdf8', '#f472b6', '#facc15', '#a78bfa', '#fb7185'];
  const DEFAULTS = { wedding: [100, 500000], birthday: [30, 40000], community: [200, 150000] };
  const PLACEHOLDERS = { wedding: "e.g. Aanya & Rohan's Wedding", birthday: "e.g. Mia's 5th Birthday", community: 'e.g. Green Park Diwali Mela' };

  let plan = null;
  let store = { checks: {}, spent: {} };
  let chatHistory = [];
  let dirty = false;

  // ---------- utils ----------
  const money = n => (plan ? plan.meta.symbol : '') + Math.round(n).toLocaleString(plan && plan.meta.currency === 'INR' ? 'en-IN' : 'en-US');
  const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const longDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify({ plan, store })); } catch (e) { } };
  const save = () => { persist(); checkBadges(true); };
  let pops = 0; try { pops = parseInt(localStorage.getItem('soiree_pops') || '0', 10) || 0; } catch (e) { }
  let toastT;
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800); };
  const hex = c => /^#[0-9a-f]{3,8}$/i.test(c) ? c : '#888';

  // shared SVG gradient for rings
  document.body.insertAdjacentHTML('beforeend', '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b9d"/><stop offset="1" stop-color="#ffb347"/></linearGradient></defs></svg>');

  // ---------- confetti ----------
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], raf = null;
  const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
  addEventListener('resize', fit); fit();
  const isCalm = () => document.documentElement.classList.contains('calm');
  function confetti(n = 160) {
    if (isCalm()) return;
    for (let i = 0; i < n; i++) parts.push({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
      vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4, g: .32 + Math.random() * .15,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: COLORS[i % COLORS.length], life: 1
    });
    if (!raf) loop();
  }
  function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0 && p.y < cv.height + 20);
    for (const p of parts) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; p.life -= .005;
      cx.save(); cx.globalAlpha = Math.max(p.life, 0); cx.translate(p.x, p.y); cx.rotate(p.r);
      cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); cx.restore();
    }
    raf = parts.length ? requestAnimationFrame(loop) : (cx.clearRect(0, 0, cv.width, cv.height), null);
  }

  // ---------- reveal + count-up ----------
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  const observe = (root = document) => $$('.reveal', root).forEach(el => { if (!el.classList.contains('in')) io.observe(el); });
  function countUp(root) {
    $$('.cnt', root).forEach(el => {
      const to = +el.dataset.to, t0 = performance.now(), dur = 1200, isMoney = el.dataset.fmt === 'money';
      const fmt = v => isMoney ? money(v) : Math.round(v).toLocaleString();
      const tick = t => { const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(to * e); if (k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
  }

  // ---------- wizard ----------
  let step = 1;
  const dateInput = $('input[name=date]');
  dateInput.min = todayISO(); dateInput.value = addDays(90);
  function showStep(n) {
    step = n;
    $$('.step').forEach(s => s.classList.toggle('active', +s.dataset.step === n));
    $('#stepBar').style.width = (n / 3 * 100) + '%';
    $$('.steps li').forEach((li, i) => li.classList.toggle('on', i < n));
    $('#prev').hidden = n === 1; $('#next').hidden = n === 3; $('#submit').hidden = n !== 3;
    const pb = $('#stepProgress'); pb.setAttribute('aria-valuenow', n); pb.setAttribute('aria-valuetext', `Step ${n} of 3`);
  }
  /** Moves focus to the new step's heading so keyboard and screen-reader users land in the right place. */
  const goToStep = n => { showStep(n); const h = $('.step.active h2'); if (h) h.focus({ preventScroll: true }); };
  function validate2() {
    const f = $('#wizard'), err = $('#err2'); err.textContent = '';
    const fail = (msg, field) => { err.textContent = msg; f.elements[field].focus(); f.elements[field].setAttribute('aria-invalid', 'true'); return false; };
    ['date', 'guests', 'budget'].forEach(n => f.elements[n].removeAttribute('aria-invalid'));
    if (!f.elements.date.value) return fail('Please choose the event date.', 'date');
    if (f.elements.date.value < todayISO()) return fail('The date must be today or later.', 'date');
    const g = +f.elements.guests.value, b = +f.elements.budget.value;
    if (!(g >= 1 && g <= 5000)) return fail('Guests must be between 1 and 5,000.', 'guests');
    if (!(b > 0)) return fail('Please enter a budget greater than 0.', 'budget');
    return true;
  }
  $('#next').onclick = () => { if (step === 2 && !validate2()) return; goToStep(step + 1); };
  $('#prev').onclick = () => goToStep(step - 1);
  $$('input[name=event_type]').forEach(r => r.addEventListener('change', () => {
    const t = r.value; $('input[name=name]').placeholder = PLACEHOLDERS[t];
    FX.scene.setMood(t);
    if (!dirty) { $('input[name=guests]').value = DEFAULTS[t][0]; $('input[name=budget]').value = DEFAULTS[t][1]; }
  }));
  ['guests', 'budget'].forEach(n => $(`input[name=${n}]`).addEventListener('input', () => dirty = true));

  const LOAD_MSGS = ['Crunching your budget…', 'Mapping the timeline…', 'Building vendor checklists…', 'Sprinkling in ideas…', 'Adding the sparkle ✨'];
  $('#wizard').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate2()) { showStep(2); return; }
    const f = e.target;
    const body = Object.fromEntries(new FormData(f).entries());
    const loader = $('#loader'); loader.hidden = false;
    let i = 0; const msg = $('#loaderMsg'); msg.textContent = LOAD_MSGS[0];
    const iv = setInterval(() => msg.textContent = LOAD_MSGS[++i % LOAD_MSGS.length], 700);
    try {
      const bad = Engine.validate(body); if (bad) throw new Error(bad);
      const [data] = await Promise.all([Engine.enrich(Engine.buildPlan(body)), new Promise(r => setTimeout(r, 2200))]);
      plan = data; store = { checks: {}, spent: {} }; chatHistory = []; resetChat(); FX.scene.burst();
      save(); render(true);
    } catch (err) { toast(err.message || 'Could not reach the server.'); }
    finally { clearInterval(iv); loader.hidden = true; }
  });

  // ---------- progress ----------
  function progress() {
    let tt = 0, td = 0, vt = 0, vd = 0;
    plan.timeline.forEach((t, ti) => t.tasks.forEach((_, ki) => { tt++; if (store.checks[`t:${ti}:${ki}`]) td++; }));
    plan.vendors.forEach((v, vi) => v.items.forEach((_, ki) => { vt++; if (store.checks[`v:${vi}:${ki}`]) vd++; }));
    const spent = Object.values(store.spent).reduce((a, b) => a + (+b || 0), 0);
    return { tasks: tt ? td / tt : 0, vendors: vt ? vd / vt : 0, spent, spentPct: Math.min(spent / plan.meta.budget, 1), td, tt, vd, vt };
  }
  const C = 2 * Math.PI * 52;
  const ring = (id, label) => `<div class="ring" role="img" aria-label="${label}: 0%" data-ring="${id}" data-label="${label}"><svg width="120" height="120" viewBox="0 0 120 120" aria-hidden="true"><circle class="bgc" cx="60" cy="60" r="52"/><circle class="fg" id="${id}" cx="60" cy="60" r="52" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><span><b id="${id}t">0%</b><small>${label}</small></span></div>`;
  function updateRings() {
    if (!$('#rTasks')) return;
    const p = progress();
    [['rTasks', p.tasks], ['rVendors', p.vendors], ['rSpent', p.spentPct]].forEach(([id, v]) => {
      $('#' + id).style.strokeDashoffset = C * (1 - v); $('#' + id + 't').textContent = Math.round(v * 100) + '%';
      const wrap = $(`[data-ring="${id}"]`); if (wrap) wrap.setAttribute('aria-label', `${wrap.dataset.label}: ${Math.round(v * 100)}%`);
    });
  }

  // ---------- shared helpers for extras.js ----------
  const downloadBlob = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const ctx = () => ({ plan, store, save, money, toast, confetti, longDate, todayISO, download, downloadBlob });
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- palette theming (colours are adjusted by Engine.accentColors so text stays readable) ----------
  const ACCENT_VARS = { p1: '--p1', p2: '--p2', p3: '--p3', btn1: '--btn1', btn2: '--btn2' };
  function applyPalette(pal, silent) {
    const root = document.documentElement.style;
    if (!pal) {
      Object.values(ACCENT_VARS).forEach(v => root.removeProperty(v));
      FX.scene.setColors(['#ff6b9d', '#ffb347', '#7c5cff', '#3ddc97']); delete store.palette; persist();
      if (!silent) toast('Default colours restored');
      return;
    }
    const a = Engine.accentColors(pal);
    Object.entries(ACCENT_VARS).forEach(([k, v]) => root.setProperty(v, a[k]));
    FX.scene.setColors([a.p1, a.p2, a.p3, ...pal]);
    store.palette = pal;
    if (silent) persist(); else { save(); toast('Palette applied to the whole planner ✨'); confetti(50); }
  }

  // ---------- render ----------
  function render(fresh) {
    const m = plan.meta;
    if (store.pct) applyPct(store.pct);
    applyPalette(store.palette || null, true);
    $('#dashboard').hidden = false;
    $('#dEyebrow').textContent = `${m.emoji} ${m.label} · ${m.vibe}`;
    $('#dTitle').textContent = m.name;
    $('#dSub').textContent = `${longDate(m.date)}${m.city ? ' · ' + m.city : ''} · ${m.guests} guests`;
    $('#p-overview').innerHTML = overviewHTML();
    $('#p-budget').innerHTML = budgetHTML();
    $('#p-timeline').innerHTML = timelineHTML();
    $('#p-vendors').innerHTML = vendorsHTML();
    $('#p-ideas').innerHTML = ideasHTML();
    bindBudget(); bindChecks();
    if (typeof Extras !== 'undefined') Extras.render(ctx());
    checkBadges(false);
    FX.markTilt($('#dashboard')); FX.scene.setMood(m.event_type);
    switchTab('overview', true);
    observe($('#dashboard')); countUp($('#p-overview'));
    setTimeout(() => updateRings(), 150);
    if (fresh) { $('#dashboard').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => confetti(), 500); }
  }

  function overviewHTML() {
    const m = plan.meta;
    const urg = { comfortable: 'Comfortable timeline', tight: 'Tight timeline', rush: 'Rush mode' }[m.urgency];
    return `
    <div class="card cd-card reveal"><p class="eyebrow" style="margin-bottom:10px">Countdown to ${esc(m.name)}</p><div id="countdown" class="countdown" aria-live="off"></div></div>
    <div class="stats">
      <div class="card stat reveal"><div class="n"><span class="cnt" data-to="${m.days_left}">0</span></div><small>days to go</small></div>
      <div class="card stat reveal"><div class="n"><span class="cnt" data-to="${m.budget}" data-fmt="money">0</span></div><small>total budget</small></div>
      <div class="card stat reveal"><div class="n"><span class="cnt" data-to="${m.per_guest}" data-fmt="money">0</span></div><small>per guest · ${esc(m.tier)}</small></div>
      <div class="card stat reveal"><div class="n"><span class="cnt" data-to="${m.guests}">0</span></div><small>guests</small></div>
    </div>
    <div class="two">
      <div class="card reveal"><h3>Your progress</h3><p style="margin:6px 0"><span class="tag ${m.urgency}">${urg}</span></p>
        <div class="rings">${ring('rTasks', 'tasks')}${ring('rVendors', 'vendors')}${ring('rSpent', 'budget used')}</div></div>
      <div class="card reveal"><h3>Quick facts</h3>
        <div class="facts">${plan.facts.map(f => `<div class="fact"><small>${esc(f.label)}</small><b>${esc(f.value)}</b><small>${esc(f.hint)}</small></div>`).join('')}</div></div>
    </div>
    <div class="card reveal" style="margin-top:18px"><h3>Planner tips</h3><ul class="tips">${plan.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    <div class="card reveal" style="margin-top:18px"><h3>Achievements <small class="muted" id="bdgCount" style="font-size:.75rem"></small></h3><p class="muted" style="font-size:.85rem">Unlock badges as you plan. Hover one to spin it.</p><div class="badges" id="badges"></div></div>`;
  }

  // ---------- achievements ----------
  const nChecks = k => Object.keys(store.checks || {}).filter(x => x.startsWith(k + ':') && store.checks[x]).length;
  const BADGES = [
    { id: 'start', icon: '🚀', name: 'Kick-off', how: 'Create your plan', test: () => true },
    { id: 'task1', icon: '✅', name: 'First step', how: 'Tick off a task', test: () => nChecks('t') >= 1 },
    { id: 'half', icon: '🔥', name: 'Halfway there', how: 'Finish half the tasks', test: () => progress().tasks >= .5 },
    { id: 'all', icon: '🏆', name: 'Fully planned', how: 'Finish every task', test: () => progress().tasks >= 1 },
    { id: 'vendor', icon: '🤝', name: 'Vendor pro', how: 'Complete a vendor list', test: () => plan.vendors.some((v, vi) => v.items.every((_, ki) => store.checks[`v:${vi}:${ki}`])) },
    { id: 'whatif', icon: '🎛️', name: 'Balancer', how: 'Use a what-if slider', test: () => !!store.pct },
    { id: 'spend', icon: '💸', name: 'Spend tracker', how: 'Log some spending', test: () => progress().spent > 0 },
    { id: 'guests', icon: '👥', name: 'Guest list', how: 'Add 5 guests', test: () => (store.guests || []).length >= 5 },
    { id: 'seat', icon: '🪑', name: 'Seating pro', how: 'Seat 5 guests', test: () => (store.guests || []).filter(g => g.table != null).length >= 5 },
    { id: 'invite', icon: '💌', name: 'Designer', how: 'Edit your invitation', test: () => Object.keys(store.invite || {}).length > 0 },
    { id: 'palette', icon: '🎨', name: 'Colourist', how: 'Apply a theme palette', test: () => !!store.palette },
    { id: 'pop', icon: '🎈', name: 'Balloon popper', how: 'Pop 5 balloons', test: () => pops >= 5 },
  ];
  function drawBadges(fresh) {
    const el = $('#badges'); if (!el) return;
    const sig = (store.badges || []).join(',') + '|' + (fresh || []).join(',');
    if (el.dataset.sig === sig) return; el.dataset.sig = sig;
    const have = new Set(store.badges || []);
    el.innerHTML = BADGES.map(b => `<div class="bdg ${have.has(b.id) ? 'on' : ''} ${(fresh || []).includes(b.id) ? 'new' : ''}" title="${esc(b.how)}"><b>${b.icon}</b><strong>${esc(b.name)}</strong><small>${esc(b.how)}</small></div>`).join('');
    const c = $('#bdgCount'); if (c) c.textContent = `${have.size}/${BADGES.length}`;
  }
  function checkBadges(announce) {
    if (!plan) return;
    let ok = []; try { ok = BADGES.filter(b => b.test()).map(b => b.id); } catch (e) { return; }
    let fresh = [];
    if (!Array.isArray(store.badges)) store.badges = ok;
    else { fresh = ok.filter(i => !store.badges.includes(i)); if (fresh.length) store.badges = [...new Set([...store.badges, ...ok])]; }
    if (fresh.length) {
      persist();
      if (announce) { toast('🏅 Badge unlocked: ' + fresh.map(i => BADGES.find(b => b.id === i).name).join(', ')); confetti(60); }
    }
    drawBadges(fresh);
  }

  let refreshSpent = () => { };
  function applyPct(p) {
    const total = plan.meta.budget, cats = plan.budget.categories;
    cats.forEach((c, i) => { c.amount = Math.round(total * p[i] / 100); c.pct = Math.round(p[i]); });
    const diff = total - cats.reduce((a, c) => a + c.amount, 0);
    cats.reduce((mx, c) => c.amount > mx.amount ? c : mx, cats[0]).amount += diff;
  }
  function setSlider(i, val) {
    const cats = plan.budget.categories;
    if (!store.basePct) store.basePct = cats.map(c => c.pct);
    const base = store.pct ? store.pct.slice() : cats.map(c => c.pct);
    val = clamp(val, 0, 100);
    const others = base.reduce((a, v, j) => j === i ? a : a + v, 0), rest = 100 - val;
    store.pct = base.map((v, j) => j === i ? val : others > 0 ? v * rest / others : rest / (cats.length - 1));
    applyPct(store.pct); save(); updateBudgetView();
  }
  function updateBudgetView() {
    const cats = plan.budget.categories, CC = 2 * Math.PI * 106; let off = 0;
    const set = (id, t) => { const e = $('#' + id); if (e) e.textContent = t; };
    cats.forEach((c, i) => {
      const len = c.amount / plan.meta.budget * CC, seg = $('#seg' + i);
      if (seg) { seg.dataset.len = len; seg.setAttribute('stroke-dasharray', `${Math.max(len - 2, 0)} ${CC - len + 2}`); seg.setAttribute('stroke-dashoffset', -off); }
      off += len;
      set('lamt' + i, money(c.amount)); set('lpct' + i, c.pct + '%'); set('plan' + i, money(c.amount)); set('sv' + i, c.pct + '%');
      const sl = $(`[data-sl="${i}"]`); if (sl && document.activeElement !== sl) sl.value = store.pct ? store.pct[i] : c.pct;
    });
    const by = Object.fromEntries(cats.map(c => [c.name, c.amount]));
    plan.vendors.forEach((v, vi) => { if (v.key && by[v.key] != null) { v.estimate = by[v.key]; const e = $(`.v-card[data-vi="${vi}"] .est`); if (e) e.textContent = '≈ ' + money(v.estimate); } });
    refreshSpent();
    const d = $('#donutSvg'); if (d) d.setAttribute('aria-label', donutLabel());
  }
  const donutLabel = () => 'Budget split: ' + plan.budget.categories.map(c => `${c.name} ${c.pct}%`).join(', ');
  function budgetHTML() {
    const cats = plan.budget.categories, R = 106, CC = 2 * Math.PI * R;
    let off = 0;
    const segs = cats.map((c, i) => { const len = c.amount / plan.meta.budget * CC; const sg = `<circle class="seg" id="seg${i}" data-len="${len}" data-off="${off}" cx="140" cy="140" r="${R}" stroke="${COLORS[i % COLORS.length]}" stroke-dasharray="0 ${CC}" stroke-dashoffset="${-off}"/>`; off += len; return sg; }).join('');
    return `
    <div class="card reveal"><div class="budget-grid">
      <div class="donut"><svg width="280" height="280" viewBox="0 0 280 280" role="img" id="donutSvg" aria-label="${esc(donutLabel())}"><circle cx="140" cy="140" r="${R}" stroke="rgba(255,255,255,.07)" fill="none" stroke-width="34"/>${segs}</svg>
        <div class="c"><small>Total budget</small><b>${money(plan.meta.budget)}</b></div></div>
      <div class="bl">${cats.map((c, i) => `<div class="bl-row"><i class="dot" style="background:${COLORS[i % COLORS.length]}"></i><div>${esc(c.name)}<small>${esc(c.tip)}</small></div><div class="amt"><span id="lamt${i}">${money(c.amount)}</span><small id="lpct${i}" style="text-align:right">${c.pct}%</small></div></div>`).join('')}</div>
    </div></div>
    <div class="card reveal" style="margin-top:18px"><div class="seat-top"><div><h3>What-if sliders</h3><p class="muted" style="font-size:.85rem">Drag to shift money between categories. The others rebalance automatically.</p></div><button class="btn ghost" id="pctReset">↺ Reset</button></div>
      <div class="sliders">${cats.map((c, i) => `<label class="sl"><span><i class="dot" style="background:${COLORS[i % COLORS.length]}"></i>${esc(c.name)}</span><input type="range" min="0" max="70" step="1" value="${store.pct ? store.pct[i] : c.pct}" data-sl="${i}" aria-label="${esc(c.name)} percent"><b id="sv${i}">${c.pct}%</b></label>`).join('')}</div></div>
    <div class="card reveal" style="margin-top:18px"><h3>Track your spending</h3>
      <p class="muted" style="font-size:.85rem">Enter what you've actually spent. Your numbers are saved in this browser.</p>
      <div class="track" id="spentTrack" role="progressbar" aria-label="Budget spent" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="spentBar"></i></div><small class="muted" id="spentTxt"></small>
      <div style="overflow-x:auto"><table><thead><tr><th scope="col">Category</th><th scope="col">Planned</th><th scope="col">Spent</th><th scope="col">Left</th></tr></thead><tbody>
      ${cats.map((c, i) => `<tr><td>${esc(c.name)}</td><td id="plan${i}">${money(c.amount)}</td><td><input type="number" min="0" data-i="${i}" value="${store.spent[i] || ''}" placeholder="0" aria-label="Spent on ${esc(c.name)}"></td><td id="left${i}"></td></tr>`).join('')}
      </tbody></table></div></div>`;
  }
  function bindBudget() {
    const cats = plan.budget.categories;
    const refresh = () => {
      let spent = 0;
      cats.forEach((c, i) => { const s = +store.spent[i] || 0; spent += s; const left = c.amount - s, el = $('#left' + i); if (!el) return; el.textContent = (left < 0 ? '−' : '') + money(Math.abs(left)); el.className = left < 0 ? 'bad' : 'ok'; });
      const pct = spent / plan.meta.budget * 100, bar = $('#spentBar');
      bar.style.width = Math.min(pct, 100) + '%'; bar.classList.toggle('over', pct > 100);
      $('#spentTrack').setAttribute('aria-valuenow', Math.min(Math.round(pct), 100));
      $('#spentTxt').textContent = `${money(spent)} spent of ${money(plan.meta.budget)} (${Math.round(pct)}%)`;
      updateRings();
    };
    refreshSpent = refresh;
    $$('#p-budget input[data-i]').forEach(inp => inp.addEventListener('input', () => { store.spent[inp.dataset.i] = inp.value; save(); refresh(); }));
    $$('#p-budget input[data-sl]').forEach(sl => sl.addEventListener('input', () => setSlider(+sl.dataset.sl, +sl.value)));
    $('#pctReset').onclick = () => { if (store.basePct) { store.pct = store.basePct.slice(); applyPct(store.pct); save(); updateBudgetView(); toast('Budget split reset'); } else toast('Nothing to reset yet'); };
    refresh();
  }
  function animateDonut() {
    $$('#p-budget .seg').forEach((s, i) => setTimeout(() => {
      const len = +s.dataset.len, C2 = 2 * Math.PI * 106;
      s.setAttribute('stroke-dasharray', `${Math.max(len - 2, 0)} ${C2 - len + 2}`);
    }, 150 + i * 90));
  }

  function timelineHTML() {
    const today = todayISO();
    return `<div class="tl">${plan.timeline.map((t, ti) => {
      const done = t.tasks.every((_, ki) => store.checks[`t:${ti}:${ki}`]);
      return `<div class="card tl-item reveal ${done ? 'done' : ''} ${t.iso < today ? 'past' : ''}" data-ti="${ti}" style="transition-delay:${Math.min(ti, 5) * 60}ms">
        <div class="tl-head"><h3>${esc(t.title)}</h3><span class="when">${esc(t.when)} · ${longDate(t.iso)}</span></div>
        ${t.tasks.map((k, ki) => `<label class="task"><input type="checkbox" data-k="t:${ti}:${ki}" ${store.checks[`t:${ti}:${ki}`] ? 'checked' : ''}><span>${esc(k)}</span></label>`).join('')}</div>`;
    }).join('')}</div>`;
  }

  function vendorsHTML() {
    return `<div class="v-grid">${plan.vendors.map((v, vi) => {
      const d = v.items.filter((_, ki) => store.checks[`v:${vi}:${ki}`]).length;
      return `<div class="card v-card reveal" data-vi="${vi}" style="transition-delay:${(vi % 4) * 70}ms">
        <h3>${esc(v.category)}<span class="est">≈ ${money(v.estimate)}</span></h3>
        <div class="v-prog"><i style="width:${d / v.items.length * 100}%"></i></div>
        ${v.items.map((k, ki) => `<label class="task"><input type="checkbox" data-k="v:${vi}:${ki}" ${store.checks[`v:${vi}:${ki}`] ? 'checked' : ''}><span>${esc(k)}</span></label>`).join('')}
        <details><summary>Questions to ask</summary><ul>${v.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul></details></div>`;
    }).join('')}</div>`;
  }

  function bindChecks() {
    $$('input[data-k]').forEach(cb => cb.addEventListener('change', () => {
      store.checks[cb.dataset.k] = cb.checked; save();
      const [kind, i] = cb.dataset.k.split(':');
      if (kind === 't') {
        const card = $(`.tl-item[data-ti="${i}"]`), all = $$('input[data-k]', card).every(x => x.checked);
        card.classList.toggle('done', all); if (all) confetti(40);
      } else {
        const card = $(`.v-card[data-vi="${i}"]`), boxes = $$('input[data-k]', card);
        $('.v-prog i', card).style.width = boxes.filter(x => x.checked).length / boxes.length * 100 + '%';
      }
      updateRings();
    }));
  }

  let themeList = [];
  function ideasHTML() {
    const ai = plan.ai, id = plan.ideas;
    const list = a => Array.isArray(a) ? a.map(x => `<li>${esc(x)}</li>`).join('') : '';
    let html = '';
    if (plan.ai_powered && ai) {
      html += `<div class="card ai-box reveal"><h3>✨ AI-personalised for you</h3>${ai.headline ? `<p style="margin:6px 0 12px">${esc(ai.headline)}</p>` : ''}
        <div class="ideas-grid">
          ${['personal_touches:Personal touches', 'menu:Menu ideas', 'activities:Activities'].map(s => { const [k, t] = s.split(':'); return Array.isArray(ai[k]) ? `<div><b>${t}</b><ul>${list(ai[k])}</ul></div>` : ''; }).join('')}
        </div>${ai.pro_tip ? `<p class="muted" style="margin-top:12px;font-size:.88rem">💡 ${esc(ai.pro_tip)}</p>` : ''}</div>`;
    }
    const themes = [...(plan.ai_powered && ai && Array.isArray(ai.themes) ? ai.themes : []), ...id.themes];
    themeList = themes;
    html += `<div class="seat-top sec-title"><h3>Theme directions <small class="muted" style="font-size:.7rem">hover or tap a card to flip</small></h3>${store.palette ? '<button class="btn ghost" data-palreset>↺ Default colours</button>' : ''}</div><div class="themes">${themes.map((t, i) => `<div class="flip reveal" tabindex="0" data-flip><div class="flip-in">
      <div class="face card front"><h3>${esc(t.name)}</h3><div class="pal big">${(Array.isArray(t.palette) ? t.palette : []).slice(0, 5).map(c => `<i title="${esc(c)}" style="background:${hex(c)}"></i>`).join('')}</div><small class="muted">Flip for details ↻</small></div>
      <div class="face card back"><h3 style="font-size:1.05rem">${esc(t.name)}</h3><p class="muted" style="font-size:.86rem">${esc(t.description)}</p><button class="btn primary" data-pal="${i}">🎨 Use this palette</button></div></div></div>`).join('')}</div>`;
    html += `<h3 class="sec-title">Ideas to steal</h3><div class="ideas-grid">${id.sections.map(s => `<div class="card reveal"><h3 style="font-size:1.05rem">${esc(s.title)}</h3><ul>${list(s.items)}</ul></div>`).join('')}</div>`;
    html += `<h3 class="sec-title">Money-saving hacks</h3><div class="card reveal"><ul class="tips">${id.hacks.map(h => `<li>${esc(h)}</li>`).join('')}</ul></div>`;
    return html;
  }

  // ---------- tabs ----------
  function switchTab(name, instant) {
    $$('.tab').forEach(t => { const on = t.dataset.tab === name; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    $$('.panel').forEach(p => p.classList.toggle('active', p.id === 'p-' + name));
    const a = $('.tab.active'), ink = $('#tabInk');
    ink.style.left = a.offsetLeft + 'px'; ink.style.width = a.offsetWidth + 'px';
    if (name === 'budget') animateDonut();
    if (name === 'overview') updateRings();
    if (typeof Extras !== 'undefined') Extras.onTab(name);
    FX.markTilt($('#p-' + name));
    observe($('#p-' + name));
    const bar = a.parentElement; bar.scrollTo({ left: a.offsetLeft - (bar.clientWidth - a.offsetWidth) / 2, behavior: instant ? 'auto' : 'smooth' });
    if (!instant) $('#p-' + name).scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  $$('.tab').forEach(t => t.onclick = () => switchTab(t.dataset.tab));
  // Arrow keys / Home / End move between tabs (WAI-ARIA tabs pattern)
  $('.tabs').addEventListener('keydown', e => {
    const tabs = $$('.tab'), i = tabs.indexOf(document.activeElement); if (i < 0) return;
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault(); switchTab(tabs[next].dataset.tab); tabs[next].focus();
  });
  $('#p-ideas').addEventListener('click', e => {
    const pb = e.target.closest('[data-pal]');
    if (pb) { const t = themeList[+pb.dataset.pal]; if (t) applyPalette(t.palette); return; }
    if (e.target.closest('[data-palreset]')) { applyPalette(null); $('#p-ideas').innerHTML = ideasHTML(); observe($('#p-ideas')); FX.markTilt($('#p-ideas')); return; }
    const f = e.target.closest('[data-flip]');
    if (f && matchMedia('(hover: none)').matches) f.classList.toggle('flipped');
  });
  $('#p-ideas').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-flip]')) { e.preventDefault(); e.target.classList.toggle('flipped'); } });
  addEventListener('resize', () => plan && switchTab($('.tab.active').dataset.tab, true));

  // ---------- exports ----------
  const download = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
  const slug = () => (plan.meta.name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'event';
  $('#btnJson').onclick = () => { download(`${slug()}-plan.json`, JSON.stringify({ plan, progress: store }, null, 2), 'application/json'); toast('Plan downloaded'); };
  $('#btnPrint').onclick = () => print();
  $('#btnIcs').onclick = () => {
    const ics = s => String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const d8 = iso => iso.replace(/-/g, '');
    const next = iso => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + 1); return d8(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`); };
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const ev = plan.timeline.map((t, i) => ['BEGIN:VEVENT', `UID:${slug()}-${i}@soiree`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d8(t.iso)}`, `DTEND;VALUE=DATE:${next(t.iso)}`, `SUMMARY:${ics(plan.meta.name + ': ' + t.title)}`, `DESCRIPTION:${ics(t.tasks.map(x => '• ' + x).join('\n'))}`, 'END:VEVENT'].join('\r\n'));
    download(`${slug()}.ics`, ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Soiree//Event Planner//EN', ...ev, 'END:VCALENDAR'].join('\r\n'), 'text/calendar');
    toast('Calendar file downloaded');
  };
  $('#btnShare').onclick = async () => {
    const m = plan.meta, inputs = { event_type: m.event_type, name: m.name, date: m.date, guests: m.guests, budget: m.budget, currency: m.currency, vibe: m.vibe, city: m.city, notes: m.notes };
    const url = location.href.split('#')[0] + '#p=' + btoa(unescape(encodeURIComponent(JSON.stringify(inputs))));
    try { await navigator.clipboard.writeText(url); toast('Share link copied 🔗'); } catch (e) { prompt('Copy this link:', url); }
  };
  $('#btnNew').onclick = () => { $('#planner').scrollIntoView({ behavior: 'smooth' }); showStep(1); };

  // ---------- scroll progress ----------
  const sbar = $('#scrollBar');
  addEventListener('scroll', () => { const h = document.documentElement, m = h.scrollHeight - innerHeight; sbar.style.width = (m > 0 ? scrollY / m * 100 : 0) + '%'; }, { passive: true });

  // ---------- balloon popping (3D scene) ----------
  FX.onPop = () => {
    pops++; try { localStorage.setItem('soiree_pops', String(pops)); } catch (e) { }
    toast(pops === 1 ? '🎈 Pop! Keep going…' : `🎈 Pop! ${pops} popped`); confetti(24);
    if (plan) checkBadges(true);
  };

  // ---------- import (rebuilt from inputs and sanitised: never trust file contents) ----------
  function importPlan(j) {
    const m = j && j.plan && j.plan.meta;
    if (!m) throw new Error('missing plan');
    const inputs = { event_type: m.event_type, name: m.name, date: m.date, guests: m.guests, budget: m.budget, currency: m.currency, vibe: m.vibe, city: m.city, notes: m.notes };
    const bad = Engine.validate(Object.assign({}, inputs, { date: inputs.date && inputs.date >= todayISO() ? inputs.date : addDays(1) }));
    if (bad) throw new Error(bad);
    if (inputs.date < todayISO()) inputs.date = todayISO(); // past events open on "event day"
    const rebuilt = Engine.buildPlan(inputs);
    store = Engine.sanitizeProgress(j.progress, { categories: rebuilt.budget.categories.length, baseline: rebuilt.budget.categories.map(c => c.pct), badgeIds: BADGES.map(b => b.id) });
    plan = rebuilt;
  }
  $('#btnImport').onclick = () => $('#fileImport').click();
  $('#fileImport').onchange = async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > 5e6) return toast('That file is too large');
    try { importPlan(JSON.parse(await f.text())); chatHistory = []; resetChat(); persist(); render(true); toast('Plan imported'); }
    catch (err) { toast('Could not import: that is not a valid plan file'); }
  };

  // ---------- chat ----------
  const body = $('#chatBody');
  const addMsg = (text, who) => { const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = text; body.appendChild(d); body.scrollTop = body.scrollHeight; return d; };
  function resetChat() { body.innerHTML = ''; addMsg(plan ? `Your ${plan.meta.label.toLowerCase()} plan is ready! Ask me anything about it.` : 'Hi! Generate a plan and ask me anything: budget, timeline, vendors or ideas.', 'bot'); }
  const chatBox = $('#chat'), fab = $('#fab');
  function setChat(open) {
    chatBox.hidden = !open; fab.setAttribute('aria-expanded', open); fab.setAttribute('aria-label', open ? 'Close planning assistant' : 'Open planning assistant');
    if (open) $('#chatInput').focus(); else fab.focus();
  }
  fab.onclick = () => setChat(chatBox.hidden);
  $('#chatClose').onclick = () => setChat(false);
  chatBox.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); setChat(false); } });
  async function ask(text) {
    addMsg(text, 'me'); chatHistory.push({ role: 'user', content: text });
    const t = document.createElement('div'); t.className = 'msg bot typing'; t.setAttribute('aria-label', 'Assistant is typing'); t.innerHTML = '<span></span><span></span><span></span>'; body.appendChild(t); body.scrollTop = body.scrollHeight;
    try {
      const answer = await Engine.chat(chatHistory, plan || {}); t.remove();
      const reply = answer || 'Sorry, I could not answer that.';
      addMsg(reply, 'bot'); chatHistory.push({ role: 'assistant', content: reply });
    } catch (e) { t.remove(); addMsg('I could not reach the server. Please try again.', 'bot'); }
  }
  $('#chatForm').addEventListener('submit', e => { e.preventDefault(); const i = $('#chatInput'), v = i.value.trim(); if (v) { i.value = ''; ask(v); } });
  $$('#chatChips button').forEach(b => b.onclick = () => ask(b.textContent));

  // ---------- init ----------
  // ---------- motion preference (OS setting by default, user can override and it is remembered) ----------
  const motionBtn = $('#motionBtn');
  function setMotion(on, remember) {
    document.documentElement.classList.toggle('calm', !on);
    motionBtn.setAttribute('aria-pressed', !on); motionBtn.textContent = on ? 'Motion: on' : 'Motion: off';
    FX.setMotion(on);
    if (remember) { try { localStorage.setItem('soiree_motion', on ? 'on' : 'off'); } catch (e) { } }
  }
  motionBtn.onclick = () => { setMotion(isCalm(), true); toast(isCalm() ? 'Animations paused' : 'Animations on'); };

  (async () => {
    let pref = null; try { pref = localStorage.getItem('soiree_motion'); } catch (e) { }
    const startOn = pref ? pref === 'on' : !matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.toggle('calm', !startOn);
    FX.init(); FX.markTilt(document); setMotion(startOn, false);
    const badge = $('#aiBadge');
    const refreshBadge = () => { const on = Engine.hasKey(); badge.textContent = on ? '✦ Claude AI on' : 'Smart engine · add AI key'; badge.classList.toggle('ai', on); };
    badge.title = 'Optional: add your own Anthropic API key for AI-personalised ideas and chat';
    badge.onclick = () => {
      const k = prompt('Optional: paste your Anthropic API key to turn on AI ideas and chat.\nIt is stored only in this browser and sent only to api.anthropic.com.\nLeave empty to remove a saved key.', '');
      if (k === null) return;
      Engine.setKey(k.trim()); refreshBadge(); toast(k.trim() ? 'AI key saved in this browser' : 'AI key removed');
    };
    refreshBadge();
    const hm = location.hash.match(/^#p=(.+)$/);
    if (hm) {
      try {
        const inputs = JSON.parse(decodeURIComponent(escape(atob(hm[1]))));
        const bad = Engine.validate(inputs);
        if (!bad) { plan = Engine.buildPlan(inputs); store = { checks: {}, spent: {} }; save(); history.replaceState(null, '', location.href.split('#')[0]); render(true); resetChat(); return; }
        toast('Shared plan: ' + bad);
      } catch (e) { }
    }
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && saved.plan) { plan = saved.plan; store = saved.store || { checks: {}, spent: {} }; render(false); resetChat(); return; }
    } catch (e) { }
    resetChat(); showStep(1); observe();
  })();
  showStep(1); observe();
})();
