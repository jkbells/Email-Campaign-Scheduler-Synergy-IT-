/**
 * HTML rendering for the setup form, result tabs, summary cards and navigation.
 */
function dailyView() {
  let r = dObj().filter(
    (x) => (!fq || (x.date + x.day).toLowerCase().includes(fq)) && (!fs || x.status.startsWith(fs)),
  );
  r.sort((a, b) => (a[sort.k] > b[sort.k] ? 1 : -1) * sort.d);
  const cs = dCols();
  const w = Math.max(600, R.days.length * 8),
    bars = dObj()
      .map(
        (x, i) =>
          `<rect x="${i * 8}" y="${60 - x.util * 0.6}" width="6" height="${x.util * 0.6}" fill="${x.util >= 100 ? '#ed1169' : '#83c0eb'}"><title>${x.date}: ${x.total}/${x.cap}</title></rect>`,
      )
      .join('');
  return `<section class="c"><h2>Daily capacity utilization</h2><div class="tw"><svg viewBox="0 0 ${w} 64" width="${w}" height="90" role="img" aria-label="Daily utilization">${bars}</svg></div></section>
 <section class="c"><div class="row"><input data-f="q" placeholder="Search date or weekday" value="${esc(fq)}" aria-label="Search"><select data-f="s" aria-label="Status"><option value="">All statuses</option>${['Full', 'High', 'OK', 'Idle', 'Deferred'].map((s) => `<option ${fs === s ? 'selected' : ''}>${s}</option>`).join('')}</select><button class="b" data-a="csv">Export CSV</button><button class="b s" data-a="csvd">Daily summary CSV</button><button class="b p" data-a="pdf">Export PDF</button></div>
 <div class="tw" style="max-height:520px"><table><tr>${cs.map((c) => `<th class="so" data-a="sort" data-k="${c[0]}">${esc(c[1])}${sort.k === c[0] ? (sort.d > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr>${r.map((x) => `<tr>${cs.map((c) => (c[0] === 'status' ? `<td><span class="tag ${/Full|Deferred/.test(x.status) ? 'r' : ''}">${x.status}</span></td>` : c[0] === 'util' ? `<td>${x.util}% <div class="bar"><i class="${x.util >= 100 ? 'f' : ''}" style="width:${Math.min(100, x.util)}%"></i></div></td>` : `<td>${esc(x[c[0]] ?? 0)}</td>`)).join('')}</tr>`).join('')}</table></div></section>`;
}
function contactsView() {
  const rows = evRows().filter((r) => !cq || r.join(' ').toLowerCase().includes(cq)),
    sh = rows.slice(0, 300);
  return `<section class="c"><p class="hint">Contacts use internal IDs (C-00001…); no real contact data was provided. Showing ${sh.length} of ${rows.length} events. Exports include all ${R.ev.length}.</p><div class="row"><input data-f="c" placeholder="Search contact, batch, step, date, status" value="${esc(cq)}" style="min-width:260px"></div><div class="tw" style="max-height:560px"><table><tr>${['Contact', 'Batch', 'Step', 'Original due', 'Scheduled', 'Mailbox', 'Delay (days)', 'Status'].map((h) => `<th>${h}</th>`).join('')}</tr>${sh.map((r) => `<tr><td>${r[2]}</td><td>${esc(r[1])}</td><td>${r[3]}. ${esc(r[4])}</td><td>${r[6]}</td><td>${r[7]}</td><td>${r[9]}</td><td>${r[14]}</td><td>${r[15]}</td></tr>`).join('')}</table></div></section>`;
}
function calView() {
  if (calM == null) {
    const t = new Date(R.first * DAY);
    calM = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1) / DAY;
  }
  const t = new Date(calM * DAY),
    y = t.getUTCFullYear(),
    m = t.getUTCMonth(),
    dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(),
    mp = {};
  R.days.forEach((x) => (mp[x.d] = x));
  let cells = '';
  for (let i = 0; i < t.getUTCDay(); i++) cells += '<div style="border:0"></div>';
  for (let i = 1; i <= dim; i++) {
    const d = calM + i - 1,
      x = mp[d],
      u = x ? x.n / R.total : 0;
    cells += `<button data-a="cal" data-d="${d}" class="${calSel === d ? 'sel' : ''} ${x ? '' : 'off'}" style="background:rgba(131,192,235,${u * 0.7})"><b>${i}</b><br>${x ? x.n + ' sent' : ''}${x && x.def ? '<br><span class="tag r">deferred ' + x.def + '</span>' : ''}</button>`;
  }
  let det = '<p class="hint">Select a date to see its events and mailbox utilization.</p>';
  const x = mp[calSel];
  if (x) {
    const evs = R.ev.filter((e) => e.date === calSel);
    det = `<h2>${fd(calSel)} · ${WN[dw(calSel)]}</h2><p>${x.n} of ${R.total} emails. ${x.by.map((v, i) => `${esc(S.steps[i].name)}: ${v}`).join(' · ')}</p>${R.cp.map((c, i) => `<div class="row" style="margin:2px 0"><span style="width:90px">Mailbox ${i + 1}</span><div class="bar" style="flex:1"><i class="${x.used[i] >= c && c ? 'f' : ''}" style="width:${c ? (x.used[i] / c) * 100 : 0}%"></i></div><span>${x.used[i]}/${c}</span></div>`).join('')}<div class="tw" style="max-height:220px"><table>${evs
      .slice(0, 60)
      .map(
        (e) =>
          `<tr><td>${e.cid}</td><td>${esc(S.steps[e.step].name)}</td><td>Mailbox ${e.mb + 1}</td></tr>`,
      )
      .join(
        '',
      )}</table></div>${evs.length > 60 ? '<p class="hint">First 60 shown; export for all.</p>' : ''}`;
  }
  return `<section class="c"><div class="row"><button class="b s" data-a="cm" data-d="-1">‹ Prev</button><b>${t.toLocaleString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</b><button class="b s" data-a="cm" data-d="1">Next ›</button></div><div class="cal">${'SMTWTFS'
    .split('')
    .map((c) => `<div style="border:0;min-height:0;color:var(--mut)">${c}</div>`)
    .join('')}${cells}</div></section><section class="c">${det}</section>`;
}
function timeView() {
  const dl = R.days.filter((x) => x.def > 0);
  return `<section class="c"><h2>Campaign timeline</h2><p>First email <b>${fd(R.first)}</b> · last email <b>${fd(R.last)}</b> · duration <b>${R.last - R.first + 1} days</b></p><div class="tw"><table><tr><th>Step</th><th>First</th><th>Last</th><th>Events</th><th>Capacity-deferred</th><th>Avg delay (days)</th></tr>${S.steps
    .map((s, i) => {
      const e = R.ev.filter((x) => x.step === i);
      return `<tr><td>${esc(s.name)}</td><td>${fd(Math.min(...e.map((x) => x.date)))}</td><td>${fd(Math.max(...e.map((x) => x.date)))}</td><td>${e.length}</td><td>${e.filter((x) => x.date > x.elig).length}</td><td>${(sum(e.map((x) => x.date - x.orig)) / e.length).toFixed(1)}</td></tr>`;
    })
    .join(
      '',
    )}</table></div></section><section class="c"><h2>Days where capacity delayed emails</h2>${dl.length ? `<div class="tw" style="max-height:300px"><table><tr><th>Date</th><th>Emails pushed to a later day</th></tr>${dl.map((x) => `<tr><td>${fd(x.d)} ${WN[dw(x.d)].slice(0, 3)}</td><td>${x.def}</td></tr>`).join('')}</table></div>` : '<p>No capacity delays.</p>'}</section>`;
}
function valView() {
  const p = V.filter((c) => c.ok).length;
  return `<section class="c"><h2>Validation: ${p === V.length ? '<span class="tag">Valid</span>' : '<span class="tag r">Invalid</span>'} ${p}/${V.length} checks passed</h2>${V.map((c) => `<div class="msg ${c.ok ? 'ok' : ''}"><b>${c.ok ? 'Pass' : 'Fail'}</b> · ${esc(c.n)} <span class="hint">${esc(c.dt)}</span></div>`).join('')}</section><section class="c"><h2>How the scheduler works</h2><p class="hint">Day by day, it takes events that are due, orders them by your priority policy (${S.prio === 'follow' ? 'follow-ups first, oldest due date first, later steps first' : 'initial emails first'}), and fills capacity until the limit. The rest roll to the next sending day. Each next step is dated from the actual send date. It is a transparent greedy rule, not a proven global optimum.</p></section>`;
}
function batchView() {
  return `<section class="c"><div class="tw"><table><tr>${['Batch', 'Contacts', 'Initial email dates', 'Events', 'Final email', 'Delayed events', 'Status'].map((h) => `<th>${h}</th>`).join('')}</tr>${batchRows()
    .map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`)
    .join('')}</table></div></section>`;
}
function setupView() {
  const e = errs(S),
    c = caps(S),
    days = WN.map(
      (n, i) =>
        `<label><input type="checkbox" data-day="${i}" ${S.days.includes(i) ? 'checked' : ''}>${n.slice(0, 3)}</label>`,
    ).join('');
  return `<section class="c"><h2><span>1</span>Campaign setup</h2><p class="hint">Leads are people; email events are one send each (leads × steps).</p><div class="g"><label>Campaign name<input data-k="name" value="${esc(S.name)}"></label><label>Total leads<input type="number" min="1" data-k="leads" value="${esc(S.leads)}"></label><label>Campaign start date<input type="date" data-k="start" value="${esc(S.start)}"></label></div></section>
 <section class="c"><h2><span>2</span>Mailbox capacity</h2><p class="hint">Add one row for each group of mailboxes that share the same daily limit. Total daily capacity is the sum of (mailboxes × limit) across all rows.</p><button class="b s" data-a="addg">Add mailbox row</button><div class="tw"><table><tr><th>Number of mailboxes</th><th>Daily limit per mailbox</th><th>Row capacity</th><th></th></tr>${S.mbGroups.map((g, i) => `<tr><td><input type="number" min="1" data-g="${i}.count" value="${esc(g.count)}"></td><td><input type="number" min="0" data-g="${i}.cap" value="${esc(g.cap)}"></td><td><b id="gs${i}">${(+g.count || 0) * (+g.cap || 0)}</b></td><td><button class="x" data-a="delg" data-i="${i}">Remove</button></td></tr>`).join('')}</table></div><p id="tc"></p></section>
 <section class="c"><h2><span>3</span>Batch configuration</h2><p class="hint">With no batches, leads split automatically by batch size (default: daily capacity).</p><div class="row"><button class="b s" data-a="addb">Add batch</button><button class="b s" data-a="bal">Balance to total leads</button><label style="display:flex;gap:6px;align-items:center">Auto batch size<input type="number" min="1" data-k="autoSize" value="${esc(S.autoSize)}" style="width:90px"></label></div><div class="tw"><table>${S.batches.length ? '<tr><th>Name</th><th>Contacts</th><th>Initial date</th><th>Notes</th><th></th></tr>' : ''}${S.batches.map((b, i) => `<tr><td><input data-b="${i}.name" value="${esc(b.name)}"></td><td><input type="number" data-b="${i}.count" value="${esc(b.count)}"></td><td><input type="date" data-b="${i}.date" value="${esc(b.date)}"></td><td><input data-b="${i}.notes" value="${esc(b.notes)}"></td><td><button class="x" data-a="delb" data-i="${i}">Remove</button></td></tr>`).join('')}</table></div></section>
 <section class="c"><h2><span>4</span>Email sequence</h2><p class="hint">Each delay counts from the previous step's actual send date for the same contact.</p><button class="b s" data-a="adds">Add step</button><div class="tw"><table><tr><th>#</th><th>Name</th><th>Type</th><th>Gap (days)</th><th>Description</th><th></th></tr>${S.steps.map((s, i) => `<tr><td>${i + 1}</td><td><input data-s="${i}.name" value="${esc(s.name)}"></td><td><select data-s="${i}.type">${['Initial', 'Follow-up'].map((t) => `<option ${s.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select></td><td><input type="number" min="0" data-s="${i}.gap" value="${esc(s.gap)}"></td><td><input data-s="${i}.desc" value="${esc(s.desc || '')}"></td><td><button class="x" data-a="up" data-i="${i}" aria-label="Move up">↑</button><button class="x" data-a="dn" data-i="${i}" aria-label="Move down">↓</button><button class="x" data-a="dels" data-i="${i}">Remove</button></td></tr>`).join('')}</table></div></section>
 <section class="c"><h2><span>5</span>Schedule preferences</h2><div class="days">${days}</div><div class="g" style="margin-top:12px"><label>How delays are counted<select data-k="gapMode"><option value="calendar" ${S.gapMode === 'calendar' ? 'selected' : ''}>Calendar days (non-sending dates move to the next sending day)</option><option value="send" ${S.gapMode === 'send' ? 'selected' : ''}>Sending days only</option></select></label><label>Priority when capacity is short<select data-k="prio"><option value="follow" ${S.prio === 'follow' ? 'selected' : ''}>Follow-ups first (oldest due first)</option><option value="initial" ${S.prio === 'initial' ? 'selected' : ''}>Initial emails first</option></select></label></div></section>
 <section class="c"><h2><span>6</span>Review and generate</h2><div id="vm"></div>${R && stale ? '<div class="msg">Inputs changed since the last schedule. Generating will replace it.</div>' : ''}<button class="b p" data-a="gen" id="gb"></button></section>`;
}
function meta() {
  const e = errs(S),
    c = caps(S),
    t = sum(c.filter((x) => x >= 0)),
    ok = !e.length,
    N = +S.leads || 0,
    ne = N * S.steps.length;
  const K = [
    ['Total leads', N || '—'],
    ['Mailboxes', c.length],
    ['Daily capacity', t, 'emails per day'],
    ['Email events', R ? R.ev.length : ne, R ? 'scheduled' : 'planned (leads × steps)'],
    ['Start date', S.start || '—'],
    ['Projected end', R ? fd(R.last) : '—'],
    ['Duration', R ? R.last - R.first + 1 + ' days' : '—'],
    [
      'Conflicts',
      V ? V.filter((x) => !x.ok).length : '—',
      R ? R.ev.filter((x) => x.date > x.elig).length + ' events deferred by capacity' : '',
    ],
  ];
  $('#cards').innerHTML = K.map(
    (k) =>
      `<div class="k ${k[0] === 'Conflicts' && V && V.some((x) => !x.ok) ? 'bad' : ''}"><small>${k[0]}</small><b>${esc(k[1])}</b><i>${esc(k[2] || '')}</i></div>`,
  ).join('');
  S.mbGroups.forEach((g, i) => {
    const n = $('#gs' + i);
    if (n) n.textContent = (+g.count || 0) * (+g.cap || 0);
  });
  const tc = $('#tc');
  if (tc) tc.innerHTML = `Total daily capacity: <b>${t}</b> emails (${c.length} mailboxes)`;
  const vm = $('#vm');
  if (vm)
    vm.innerHTML = ok
      ? '<div class="msg ok">All inputs are valid.</div>'
      : e.map((x) => `<div class="msg">${esc(x)}</div>`).join('');
  const gb = $('#gb');
  if (gb) {
    gb.disabled = !ok;
    gb.textContent = R ? 'Regenerate schedule (replaces current)' : 'Generate schedule';
  }
  try {
    localStorage.setItem('cs_cfg', JSON.stringify(S));
  } catch (x) {}
}
function render() {
  const T = [['setup', 'Setup']].concat(
    R
      ? [
          ['daily', 'Daily schedule'],
          ['batches', 'Batches'],
          ['contacts', 'Contacts'],
          ['calendar', 'Calendar'],
          ['timeline', 'Timeline'],
          ['valid', 'Validation'],
        ]
      : [],
  );
  $('#nav').innerHTML = T.map(
    (t) =>
      `<button data-a="v" data-v="${t[0]}" class="${view === t[0] ? 'on' : ''}">${t[1]}</button>`,
  ).join('');
  $('#main').innerHTML =
    view === 'setup' || !R
      ? setupView()
      : {
          daily: dailyView,
          batches: batchView,
          contacts: contactsView,
          calendar: calView,
          timeline: timeView,
          valid: valView,
        }[view]();
  meta();
}
