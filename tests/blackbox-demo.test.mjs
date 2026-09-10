import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const js = readFileSync(join(root, 'blackbox.js'), 'utf8');
const m = /\/\/ chain-logic:start([\s\S]*?)\/\/ chain-logic:end/.exec(js);
globalThis.crypto ??= webcrypto;
const demo = m ? new Function(m[1] + '\nreturn { GENESIS, hashRecord, verifyChain };')() : null;

// Computed once with @olurabian/receipt, hashRecord over this exact receipt
// (node -e over receipt/dist/index.js on 2026-09-10). The canonical form is
// JSON.stringify({ id, ts, kind, payload, prevHash }).
const GENESIS = '0'.repeat(64);
const FIXED_HASH = 'd4bd87553812292c09750eef6ae72137687180710133495a3144191060bd1afc';
const fixed = () => ({ id: 'id-1', ts: '2026-09-10T00:00:00.000Z', kind: 'action', payload: { action: 'charge-card', outcome: 'ok', latencyMs: 184, cost: 20 }, prevHash: GENESIS });

test('blackbox.js carries the chain-logic block and it touches no DOM', () => {
  assert.ok(m, 'chain-logic markers missing from blackbox.js');
  assert.doesNotMatch(m[1], /\b(document|window)\b/);
});

test('hashRecord matches @olurabian/receipt on the fixed receipt', async () => {
  assert.equal(demo.GENESIS, GENESIS);
  assert.equal(await demo.hashRecord(fixed()), FIXED_HASH);
});

test('an altered payload breaks at index 0 with the package reason', async () => {
  const r = fixed(); r.hash = FIXED_HASH; r.payload.cost = 5000;
  assert.deepEqual(await demo.verifyChain([r]), { ok: false, brokenAt: 0, id: 'id-1', reason: 'hash mismatch (a record was altered)' });
});

test('a reordered chain breaks with the prevHash reason', async () => {
  const a = fixed(); a.hash = await demo.hashRecord(a);
  const b = { id: 'id-2', ts: a.ts, kind: 'action', payload: { action: 'query-ledger', outcome: 'ok', latencyMs: 31, cost: 0 }, prevHash: a.hash };
  b.hash = await demo.hashRecord(b);
  assert.deepEqual(await demo.verifyChain([a, b]), { ok: true });
  assert.deepEqual(await demo.verifyChain([b, a]), { ok: false, brokenAt: 0, id: 'id-2', reason: 'prevHash mismatch (a record was inserted, removed, or reordered)' });
});

test('a truncated chain still verifies, the witness gap', async () => {
  const a = fixed(); a.hash = await demo.hashRecord(a);
  const b = { id: 'id-2', ts: a.ts, kind: 'action', payload: { action: 'query-ledger', outcome: 'ok', latencyMs: 31, cost: 0 }, prevHash: a.hash };
  b.hash = await demo.hashRecord(b);
  assert.deepEqual(await demo.verifyChain([a, b]), { ok: true });
  assert.deepEqual(await demo.verifyChain([a]), { ok: true });
});
