export function addSpokenScore(store, lane, number) {
  if (!Number.isInteger(number) || number < 0 || number > 9) return 'invalid-number';
  if (!store.selectedPlayer) return 'no-player';
  if (!Number.isInteger(lane) || lane < 1 || lane > 4 || !Array.isArray(store.selectedPlayer.bahnen[lane])) return 'invalid-lane';
  if (store.selectedPlayer.bahnen[lane].length >= 30) return 'full';
  store.addScore(lane, number);
  return 'added';
}
