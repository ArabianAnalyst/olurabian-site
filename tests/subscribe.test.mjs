import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleSubscribe } from '../api/subscribe.js';

test('rejects non-POST', async () => {
  const r = await handleSubscribe({ method:'GET', body:{} }, { resendKey:'k' });
  assert.equal(r.status, 405);
});

test('rejects invalid email', async () => {
  const r = await handleSubscribe({ method:'POST', body:{ email:'nope' } }, { resendKey:'k' });
  assert.equal(r.status, 400);
});

test('returns 500 when audienceId is missing', async () => {
  const r = await handleSubscribe(
    { method:'POST', body:{ email:'a@b.co' } },
    { resendKey:'key', audienceId:null });
  assert.equal(r.status, 500);
  assert.equal(r.json.error, 'not configured');
});

test('calls resend and returns 200 on success', async () => {
  let called;
  const fakeFetch = async (url, opts) => { called = { url, opts };
    return { ok:true, json: async () => ({ id:'x' }) }; };
  const r = await handleSubscribe(
    { method:'POST', body:{ email:'a@b.co', note:'hi' } },
    { resendKey:'key', audienceId:'aud', fetchImpl:fakeFetch });
  assert.equal(r.status, 200);
  assert.ok(called.url.includes('resend.com'));
  assert.equal(called.opts.headers.Authorization, 'Bearer key');
});

test('returns 502 when resend fails', async () => {
  const fakeFetch = async () => ({ ok:false, status:500, json: async () => ({}) });
  const r = await handleSubscribe(
    { method:'POST', body:{ email:'a@b.co' } },
    { resendKey:'key', audienceId:'aud', fetchImpl:fakeFetch });
  assert.equal(r.status, 502);
});

test('honeypot filled: fake success, never calls resend', async () => {
  let called = false;
  const fakeFetch = async () => { called = true; return { ok:true, json: async () => ({}) }; };
  const r = await handleSubscribe(
    { method:'POST', body:{ email:'a@b.co', company_url:'http://spam' } },
    { resendKey:'key', audienceId:'aud', fetchImpl:fakeFetch });
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
  assert.equal(called, false);
});

test('blocks a disallowed Origin with 403', async () => {
  const r = await handleSubscribe(
    { method:'POST', body:{ email:'a@b.co' }, origin:'https://evil.example' },
    { resendKey:'key', audienceId:'aud', allowedOrigins:['https://www.olurabian.com'] });
  assert.equal(r.status, 403);
});

test('allows a whitelisted Origin', async () => {
  const fakeFetch = async () => ({ ok:true, json: async () => ({ id:'x' }) });
  const r = await handleSubscribe(
    { method:'POST', body:{ email:'a@b.co' }, origin:'https://www.olurabian.com' },
    { resendKey:'key', audienceId:'aud', fetchImpl:fakeFetch, allowedOrigins:['https://www.olurabian.com'] });
  assert.equal(r.status, 200);
});
