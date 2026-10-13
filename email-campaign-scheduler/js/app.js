/**
 * Entry point: input and click event handling, then the first render.
 */
const mv = (a, i, j) => {
  if (j < 0 || j >= a.length) return;
  [a[i], a[j]] = [a[j], a[i]];
};
document.addEventListener('input', (e) => {
  const t = e.target,
    v = t.type === 'number' ? (t.value === '' ? '' : +t.value) : t.value;
  if (t.dataset.f) {
    if (t.dataset.f === 'q') fq = v.toLowerCase();
    if (t.dataset.f === 'c') cq = v.toLowerCase();
    if (t.dataset.f === 's') fs = v;
    const p = t.selectionStart;
    render();
    const n = document.querySelector(`[data-f="${t.dataset.f}"]`);
    if ((n && n.type === 'text') || (n && !n.tagName.match(/SELECT/))) {
      n.focus();
      try {
        n.setSelectionRange(p, p);
      } catch (x) {}
    }
    return;
  }
  if (t.dataset.k) S[t.dataset.k] = v;
  else if (t.dataset.g) {
    const [i, f] = t.dataset.g.split('.');
    S.mbGroups[i][f] = v;
  } else if (t.dataset.b) {
    const [i, f] = t.dataset.b.split('.');
    S.batches[i][f] = v;
  } else if (t.dataset.s) {
    const [i, f] = t.dataset.s.split('.');
    S.steps[i][f] = v;
  } else if (t.dataset.day != null) {
    const d = +t.dataset.day;
    S.days = t.checked ? [...new Set([...S.days, d])] : S.days.filter((x) => x !== d);
  } else return;
  if (R) stale = true;
  meta();
});
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-a]');
  if (!t) return;
  const a = t.dataset.a,
    i = +t.dataset.i;
  if (a !== 'reset' && rsArm) {
    rsArm = false;
    $('#rs').textContent = 'Reset project';
  }
  if (a === 'v') {
    view = t.dataset.v;
    return render();
  }
  if (a === 'sort') {
    sort = { k: t.dataset.k, d: sort.k === t.dataset.k ? -sort.d : 1 };
    return render();
  }
  if (a === 'cal') {
    calSel = +t.dataset.d;
    return render();
  }
  if (a === 'cm') {
    calM = Math.round(
      Date.UTC(
        new Date(calM * DAY).getUTCFullYear(),
        new Date(calM * DAY).getUTCMonth() + +t.dataset.d,
        1,
      ) / DAY,
    );
    return render();
  }
  if (a === 'csv')
    return save(
      `${slug()}_schedule_events_${fd(R.first)}_to_${fd(R.last)}.csv`,
      new Blob([csv(EH, evRows())], { type: 'text/csv;charset=utf-8' }),
    );
  if (a === 'csvd')
    return save(
      `${slug()}_daily_summary_${fd(R.first)}_to_${fd(R.last)}.csv`,
      new Blob(
        [
          csv(
            dCols().map((c) => c[1]),
            dRows(),
          ),
        ],
        { type: 'text/csv;charset=utf-8' },
      ),
    );
  if (a === 'pdf') {
    toast('Building PDF…');
    return pdf().catch((x) => toast('PDF failed: ' + x.message));
  }
  if (a === 'reset') {
    if (!rsArm) {
      rsArm = true;
      t.textContent = 'Click again to confirm reset';
      return;
    }
    rsArm = false;
    S = JSON.parse(JSON.stringify(DEF));
    R = V = null;
    view = 'setup';
    t.textContent = 'Reset project';
    return render();
  }
  if (a === 'addg') S.mbGroups.push({ count: 1, cap: 20 });
  else if (a === 'delg') S.mbGroups.splice(i, 1);
  else if (a === 'addb')
    S.batches.push({ name: 'Batch ' + (S.batches.length + 1), count: 1, date: '', notes: '' });
  else if (a === 'delb') S.batches.splice(i, 1);
  else if (a === 'bal') {
    if (!S.batches.length) S.batches.push({ name: 'Batch 1', count: 0, date: '', notes: '' });
    const o = sum(S.batches.slice(0, -1).map((b) => +b.count || 0));
    S.batches[S.batches.length - 1].count = Math.max(0, S.leads - o);
  } else if (a === 'adds')
    S.steps.push({ name: 'Follow-up ' + S.steps.length, type: 'Follow-up', gap: 3, desc: '' });
  else if (a === 'dels') S.steps.splice(i, 1);
  else if (a === 'up') mv(S.steps, i, i - 1);
  else if (a === 'dn') mv(S.steps, i, i + 1);
  else if (a === 'gen') {
    if (errs(S).length) return;
    try {
      R = schedule(S);
      V = validate(R, S);
      stale = false;
      view = 'daily';
      calM = null;
      calSel = null;
      toast('Schedule generated.');
    } catch (x) {
      R = V = null;
      toast('Cannot build a valid schedule: ' + x.message);
      return;
    }
    return render();
  } else return;
  if (R) stale = true;
  render();
});
render();
