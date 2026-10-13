/**
 * Default configuration, persisted config (localStorage) and transient UI state.
 */
const DEF = {
  name: 'Q4 Outreach Campaign',
  leads: 540,
  start: '2026-10-14',
  mbGroups: [
    { count: 12, cap: 15 },
    { count: 4, cap: 30 },
    { count: 9, cap: 40 },
  ],
  days: [1, 2, 3, 4, 5],
  gapMode: 'calendar',
  prio: 'follow',
  autoSize: '',
  batches: [1, 2, 3].map((i) => ({
    name: 'Batch ' + i,
    count: 180,
    date: '2026-10-' + (13 + i),
    notes: '',
  })),
  steps: [
    ['Initial Email', 'Initial', 0],
    ['Follow-up 1', 'Follow-up', 3],
    ['Follow-up 2', 'Follow-up', 4],
    ['Follow-up 3', 'Follow-up', 5],
  ].map((a) => ({ name: a[0], type: a[1], gap: a[2], desc: '' })),
};
let S;
try {
  S = JSON.parse(localStorage.getItem('cs_cfg'));
} catch (e) {}
S = S || JSON.parse(JSON.stringify(DEF));
if (!S.mbGroups) S.mbGroups = [{ count: S.mbCount || 1, cap: S.mbCap || 0 }];
let R = null,
  V = null,
  stale = false,
  view = 'setup',
  sort = { k: 'date', d: 1 },
  fq = '',
  fs = '',
  cq = '',
  calM = null,
  calSel = null,
  rsArm = false;
