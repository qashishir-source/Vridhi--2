#!/usr/bin/env node
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'modules', 'auth', 'auth.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const configScript = html.indexOf('<script src="config.js"></script>');
const authScript = html.indexOf('<script id="vr-prod" src="modules/auth/auth.js?v=145"></script>');
const body = html.indexOf('<body>');
assert.ok(configScript >= 0 && authScript > configScript && body > authScript, 'Auth module loads synchronously after config and before the app body');
const match = source.match(/var idle=Number\(C\.idleMinutes===undefined\?5:C\.idleMinutes\),it=null,expiresAt=0;[\s\S]*?document\.addEventListener\('visibilitychange',function\(\)\{if\(!document\.hidden\)expire\(\)\}\);arm\(\);/);
assert.ok(match, 'Five-minute idle timeout code exists');

let now = 0, id = 0, signedOut = 0, active = true;
const timers = new Map(), events = {};
const context = {
  C: { idleMinutes: 5 },
  Date: class extends Date { static now() { return now; } },
  ses: () => active ? { uid: 'user-1' } : null,
  clearTimeout(timer) { timers.delete(timer); },
  setTimeout(callback, delay) { const timer = ++id; timers.set(timer, { callback, due: now + delay }); return timer; },
  localStorage: { getItem: () => '1' },
  window: {
    VRSB: { signOut() { signedOut++; active = false; } },
    addEventListener(name, callback) { events[name] = callback; }
  },
  document: {
    hidden: false,
    addEventListener(name, callback) { events[name] = callback; }
  }
};
vm.createContext(context);
vm.runInContext(match[0], context);
assert.strictEqual(timers.size, 1, 'Remember me does not disable the timeout');
assert.ok(['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'input', 'change'].every(name => events[name]), 'Activity on any screen resets the timer');

now = 2 * 60 * 1000;
events.keydown();
const deadline = Math.max(...Array.from(timers.values(), timer => timer.due));
assert.strictEqual(deadline, 7 * 60 * 1000, 'Interaction restarts the full five-minute timer');

now = deadline + 1;
context.document.hidden = false;
events.visibilitychange();
assert.strictEqual(signedOut, 1, 'Returning to an idle background tab signs the user out');
console.log('  ok   five-minute idle timeout signs out remembered sessions after inactivity');
