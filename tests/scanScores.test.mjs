import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScanLines, scanLinesFromTsv, mergeScannedScores } from '../src/services/scanScores.js';
const line = (text, confidence = 95) => ({ text, confidence });
const blank = () => Array(30).fill('');

test('FUNK starting state, headers, summaries and pin pictures are not throws', () => {
  const rows = parseScanLines(['Wurf H Ges. FW Kegelbild Zeit', '000 0 0000 00 --------- 12.0', '001 6 0006 00 1-3-5-789 12.0', '002 7 0013 00 123-56-89 11.6', 'Summe 1-15 = 0090'].map(text => line(text)));
  assert.equal(rows.length, 30);
  assert.equal(rows[0].value, '6'); assert.equal(rows[1].value, '7');
  assert.equal(rows[2].value, '');
  assert.deepEqual(rows[1].issues, []);
});
test('missing, duplicate and uncertain rows stay in their original positions', () => {
  const rows = parseScanLines([line('1 5 5'), line('3 8 18', 42), line('4 9 27'), line('4 9 27')]);
  assert.equal(rows[1].value, ''); assert.equal(rows[2].value, '8');
  assert.match(rows[2].issues.join(), /Unsicher/);
  assert.equal(rows[3].value, ''); assert.match(rows[3].issues.join(), /mehrfach/);
});
test('sum disagreement is flagged, stars and missed throws are handled', () => {
  const rows = parseScanLines([line('1 5 5'), line('2 9 10'), line('FW 17 0 97'), line('20 1* 101')], 'moeckel');
  assert.match(rows[1].issues.join(), /widerspricht/);
  assert.equal(rows[16].value, '0'); assert.equal(rows[19].value, '1');
  const wide = parseScanLines([line('1 9 123456789 A 0 9')], 'vierbahnen');
  assert.equal(wide[0].total, null);
});
test('TSV groups physical lines and sorts words by horizontal position', () => {
  const tsv = 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n' +
    '5\t1\t1\t1\t1\t2\t100\t10\t10\t10\t90\t8\n' +
    '5\t1\t1\t1\t1\t1\t10\t10\t10\t10\t95\t001\n';
  assert.deepEqual(scanLinesFromTsv(tsv), [line('001 8', 90)]);
});
test('import preserves zero, existing values and original throw positions', () => {
  const values = blank(); values[1] = '0'; values[2] = '9';
  assert.deepEqual(mergeScannedScores([8], values), [8, 0, 9]);
  assert.throws(() => mergeScannedScores([], values), /Wurf 1 fehlt/);
  values[0] = '6';
  assert.throws(() => mergeScannedScores([8], values), /bestätigen/);
  assert.deepEqual(mergeScannedScores([8], values, true), [6, 0, 9]);
});
test('a repeated import never appends duplicates or silently erases scores', () => {
  const values = blank(); values[0] = '8'; values[1] = '0';
  assert.deepEqual(mergeScannedScores([8, 0, 9], values), [8, 0, 9]);
  values[2] = '12'; assert.throws(() => mergeScannedScores([], values), /Wurf 3/);
  assert.throws(() => mergeScannedScores([], blank()), /keine Würfe/);
});

test('known zero glyphs in throw numbers need an unambiguous assignment', () => {
  const rows = parseScanLines([line('002 7 0013'), line('603 2 0015'), line('004 4 0019'), line('019 0 0098'), line('Q28 1: 0099'), line('621 2 0101'), line('026 1 0108')]);
  assert.equal(rows[2].value, '2'); assert.match(rows[2].issues.join(), /bitte prüfen/);
  assert.equal(rows[19].value, '1'); assert.equal(rows[20].value, '2');
  assert.equal(rows[27].value, '');
  const ambiguous = parseScanLines([line('Q28 1 0099')]);
  assert.equal(ambiguous.filter(row => row.value !== '').length, 0);
});

test('separate OCR columns match by height and never shift after a missing score', async () => {
  const { combineScanColumns } = await import('../src/services/scanScores.js');
  const column = words => 'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext\n' + words.map(([text, top], i) => `5\t1\t1\t1\t${i + 1}\t1\t0\t${top}\t12\t20\t95\t${text}`).join('\n');
  const result = combineScanColumns(column([['001', 10], ['002', 45], ['003', 80]]), column([['6', 12], ['9', 81]]), column([['6', 11], ['20', 82]]));
  assert.deepEqual(result, [line('001 6 6'), line('003 9 20')]);
  const rows = parseScanLines(result);
  assert.equal(rows[1].value, ''); assert.equal(rows[2].value, '9');
});
