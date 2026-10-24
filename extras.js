/* Extra interactive features: live countdown, guest manager, 3D seating planner,
   run-of-show builder, invitation studio and notes. app.js passes a context `c` on each render. */
const Extras = (() => {
  let c = null;
  const S = () => c.store;
  const uid = () => Math.random().toString(36).slice(2, 9);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const seats = g => 1 + (parseInt(g.plus, 10) || 0);

  const RUN = {
    wedding: [['09:00', 'Decor and vendor setup'], ['13:00', 'Hair, makeup and dressing'], ['16:00', 'Guests arrive and welcome drinks'], ['16:30', 'Ceremony'], ['17:30', 'Family photos and cocktail hour'], ['19:00', 'Grand entrance and dinner'], ['20:30', 'Speeches and cake'], ['21:15', 'First dance and party'], ['23:30', 'Farewell and send-off']],
    birthday: [['14:00', 'Finish setup and decor'], ['16:00', 'Guests arrive'], ['16:30', 'Welcome and games'], ['17:30', 'Entertainment or activity'], ['18:15', 'Food is served'], ['19:00', 'Cake cutting and speeches'], ['19:30', 'Dance and photos'], ['20:30', 'Return gifts and goodbyes']],
    community: [['07:00', 'Crew call and site setup'], ['09:00', 'Volunteer briefing'], ['10:00', 'Gates open and registration'], ['10:30', 'Opening ceremony'], ['12:00', 'Food and stalls open'], ['14:00', 'Performances and activities'], ['16:30', 'Prize giving and thank-yous'], ['17:30', 'Wrap-up and cleanup']],
  };
  const defaultRun = () => (RUN[c.plan.meta.event_type] || RUN.wedding).map(([time, title]) => ({ id: uid(), time, title }));

  function ensure() {
    const s = S();
    if (!Array.isArray(s.guests)) s.guests = [];
    if (!Array.isArray(s.run)) s.run = defaultRun();
    if (typeof s.notes !== 'string') s.notes = '';
    if (!s.invite) s.invite = {};
    if (s.seat3d === undefined) s.seat3d = true;
  }

  /* ================= COUNTDOWN ================= */
  let cdTimer = null;
  function startCountdown() {
    clearInterval(cdTimer);
    const el = $('#countdown'); if (!el) return;
    const target = new Date(c.plan.meta.date + 'T00:00:00');
    el.setAttribute('role', 'timer'); el.setAttribute('aria-label', 'Time until ' + c.plan.meta.name);
    el.innerHTML = ['Days', 'Hours', 'Mins', 'Secs'].map(l => `<div class="cd-tile"><b>0</b><small>${l}</small></div>`).join('');
    const tiles = $$('.cd-tile b', el);
    const tick = () => {
      const now = new Date(), diff = target - now;
      if (diff <= 0) {
        const same = c.plan.meta.date === c.todayISO();
        el.innerHTML = `<div class="cd-today">${same ? "🎉 It's celebration day!" : 'This date has passed. Time to plan the next one!'}</div>`;
        clearInterval(cdTimer); return;
      }
      const v = [Math.floor(diff / 864e5), Math.floor(diff / 36e5) % 24, Math.floor(diff / 6e4) % 60, Math.floor(diff / 1e3) % 60];
      tiles.forEach((t, i) => {
        const txt = String(v[i]).padStart(i ? 2 : 1, '0');
        if (t.textContent !== txt) { t.textContent = txt; t.classList.remove('flip-d'); void t.offsetWidth; t.classList.add('flip-d'); }
      });
    };
    tick(); cdTimer = setInterval(tick, 1000);
  }

  /* ================= NOTES ================= */
  function renderNotes() {
    const p = $('#p-overview'); if (!p) return;
    p.insertAdjacentHTML('beforeend', `<div class="card reveal" style="margin-top:18px"><h3>Notes and decisions</h3>
      <textarea id="notes" rows="4" aria-label="Notes and decisions" placeholder="Venue contact, decisions, ideas to remember…" style="margin-top:10px">${esc(S().notes)}</textarea></div>`);
    $('#notes').addEventListener('input', e => { S().notes = e.target.value; c.save(); });
  }

  /* ================= GUESTS ================= */
  let gFilter = 'all', gQuery = '';
  const RS = { pending: '⏳', yes: '✅', no: '❌' };
  const RSL = { pending: 'pending', yes: 'coming', no: 'declined' };

  function gStats() {
    const gs = S().guests;
    const invited = gs.reduce((a, g) => a + seats(g), 0);
    const confirmed = gs.filter(g => g.rsvp === 'yes').reduce((a, g) => a + seats(g), 0);
    const declined = gs.filter(g => g.rsvp === 'no').reduce((a, g) => a + seats(g), 0);
    const pending = gs.filter(g => g.rsvp === 'pending').reduce((a, g) => a + seats(g), 0);
    return { invited, confirmed, declined, pending };
  }
  const perGuestCost = () => {
    const cat = c.plan.budget.categories.find(x => /cater|food/i.test(x.name));
    return cat ? cat.amount / Math.max(c.plan.meta.guests, 1) : 0;
  };

  function renderGuests() {
    const p = $('#p-guests'); if (!p) return;
    p.innerHTML = `
      <div class="stats" id="gstats"></div>
      <div id="gwarn"></div>
      <div class="card reveal"><h3>Add guests</h3>
        <form id="gform" class="gform">
          <input name="name" placeholder="Guest name" required maxlength="60" aria-label="Guest name">
          <input name="group" placeholder="Group (Family, Friends…)" maxlength="30" aria-label="Group" list="glist-groups">
          <datalist id="glist-groups"><option>Family</option><option>Friends</option><option>Colleagues</option><option>Neighbours</option></datalist>
          <select name="diet" aria-label="Diet"><option value="">Any diet</option><option>Vegetarian</option><option>Vegan</option><option>Jain</option><option>Halal</option><option>Allergy</option></select>
          <input name="plus" type="number" min="0" max="10" value="0" title="Plus-ones" aria-label="Plus-ones">
          <button class="btn primary">＋ Add</button>
        </form>
        <details class="bulk"><summary>Bulk add (one name per line or comma-separated)</summary>
          <textarea id="gbulk" rows="3" aria-label="Guest names to add, one per line or comma separated" placeholder="Priya Sharma, Arjun Mehta&#10;Neha Kapoor"></textarea>
          <div class="row"><button class="btn ghost" id="gbulkBtn" type="button">Add all</button><button class="btn ghost" id="gsample" type="button">Try sample guests</button></div></details>
      </div>
      <div class="card reveal" style="margin-top:18px">
        <div class="gtools"><div class="chipbar" id="gfilters">${['all', 'pending', 'yes', 'no'].map(f => `<button data-f="${f}" class="${f === gFilter ? 'on' : ''}">${f === 'all' ? 'All' : f === 'yes' ? '✅ Coming' : f === 'no' ? '❌ Declined' : '⏳ Pending'}</button>`).join('')}</div>
          <input id="gsearch" placeholder="Search…" value="${esc(gQuery)}" aria-label="Search guests">
          <button class="btn ghost" id="gcsv">⬇ CSV</button></div>
        <div id="glist" class="glist"></div></div>`;
    drawGuests();
    $('#gform').addEventListener('submit', e => {
      e.preventDefault(); const f = e.target.elements, name = f.name.value.trim(); if (!name) return;
      S().guests.push({ id: uid(), name, group: f.group.value.trim(), diet: f.diet.value, plus: Math.max(0, Math.min(10, parseInt(f.plus.value, 10) || 0)), rsvp: 'pending', table: null });
      c.save(); f.name.value = ''; f.plus.value = 0; f.name.focus(); drawGuests();
    });
    $('#gbulkBtn').onclick = () => {
      const names = $('#gbulk').value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
      if (!names.length) return c.toast('Type some names first');
      names.forEach(name => S().guests.push({ id: uid(), name: name.slice(0, 60), group: '', diet: '', plus: 0, rsvp: 'pending', table: null }));
      $('#gbulk').value = ''; c.save(); drawGuests(); c.toast(`${names.length} guests added`);
    };
    $('#gsample').onclick = () => {
      const demo = [['Aarav Patel', 'Family', 'Vegetarian', 1, 'yes'], ['Meera Nair', 'Family', '', 0, 'yes'], ['Rohan Gupta', 'Friends', '', 1, 'pending'], ['Sara Khan', 'Friends', 'Halal', 0, 'yes'], ['Vikram Rao', 'Colleagues', '', 0, 'no'], ['Ananya Iyer', 'Family', 'Vegan', 0, 'pending'], ['Kabir Singh', 'Friends', '', 2, 'yes'], ['Isha Das', 'Neighbours', 'Jain', 0, 'pending'], ['Dev Malhotra', 'Colleagues', '', 0, 'yes'], ['Tara Joshi', 'Family', 'Allergy', 1, 'yes']];
      demo.forEach(([name, group, diet, plus, rsvp]) => S().guests.push({ id: uid(), name, group, diet, plus, rsvp, table: null }));
      c.save(); drawGuests(); c.toast('Sample guests added');
    };
    $('#gfilters').addEventListener('click', e => { const b = e.target.closest('button[data-f]'); if (!b) return; gFilter = b.dataset.f; $$('#gfilters button').forEach(x => x.classList.toggle('on', x === b)); drawGuests(); });
    $('#gsearch').addEventListener('input', e => { gQuery = e.target.value.toLowerCase(); drawGuests(); });
    $('#gcsv').onclick = () => {
      const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const rows = [['Name', 'Group', 'Diet', 'Plus ones', 'RSVP', 'Table'], ...S().guests.map(g => [g.name, g.group, g.diet, g.plus, g.rsvp, g.table == null ? '' : g.table + 1])];
      c.download('guest-list.csv', rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv');
    };
    $('#glist').addEventListener('click', e => {
      if (e.target.closest('[data-sample]')) { $('#gsample').onclick(); return; }
      const row = e.target.closest('.grow'); if (!row) return;
      const g = S().guests.find(x => x.id === row.dataset.id); if (!g) return;
      const rb = e.target.closest('[data-r]');
      if (rb) { g.rsvp = rb.dataset.r; if (g.rsvp === 'no') g.table = null; c.save(); drawGuests(); if (g.rsvp === 'yes') c.confetti(35); return; }
      if (e.target.closest('[data-del]')) {
        row.classList.add('out');
        setTimeout(() => { S().guests = S().guests.filter(x => x.id !== g.id); c.save(); drawGuests(); }, 250);
      }
    });
  }

  function drawGuests() {
    const st = gStats(), plan = c.plan.meta, over = st.confirmed - plan.guests;
    const stats = $('#gstats'); if (!stats) return;
    stats.innerHTML = [['Invited', st.invited, ''], ['Confirmed', st.confirmed, 'ok'], ['Pending', st.pending, 'warn'], ['Declined', st.declined, 'bad']]
      .map(([l, v, k]) => `<div class="card stat gcard"><div class="n ${k}">${v}</div><small>${l}</small></div>`).join('');
    FX.markTilt(stats);
    const warn = $('#gwarn');
    if (over > 0) {
      const extra = perGuestCost() * over;
      warn.innerHTML = `<div class="card alert bad-bg">⚠️ ${over} confirmed ${over === 1 ? 'guest is' : 'guests are'} over your plan of ${plan.guests}. Catering for them could add about <b>${c.money(extra)}</b>.</div>`;
    } else if (st.confirmed > 0) {
      warn.innerHTML = `<div class="card alert ok-bg">✅ ${st.confirmed} of ${plan.guests} planned seats confirmed (${Math.round(st.confirmed / plan.guests * 100)}%).</div>`;
    } else warn.innerHTML = '';
    const list = S().guests.filter(g => (gFilter === 'all' || g.rsvp === gFilter) && (!gQuery || (g.name + ' ' + g.group).toLowerCase().includes(gQuery)));
    $('#glist').innerHTML = list.length ? list.map(g => `
      <div class="grow" data-id="${g.id}"><div class="gname"><b>${esc(g.name)}</b><small>${[g.group, g.diet, g.plus ? '+' + g.plus : '', g.table != null ? 'Table ' + (g.table + 1) : ''].filter(Boolean).map(esc).join(' · ') || 'No details'}</small></div>
      <div class="seg3" role="group" aria-label="RSVP for ${esc(g.name)}">${['pending', 'yes', 'no'].map(r => `<button type="button" data-r="${r}" class="${g.rsvp === r ? 'on ' + r : ''}" title="${RSL[r]}" aria-label="${esc(g.name)}: ${RSL[r]}" aria-pressed="${g.rsvp === r}"><span aria-hidden="true">${RS[r]}</span></button>`).join('')}</div>
      <button type="button" class="x" data-del aria-label="Remove ${esc(g.name)}"><span aria-hidden="true">✕</span></button></div>`).join('')
      : `<p class="muted center" style="padding:22px">${S().guests.length ? 'No guests match.' : 'No guests yet. Add some above, or <button type="button" class="btn ghost" data-sample style="margin-left:6px;padding:6px 14px;font-size:.8rem">try sample guests</button>'}</p>`;
  }

  /* ================= SEATING ================= */
  let selId = null, dragId = null;
  const tableSize = () => { const m = ((c.plan.facts[1] || {}).hint || '').match(/(\d+)/); return m ? +m[1] : 8; };
  const tableCount = () => { const s = S(); if (s.tables == null) s.tables = Math.max(1, Math.ceil(c.plan.meta.guests / tableSize())); return s.tables; };
  const seatable = () => S().guests.filter(g => g.rsvp !== 'no');
  const used = t => seatable().filter(g => g.table === t).reduce((a, g) => a + seats(g), 0);

  function assign(gid, target) {
    const g = S().guests.find(x => x.id === gid); if (!g) return;
    if (target === 'pool') g.table = null;
    else {
      const t = +target, size = tableSize();
      const free = size - used(t) + (g.table === t ? seats(g) : 0);
      if (seats(g) > free) { c.toast(`Table ${t + 1} is full`); return; }
      g.table = t;
    }
    selId = null; c.save(); renderSeating(); drawGuestsIfVisible();
    c.toast(target === 'pool' ? `${g.name} is now unseated` : `${g.name} seated at table ${+target + 1}`);
    const moved = $(`.gchip[data-gid="${g.id}"]`); if (moved) moved.focus();
  }
  const drawGuestsIfVisible = () => { if ($('#glist')) drawGuests(); };
  const shortName = g => g.name.split(' ')[0] + (g.plus ? ' +' + g.plus : '');
  // the accessible name starts with the visible text, then adds detail
  const chipLabel = (g, inTable) => `${shortName(g)}. ${g.name}${g.plus ? ', with ' + g.plus + ' extra' : ''}${g.group ? ', ' + g.group : ''}${inTable ? ', seated at table ' + (g.table + 1) : ', not seated'}. Enter selects${inTable ? ', Delete unseats' : ''}.`;
  const chip = (g, inTable) => `<span class="gchip ${g.rsvp} ${selId === g.id ? 'sel' : ''}" role="button" tabindex="0" aria-pressed="${selId === g.id}" draggable="true" data-gid="${g.id}" aria-label="${esc(chipLabel(g, inTable))}" title="${esc(g.name)}${g.group ? ' · ' + esc(g.group) : ''}">${esc(shortName(g))}${inTable ? '<span class="unseat" data-un aria-hidden="true"></span>' : ''}</span>`;

  function renderSeating() {
    const p = $('#p-seating'); if (!p) return;
    const n = tableCount(), size = tableSize(), sg = seatable(), pool = sg.filter(g => g.table == null || g.table >= n);
    p.innerHTML = `
      <div class="card"><div class="seat-top">
        <div><h3>Seating planner</h3><p class="muted" style="font-size:.85rem">Drag guests onto tables, or select a guest (tap, or Enter) and then choose a table ("Seat here"). Declined guests are hidden.</p></div>
        <div class="seat-actions"><button class="btn ghost" id="autoSeat">⚡ Auto-seat</button><button class="btn ghost" id="clearSeat">Clear</button>
          <button type="button" class="btn ghost" id="tblMinus" aria-label="Remove a table">−</button><span class="tcount" role="status">${n} tables × ${size}</span><button type="button" class="btn ghost" id="tblPlus" aria-label="Add a table">＋</button>
          <button type="button" class="btn ghost" id="view3d" aria-pressed="${S().seat3d}">3D view: ${S().seat3d ? 'on' : 'off'}</button></div></div>
        ${S().guests.length ? '' : '<p class="muted center" style="padding:14px">Add guests in the Guests tab (or try the sample guests) to start seating.</p>'}
        <div class="seat-wrap">
          <aside class="pool" data-drop="pool" aria-label="Unseated guests"><h3 class="pool-h">Unseated (${pool.length})</h3><button type="button" class="seathere" data-seat="pool">Unseat selected guest</button><div class="chips2">${pool.map(g => chip(g, false)).join('') || '<small class="muted">Everyone is seated 🎉</small>'}</div></aside>
          <div class="floor ${S().seat3d ? 'is3d' : ''}"><div class="floor-in">
            ${Array.from({ length: n }, (_, t) => { const u = used(t), pct = Math.min(u / size * 100, 100); return `<div class="tcard ${u >= size ? 'full' : ''}" role="group" aria-label="Table ${t + 1}, ${u} of ${size} seats taken" data-drop="${t}" data-tilt="4"><div class="thead"><span class="tnum" aria-hidden="true">${t + 1}</span><button type="button" class="seathere" data-seat="${t}" aria-label="Seat here at table ${t + 1}">Seat here</button><small aria-hidden="true">${u}/${size}</small></div><div class="tfill" aria-hidden="true"><i style="width:${pct}%"></i></div><div class="chips2">${sg.filter(g => g.table === t).map(g => chip(g, true)).join('')}</div></div>`; }).join('')}
          </div></div></div></div>`;
    bindSeating(p);
  }

  function bindSeating(p) {
    $('#autoSeat').onclick = () => {
      const size = tableSize(), list = seatable().slice().sort((a, b) => (a.group || '~').localeCompare(b.group || '~') || a.name.localeCompare(b.name));
      list.forEach(g => g.table = null);
      let t = 0, load = 0;
      list.forEach(g => { if (load + seats(g) > size) { t++; load = 0; } g.table = t; load += seats(g); });
      S().tables = Math.max(tableCount(), t + 1); c.save(); renderSeating(); drawGuestsIfVisible(); c.toast('Seated by group'); c.confetti(40);
    };
    $('#clearSeat').onclick = () => { S().guests.forEach(g => g.table = null); selId = null; c.save(); renderSeating(); drawGuestsIfVisible(); };
    $('#tblPlus').onclick = () => { S().tables = Math.min(tableCount() + 1, 60); c.save(); renderSeating(); };
    $('#tblMinus').onclick = () => { const n = tableCount(); if (n <= 1) return; S().guests.forEach(g => { if (g.table === n - 1) g.table = null; }); S().tables = n - 1; c.save(); renderSeating(); drawGuestsIfVisible(); };
    $('#view3d').onclick = () => { S().seat3d = !S().seat3d; c.save(); renderSeating(); };
    if (p._bound) return; p._bound = true;
    p.addEventListener('dragstart', e => { const ch = e.target.closest('.gchip'); if (!ch) return; dragId = ch.dataset.gid; e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; ch.classList.add('drag'); });
    p.addEventListener('dragend', () => { dragId = null; $$('.over', p).forEach(x => x.classList.remove('over')); $$('.drag', p).forEach(x => x.classList.remove('drag')); });
    p.addEventListener('dragover', e => { const d = e.target.closest('[data-drop]'); if (d) { e.preventDefault(); d.classList.add('over'); } });
    p.addEventListener('dragleave', e => { const d = e.target.closest('[data-drop]'); if (d && !d.contains(e.relatedTarget)) d.classList.remove('over'); });
    p.addEventListener('drop', e => { const d = e.target.closest('[data-drop]'); if (!d) return; e.preventDefault(); const id = dragId || e.dataTransfer.getData('text/plain'); assign(id, d.dataset.drop); });
    p.addEventListener('keydown', e => {
      const ch = e.target.closest && e.target.closest('.gchip'); if (!ch || e.target !== ch) return;
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ch.click(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && ch.closest('.tcard')) { e.preventDefault(); assign(ch.dataset.gid, 'pool'); }
    });
    p.addEventListener('click', e => {
      const sb = e.target.closest('[data-seat]');
      if (sb) { if (!selId) { c.toast('Select a guest first, then choose a table'); return; } assign(selId, sb.dataset.seat); return; }
      if (e.target.closest('[data-un]')) { assign(e.target.closest('.gchip').dataset.gid, 'pool'); return; }
      const ch = e.target.closest('.gchip');
      if (ch) { selId = selId === ch.dataset.gid ? null : ch.dataset.gid; $$('.gchip', p).forEach(x => { const on = x.dataset.gid === selId; x.classList.toggle('sel', on); x.setAttribute('aria-pressed', String(on)); }); return; }
      const d = e.target.closest('[data-drop]');
      if (d && selId) assign(selId, d.dataset.drop);
    });
  }

  /* ================= RUN OF SHOW ================= */
  function renderRun() {
    const p = $('#p-run'); if (!p) return;
    p.innerHTML = `<div class="card reveal"><div class="seat-top"><div><h3>Day-of run of show</h3><p class="muted" style="font-size:.85rem">Edit times and activities. Share this with your vendors and helpers.</p></div>
      <div class="seat-actions"><button class="btn ghost" id="runCopy">📋 Copy</button><button class="btn ghost" id="runReset">↺ Reset</button><button class="btn primary" id="runAdd">＋ Add slot</button></div></div>
      <div class="run" id="runList"></div></div>`;
    drawRun();
    $('#runAdd').onclick = () => { S().run.push({ id: uid(), time: '12:00', title: '' }); c.save(); drawRun(true); };
    $('#runReset').onclick = () => { S().run = defaultRun(); c.save(); drawRun(); c.toast('Run of show reset'); };
    $('#runCopy').onclick = async () => {
      const txt = `${c.plan.meta.name}\n${c.longDate(c.plan.meta.date)}\n\n` + sorted().map(r => `${r.time}  ${r.title}`).join('\n');
      try { await navigator.clipboard.writeText(txt); c.toast('Schedule copied'); } catch (e) { c.download('run-of-show.txt', txt, 'text/plain'); }
    };
    $('#runList').addEventListener('input', e => { const r = S().run.find(x => x.id === e.target.closest('.rrow').dataset.id); if (!r) return; if (e.target.name === 'time') r.time = e.target.value; else r.title = e.target.value; c.save(); });
    $('#runList').addEventListener('change', e => { if (e.target.name === 'time') drawRun(); });
    $('#runList').addEventListener('click', e => { const b = e.target.closest('[data-del]'); if (!b) return; S().run = S().run.filter(x => x.id !== b.closest('.rrow').dataset.id); c.save(); drawRun(); });
  }
  const sorted = () => S().run.slice().sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  function drawRun(focusLast) {
    const el = $('#runList'); if (!el) return;
    el.innerHTML = sorted().map((r, i) => `<div class="rrow" data-id="${r.id}" style="animation-delay:${Math.min(i, 10) * 40}ms"><span class="rdot"></span><input type="time" name="time" value="${esc(r.time)}" aria-label="Time"><input name="title" value="${esc(r.title)}" placeholder="What happens?" maxlength="80" aria-label="Activity"><button type="button" class="x" data-del aria-label="Delete slot">✕</button></div>`).join('');
    if (focusLast) { const rows = $$('.rrow input[name=title]', el); const mine = S().run[S().run.length - 1]; const row = $(`.rrow[data-id="${mine.id}"] input[name=title]`, el); (row || rows[rows.length - 1]).focus(); }
  }

  /* ================= INVITATION STUDIO ================= */
  const hexRGB = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = h => { const [r, g, b] = hexRGB(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
  const mix = (a, b, t) => { const A = hexRGB(a), B = hexRGB(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const sat = h => { const [r, g, b] = hexRGB(h).map(v => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };

  function palettes() {
    const out = [];
    const add = (name, pal) => { if (Array.isArray(pal) && pal.length >= 3 && pal.every(x => /^#[0-9a-f]{3,8}$/i.test(x))) out.push({ name, pal: pal.slice(0, 4).concat(pal.slice(0, 4)).slice(0, 4) }); };
    (c.plan.ai_powered && c.plan.ai && Array.isArray(c.plan.ai.themes) ? c.plan.ai.themes : []).forEach(t => add(t.name, t.palette));
    c.plan.ideas.themes.forEach(t => add(t.name, t.palette));
    add('Soirée', ['#2a1b5a', '#ff6b9d', '#7c5cff', '#ffb347']);
    return out;
  }
  const inv = () => {
    const d = S().invite, m = c.plan.meta;
    return Object.assign({ line1: "You're invited to", title: m.name, date: c.longDate(m.date), time: '', venue: m.city || '', message: 'Join us for an unforgettable celebration.', rsvp: '', style: 'gradient', pal: 0 }, d);
  };

  function wrap(x, text, maxW) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line); return lines;
  }

  function drawInvite(cv, face) {
    const W = 600, H = 840, s = cv.width / W, x = cv.getContext('2d'); if (!x) return;
    const d = inv(), P = palettes(), pal = (P[d.pal] || P[0]).pal;
    x.setTransform(s, 0, 0, s, 0, 0); x.clearRect(0, 0, W, H);
    // background
    const c1 = pal[0], c2 = mix(pal[0], pal[2] || pal[1], 0.7);
    if (d.style === 'solid') { x.fillStyle = c1; }
    else { const g = x.createLinearGradient(0, 0, W * 0.7, H); g.addColorStop(0, c1); g.addColorStop(1, c2); x.fillStyle = g; }
    x.fillRect(0, 0, W, H);
    const dark = lum(mix(c1, c2, 0.5)) < 0.55, ink = dark ? '#ffffff' : '#1b1530', soft = dark ? 'rgba(255,255,255,.72)' : 'rgba(27,21,48,.7)';
    const accent = pal.slice().sort((a, b) => sat(b) - sat(a))[0] === c1 ? pal[1] : pal.slice().sort((a, b) => sat(b) - sat(a))[0];
    // decoration
    x.save(); x.globalAlpha = 0.22; x.fillStyle = pal[1];
    if (d.style === 'confetti') { let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 70; i++) { x.fillStyle = pal[i % pal.length]; x.beginPath(); x.arc(rnd() * W, rnd() * H, 3 + rnd() * 8, 0, 6.28); x.fill(); } }
    else { x.beginPath(); x.arc(W * 0.95, H * 0.06, 170, 0, 6.28); x.fill(); x.fillStyle = pal[2] || pal[1]; x.beginPath(); x.arc(W * 0.02, H * 0.97, 210, 0, 6.28); x.fill(); }
    x.restore();
    // frame
    x.strokeStyle = accent; x.lineWidth = 3; x.strokeRect(26, 26, W - 52, H - 52);
    x.lineWidth = 1; x.globalAlpha = 0.6; x.strokeRect(36, 36, W - 72, H - 72); x.globalAlpha = 1;
    x.fillStyle = accent; [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]].forEach(([px, py]) => { x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillRect(-6, -6, 12, 12); x.restore(); });
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    const serif = '"Playfair Display", Georgia, serif', sans = 'Poppins, "Segoe UI", sans-serif';
    const lines = (txt, y, font, color, lh, maxW = 440) => { x.font = font; x.fillStyle = color; const ls = wrap(x, txt, maxW); ls.forEach((l, i) => x.fillText(l, W / 2, y + i * lh)); return y + ls.length * lh; };
    const divider = y => { x.strokeStyle = accent; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 90, y); x.lineTo(W / 2 - 14, y); x.moveTo(W / 2 + 14, y); x.lineTo(W / 2 + 90, y); x.stroke(); x.fillStyle = accent; x.save(); x.translate(W / 2, y); x.rotate(Math.PI / 4); x.fillRect(-5, -5, 10, 10); x.restore(); };

    if (face === 'cover') {
      lines(d.line1.toUpperCase(), 170, `500 17px ${sans}`, soft, 24);
      x.font = '150px serif'; x.fillText(c.plan.meta.emoji, W / 2, 400);
      const y = lines(d.title, 500, `700 54px ${serif}`, ink, 64);
      divider(y + 10);
      lines(d.date, y + 62, `500 19px ${sans}`, soft, 26);
    } else {
      lines('THE DETAILS', 130, `500 15px ${sans}`, soft, 20);
      let y = lines(d.title, 190, `700 38px ${serif}`, ink, 46);
      divider(y); y += 54;
      const row = (label, val) => { if (!val) return; x.font = `500 13px ${sans}`; x.fillStyle = accent; x.fillText(label.toUpperCase(), W / 2, y); y = lines(val, y + 28, `600 21px ${sans}`, ink, 28); y += 22; };
      row('Date', d.date); row('Time', d.time); row('Venue', d.venue);
      if (d.message) { y += 6; y = lines(d.message, y + 10, `italic 400 21px ${serif}`, ink, 30, 420); y += 20; }
      if (d.rsvp) { divider(y + 6); lines('RSVP: ' + d.rsvp, y + 52, `500 17px ${sans}`, soft, 24); }
    }
  }

  function redrawInvite() {
    const a = $('#invCover'), b = $('#invDetails'); if (!a || !b) return;
    try { drawInvite(a, 'cover'); drawInvite(b, 'details'); } catch (e) { /* canvas unavailable */ }
    const d = inv();
    a.setAttribute('aria-label', `Invitation front: ${d.line1} ${d.title}, ${d.date}`);
    b.setAttribute('aria-label', `Invitation back: ${[d.date, d.time, d.venue, d.message, d.rsvp && 'RSVP ' + d.rsvp].filter(Boolean).join('. ')}`);
  }

  function renderInvite() {
    const p = $('#p-invite'); if (!p) return;
    const d = inv(), P = palettes();
    p.innerHTML = `<div class="inv-grid">
      <div class="card reveal"><h3>Invitation studio</h3><p class="muted" style="font-size:.85rem;margin-bottom:12px">Design a shareable invite. Click the card to flip it.</p>
        <div class="iform">
          <label>Top line<input data-k="line1" value="${esc(d.line1)}" maxlength="40"></label>
          <label>Title<input data-k="title" value="${esc(d.title)}" maxlength="60"></label>
          <label>Date<input data-k="date" value="${esc(d.date)}" maxlength="60"></label>
          <label>Time<input data-k="time" value="${esc(d.time)}" placeholder="e.g. 6:30 PM onwards" maxlength="40"></label>
          <label>Venue<input data-k="venue" value="${esc(d.venue)}" placeholder="Venue and city" maxlength="80"></label>
          <label>Message<textarea data-k="message" rows="2" maxlength="140">${esc(d.message)}</textarea></label>
          <label>RSVP details<input data-k="rsvp" value="${esc(d.rsvp)}" placeholder="Phone or email, and date" maxlength="60"></label>
        </div>
        <p class="lbl">Palette</p><div class="palpick" id="palpick">${P.map((x, i) => `<button type="button" data-p="${i}" class="${i === d.pal ? 'on' : ''}" title="${esc(x.name)}" aria-label="${esc(x.name)}">${x.pal.map(col => `<i style="background:${col}"></i>`).join('')}</button>`).join('')}</div>
        <p class="lbl">Style</p><div class="chipbar" id="stylepick">${['gradient', 'solid', 'confetti'].map(s => `<button data-s="${s}" class="${s === d.style ? 'on' : ''}">${s[0].toUpperCase() + s.slice(1)}</button>`).join('')}</div>
        <div class="row" style="margin-top:16px"><button class="btn primary" id="dlCover">⬇ Cover PNG</button><button class="btn primary" id="dlDetails">⬇ Details PNG</button></div></div>
      <div class="inv-stage" data-tilt="9"><div class="inv-in" id="invIn" role="button" tabindex="0" aria-pressed="false" aria-label="Invitation card. Activate to flip between front and back">
        <canvas id="invCover" class="face" width="600" height="840" role="img"></canvas><canvas id="invDetails" class="face back" width="600" height="840" role="img"></canvas></div>
        <p class="muted center" style="font-size:.8rem;margin-top:12px">Tap the card to flip it</p></div></div>`;
    const set = (k, v) => { S().invite[k] = v; c.save(); requestAnimationFrame(redrawInvite); };
    $$('.iform [data-k]', p).forEach(el => el.addEventListener('input', () => set(el.dataset.k, el.value)));
    $('#palpick').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; $$('#palpick button').forEach(x => x.classList.toggle('on', x === b)); set('pal', +b.dataset.p); });
    $('#stylepick').addEventListener('click', e => { const b = e.target.closest('button[data-s]'); if (!b) return; $$('#stylepick button').forEach(x => x.classList.toggle('on', x === b)); set('style', b.dataset.s); });
    const flip = () => { const el = $('#invIn'); el.setAttribute('aria-pressed', el.classList.toggle('flipped')); };
    $('#invIn').addEventListener('click', flip);
    $('#invIn').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    const dl = face => { const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 1680; drawInvite(cv, face); cv.toBlob(b => { if (b) c.downloadBlob(`invitation-${face}.png`, b); }, 'image/png'); };
    $('#dlCover').onclick = () => dl('cover'); $('#dlDetails').onclick = () => dl('details');
    redrawInvite();
    if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('700 40px "Playfair Display"'), document.fonts.load('italic 400 20px "Playfair Display"'), document.fonts.load('500 16px Poppins')]).then(redrawInvite).catch(() => { });
  }

  /* ================= PUBLIC ================= */
  function render(ctx) {
    c = ctx; ensure();
    startCountdown(); renderNotes(); renderGuests(); renderSeating(); renderRun(); renderInvite();
  }
  function onTab(name) {
    if (!c) return;
    if (name === 'seating') renderSeating();
    if (name === 'invite') renderInvite();
    if (name === 'guests') drawGuests();
  }
  return { render, onTab, drawInvite };
})();
