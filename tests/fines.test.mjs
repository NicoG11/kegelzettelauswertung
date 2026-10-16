import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePayableFine } from '../src/services/rules.js';

test('own fines apply below 600 pins and are waived at and above 600', () => {
  assert.equal(calculatePayableFine(5, 3, 599), 8);
  assert.equal(calculatePayableFine(5, 3, 600), 3);
  assert.equal(calculatePayableFine(5, 3, 601), 3);
  assert.equal(calculatePayableFine(5, 0, 600), 0);
});

test('shares from other players remain payable and the 15 Euro cap still applies', () => {
  assert.equal(calculatePayableFine(12, 8, 599), 15);
  assert.equal(calculatePayableFine(12, 8, 600), 8);
  assert.equal(calculatePayableFine(12, 20, 600), 15);
  assert.equal(calculatePayableFine(0, 0, 0), 0);
});
