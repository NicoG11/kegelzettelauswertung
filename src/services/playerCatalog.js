export const defaultPlayerNames = [
  'Jerry', 'Max', 'Robi', 'Kaschi', 'KT', 'Philipp', 'Lucas', 'Lucas (Bohle)', 'Nico', 'Lucas Topka',
];
const key = 'kegelzettel_spielernamen';
export function normalizePlayerName(name) {
  const clean = name.trim().replace(/\s+/g, ' ');
  return ['locas topka', 'lucas topka'].includes(clean.toLocaleLowerCase('de')) ? 'Lucas Topka' : clean;
}
export function readPlayerNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return mergeNames(Array.isArray(saved) ? saved : []);
  } catch {
    return [...defaultPlayerNames];
  }
}
function mergeNames(names) {
  const unique = new Map();
  for (const name of [...defaultPlayerNames, ...names]) {
    if (typeof name !== 'string' || !name.trim()) continue;
    const clean = normalizePlayerName(name);
    if (!unique.has(clean.toLocaleLowerCase('de'))) unique.set(clean.toLocaleLowerCase('de'), clean);
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b, 'de'));
}
export function rememberPlayerNames(names) {
  const merged = mergeNames([...readPlayerNames(), ...names]);
  localStorage.setItem(key, JSON.stringify(merged));
  return merged;
}
