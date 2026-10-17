// Rows retain their throw numbers, including missing rows. Never compact OCR output.
export function parseScanLines(lines, format = 'funk') {
  const rows = Array.from({ length: 30 }, (_, i) => ({ throw: i + 1, value: '', total: null, issues: [], source: '' }));
  const seen = new Set();
  const glyphs = { 0: '0OQG@D689', 1: '1Il!', 2: '2Z', 3: '3', 4: '4', 5: '5S', 6: '6', 7: '7T', 8: '8B', 9: '9' };
  const records = lines.flatMap(line => {
    const text = line.text.trim();
    const match = text.match(/^(?:FW\s+)?([0-9OQG@DIl!ZTSB]{1,3})\s+([0-9OQ@TIlS])(?:[*:.])?(?=\s|$)(.*)$/);
    if (!match || /^0+$/.test(match[1])) return [];
    const direct = /^\d+$/.test(match[1]) ? Number(match[1]) : null;
    return [{ line, text, match, direct: direct >= 1 && direct <= 30 ? direct : null }];
  });
  for (let index = 0; index < records.length; index++) {
    const { line, text, match, direct } = records[index];
    // Recover only known OCR glyph confusions, bounded by readable neighboring
    // throw numbers. Ambiguous numbers remain missing rather than shifting rows.
    const before = records.slice(0, index).reverse().find(record => record.direct !== null)?.direct || 1;
    const after = records.slice(index + 1).find(record => record.direct !== null)?.direct || 30;
    const candidates = Array.from({ length: 30 }, (_, i) => i + 1).filter(number => {
      const expected = String(number).padStart(match[1].length, '0');
      return expected.length === match[1].length && [...expected].every((digit, i) => glyphs[digit].includes(match[1][i]));
    });
    const bounded = candidates.filter(number => number >= before && number <= after);
    const number = direct !== null && candidates.includes(direct) && direct >= before && direct <= after
      ? direct : bounded.length === 1 ? bounded[0] : candidates.length === 1 ? candidates[0] : null;
    if (number === null) continue;
    const row = rows[number - 1];
    if (seen.has(number)) {
      row.value = '';
      row.issues = ['Wurfnummer mehrfach erkannt'];
      row.source += ` / ${text}`;
      continue;
    }
    seen.add(number);
    row.value = /^[0-9]$/.test(match[2]) ? match[2] : ({ O: '0', Q: '0', '@': '0', T: '7', I: '1', l: '1', S: '5' })[match[2]];
    if (direct !== number || !/^[0-9]$/.test(match[2])) row.issues.push('Wurfnummer oder Ziffer bitte prüfen');
    row.source = text;
    if (line.confidence < 75) row.issues.push('Unsichere Erkennung');
    // On the wide slip the running total lies beyond the pin picture and error column.
    // Do not mistake these intervening columns for a total.
    const total = format !== 'vierbahnen' && match[3].trim().match(/^(\d{1,4})(?=\s|$)/);
    row.total = total ? Number(total[1]) : null;
  }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.value === '' || row.total === null) continue;
    const previous = i === 0 ? 0 : rows[i - 1].total;
    if (previous !== null && row.total - previous !== Number(row.value)) row.issues.push('Zwischensumme widerspricht Holzzahl');
  }
  return rows;
}

// Tesseract's TSV preserves physical lines; plain text may merge columns/spaces.
function positionedLines(tsv = '') {
  const groups = new Map();
  for (const entry of tsv.split('\n').slice(1)) {
    const fields = entry.split('\t');
    if (fields[0] !== '5' || !fields[11]?.trim()) continue;
    const key = fields.slice(1, 5).join(':');
    const line = groups.get(key) || { words: [], confidence: 100, top: Infinity, bottom: 0 };
    line.top = Math.min(line.top, Number(fields[7]));
    line.bottom = Math.max(line.bottom, Number(fields[7]) + Number(fields[9]));
    line.words.push({ text: fields.slice(11).join('\t'), left: Number(fields[6]) });
    line.confidence = Math.min(line.confidence, Number(fields[10]));
    groups.set(key, line);
  }
  return [...groups.values()].map(line => ({
    text: line.words.sort((a, b) => a.left - b.left).map(word => word.text).join(' '),
    confidence: line.confidence, top: line.top, bottom: line.bottom,
  }));
}

export function scanLinesFromTsv(tsv = '') {
  return positionedLines(tsv).map(({ text, confidence }) => ({ text, confidence }));
}

export function combineScanColumns(throwTsv, scoreTsv, totalTsv = '') {
  const scores = positionedLines(scoreTsv);
  const totals = positionedLines(totalTsv);
  const match = (row, candidates) => {
    const center = (row.top + row.bottom) / 2;
    const nearest = candidates.reduce((best, candidate) => {
      const distance = Math.abs((candidate.top + candidate.bottom) / 2 - center);
      return !best || distance < best.distance ? { candidate, distance } : best;
    }, null);
    return nearest && nearest.distance < Math.max(5, (row.bottom - row.top) * 0.65) ? nearest.candidate : null;
  };
  return positionedLines(throwTsv).flatMap(row => {
    const score = match(row, scores);
    if (!score) return [];
    const total = match(row, totals);
    return [{ text: `${row.text} ${score.text}${total ? ` ${total.text}` : ''}`, confidence: Math.min(row.confidence, score.confidence, total?.confidence ?? 100) }];
  });
}

export function mergeScannedScores(existing, values, replace = false) {
  if (!Array.isArray(existing) || existing.length > 30 || values.length !== 30) throw new Error('Ungültige Bahn.');
  const merged = [...existing];
  let count = 0;
  for (let i = 0; i < 30; i++) {
    const raw = values[i];
    if (raw === '' || raw === null || raw === undefined) continue;
    if (!/^[0-9]$/.test(String(raw))) throw new Error(`Wurf ${i + 1}: Holz muss zwischen 0 und 9 liegen.`);
    const value = Number(raw);
    if (i < existing.length && existing[i] !== value && !replace) throw new Error('Ersetzen vorhandener Würfe bitte bestätigen.');
    merged[i] = value;
    count++;
  }
  if (!count) throw new Error('Noch keine Würfe erkannt oder eingetragen.');
  for (let i = 0; i < merged.length; i++) {
    if (!Number.isInteger(merged[i]) || merged[i] < 0 || merged[i] > 9) throw new Error(`Wurf ${i + 1} fehlt. Bitte ergänzen oder spätere Würfe leeren.`);
  }
  return merged;
}
