import test from 'node:test';
import assert from 'node:assert/strict';
import { currentSeason, validSeason, gameSeason, savedGameKey, readSavedGames } from '../src/services/savedGames.js';
import { normalizePlayerName, readPlayerNames } from '../src/services/playerCatalog.js';

test('season follows the calendar year, including New Year', () => {
  assert.equal(currentSeason(new Date(2026, 11, 31)), '2026/2027');
  assert.equal(currentSeason(new Date(2027, 0, 1)), '2027/2028');
  assert.ok(validSeason('2026/2027'));
  for (const value of ['2026/2028', '26/27', '', null]) assert.equal(validSeason(value), false);
});

test('legacy dates determine the season; undated results remain unassigned', () => {
  assert.equal(gameSeason({ datum: '16.10.2026' }), '2026/2027');
  assert.equal(gameSeason({ datum: '2025-09-21' }), '2025/2026');
  assert.equal(gameSeason({ datum: 'Unbekannt' }), '');
  assert.equal(gameSeason({ saison: '2024/2025', datum: '16.10.2026' }), '2024/2025');
  assert.equal(gameSeason({ saison: '', datum: '16.10.2026' }), '');
});

test('the same game name in different seasons has separate storage keys', () => {
  assert.notEqual(savedGameKey('2026/2027', '1'), savedGameKey('2027/2028', '1'));
  assert.equal(savedGameKey('2026/2027', '  Heim / Gast: 1  '), 'spieltag_v2:2026/2027:Heim%20%2F%20Gast%3A%201');
});

test('new and legacy results coexist without modifying stored data', () => {
  const entries = {
    spieltag_Alt: JSON.stringify({ spieltag: 'Alt', datum: '22.09.2025', spielerListe: [] }),
    spieltag_Undatiert: JSON.stringify({ spieltag: 'Undatiert', spielerListe: [] }),
    [savedGameKey('2026/2027', '1')]: JSON.stringify({ spieltag: '1', saison: '2026/2027', spielerListe: [] }),
    spieltag_Kaputt: '{',
    spieltag_Ungueltig: JSON.stringify({ spieltag: 'Fehler' }),
    kegelzettel_theme: 'clubDark',
  };
  const before = JSON.stringify(entries);
  const storage = { ...entries, getItem: key => entries[key] ?? null };
  const result = readSavedGames(storage);
  assert.deepEqual(result.map(game => [game.spieltag, game.saison]), [
    ['1', '2026/2027'], ['Alt', '2025/2026'], ['Undatiert', ''],
  ]);
  assert.equal(result[1].key, 'spieltag_Alt');
  assert.equal(JSON.stringify(entries), before);
});

test('old spellings in saved name lists become Lucas Topka without duplicates', () => {
  assert.equal(normalizePlayerName(' Locas   Topka '), 'Lucas Topka');
  assert.equal(normalizePlayerName('Lucas topka'), 'Lucas Topka');
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: () => JSON.stringify(['Locas Topka', 'Lucas Topka', 'Gast']),
    }});
    const names = readPlayerNames();
    assert.equal(names.filter(name => name === 'Lucas Topka').length, 1);
    assert.ok(!names.includes('Locas Topka'));
    assert.ok(names.includes('Gast'));
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('autosave targets only the active game and confirms a different existing result', async () => {
  const { autosaveTarget } = await import('../src/services/savedGames.js');
  const data = { spieltag: '3', saison: '2026/2027' };
  const current = { ...data, key: savedGameKey(data.saison, data.spieltag) };
  const otherSeason = { spieltag: '3', saison: '2025/2026', key: 'spieltag_Alt' };
  assert.deepEqual(autosaveTarget(data, [], null), { key: current.key, requiresConfirmation: false });
  assert.deepEqual(autosaveTarget(data, [current, otherSeason], current.key), { key: current.key, requiresConfirmation: false });
  assert.deepEqual(autosaveTarget(data, [current, otherSeason], null), { key: current.key, requiresConfirmation: true });
  const legacy = { ...data, key: 'spieltag_3' };
  assert.deepEqual(autosaveTarget(data, [legacy], legacy.key), { key: legacy.key, requiresConfirmation: false });
  assert.deepEqual(autosaveTarget(data, [otherSeason], otherSeason.key), { key: current.key, requiresConfirmation: false });
});
