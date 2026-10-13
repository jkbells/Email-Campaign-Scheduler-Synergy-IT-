/**
 * CSV and PDF export plus the file-save helper.
 */
const csv = (h, rows) =>
  '\ufeff' +
  [h, ...rows]
    .map((r) =>
      r
        .map((v) => {
          v = String(v);
          return /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
        })
        .join(','),
    )
    .join('\r\n');
const slug = () =>
  (S.name || 'campaign')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
async function save(name, blob) {
  try {
    const dl = window.claude && (await claude.use('downloads'));
    if (dl) {
      await dl.save({ filename: name, data: blob });
      return toast('Export ready: ' + name);
    }
  } catch (e) {
    if (e && e.code === 'declined') return toast('Download cancelled.');
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  toast('Exported ' + name);
}
async function logoPng() {
  try {
    const s = new XMLSerializer().serializeToString(document.querySelector('.logo svg')),
      im = new Image();
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
    await im.decode();
    const c = document.createElement('canvas');
    c.width = 1640;
    c.height = 262;
    c.getContext('2d').drawImage(im, 0, 0, 1640, 262);
    return c.toDataURL('image/png');
  } catch (e) {
    return null;
  }
}
async function pdf() {
  const doc = new jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' }),
    L = 36,
    img = await logoPng(),
    T = (h, b, o = {}) =>
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + (o.gap ?? 0),
        head: h,
        body: b,
        theme: 'grid',
        showHead: 'everyPage',
        margin: { left: L, right: L },
        styles: { fontSize: o.fs || 8, cellPadding: 3 },
        headStyles: { fillColor: [42, 69, 132] },
        alternateRowStyles: { fillColor: [238, 245, 251] },
      });
  if (img) doc.addImage(img, 'PNG', L, 24, 180, 28.8);
  else {
    doc.setFontSize(14);
    doc.text('Email Campaign Scheduler', L, 40);
  }
  doc.setFontSize(18);
  doc.setTextColor(42, 69, 132);
  doc.text(S.name + ' — Email schedule', L, 82);
  doc.lastAutoTable = { finalY: 98 };
  const sd = [...S.days]
      .sort()
      .map((x) => WN[x].slice(0, 3))
      .join(', '),
    H = (t) => {
      let y = doc.lastAutoTable.finalY + 30;
      if (y > doc.internal.pageSize.getHeight() - 110) {
        doc.addPage();
        y = 50;
      }
      doc.setFontSize(12);
      doc.setTextColor(237, 17, 105);
      doc.text(t, L, y);
      doc.lastAutoTable = { finalY: y + 6 };
    };
  T(
    [['Setting', 'Value']],
    [
      ['Total leads', R.N],
      ['Total email events', R.ev.length],
      ['First / last send date', fd(R.first) + ' / ' + fd(R.last)],
      ['Duration', R.last - R.first + 1 + ' calendar days'],
      [
        'Mailboxes',
        R.cp.length +
          ' (' +
          S.mbGroups.map((g) => g.count + ' × ' + g.cap + '/day').join(', ') +
          ')',
      ],
      ['Total daily capacity', R.total],
      ['Sending days', sd],
      [
        'Gap rule',
        S.gapMode === 'send'
          ? 'Delays counted in sending days'
          : 'Delays counted in calendar days; non-sending dates move to next sending day',
      ],
      [
        'Priority',
        S.prio === 'follow'
          ? 'Follow-ups before initial emails'
          : 'Initial emails before follow-ups',
      ],
    ],
    { gap: 0 },
  );
  H('Email sequence');
  T(
    [['#', 'Name', 'Type', 'Gap', 'Description']],
    S.steps.map((s, i) => [i + 1, s.name, s.type, s.gap + ' days', s.desc || '']),
    { gap: 12 },
  );
  H('Batch summary');
  T(
    [['Batch', 'Contacts', 'Initial dates', 'Events', 'Final send', 'Delayed events']],
    batchRows().map((r) => r.slice(0, 6)),
    { gap: 12 },
  );
  H('Validation results (' + V.filter((c) => c.ok).length + '/' + V.length + ' passed)');
  T(
    [['Check', 'Result', 'Detail']],
    V.map((c) => [c.n, c.ok ? 'PASS' : 'FAIL', c.dt]),
    { gap: 12 },
  );
  H('Capacity-delayed days');
  T(
    [['Date', 'Emails delayed to a later day']],
    R.days
      .filter((x) => x.def > 0)
      .map((x) => [fd(x.d), x.def])
      .concat(R.days.some((x) => x.def > 0) ? [] : [['None', '']]),
    { gap: 12 },
  );
  doc.addPage();
  doc.setFontSize(13);
  doc.setTextColor(42, 69, 132);
  doc.text('Daily schedule & capacity utilization', L, 44);
  doc.lastAutoTable = { finalY: 56 };
  T([dCols().map((c) => c[1])], dRows(), { fs: 7 });
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${S.name} · page ${i} of ${n}`, L, doc.internal.pageSize.getHeight() - 16);
  }
  save(`${slug()}_schedule_${fd(R.first)}_to_${fd(R.last)}.pdf`, doc.output('blob'));
}
