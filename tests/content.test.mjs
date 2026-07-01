import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('no em dashes anywhere in the page', () => {
  assert.equal(html.includes('—'), false, 'found an em dash');
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
