/**
 * Builds the row/column data used by the tables, CSV exports and PDF report.
 */
const evRows = () => {
  const dt = {};
  R.ev.forEach((e) => (dt[e.date] = (dt[e.date] || 0) + 1));
  return R.ev.map((e) => [
    S.name,
    R.bs[e.bi].name,
    e.cid,
    e.step + 1,
    S.steps[e.step].name,
    S.steps[e.step].type,
    fd(e.orig),
    fd(e.date),
    WN[dw(e.date)],
    'Mailbox ' + (e.mb + 1),
    R.cp[e.mb],
    dt[e.date],
    R.total,
    R.total - dt[e.date],
    e.date - e.orig,
    stat(e),
  ]);
};
const EH = [
  'Campaign Name',
  'Batch',
  'Contact ID',
  'Step Number',
  'Step Name',
  'Step Type',
  'Original Due Date',
  'Actual Scheduled Date',
  'Day of Week',
  'Assigned Mailbox',
  'Daily Mailbox Capacity',
  'Total Emails That Day',
  'Total Daily Capacity',
  'Remaining Daily Capacity',
  'Delay (calendar days)',
  'Status',
];
const dCols = () => [
  ['date', 'Date'],
  ['day', 'Day'],
  ...S.steps.map((s, i) => ['s' + i, s.name || 'Step ' + (i + 1)]),
  ['total', 'Total'],
  ['cap', 'Max capacity'],
  ['rem', 'Remaining'],
  ['mb', 'Active mailboxes'],
  ['util', 'Utilization %'],
  ['status', 'Status'],
];
const dObj = () =>
  R.days.map((x) => {
    const r = {
      date: fd(x.d),
      day: WN[dw(x.d)],
      total: x.n,
      cap: R.total,
      rem: R.total - x.n,
      mb: x.mb,
      util: Math.round((x.n / R.total) * 100),
      status:
        x.n > R.total
          ? 'Over capacity'
          : x.def
            ? `Deferred ${x.def}`
            : x.n === R.total
              ? 'Full'
              : x.n / R.total >= 0.85
                ? 'High'
                : x.n
                  ? 'OK'
                  : 'Idle',
    };
    x.by.forEach((v, i) => (r['s' + i] = v));
    return r;
  });
const dRows = () => dObj().map((r) => dCols().map((c) => r[c[0]]));
function batchRows() {
  return R.bs.map((b, i) => {
    const e = R.ev.filter((x) => x.bi === i),
      ini = e.filter((x) => x.step === 0).map((x) => x.date),
      a = Math.min(...ini),
      z = Math.max(...ini);
    return [
      b.name,
      b.count,
      a === z ? fd(a) : fd(a) + ' to ' + fd(z),
      e.length,
      fd(Math.max(...e.map((x) => x.date))),
      e.filter((x) => x.date > x.orig).length,
      'Complete',
    ];
  });
}
