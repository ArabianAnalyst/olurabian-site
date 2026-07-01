import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, createGraph, stepGraph, hitTest, shouldAnimate, NAMED } from '../graph.js';

test('mulberry32 is deterministic', () => {
  const a = mulberry32(42), b = mulberry32(42);
  assert.equal(a(), b());
  assert.ok(a() >= 0 && a() < 1);
});

test('createGraph includes all named nodes with labels and sections', () => {
  const g = createGraph({ width: 1000, height: 600, count: 30, seed: 7 });
  assert.ok(g.nodes.length >= NAMED.length);
  for (const n of NAMED) {
    const found = g.nodes.find(x => x.id === n.id);
    assert.ok(found, `missing ${n.id}`);
    assert.equal(found.label, n.label);
    assert.equal(found.section, n.section);
  }
  const center = g.nodes.find(x => x.id === 'araba');
  assert.equal(center.accent, true);
  assert.ok(Math.abs(center.x - 500) < 1 && Math.abs(center.y - 300) < 1);
});

test('createGraph nodes are within bounds and edges reference valid indices', () => {
  const g = createGraph({ width: 800, height: 500, count: 24, seed: 3 });
  for (const n of g.nodes) {
    assert.ok(n.x >= 0 && n.x <= 800 && n.y >= 0 && n.y <= 500);
  }
  for (const [i, j] of g.edges) {
    assert.ok(i >= 0 && i < g.nodes.length && j >= 0 && j < g.nodes.length);
    assert.notEqual(i, j);
  }
});

test('stepGraph keeps nodes in bounds', () => {
  const g = createGraph({ width: 400, height: 300, count: 20, seed: 1 });
  for (let k = 0; k < 200; k++) stepGraph(g, 16, { width: 400, height: 300 });
  for (const n of g.nodes) {
    assert.ok(n.x >= 0 && n.x <= 400 && n.y >= 0 && n.y <= 300);
  }
});

test('hitTest finds a node at its position and returns -1 far away', () => {
  const g = createGraph({ width: 1000, height: 600, count: 30, seed: 9 });
  const n = g.nodes[5];
  assert.equal(hitTest(g, n.x, n.y), 5);
  assert.equal(hitTest(g, -999, -999), -1);
});

test('shouldAnimate gates on reduced motion', () => {
  assert.equal(shouldAnimate(false), true);
  assert.equal(shouldAnimate(true), false);
});
