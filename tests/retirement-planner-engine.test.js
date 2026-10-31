#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules', 'retirement-planner', 'engine.js'), 'utf8');
const uiSource = fs.readFileSync(path.join(root, 'modules', 'retirement-planner', 'ui.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const moduleScript = html.indexOf('<script src="modules/retirement-planner/engine.js?v=128"></script>');
const uiScript = html.indexOf('<script src="modules/retirement-planner/ui.js?v=129"></script>');
const bodyEnd = html.indexOf('</body>');
assert.ok(moduleScript >= 0 && uiScript > moduleScript, 'Retirement Planner engine loads before its UI');
assert.ok(!html.includes('<script id="fh-engine">'), 'Retirement Planner engine is no longer duplicated inline');
assert.ok(!html.includes('<script id="fh-ui">'), 'Retirement Planner UI is no longer duplicated inline');
assert.ok(bodyEnd > uiScript, 'Retirement Planner UI loads before the document ends');
assert.ok(!/\bdocument\s*\.|\blocalStorage\b|\bfetch\s*\(/.test(source), 'Engine stays independent of DOM, storage, and network APIs');
assert.ok(uiSource.includes('window.FreedomHorizon'), 'Extracted UI consumes the existing calculation engine API');

const context = {};
vm.createContext(context);
vm.runInContext(source, context);

const engine = context.FreedomHorizon;
assert.ok(engine, 'Engine exposes the existing FreedomHorizon global API');
const inputs = engine.defaults();
assert.strictEqual(engine.FIELDS.length, 65, 'Engine field catalogue remains available');
assert.strictEqual(engine.stepsFor(0).length, 4, 'A plan without children has four wizard steps');
assert.strictEqual(JSON.stringify(engine.defaultAllocation(1000000, 0)), JSON.stringify({ houseFund: 400000, buffer: 100000 }), 'Default bucket allocation remains available');

inputs.children = '0';
inputs.houseFund = 0;
inputs.buffer = 0;
assert.deepStrictEqual(Array.from(engine.validateAll(inputs)), [], 'A valid no-children plan passes validation');
const result = engine.calculate(inputs);
assert.strictEqual(result.ok, true, 'Valid inputs calculate successfully');
assert.strictEqual(result.rows[result.rows.length - 1].name, 'TOTAL', 'Calculation includes its total row');
assert.ok(Number.isFinite(result.needed) && result.needed > 0, 'Calculation returns a finite present-day funding need');
assert.strictEqual(result.available, 30000000, 'Calculation carries through the available corpus');
console.log('  ok   Retirement Planner engine loads independently and calculates a valid plan');
