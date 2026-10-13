/**
 * Scheduling engine: mailbox capacity helpers and the day-by-day scheduler. No DOM access.
 */
const caps = (S) =>
  (S.mbGroups || []).flatMap((g) =>
    Array(Math.max(0, Math.floor(+g.count || 0))).fill(+g.cap || 0),
  );
const sum = (a) => a.reduce((x, y) => x + y, 0);
function schedule(S) {
  const cp = caps(S),
    total = sum(cp),
    ds = new Set(S.days),
    st = pd(S.start),
    el = (d) => ds.has(dw(d)),
    nx = (d) => {
      while (!el(d)) d++;
      return d;
    },
    N = +S.leads;
  let bs = S.batches.length
    ? S.batches.map((b) => ({
        name: b.name || 'Batch',
        count: +b.count,
        date: b.date ? pd(b.date) : st,
      }))
    : [];
  if (!bs.length) {
    const z = Math.max(1, +S.autoSize || total);
    for (let i = 0, r = N; r > 0; i++, r -= z)
      bs.push({ name: 'Batch ' + (i + 1), count: Math.min(z, r), date: st });
  }
  let n = 0,
    pend = [];
  bs.forEach((b, bi) => {
    for (let k = 0; k < b.count; k++) {
      const o = Math.max(st, b.date);
      pend.push({ id: 'C-' + String(++n).padStart(5, '0'), n, bi, step: 0, orig: o, due: nx(o) });
    }
  });
  const ev = [],
    days = [],
    ns = S.steps.length,
    fol = S.prio === 'follow';
  let d = st;
  const cmp = (a, b) =>
    (fol
      ? (a.step > 0 ? 0 : 1) - (b.step > 0 ? 0 : 1)
      : (a.step > 0 ? 1 : 0) - (b.step > 0 ? 1 : 0)) ||
    a.due - b.due ||
    b.step - a.step ||
    a.n - b.n;
  while (pend.length) {
    if (d - st > 3650) throw Error('Schedule exceeds 10 years; check capacity and sending days.');
    if (el(d)) {
      const cand = pend.filter((c) => c.due <= d).sort(cmp),
        take = cand.slice(0, total),
        rem = cp.slice(),
        used = cp.map(() => 0),
        by = Array(ns).fill(0);
      take.forEach((c) => {
        let m = 0;
        rem.forEach((r, i) => {
          if (r > rem[m]) m = i;
        });
        rem[m]--;
        used[m]++;
        by[c.step]++;
        ev.push({ cid: c.id, bi: c.bi, step: c.step, orig: c.orig, elig: c.due, date: d, mb: m });
        if (c.step + 1 < ns) {
          const g = +S.steps[c.step + 1].gap;
          let raw = d + g;
          if (S.gapMode === 'send') {
            raw = d;
            for (let k = 0; k < g; k++) raw = nx(raw + 1);
          }
          c.step++;
          c.orig = raw;
          c.due = nx(raw);
        } else c.done = true;
      });
      pend = pend.filter((c) => !c.done);
      days.push({
        d,
        n: take.length,
        by,
        used,
        def: cand.length - take.length,
        mb: used.filter((u) => u > 0).length,
      });
    }
    d++;
  }
  const f = ev[0].date,
    first = days.findIndex((x) => x.n > 0);
  return {
    ev,
    days: days.slice(first),
    cp,
    total,
    bs,
    first: f,
    last: ev[ev.length - 1].date,
    N,
    S: ns,
  };
}
const stat = (e) =>
  e.date > e.elig
    ? 'Deferred (capacity)'
    : e.date > e.orig
      ? 'Shifted (non-sending day)'
      : 'On time';
