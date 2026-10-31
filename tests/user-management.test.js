#!/usr/bin/env node
'use strict';

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const adminSource = fs.readFileSync(path.join(root, 'modules', 'user-management', 'client-admin.js'), 'utf8');
const passwordSource = fs.readFileSync(path.join(root, 'modules', 'user-management', 'password-change.js'), 'utf8');
const adminTag = '<script src="modules/user-management/client-admin.js?v=140"></script>';
const passwordTag = '<script src="modules/user-management/password-change.js?v=140"></script>';
const adminPosition = html.indexOf(adminTag);
const passwordPosition = html.indexOf(passwordTag);
assert.ok(adminPosition >= 0 && passwordPosition > adminPosition, 'User management modules load synchronously in their original order');
assert.strictEqual(html.indexOf(adminTag, adminPosition + adminTag.length), -1, 'Client administration module is included only once');
assert.strictEqual(html.indexOf(passwordTag, passwordPosition + passwordTag.length), -1, 'Password module is included only once');
assert.ok(!html.includes("var st={users:null,err:'',msg:'',loading:false,show:false"), 'Client administration logic is no longer inline');
assert.ok(!html.includes("function $(i){return document.getElementById(i)}function v(i){var x=$(i);return x?x.value:''}"), 'Password-change logic is no longer inline');

function clickListenerTest() {
  const listeners = {};
  const inputs = {
    'vr-um-em': { value: '' },
    'vr-um-pw': { value: '' },
    'vr-um-rp': { value: '' }
  };
  const host = { innerHTML: '' };
  const actions = [];
  let users = [{ id: 'client-1', email: 'client@example.com', role: 'client', created_at: '2026-01-01' }];
  const context = {
    window: null,
    document: {
      addEventListener(name, callback) { listeners[name] = callback; },
      getElementById(id) { return id === 'vr-um' ? host : inputs[id] || null; }
    },
    VRSB: {
      async isAdviser() { return true; },
      async users(request) {
        actions.push(request);
        if (request.action === 'list') return { users };
        if (request.action === 'create') {
          users = users.concat({ id: 'client-2', email: request.email, role: 'client' });
        }
        if (request.action === 'delete') users = users.filter(user => user.id !== request.id);
        return {};
      }
    },
    VR_ADV: true,
    Date,
    setTimeout(callback) { context.load = callback; return 1; },
    confirm() { return true; }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(adminSource, context, { filename: 'client-admin.js' });

  assert.ok(context.usersTab().includes('Client logins'), 'Users tab renders client administration');
  return context.load().then(async () => {
    assert.ok(host.innerHTML.includes('client@example.com'), 'Loading lists client logins');
    const click = async (action, data = {}) => listeners.click({
      target: {
        closest(selector) {
          return selector === '[data-um]' ? { dataset: Object.assign({ um: action }, data) } : null;
        }
      }
    });

    await click('add');
    inputs['vr-um-em'].value = ' New.Client@example.com ';
    inputs['vr-um-pw'].value = 'short';
    await click('create');
    assert.ok(host.innerHTML.includes('Password must be 8 to 10 characters.'), 'Create validates temporary password length');
    inputs['vr-um-pw'].value = 'temporary9';
    await click('create');
    const createAction = actions.find(action => action.action === 'create');
    assert.ok(createAction && createAction.email === 'new.client@example.com' && createAction.password === 'temporary9',
      'Create normalizes email and calls the user API');

    await click('reset', { id: 'client-1' });
    inputs['vr-um-rp'].value = 'resetpass9';
    await click('rsave', { id: 'client-1' });
    assert.ok(actions.some(action => action.action === 'reset' && action.id === 'client-1' && action.password === 'resetpass9'), 'Reset saves the selected client password');

    await click('del', { id: 'client-1', email: 'client@example.com' });
    assert.ok(actions.some(action => action.action === 'delete' && action.id === 'client-1'), 'Remove deletes the confirmed client');
  });
}

function passwordChangeTest() {
  const listeners = {};
  const fields = {};
  let modal = null, changed = null, completed = false;
  function field(id) {
    if (!fields[id]) fields[id] = { value: '', textContent: '', type: '', disabled: false, listeners: {}, addEventListener(name, callback) { this.listeners[name] = callback; }, focus() {}, select() {} };
    return fields[id];
  }
  const box = {
    set innerHTML(value) {
      this.html = value;
      if (value.includes('Password changed')) field('vr-cpd');
    }
  };
  const context = {
    window: null,
    document: {
      addEventListener(name, callback) { listeners[name] = callback; },
      removeEventListener() {},
      getElementById(id) { return id === 'vr-cpm' ? modal : field(id); },
      createElement() {
        return {
          set id(value) { this._id = value; modal = this; },
          get id() { return this._id; },
          set innerHTML(value) { this.html = value; },
          addEventListener() {},
          remove() { modal = null; }
        };
      },
      body: { appendChild() {} },
      querySelector() { return box; }
    },
    VRSB: {
      async isAdviser() { return true; },
      async changePassword(current, next) { changed = { current, next }; }
    }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(passwordSource, context, { filename: 'password-change.js' });
  const open = listeners.click({
    target: { closest(selector) { return selector === '#vr-cp' ? {} : null; } }
  });
  return Promise.resolve(open).then(() => new Promise(resolve => setImmediate(resolve))).then(async () => {
    assert.ok(modal && modal.html.includes('Use 14 or more characters.'), 'Adviser password dialog uses the adviser length rule');
    field('vr-cp0').value = 'current-password';
    field('vr-cp1').value = 'short';
    field('vr-cp2').value = 'short';
    await field('vr-cpv').listeners.click();
    assert.ok(field('vr-cpe').textContent.includes('at least 14'), 'Password change validates adviser password length');

    field('vr-cp1').value = 'a-new-adviser-password';
    field('vr-cp2').value = 'a-new-adviser-password';
    await field('vr-cpv').listeners.click();
    assert.deepStrictEqual(changed, {
      current: 'current-password',
      next: 'a-new-adviser-password'
    }, 'Password change submits current and new passwords');
    assert.ok(box.html.includes('Password changed'), 'Successful password change shows confirmation');
    field('vr-cpd').listeners.click();
    completed = modal === null;
    assert.ok(completed, 'Done closes the password dialog');
  });
}

clickListenerTest()
  .then(passwordChangeTest)
  .then(() => console.log('  ok   user management preserves client login and password flows'))
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
