export function currentSeason(date = new Date()) {
  const year = date.getFullYear();
  return `${year}/${year + 1}`;
}

export function validSeason(value) {
  const match = /^(\d{4})\/(\d{4})$/.exec(String(value || '').trim());
  return !!match && Number(match[2]) === Number(match[1]) + 1;
}

export function gameSeason(data) {
  if (Object.hasOwn(data, 'saison')) return validSeason(data.saison) ? data.saison.trim() : '';
  // Older results have only a localized save date. Use its year when available.
  const year = String(data.datum || '').match(/\b(\d{4})\b/);
  return year ? `${Number(year[1])}/${Number(year[1]) + 1}` : '';
}

export function savedGameKey(saison, spieltag) {
  return `spieltag_v2:${saison}:${encodeURIComponent(spieltag.trim())}`;
}

export function readSavedGames(storage = localStorage) {
  return Object.keys(storage).filter(key => key.startsWith('spieltag_')).flatMap(key => {
    try {
      const data = JSON.parse(storage.getItem(key));
      if (!data || !Array.isArray(data.spielerListe)) return [];
      return [{
        key,
        spieltag: String(data.spieltag || key.slice('spieltag_'.length)),
        saison: gameSeason(data),
        datum: data.datum || 'Unbekannt',
      }];
    } catch {
      return [];
    }
  }).sort((a, b) => b.saison.localeCompare(a.saison) || a.spieltag.localeCompare(b.spieltag, 'de', { numeric: true }));
}

export function autosaveTarget(data, games, activeKey) {
  const key = savedGameKey(data.saison, data.spieltag);
  const matches = games.filter(game => game.spieltag === data.spieltag && game.saison === data.saison);
  const existing = matches.find(game => game.key === activeKey) || matches.find(game => game.key === key) || matches[0];
  return {
    key: existing?.key || key,
    requiresConfirmation: !!existing && existing.key !== activeKey,
  };
}
