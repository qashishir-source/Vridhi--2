#!/usr/bin/env node
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('function entry('), end = source.indexOf('function mcm(', start);
const fym = source.match(/const FYM=m=>m>=4\?m-4:m\+8/);
const mIx = source.match(/function mIx\(t\)\{[^\n]*\}/);
const depShow = source.match(/function depShow\(.*?(?=\nfunction addInfo\()/s);
assert.ok(start >= 0 && end > start, 'Projection date helpers exist');
assert.ok(fym && mIx && depShow, 'Annual Portfolio Projection deposit helper exists');
const context = {};
vm.createContext(context);
vm.runInContext([
  fym[0],
  mIx[0],
  source.slice(start, end),
  depShow[0],
  'this.projectDeposits=function(asset,count){S={start:2026,assets:[asset]};return Array.from({length:count},(_,i)=>depShow(i+1,null,count))}'
].join('\n'), context);
const yearly = context.projectDeposits({
  type: '', add: 25196, amon: 4, madd: 0, edate: '2026-04-01', yrs: 8,
  yfrom: '2026-01', yto: '2032-12'
}, 10);
assert.strictEqual(yearly[0], 25196, 'First annual April deposit appears on 1 Apr 2026');
assert.strictEqual(yearly[1], 25196, 'Next annual April deposit appears once on 1 Apr 2027');
assert.strictEqual(yearly[7], 0, 'No deposit appears after the final annual contribution');

const monthly = context.projectDeposits({
  type: '', add: 0, amon: 4, madd: 25196, edate: '2026-04-01', yrs: 8,
  mfrom: '2026-04', mto: '2033-03'
}, 10);
assert.strictEqual(monthly[0], 25196, 'First monthly April deposit appears on 1 Apr 2026');
assert.strictEqual(monthly[1], 12 * 25196, 'Annual report shows the next twelve monthly deposits once');
assert.strictEqual(monthly[7], 11 * 25196, 'Final year includes deposits through March 2033');
assert.strictEqual(monthly.reduce((total, amount) => total + amount, 0), 84 * 25196, 'No monthly deposits are lost or double-counted');
console.log('  ok   April 2026 annual and monthly deposits appear on matching rows');
