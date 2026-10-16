import test from 'node:test';
import assert from 'node:assert/strict';
import { addSpokenScore } from '../src/services/speechScores.js';
function store() {
  return {
    selectedPlayer: { bahnen: { 1: [], 2: [], 3: [], 4: [] } },
    addScore(lane, number) { this.selectedPlayer.bahnen[lane].push(number); },
  };
}
test('speech scores go to the supplied recording lane without an edited throw', () => {
  const state = store();
  assert.equal(addSpokenScore(state, 1, 9), 'added');
  assert.deepEqual(state.selectedPlayer.bahnen[1], [9]);
  assert.equal(addSpokenScore(state, 2, 8), 'added');
  assert.deepEqual(state.selectedPlayer.bahnen[1], [9]);
  assert.deepEqual(state.selectedPlayer.bahnen[2], [8]);
});
test('speech accepts zero and stops at 30 throws', () => {
  const state = store();
  state.selectedPlayer.bahnen[3] = Array(29).fill(9);
  assert.equal(addSpokenScore(state, 3, 0), 'added');
  assert.equal(addSpokenScore(state, 3, 8), 'full');
  assert.equal(state.selectedPlayer.bahnen[3].length, 30);
  assert.equal(state.selectedPlayer.bahnen[3][29], 0);
});
test('missing lane/player and invalid numbers do not change scores', () => {
  const state = store();
  for (const lane of [null, 0, 5, '1']) assert.equal(addSpokenScore(state, lane, 9), 'invalid-lane');
  for (const value of [-1, 10, 1.5, NaN, '9']) assert.equal(addSpokenScore(state, 1, value), 'invalid-number');
  assert.deepEqual(state.selectedPlayer.bahnen[1], []);
  assert.equal(addSpokenScore({ selectedPlayer: null }, 1, 9), 'no-player');
});
