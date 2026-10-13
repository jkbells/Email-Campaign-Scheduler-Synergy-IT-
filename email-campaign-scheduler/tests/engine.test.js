// Loads the browser scripts into an isolated context so the engine can be tested without a DOM.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = vm.createContext({ console });
['dates', 'state', 'engine', 'validation', 'report-data'].forEach((f) =>
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx, {
    filename: f,
  }),
);

// Runs a scenario: overrides are merged into the default config, then the schedule is built and audited.
function run(overrides = {}) {
  ctx.over = overrides;
  return JSON.parse(
    vm.runInContext(
      `(() => { S = Object.assign(JSON.parse(JSON.stringify(DEF)), over);
       const errors = errs(S);
       let out = { errors };
       if (!errors.length) {
         R = schedule(S); V = validate(R, S);
         const perDay = {}; R.ev.forEach(e => perDay[e.date] = (perDay[e.date] || 0) + 1);
         out = { errors, n: R.ev.length, valid: V.every(c => c.ok), failed: V.filter(c => !c.ok).map(c => c.n),
           maxDay: Math.max(...Object.values(perDay)), total: R.total, first: fd(R.first), last: fd(R.last),
           deferred: R.ev.filter(e => e.date > e.elig).length,
           weekdays: [...new Set(R.ev.map(e => dw(e.date)))].sort() };
       }
       return JSON.stringify(out); })()`,
      ctx,
    ),
  );
}

const small = (extra = {}) => ({
  leads: 20,
  batches: [],
  mbGroups: [{ count: 1, cap: 5 }],
  ...extra,
});

test('default scenario schedules every event and passes all checks', () => {
  const r = run();
  assert.deepStrictEqual(r.errors, []);
  assert.strictEqual(r.n, 540 * 4);
  assert.ok(r.valid, r.failed.join('; '));
  assert.ok(r.maxDay <= r.total);
});

test('mixed mailbox groups add up (12x15 + 4x30 + 9x40 = 660)', () => {
  assert.strictEqual(run().total, 660);
});

test('one mailbox, few leads: capacity is a hard limit and work spills to later days', () => {
  const r = run(small());
  assert.ok(r.valid);
  assert.strictEqual(r.maxDay, 5);
  assert.ok(r.deferred > 0);
});

test('only selected sending days are used (Mon/Wed/Fri)', () => {
  const r = run(small({ days: [1, 3, 5] }));
  assert.ok(r.valid);
  assert.ok(r.weekdays.every((d) => [1, 3, 5].includes(d)));
});

test('sending-days gap mode and initial-first priority stay valid', () => {
  assert.ok(run(small({ gapMode: 'send', prio: 'initial' })).valid);
});

test('scheduling is deterministic and never duplicates on repeated runs', () => {
  const a = run(small());
  const b = run(small());
  assert.deepStrictEqual(a, b);
});

test('large campaign (5,000 leads, 6 steps) stays valid', () => {
  const steps = [0, 3, 4, 5, 7, 7].map((g, i) => ({
    name: 'Step ' + (i + 1),
    type: i ? 'Follow-up' : 'Initial',
    gap: g,
    desc: '',
  }));
  const r = run({ leads: 5000, batches: [], steps, mbGroups: [{ count: 10, cap: 40 }] });
  assert.ok(r.valid);
  assert.strictEqual(r.n, 30000);
});

test('invalid inputs are rejected with messages', () => {
  assert.ok(run({ mbGroups: [{ count: 3, cap: 0 }] }).errors.length > 0);
  assert.ok(run({ days: [] }).errors.length > 0);
  assert.ok(
    run({
      steps: [
        { name: 'A', type: 'Initial', gap: 0 },
        { name: 'B', type: 'Follow-up', gap: '' },
      ],
    }).errors.length > 0,
  );
  assert.ok(run({ leads: 100 }).errors.length > 0); // batches total 540, not 100
});
