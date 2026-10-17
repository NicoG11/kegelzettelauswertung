export function addSpokenScore(store, lane, number) {
  if (!Number.isInteger(number) || number < 0 || number > 9) return 'invalid-number';
  if (!store.selectedPlayer) return 'no-player';
  if (!Number.isInteger(lane) || lane < 1 || lane > 4 || !Array.isArray(store.selectedPlayer.bahnen[lane])) return 'invalid-lane';
  if (store.selectedPlayer.bahnen[lane].length >= 30) return 'full';
  store.addScore(lane, number);
  return 'added';
}

// Unknown speech stays unknown; ordinary words must not become bowling scores.
const spokenNumbers = { null: 0, fehler: 0, ein: 1, eins: 1, eine: 1,
  zwei: 2, zwo: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
export const speechGrammar = [...Object.keys(spokenNumbers), '[unk]'];
export function parseSpokenScores(text = '') {
  return (text.toLowerCase().match(/[\p{L}]+|\d+/gu) || []).flatMap(word => {
    if (/^[0-9]$/.test(word)) return [Number(word)];
    return Object.hasOwn(spokenNumbers, word) ? [spokenNumbers[word]] : [];
  });
}
