#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules', 'reports', 'visual-analytics.js'), 'utf8');
const sandbox = { window: {}, Intl, Number, String, Math, Promise, console };
vm.runInNewContext(source, sandbox);

const assets = [
  { name: 'Mutual Fund', cat: 'Equity' },
  { name: 'Bank FD', cat: 'Fixed income' },
  { name: 'Bank balance', cat: 'Cash' },
  { name: 'PPF', cat: 'Retirement' },
  { name: 'Sukanya Samriddhi', cat: 'Fixed income' },
  { name: 'Gold ETF', cat: 'Gold / Metal' },
  { name: 'Other holding', cat: 'Other' }
];
const rows = [
  { year: 2026, age: [48], tot: 26531185, v: [10000000, 2000000, 1000000, 3000000, 2000000, 1000000, 531185], chg: 0, add: 0 },
  { year: 2037, age: [59], tot: 69127042, v: [30000000, 8000000, 4000000, 12000000, 6000000, 3000000, 127042], chg: 0, add: 0 },
  { year: 2038, age: [60], tot: 100000000, v: [40000000, 12000000, 5000000, 18000000, 9000000, 5000000, 1000000], chg: 40000000, add: 1000000 },
  { year: 2049, age: [71], tot: 169749162, v: [70000000, 20000000, 10000000, 30000000, 20000000, 10000000, 9749162], chg: 72000000, add: 2000000 }
];
const model = sandbox.window.VRAnalytics.createModel({
  rows,
  assets,
  retirementIndex: 1,
  blendedRoi: 0.0767,
  fallbackIncome: 0
});

assert.strictEqual(model.metrics.current, 26531185);
assert.strictEqual(model.metrics.retirement, 69127042);
assert.strictEqual(model.metrics.terminal, 169749162);
assert.strictEqual(model.metrics.annualIncome, 54500000);
assert.strictEqual(model.metrics.currentAge, 48);
assert.strictEqual(model.metrics.retirementAge, 59);
assert.strictEqual(model.metrics.terminalAge, 71);
assert.deepStrictEqual(Array.from(model.allocations[0].values), [10000000, 3000000, 3000000, 3531185]);
assert.deepStrictEqual(Array.from(model.allocations[1].values), [30000000, 12000000, 12000000, 9127042]);

const markup = sandbox.window.VRAnalytics.section(model);
assert.ok(markup.includes('₹ 2.65 Cr') && markup.includes('₹ 6.91 Cr') && markup.includes('₹ 16.97 Cr'),
  'Executive metric ribbon formats the live projection milestones');
assert.ok(markup.includes('2037 · Age 59 retired') && markup.includes('2049 · Age 71 horizon'),
  'Metric details identify the retirement and terminal ages');
assert.ok(markup.includes('Net Worth Trajectory &amp; Retirement Milestones'));
assert.ok(markup.includes('2026 · Current') && markup.includes('2037 · Retirement') && markup.includes('2049 · Terminal'),
  'Allocation filter includes current, retirement, and terminal years');
assert.ok(markup.includes('va-trajectory') && markup.includes('va-allocation'));

console.log('  ok   visual analytics models milestones, asset classes, and report markup');
