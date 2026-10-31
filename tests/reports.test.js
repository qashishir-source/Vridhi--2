#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [
  ['modules/reports/monthly-projection.js', 'monthly-projection.js'],
  ['modules/reports/report-selection.js', 'report-selection.js'],
  ['modules/reports/interest-income.js', 'interest-income.js']
];
const positions = files.map(([file, tag]) => {
  const marker = `<script src="modules/reports/${tag}?v=137"></script>`;
  const index = html.indexOf(marker);
  assert.ok(index >= 0, `${tag} is loaded synchronously from index.html`);
  assert.strictEqual(html.indexOf(marker, index + 1), -1, `${tag} is included only once`);
  return index;
});
assert.ok(positions[0] < positions[1] && positions[1] < positions[2], 'Report scripts preserve their original initialization order');
assert.ok(!html.includes('window.monthData=function()'), 'Monthly projection code is no longer inline');
assert.ok(!html.includes('window.repSel=function()'), 'Report selection code is no longer inline');
assert.ok(!html.includes('window.intData=function()'), 'Interest statement code is no longer inline');

const assets = [
  { id: 1, name: 'PPF', cat: 'Retirement', type: 'fund', value: 1000, ret: 0.06, add: 120, madd: 10, amon: 4, cmp: 'ppf', icr: true, yrs: 4 },
  { id: 2, name: 'Bank', cat: 'Cash', type: 'fund', value: 500, ret: 0.04, add: 0, madd: 0, amon: 4, cmp: 'annual', icr: false, yrs: 4 }
];
const state = {
  start: 2026,
  ret: 41,
  members: [{ name: 'Self', role: 'Self' }],
  assets,
  grat: { rem: 0 }
};
const listeners = {};
const policy = {
  monthPayout() { return 0; },
  hasPayouts() { return false; }
};
const context = {
  S: state,
  UI: { rv: 'month', rsel: null, rcl: null, rq: '', rk: 'a', rd: 1, sel: null },
  CATS: ['Retirement', 'Cash'],
  COL: [],
  VRPolicy: policy,
  document: {
    addEventListener(name, callback) { listeners[name] = callback; },
    querySelectorAll() { return []; }
  },
  calc() {
    return {
      ri: 1,
      rows: [
        { a: 1, year: 2026, v: [1000, 500], tot: 1500, age: [40], st: [''] },
        { a: 2, year: 2027, v: [1300, 520], tot: 1820, age: [41], st: [''] }
      ]
    };
  },
  fyInfo(asset) {
    return {
      e: { a0: 2, mo: 4 },
      first: true,
      act: true,
      ms: Array(12).fill(true),
      n: 12,
      w: 78,
      yp: asset.add > 0,
      rem: 12,
      days: 365
    };
  },
  mcm(balance, asset) { return Array(12).fill(balance + asset.madd * 12 + asset.add); },
  matOf() { return null; },
  FYM(month) { return month >= 4 ? month - 4 : month + 8; },
  render() {},
  esc(value) { return String(value); },
  escn(value) { return String(value); },
  f(value) { return String(value); },
  lk(value) { return String(value); },
  hin(value) { return String(value); },
  rowRoi() { return 0; },
  rowRoiTxt() { return '0%'; },
  rowRoiPct() { return 0; },
  fyl(value) { return String(value); },
  sh(value) { return String(value); },
  matDone() { return false; },
  polTiVal(interest, payout) { return (interest || 0) + payout; },
  polTiTxt() { return '0'; },
  allMat() { return false; },
  depShow() { return 0; },
  repMin() { return ''; },
  repNone() { return '<div>None</div>'; }
};
context.window = context;
vm.createContext(context);
for (const [file] of files) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
const window = context;

const monthly = window.monthData();
assert.strictEqual(monthly.rows.length, 12, 'Monthly projection emits one row per month');
assert.strictEqual(monthly.rows[0].label, 'Apr 2026', 'Monthly projection starts at the financial-year boundary');
assert.strictEqual(monthly.rows[0].add, 130, 'First month includes its scheduled yearly and monthly contributions');
assert.strictEqual(monthly.rows[11].label, 'Mar 2027', 'Financial-year month labels end in March');
assert.strictEqual(monthly.rows[11].tot, 1820, 'Final month uses the annual forecast closing balance');
assert.strictEqual(typeof window.repMRows, 'function', 'Monthly report renderer interface is preserved');
assert.strictEqual(typeof window.monthCSV, 'function', 'Monthly CSV interface is preserved');
assert.ok(window.repMRows().includes('Apr 2026'), 'Monthly report renders the calculated rows');
assert.ok(window.monthCSV().includes('"S.No","Month","Year"'), 'Monthly CSV retains its column headers');

window.UI.rsel = ['1'];
assert.deepStrictEqual(Array.from(window.repSel().idx), [0], 'Report selection resolves selected holding IDs');
window.UI.rsel = [];
assert.strictEqual(window.repSel().none, true, 'An empty holding selection remains explicit');
window.UI.rsel = null;
assert.strictEqual(typeof window.repMin, 'function', 'Shared annual/minimal report renderer interface is preserved');

const interest = window.intData();
assert.strictEqual(interest.rows[0].fy, 'FY 2026-27', 'Interest report uses the same financial-year range');
assert.strictEqual(interest.rows[0].ad[0], 240, 'Interest report additions include yearly and monthly contributions');
assert.strictEqual(interest.rows[0].it[0], 60, 'Interest report subtracts additions from closing balance');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(window.intCalc(interest.rows[0], [0]))),
  { open: 1000, close: 1300, add: 240, intr: 60, mi: 5, yl: 0.06 },
  'Interest report metrics preserve opening, closing, additions, and yield calculations'
);
assert.strictEqual(typeof window.repIRows, 'function', 'Interest report renderer interface is preserved');
assert.strictEqual(typeof window.intCSV, 'function', 'Interest report CSV interface is preserved');
assert.ok(window.repIRows().includes('Interest<br>earned'), 'Interest report renders the statement columns');
assert.ok(window.intCSV().includes('"Interest earned"'), 'Interest statement CSV retains its column headers');

console.log('  ok   report modules preserve monthly projection, selection, and interest calculations');
