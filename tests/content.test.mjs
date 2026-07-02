import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const SHIPPING = ['index.html', 'styles.css', 'graph.js', 'form.js', 'og.html', 'api/subscribe.js'];

test('no em dashes anywhere in the page', () => {
  assert.equal(html.includes('—'), false, 'found an em dash');
});

test('no em dashes in any shipping file', () => {
  for (const f of SHIPPING) {
    const src = readFileSync(join(root, f), 'utf8');
    assert.ok(!src.includes('—'), `em dash found in ${f}`);
  }
});

test('required verified proof and copy are present', () => {
  for (const s of [
    'Build the infrastructure', 'Own the category',
    'Book a Memory Audit', 'Intelligence got cheap',
    'invobi', 'Purse', 'Company Brain',
    'id="audit-form"', 'id="audit-email"', 'id="audit-status"',
  ]) assert.ok(html.includes(s), `missing: ${s}`);
});

test('banned proof never appears', () => {
  for (const s of ['FoodCatering', 'Alex Lewis']) {
    assert.equal(html.toLowerCase().includes(s.toLowerCase()), false, `banned: ${s}`);
  }
});
