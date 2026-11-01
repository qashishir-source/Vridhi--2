# Goal Planner reports

The report subsystem is split into synchronous classic scripts to preserve the app's
existing initialization order:

- `monthly-projection.js` builds month-by-month forecast rows and report/CSV output.
- `report-selection.js` owns holding/category selection, shared report rendering, and
  selection events.
- `interest-income.js` builds the Interest & Income Statement, summary tiles, and CSV.
- `visual-analytics.js` renders the annual projection's executive metrics and Chart.js
  visualizations; its scoped styles live in `visual-analytics.css`.

The scripts are loaded at their original positions in `index.html` because their callbacks
use existing app globals and are interleaved with other feature initialization. Their
`window.*` interfaces remain unchanged.

Run `node tests/reports.test.js` after changing report logic and
`node tests/visual-analytics.test.js` after changing visual analytics.
