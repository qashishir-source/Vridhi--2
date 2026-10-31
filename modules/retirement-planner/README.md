# Retirement Planner calculation engine

`engine.js` contains the Retirement Planner's calculation engine. It has no DOM, storage,
or network dependencies; callers provide inputs and use the `FreedomHorizon` API it exposes.
The Retirement Planner UI remains in `index.html` and consumes this API.

The classic script must load synchronously immediately before the Retirement Planner UI script,
which preserves its current startup order and avoids changing the app's global API.

Run `node tests/retirement-planner-engine.test.js` after changing the engine.
