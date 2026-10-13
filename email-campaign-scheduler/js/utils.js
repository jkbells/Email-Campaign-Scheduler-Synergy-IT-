/**
 * Small DOM and text helpers shared by every module.
 */
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
    );
const toast = (t) => ($('#toast').textContent = t);
