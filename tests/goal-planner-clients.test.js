#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules', 'goal-planner-clients', 'goal-planner-clients.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const appCore = fs.readFileSync(path.join(root, 'modules', 'app-core', 'app.js'), 'utf8');
const keysPosition = appCore.indexOf('const GPP_KEYS=');
const retirementUI = html.indexOf('<script src="modules/retirement-planner/ui.js?v=150"></script>');
const moduleSourceTag = '<script src="modules/goal-planner-clients/goal-planner-clients.js?v=138"></script>';
const moduleTag = html.indexOf(moduleSourceTag);
const appCoreTag = html.indexOf('<script src="modules/app-core/app.js?v=162"></script>');
assert.ok(keysPosition >= 0 && appCoreTag >= 0 && retirementUI > appCoreTag && moduleTag > retirementUI, 'Profile module loads after its state keys and planner dependencies');
assert.strictEqual(html.indexOf(moduleSourceTag, moduleTag + moduleSourceTag.length), -1, 'Profile module is included only once');
assert.ok(!html.includes('Goal Planner clients (build 84):'), 'Profile manager logic is no longer inline');

const keys = ['members', 'start', 'end', 'ret', 'retP', 'hor', 'goal', 'link', 'grat', 'assets', 'policies'];
function snapshot(name, value, goal) {
  const data = {
    members: [{ id: 1, name, role: 'Self', age: 40 }],
    start: 2026,
    end: 2045,
    ret: 58,
    retP: 58,
    hor: 6,
    goal,
    link: false,
    grat: { basic: 0, svc: 0, rem: 0, cap: 0 },
    assets: [{ id: 1, name: 'Fund', cat: 'Equity', value, add: 0, ret: 0.06, type: 'fund' }],
    policies: []
  };
  return data;
}
const active = snapshot('Asha', 1000, 100000);
const other = snapshot('Bina', 2000, 200000);
const state = Object.assign({}, active, {
  gpp: {
    active: 'asha',
    profiles: {
      asha: { name: 'Asha', d: JSON.parse(JSON.stringify(active)), created: 1 },
      bina: { name: 'Bina', d: JSON.parse(JSON.stringify(other)), created: 2 }
    }
  }
});
const listeners = {};
const elements = {
  'gpp-n': { value: '', focus() {}, select() {} },
  'gpp-e': { textContent: '' }
};
const dialog = { innerHTML: '', className: '', open: false, showModal() { this.open = true; }, close() { this.open = false; } };
let renderCount = 0, saves = 0, confirmation;
const context = {
  window: null,
  S: state,
  UI: { tab: 'Dashboard', rv: null, q: 'filter', cat: 'Equity', sel: 4, rq: 'search', rsel: ['1'], rcl: ['Equity'] },
  GPP_KEYS: keys,
  DEF() {
    return {
      start: 2026, end: 2049, ret: 58, retP: 58, hor: 6, goal: 50000000,
      members: [{ age: 40 }], assets: []
    };
  },
  MB(id, name, role, age) { return { id, name, role, age }; },
  save() { saves++; if (context.window.gppSync) context.window.gppSync(); },
  render() { renderCount++; },
  calc(plan) { return { rows: [{ v: plan.assets.map(asset => asset.value) }] }; },
  ctx() {
    return { r0: { tot: context.S.assets[0].value }, rr: { tot: 250000, year: 2044 }, G: context.S.goal, yr: 18, tm: 120 };
  },
  cr(value) { return '₹ ' + value; },
  esc(value) { return String(value); },
  document: {
    addEventListener(name, callback) { listeners[name] = callback; },
    getElementById(id) { return elements[id] || null; }
  },
  dg: dialog,
  toast() {},
  confirmBox(message, callback) { confirmation = { message, callback }; },
  rvTog() { return '<div class="report-toggle"></div>'; },
  scrollTo() {},
  Date,
  JSON,
  Object,
  Array,
  String,
  Number,
  Math
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context);

assert.strictEqual(context.UI.rv, 'clients', 'Client portfolios remain the initial Reports view');
assert.strictEqual(typeof context.gppSync, 'function', 'Profile state sync remains exposed');
assert.ok(context.gppBarHTML(true).includes('Asha') && context.gppBarHTML(true).includes('Bina'), 'Client switcher lists each saved profile');
assert.ok(context.gppHeroInner().includes('Asha'), 'Goal Planner hero reflects the active profile');
assert.strictEqual(context.gppHoldingList().length, 2, 'Read-only holdings summary includes every profile');
assert.strictEqual(context.gppHoldingList()[1].items[0].val, 2000, 'Holdings summary uses each profile plan');

state.goal = 123456;
listeners.change({ target: { classList: { contains: value => value === 'gpp-sel' }, value: 'bina' } });
assert.strictEqual(state.gpp.active, 'bina', 'Selecting a client changes the active profile');
assert.strictEqual(state.members[0].name, 'Bina', 'Selecting a client loads its planning data into app state');
assert.strictEqual(state.goal, 200000, 'Switching profiles loads the selected profile goal');
assert.strictEqual(state.gpp.profiles.asha.d.goal, 123456, 'Switching saves the previous active profile first');
assert.strictEqual(context.UI.rq, '', 'Switching profiles clears report search state');
assert.strictEqual(context.UI.rsel, undefined, 'Switching profiles clears holding selection state');
assert.ok(renderCount > 0 && saves > 0, 'Profile switching saves and rerenders the app');

listeners.click({
  target: {
    id: '',
    closest(selector) {
      return selector === '[data-gpp]' ? { dataset: { gpp: 'dup:bina' } } : null;
    }
  }
});
const copies = Object.keys(state.gpp.profiles).filter(id => state.gpp.profiles[id].name === 'Bina (copy)');
assert.strictEqual(copies.length, 1, 'Duplicate action creates a uniquely named profile');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(state.gpp.profiles[copies[0]].d)),
  JSON.parse(JSON.stringify(state.gpp.profiles.bina.d)),
  'Duplicate action copies the complete profile plan'
);

listeners.click({
  target: {
    id: '',
    closest(selector) {
      return selector === '[data-gpp]' ? { dataset: { gpp: 'del:' + copies[0] } } : null;
    }
  }
});
assert.ok(confirmation && confirmation.message.includes('Bina (copy)'), 'Delete action requests confirmation');
confirmation.callback();
assert.ok(!state.gpp.profiles[copies[0]], 'Confirmed deletion removes the selected profile');

console.log('  ok   Goal Planner client profiles preserve switching, snapshots, duplicate, and delete behavior');
