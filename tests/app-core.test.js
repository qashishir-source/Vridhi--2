#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appCore = fs.readFileSync(path.join(root, 'modules', 'app-core', 'app.js'), 'utf8');
const i18n = html.indexOf('<script src="modules/i18n/i18n.js?v=130"></script>');
const landing = html.indexOf('<script src="modules/landing/landing.js?v=131"></script>');
const calculations = html.indexOf('<script src="modules/portfolio-calculations/engine.js?v=136"></script>');
const coreTag = '<script src="modules/app-core/app.js?v=152"></script>';
const core = html.indexOf(coreTag);
const family = html.indexOf('<script src="modules/family-management/family-management.js?v=143"></script>');

assert.ok(i18n >= 0 && landing > i18n && calculations > landing && core > calculations && family > core,
  'App core remains synchronously loaded after its dependencies and before feature modules');
assert.strictEqual(html.indexOf(coreTag, core + coreTag.length), -1,
  'App core is loaded exactly once');
assert.ok(!html.includes('//CALC-START') && !html.includes('setTimeout(startApp,250);'),
  'The large app script and startup call are no longer inline');
assert.ok(appCore.trimStart().startsWith('//CALC-START') && appCore.includes('//CALC-END') &&
  appCore.includes('setTimeout(startApp,250);'),
'Extracted app core preserves its calculation boundaries and initialization behavior');
assert.ok(appCore.includes('function render()') && appCore.includes('async function initSync()') &&
  appCore.includes('M.addEventListener(\'click\'') && appCore.includes('async function startApp()'),
'Extracted app core retains the app render, sync, and delegated event setup');
assert.ok(appCore.includes('function holdingDetail(D,i)') &&
  appCore.includes('data-holding-view=') && appCore.includes('data-holding-back') &&
  appCore.includes('data-hdtab=') && appCore.includes('Estimated value through retirement'),
'Holdings include a detail page with projections, tabbed information, and return navigation');

console.log('App core loads synchronously and preserves its initialization boundaries');
