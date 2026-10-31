# Retirement Planner calculation engine

`engine.js` contains the Retirement Planner's calculation engine. It has no DOM, storage,
or network dependencies; callers provide inputs and use the `FreedomHorizon` API it exposes.
`ui.js` contains the Retirement Planner wizard, summary, and report UI, and consumes that API.

Both classic scripts load synchronously in order: the engine first, then the UI. Keep this order
so the UI can consume the existing engine API without changing the app's global interfaces.

Run `node tests/retirement-planner-engine.test.js` after changing either file.
