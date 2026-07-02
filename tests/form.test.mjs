import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, buildPayload, submitAudit } from '../form.js';

test('isValidEmail', () => {
  assert.equal(isValidEmail('a@b.co'), true);
  assert.equal(isValidEmail('nope'), false);
  assert.equal(isValidEmail(''), false);
  assert.equal(isValidEmail('a@b'), false);
});

test('buildPayload trims', () => {
  assert.deepEqual(buildPayload('  A@B.CO ', '  runs stuff '), { email:'A@B.CO', note:'runs stuff' });
});

test('submitAudit posts and returns ok on 200', async () => {
  let seen;
  const fakeFetch = async (url, opts) => { seen = { url, opts };
    return { ok:true, json: async () => ({ ok:true }) }; };
  const r = await submitAudit({ email:'a@b.co', note:'' }, fakeFetch);
  assert.equal(r.ok, true);
  assert.equal(seen.url, '/api/subscribe');
  assert.equal(JSON.parse(seen.opts.body).email, 'a@b.co');
});

test('submitAudit returns ok:false on failure', async () => {
  const fakeFetch = async () => ({ ok:false, json: async () => ({ error:'bad' }) });
  const r = await submitAudit({ email:'a@b.co', note:'' }, fakeFetch);
  assert.equal(r.ok, false);
});
