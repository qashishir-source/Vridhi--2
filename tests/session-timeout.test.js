#!/usr/bin/env node
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules', 'auth', 'idle-timeout.js'), 'utf8');
const authSource = fs.readFileSync(path.join(root, 'modules', 'auth', 'auth.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const configScript = html.indexOf('<script src="config.js"></script>');
const authScript = html.indexOf('<script id="vr-prod" src="modules/auth/auth.js?v=149"></script>');
const timeoutScript = html.indexOf('<script src="modules/auth/idle-timeout.js?v=148"></script>');
const body = html.indexOf('<body>');
assert.ok(configScript >= 0 && authScript > configScript && timeoutScript > authScript && body > timeoutScript,
  'Auth and timeout modules load synchronously after config and before the app body');
assert.ok(!authSource.includes('automatic sign-out after five minutes'),
  'The timeout lifecycle is owned by its dedicated module');

let now = 0, id = 0, signedOut = 0, reloads = 0;
const timers = new Map(), documentEvents = {}, windowEvents = {};
const stored = new Map([['fs-auth', '1'], ['vr-sb', JSON.stringify({ uid: 'user-1' })]]);
function setTimer(callback, delay) {
  const timer = ++id;
  timers.set(timer, { callback, due: now + delay });
  return timer;
}
const sessionStorage = {
  getItem(key) { return stored.get(key) || null; },
  setItem(key, value) { stored.set(key, String(value)); },
  removeItem(key) { stored.delete(key); }
};
const document = {
  hidden: false,
  addEventListener(name, callback) { documentEvents[name] = callback; }
};
const window = {
  VR_CFG: { idleMinutes: 5 },
  VRSB: { signOut() { signedOut++; } },
  addEventListener(name, callback) { windowEvents[name] = callback; }
};
function loadTimeout() {
  const context = {
    window, document, sessionStorage, localStorage: { removeItem() {} },
    location: { reload() { reloads++; } },
    Date: class extends Date { static now() { return now; } },
    setTimeout: setTimer,
    clearTimeout(timer) { timers.delete(timer); }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
}
function currentDeadline() {
  return Math.max(...Array.from(timers.values(), timer => timer.due));
}

loadTimeout();
assert.strictEqual(currentDeadline(), 5 * 60 * 1000, 'An authenticated session starts a five-minute timer');
const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'input', 'change', 'wheel'];
assert.ok(activityEvents.every(name => documentEvents[name]),
  'Activity is observed at the document level across every app screen');

for (const screen of ['Dashboard', 'Goal Planner', 'Reports', 'Holdings', 'Settings', 'Policies', 'Retirement Planner']) {
  now += 1000;
  documentEvents.pointerdown({ target: { screen } });
  assert.strictEqual(currentDeadline(), now + 5 * 60 * 1000, `${screen} activity restarts the idle timer`);
}

const deadline = currentDeadline();
now = deadline + 1;
timers.get(Math.max(...timers.keys())).callback();
assert.strictEqual(signedOut, 1, 'An idle authenticated session signs out at its deadline');
assert.strictEqual(reloads, 0, 'Production sign-out is delegated to the auth module');
assert.strictEqual(typeof windowEvents.focus, 'function', 'Returning focus checks the persisted deadline');
assert.strictEqual(typeof windowEvents.pageshow, 'function', 'Restoring a page checks the persisted deadline');
assert.strictEqual(typeof documentEvents.visibilitychange, 'function', 'Returning to a visible tab checks the persisted deadline');

signedOut = 0;
now = 0;
timers.clear();
stored.set('vr-idle-until', String(5 * 60 * 1000));
now = 6 * 60 * 1000;
loadTimeout();
assert.strictEqual(signedOut, 1, 'A reload cannot restart an already-expired authenticated session');
assert.ok(authSource.includes("sessionStorage.removeItem('vr-idle-until')"),
  'Signing out clears the persisted idle deadline');

assert.ok(authSource.indexOf('wipeAuth();') < authSource.indexOf('fetch(URL0+\'/auth/v1/logout\''),
  'Sign-out clears local authentication before attempting remote logout');

window.VRSB = null;
stored.set('fs-auth', '1');
stored.set('vr-idle-until', '1');
now = 6 * 60 * 1000;
loadTimeout();
assert.strictEqual(reloads, 1, 'An expired local session locks even when production auth is unavailable');
assert.strictEqual(stored.has('fs-auth'), false, 'Fallback sign-out clears the local authenticated state');
console.log('  ok   five-minute idle timeout covers every screen and remains enforced across reloads');
