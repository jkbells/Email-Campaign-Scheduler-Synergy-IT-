# Email-Campaign-Scheduler-Synergy-IT-
Create an App for creating the Automatic Schedule for our campaings 

# Email Campaign Scheduler

A browser-based tool that turns your campaign details into a complete, validated email sending schedule. You enter leads, mailboxes, batches and sequence steps, click **Generate schedule**, and get daily, batch, contact and calendar views plus CSV and PDF exports.

There is no backend, database or login. Everything runs in the browser, and your configuration is saved in the browser's `localStorage`.

## Features

- **Mailbox capacity rows.** Add one row per group of mailboxes that share a limit (for example 12 × 15, 4 × 30, 9 × 40). The total daily capacity is calculated for you.
- **Batches.** Manual batches with their own start dates, or automatic splitting by batch size. A warning appears when batch totals do not match total leads.
- **Email sequence.** Any number of steps with independent gaps. You can add, remove and reorder steps.
- **Capacity-aware scheduler.** Daily capacity is a hard limit. Overflow rolls to the next sending day, and every later step is dated from the real send date of the previous step.
- **Validation.** 10 automatic audit checks. A schedule is only shown as valid if all of them pass.
- **Views.** Daily table (search, sort, filter, utilization chart), batches, contacts, calendar, timeline.
- **Exports.** CSV (one row per email event), daily-summary CSV and a PDF report.
- **Branding.** Colors are taken from the Synergy logo.

## Quick start

You need a modern browser. Node.js 18 or newer is only needed for the tests and the dev server.

**Option 1: open the file.** Open `index.html` in your browser. The PDF libraries load from a CDN, so you need an internet connection for PDF export.

**Option 2: local server (recommended).**

```bash
npm install      # only needed for tests and formatting
npm start        # serves the project, then open the URL it prints
```

Without Node, `python3 -m http.server 8080` also works.

**Run the tests**

```bash
npm test
```

**Format the code**

```bash
npm run format
```

## Project structure

```
email-campaign-scheduler/
├── index.html              Page layout, header with inline logo, script loading order
├── css/
│   └── styles.css          Theme tokens (brand colors, dark mode) and all component styles
├── assets/
│   └── synergy-logo.svg    Copy of the logo for reference (the live logo is inline in index.html)
├── js/
│   ├── utils.js            DOM shortcut ($), HTML escaping (esc), status message (toast)
│   ├── dates.js            Date helpers: parse (pd), format (fd), weekday (dw), weekday names
│   ├── state.js            Default config (DEF), saved config (S), schedule results (R, V), UI state
│   ├── engine.js           Mailbox capacity (caps, sum) and the scheduler (schedule, stat). No DOM.
│   ├── validation.js       Input rules (errs) and the 10 post-schedule audit checks (validate)
│   ├── report-data.js      Row and column builders for tables, CSV and PDF (evRows, dRows, batchRows)
│   ├── exports.js          CSV builder, file saving, logo-to-PNG, PDF report
│   ├── views.js            HTML for the setup form, result tabs, summary cards, navigation
│   └── app.js              Event handlers (input, click) and the first render
├── tests/
│   └── engine.test.js      Node tests for the engine, validation and input rules
├── package.json            Scripts: start, test, format
├── .prettierrc             Formatting rules
└── .gitignore
```

The scripts are plain (non-module) scripts, loaded in the order shown in `index.html`. They share global names, so keep that order if you add files.

## How scheduling works

1. Each contact gets an internal ID (`C-00001`, …) and a batch. Real contact data is not required.
2. The scheduler walks forward one day at a time and skips non-sending days.
3. On each sending day it collects every event that is due, sorts them by the priority policy, and sends as many as capacity allows. The rest move to the next sending day.
4. When a step is sent, the next step is dated from that actual send date plus its gap.
5. Mailboxes are assigned by always choosing the mailbox with the most remaining capacity, so the load is spread evenly and no mailbox exceeds its own limit.

**Priority policy** (setting in the app):

- *Follow-ups first* (default): follow-ups before initial emails, oldest due date first, later steps first.
- *Initial emails first*: new initial emails take capacity before follow-ups.

**Delay counting** (setting in the app):

- *Calendar days*: gap is counted in calendar days. If the date is a non-sending day, the email moves to the next sending day.
- *Sending days only*: gap is counted in sending days.

For each email the app shows the **original due date**, the **actual date**, and a status: `On time`, `Shifted (non-sending day)` or `Deferred (capacity)`.

The scheduler is deterministic and easy to audit, but it is a greedy rule. It does not claim to be globally optimal.

## Validation checks

1. Every expected email event is scheduled (leads × steps).
2. No duplicate events.
3. No day exceeds total capacity.
4. No mailbox exceeds its own daily limit.
5. No contact gets two emails on the same day.
6. Steps are in order and respect their delays.
7. Only eligible sending days are used.
8. Every event has a valid batch and step.
9. Batch totals match total leads.
10. Exports contain every event.

## Exports

**Event CSV** has one row per email with: Campaign Name, Batch, Contact ID, Step Number, Step Name, Step Type, Original Due Date, Actual Scheduled Date, Day of Week, Assigned Mailbox, Daily Mailbox Capacity, Total Emails That Day, Total Daily Capacity, Remaining Daily Capacity, Delay (calendar days), Status. Dates are `YYYY-MM-DD` and the file is UTF-8.

**Daily summary CSV** has one row per sending day with counts per step, totals, capacity, utilization and status.

**PDF report** is landscape A4 with the logo, configuration, sequence, batch summary, validation results, capacity-delayed days and the full daily schedule with repeating headers.

## Customizing

- **Logo and brand colors:** replace the `<svg>` inside `index.html` (the PDF uses this same inline logo) and edit the `--navy`, `--sky` and `--pink` variables at the top of `css/styles.css`.
- **Defaults:** edit `DEF` in `js/state.js`.
- **Scheduling rules:** edit `schedule()` in `js/engine.js`, then add a test in `tests/engine.test.js`.
- **PDF layout:** edit `pdf()` in `js/exports.js`.

## Known limitations and ideas

- Scripts share global names. A good next step is converting them to ES modules (and optionally Vite and TypeScript).
- The contact and calendar lists show a limited number of rows on screen; exports always contain everything.
- Real contact lists (CSV import) are not supported yet.
- The tests cover the engine and validation only. The UI and exports have not been covered by automated tests.
- When the page runs inside Claude's artifact viewer, downloads use its save prompt. In a normal browser they use a standard file download.

## License

Add a license of your choice before publishing.
