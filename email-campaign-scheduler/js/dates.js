/**
 * Date helpers. Dates are handled as whole UTC day numbers to avoid timezone bugs.
 */
const DAY = 864e5,
  pd = (s) => {
    const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s || '');
    return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY) : NaN;
  },
  fd = (n) => new Date(n * DAY).toISOString().slice(0, 10),
  dw = (n) => new Date(n * DAY).getUTCDay();
const WN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
