#!/usr/bin/env node
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = source.match(/function depShow\(a,idx,N\)\{[^\n]*\}/);
assert.ok(match, 'Annual Portfolio Projection deposit display helper exists');
const context = {
  S: { assets: [{ type: '', add: 25196, amon: 4, madd: 0 }] },
  fyInfo(x, s, a) {
    const active = a >= 2 && a <= 8;
    return { act: active, yp: active, n: 0 };
  }
};
vm.createContext(context);
vm.runInContext(match[0] + '\nthis.depShow = depShow;', context);
assert.deepStrictEqual(
  Array.from({ length: 8 }, (_, i) => context.depShow(i + 1, null, 25)),
  [25196, 25196, 25196, 25196, 25196, 25196, 25196, 0],
  'April 2026 through March 2033 annual deposits appear once on their matching 1 April rows'
);
console.log('  ok   April 2026-March 2033 annual deposits appear on matching rows');
