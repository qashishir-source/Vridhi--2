#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const stylesheets = [
  ['modules/app-shell/base.css', ':root{--bg:#f5f6f8;'],
  ['modules/ui-pagination/ui.css', '.vpg{display:flex;'],
  ['modules/app-shell/goal-timeline.css', '.pt{border:1px solid'],
  ['modules/landing/landing.css', '.vw{--vn:#17294a;'],
  ['modules/dashboard-preferences/dashboard.css', '#dsh{max-width:900px;'],
  ['modules/app-shell/ui-system.css', ':root{color-scheme:light dark}'],
  ['modules/retirement-planner/ui.css', 'dialog.hf.fh{width:min(560px,96vw)}'],
  ['modules/app-shell/icons.css', '/* Icons (build 47):'],
  ['modules/retirement-planner/planner-page.css', '.rp2-page{display:flex;'],
  ['modules/app-shell/enterprise.css', 'data-skin=enterprise']
];

const positions = stylesheets.map(([file, marker]) => {
  const contents = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(contents.includes(marker), `${file} contains its expected feature styles`);
  const link = `<link rel="stylesheet" href="${file}?v=141">`;
  const index = html.indexOf(link);
  assert.ok(index >= 0, `${file} is loaded from index.html`);
  assert.strictEqual(html.indexOf(link, index + link.length), -1, `${file} is included only once`);
  return index;
});
assert.deepStrictEqual(positions.slice().sort((a, b) => a - b), positions,
  'Extracted stylesheets preserve their cascade order');
assert.ok(!html.includes('<style id="ui-system">') && !html.includes('<style id="fh-css">') &&
  !html.includes('<style id="fh-css2">') && !html.includes('<style id="ds-ent">'),
'Large feature styles are no longer embedded in index.html');

console.log('  ok   extracted stylesheets are present and preserve cascade order');
