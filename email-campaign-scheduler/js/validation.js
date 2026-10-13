/**
 * Input validation (errs) and post-schedule audit checks (validate).
 */
function errs(S) {
  const e = [],
    c = caps(S),
    t = sum(c);
  if (!(Number.isInteger(+S.leads) && +S.leads >= 1))
    e.push('Total leads must be a whole number of at least 1.');
  if (isNaN(pd(S.start))) e.push('Choose a campaign start date.');
  if (!S.mbGroups.length) e.push('Add at least one mailbox row.');
  S.mbGroups.forEach((g, i) => {
    if (g.count === '' || !(Number.isInteger(+g.count) && +g.count >= 1))
      e.push(`Mailbox row ${i + 1}: number of mailboxes must be a whole number of at least 1.`);
    if (g.cap === '' || !(Number.isInteger(+g.cap) && +g.cap >= 0))
      e.push(`Mailbox row ${i + 1}: daily limit must be a whole number (0 or more).`);
  });
  if (S.mbGroups.length && !e.length && t < 1)
    e.push(
      'Total daily capacity is 0, so no email can be sent. Raise a mailbox count or daily limit.',
    );
  if (!S.days.length) e.push('Select at least one sending day; no valid sending days exist.');
  if (!S.steps.length) e.push('Add at least one sequence step.');
  S.steps.forEach((s, i) => {
    if (!s.name.trim()) e.push(`Step ${i + 1} needs a name.`);
    if (i == 0 && +s.gap !== 0) e.push('Step 1 must have a gap of 0 days.');
    if (i > 0 && !(Number.isInteger(+s.gap) && s.gap !== '' && +s.gap >= 1))
      e.push(
        `Step ${i + 1} (${s.name || 'unnamed'}) needs a delay of at least 1 day from the previous step.`,
      );
  });
  if (S.batches.length) {
    const n = sum(S.batches.map((b) => +b.count || 0));
    S.batches.forEach((b, i) => {
      if (!(Number.isInteger(+b.count) && +b.count >= 1))
        e.push(`Batch ${i + 1}: contacts must be a whole number of at least 1.`);
      if (b.date && (isNaN(pd(b.date)) || pd(b.date) < pd(S.start)))
        e.push(`Batch ${i + 1}: initial date must be valid and not before the campaign start.`);
    });
    if (n !== +S.leads)
      e.push(
        `Batches contain ${n} contacts but total leads is ${S.leads}. Use "Balance to total leads" or edit batch sizes.`,
      );
  }
  return e;
}
function validate(R, S) {
  const C = [],
    ds = new Set(S.days),
    ev = R.ev,
    exp = R.N * R.S,
    add = (n, ok, dt) => C.push({ n, ok, dt });
  const ps = Array(R.S).fill(0);
  ev.forEach((e) => ps[e.step]++);
  add(
    'Every expected email event is scheduled (N × S)',
    ev.length === exp && ps.every((x) => x === R.N),
    `${ev.length} scheduled, ${exp} expected (${R.N} × ${R.S})`,
  );
  add(
    'No duplicate events',
    new Set(ev.map((e) => e.cid + '|' + e.step)).size === ev.length,
    'Unique contact + step pairs',
  );
  const dt = {},
    dm = {},
    cd = new Set();
  let col = 0;
  ev.forEach((e) => {
    dt[e.date] = (dt[e.date] || 0) + 1;
    const k = e.date + '|' + e.mb;
    dm[k] = (dm[k] || 0) + 1;
    const c = e.cid + '|' + e.date;
    if (cd.has(c)) col++;
    cd.add(c);
  });
  add(
    'No day exceeds total capacity',
    Object.values(dt).every((v) => v <= R.total),
    `Limit ${R.total}/day`,
  );
  add(
    'No mailbox exceeds its daily limit',
    Object.entries(dm).every(([k, v]) => v <= R.cp[+k.split('|')[1]]),
    'Per-mailbox totals reconcile with daily totals',
  );
  add('No contact gets two emails on one day', col === 0, col + ' collisions');
  const g = {};
  ev.forEach((e) => ((g[e.cid] = g[e.cid] || [])[e.step] = e));
  let bad = 0;
  Object.values(g).forEach((a) => {
    for (let i = 1; i < R.S; i++) {
      const p = a[i - 1],
        c = a[i],
        gp = +S.steps[i].gap;
      if (!p || !c || c.date <= p.date) {
        bad++;
        continue;
      }
      if (S.gapMode === 'send') {
        let k = 0;
        for (let x = p.date + 1; x <= c.date; x++) if (ds.has(dw(x))) k++;
        if (k < gp) bad++;
      } else if (c.date - p.date < gp) bad++;
    }
  });
  add('Steps are in order and respect delays', bad === 0, bad + ' violations');
  add(
    'Only eligible sending days used',
    ev.every((e) => ds.has(dw(e.date))),
    'Sending days: ' +
      [...ds]
        .sort()
        .map((x) => WN[x].slice(0, 3))
        .join(', '),
  );
  add(
    'Every event has a valid batch and step',
    ev.every((e) => R.bs[e.bi] && S.steps[e.step]),
    '',
  );
  add(
    'Batch totals match total leads',
    sum(R.bs.map((b) => b.count)) === R.N,
    sum(R.bs.map((b) => b.count)) + ' vs ' + R.N,
  );
  add(
    'Exports contain every event',
    evRows().length === ev.length && dRows().length === R.days.length,
    'CSV rows = events',
  );
  return C;
}
