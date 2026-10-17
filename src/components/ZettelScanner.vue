<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useSpielerStore } from '@/stores/spielerStore';
import { createScanWorker } from '@/services/scanOcr';
import { combineScanColumns, mergeScannedScores, parseScanLines, parseHorizontalScores } from '@/services/scanScores';

const props = defineProps({ lane: { type: Number, required: true } });
const emit = defineEmits(['close', 'saved']);
const store = useSpielerStore();
const target = store.selectedPlayer;
const original = [...target.bahnen[props.lane]];
const fileInput = ref(null);
const cameraInput = ref(null);
const imageUrl = ref('');
const previewImage = ref(null);
const cropX = ref([0, 100]);
const cropY = ref([0, 100]);
const format = ref('funk');
const horizontal = computed(() => format.value === 'zeilen');
const rowLayout = ref('vier');
const rowBoundaries = ref([25, 50, 75]);
const halfBoundary = ref(50);
const firstSplit = ref(32);
const secondSplit = ref(64);
const flattenShadows = ref(true);
const rows = ref([]);
const busy = ref(false);
const error = ref('');
const progress = ref(0);
const status = ref('');
const replace = ref(false);
const reviewed = ref(false);
const sourceCanvas = document.createElement('canvas');
const supportsShadowFilter = 'filter' in sourceCanvas.getContext('2d');
let worker = null;
let disposed = false;
let generation = 0;
let dragStart = null;

const formats = [
  { title: 'Zeilenweise (Volle über Abräumen)', value: 'zeilen' },
  { title: 'FUNK-Bon (Wurf / H / Ges.)', value: 'funk' },
  { title: 'Möckel-Bon (WU / EI / SU)', value: 'moeckel' },
  { title: 'Vier-Bahnen-Zettel (Wurf / Holz)', value: 'vierbahnen' },
];
const detected = computed(() => rows.value.filter(row => row.source).length);
const values = computed(() => rows.value.map(row => row.value));
const previewTotal = computed(() => rows.value.reduce((sum, row) => sum + (/^[0-9]$/.test(String(row.value)) ? Number(row.value) : 0), 0));
const filledCount = computed(() => rows.value.filter(row => /^[0-9]$/.test(String(row.value))).length);
const conflicts = computed(() => rows.value.filter((row, i) => row.value !== '' && i < original.length && Number(row.value) !== original[i]).length);
const importError = computed(() => {
  if (!rows.value.length) return '';
  try { mergeScannedScores(original, values.value, replace.value); return ''; }
  catch (e) { return e.message; }
});
const cropStyle = computed(() => ({ left: `${cropX.value[0]}%`, top: `${cropY.value[0]}%`, width: `${cropX.value[1] - cropX.value[0]}%`, height: `${cropY.value[1] - cropY.value[0]}%` }));
function invalidate() { rows.value = []; reviewed.value = false; replace.value = false; error.value = ''; }
watch([cropX, cropY, format, firstSplit, secondSplit, flattenShadows, rowLayout, rowBoundaries, halfBoundary], invalidate, { deep: true });
watch(format, value => { firstSplit.value = value === 'vierbahnen' ? 50 : 32; secondSplit.value = 64; });
watch(firstSplit, value => { if (secondSplit.value <= value) secondSplit.value = value + 5; });
watch(values, () => { reviewed.value = false; }, { deep: true });

async function chooseImage(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  invalidate();
  if (file.size > 25 * 1024 * 1024) { error.value = 'Bild ist zu groß (maximal 25 MB).'; return; }
  const request = ++generation;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (disposed || request !== generation) return;
    const scale = Math.min(1, 4200 / Math.max(image.naturalWidth, image.naturalHeight));
    sourceCanvas.width = Math.round(image.naturalWidth * scale);
    sourceCanvas.height = Math.round(image.naturalHeight * scale);
    sourceCanvas.getContext('2d').drawImage(image, 0, 0, sourceCanvas.width, sourceCanvas.height);
    cropX.value = [0, 100]; cropY.value = [0, 100];
    imageUrl.value = sourceCanvas.toDataURL('image/jpeg', 0.92);
  } catch { if (!disposed) error.value = 'Bild konnte nicht geöffnet werden. Bitte JPEG, PNG oder WebP verwenden.'; }
  finally { URL.revokeObjectURL(url); }
}
function rotate() {
  invalidate();
  const rotated = document.createElement('canvas');
  rotated.width = sourceCanvas.height; rotated.height = sourceCanvas.width;
  const context = rotated.getContext('2d');
  context.translate(rotated.width, 0); context.rotate(Math.PI / 2); context.drawImage(sourceCanvas, 0, 0);
  sourceCanvas.width = rotated.width; sourceCanvas.height = rotated.height;
  sourceCanvas.getContext('2d').drawImage(rotated, 0, 0);
  cropX.value = [0, 100]; cropY.value = [0, 100];
  imageUrl.value = sourceCanvas.toDataURL('image/jpeg', 0.92);
}
function point(event) {
  const rect = previewImage.value.getBoundingClientRect();
  return [Math.max(0, Math.min(100, (event.clientX - rect.left) / rect.width * 100)), Math.max(0, Math.min(100, (event.clientY - rect.top) / rect.height * 100))];
}
function startCrop(event) { if (busy.value) return; dragStart = point(event); event.currentTarget.setPointerCapture(event.pointerId); }
function moveCrop(event) {
  if (!dragStart) return;
  const end = point(event);
  cropX.value = [Math.min(dragStart[0], end[0]), Math.max(dragStart[0], end[0])];
  cropY.value = [Math.min(dragStart[1], end[1]), Math.max(dragStart[1], end[1])];
}
function endCrop(event) { moveCrop(event); dragStart = null; }

async function recognize() {
  if (cropX.value[1] - cropX.value[0] < 2 || cropY.value[1] - cropY.value[0] < 2) { error.value = 'Bitte einen größeren Tabellenbereich markieren.'; return; }
  invalidate(); busy.value = true; progress.value = 0; status.value = 'Erkennung wird geladen …';
  const request = ++generation;
  try {
    const localWorker = await createScanWorker((state, value) => {
      if (disposed || request !== generation) return;
      status.value = state === 'recognizing text' ? 'Zahlen werden erkannt …' : 'Erkennung wird geladen …';
      progress.value = Math.round((value || 0) * 100);
    });
    if (disposed || request !== generation) { await localWorker.terminate(); return; }
    worker = localWorker;
    const width = sourceCanvas.width * (cropX.value[1] - cropX.value[0]) / 100;
    const height = sourceCanvas.height * (cropY.value[1] - cropY.value[0]) / 100;
    const scale = Math.min(3, 1200 / width, 1800 / height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(sourceCanvas, sourceCanvas.width * cropX.value[0] / 100, sourceCanvas.height * cropY.value[0] / 100, width, height, 0, 0, canvas.width, canvas.height);
    // Normalize slow lighting changes, keeping stroke detail in the greyscale image.
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let background = null;
    if (flattenShadows.value && supportsShadowFilter) {
      const blurred = document.createElement('canvas');
      blurred.width = canvas.width; blurred.height = canvas.height;
      const blurContext = blurred.getContext('2d');
      blurContext.filter = `blur(${Math.max(12, Math.round(canvas.height / 90))}px)`;
      blurContext.drawImage(canvas, 0, 0);
      background = blurContext.getImageData(0, 0, canvas.width, canvas.height).data;
    }
    for (let i = 0; i < pixels.data.length; i += 4) {
      let grey = pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114;
      if (background) {
        const light = background[i] * 0.299 + background[i + 1] * 0.587 + background[i + 2] * 0.114;
        grey = Math.max(0, Math.min(255, (grey / Math.max(1, light) * 255 - 20) * 255 / 235));
      }
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = grey;
    }
    context.putImageData(pixels, 0, 0);
    const imageData = canvas.toDataURL('image/png');
    if (horizontal.value) {
      await worker.setParameters({ tessedit_pageseg_mode: '7', preserve_interword_spaces: '1', user_defined_dpi: '300' });
      const boundaries = rowLayout.value === 'vier' ? [0, ...rowBoundaries.value, 100] : [0, halfBoundary.value, 100];
      const resultBands = rowLayout.value === 'vier' ? [1, 3] : [0, 1];
      const bands = [];
      for (const band of resultBands) {
        const top = Math.round(canvas.height * boundaries[band] / 100);
        const height = Math.round(canvas.height * boundaries[band + 1] / 100) - top;
        // Send only the result row, so forced single-line OCR cannot pick a
        // different line elsewhere on the slip (including throw-number headers).
        const strip = document.createElement('canvas');
        strip.width = canvas.width; strip.height = height;
        strip.getContext('2d').drawImage(canvas, 0, top, canvas.width, height, 0, 0, canvas.width, height);
        const result = await worker.recognize(strip.toDataURL('image/png'), {}, { text: true, tsv: true });
        if (disposed || request !== generation) return;
        bands.push(result.data.tsv);
      }
      rows.value = parseHorizontalScores(bands, canvas.width);
    } else {
      await worker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1', user_defined_dpi: '300' });
      const boundaries = format.value === 'vierbahnen' ? [0, firstSplit.value, 100] : [0, firstSplit.value, secondSplit.value, 100];
      const columns = [];
      for (let i = 0; i < boundaries.length - 1; i++) {
        status.value = `Spalte ${i + 1} von ${boundaries.length - 1} wird erkannt …`;
        const left = Math.round(canvas.width * boundaries[i] / 100);
        const columnWidth = Math.round(canvas.width * boundaries[i + 1] / 100) - left;
        const result = await worker.recognize(imageData, { rectangle: { left, top: 0, width: columnWidth, height: canvas.height } }, { text: true, tsv: true });
        if (disposed || request !== generation) return;
        columns.push(result.data.tsv);
      }
      rows.value = parseScanLines(combineScanColumns(...columns), format.value);
    }
    await nextTick();
    document.getElementById('scan-review-heading')?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  } catch { if (!disposed && request === generation) error.value = 'Erkennung fehlgeschlagen. Bitte erneut versuchen oder einen kleineren Ausschnitt wählen.'; }
  finally {
    const active = worker; worker = null;
    if (active) await active.terminate();
    if (!disposed && request === generation) busy.value = false;
  }
}
function save() {
  try {
    if (!reviewed.value) throw new Error('Bitte die Würfe zuerst prüfen.');
    if (store.selectedPlayer !== target || JSON.stringify(target.bahnen[props.lane]) !== JSON.stringify(original)) throw new Error('Die Bahn wurde inzwischen geändert. Scanner bitte erneut öffnen.');
    const merged = mergeScannedScores(original, values.value, replace.value);
    target.bahnen[props.lane] = merged;
    emit('saved');
  } catch (e) { error.value = e.message; }
}
onBeforeUnmount(() => {
  disposed = true; generation++;
  worker?.terminate(); worker = null;
  sourceCanvas.width = sourceCanvas.height = 0;
});
</script>

<template>
  <v-dialog :model-value="true" max-width="850" scrollable @update:model-value="value => { if (!value) emit('close'); }">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between ga-2">
        <span>Zettel scannen · Bahn {{ lane }}</span>
        <v-btn icon="mdi-close" variant="text" aria-label="Scanner schließen" @click="emit('close')" />
      </v-card-title>
      <v-card-text>
        <p class="mb-3">{{ target.name }} · Verarbeitung auf diesem Gerät. Fotos werden nicht gespeichert oder hochgeladen.</p>
        <input ref="cameraInput" class="d-none" type="file" accept="image/*" capture="environment" aria-label="Foto aufnehmen" @change="chooseImage">
        <input ref="fileInput" class="d-none" type="file" accept="image/*" aria-label="Zettelbild auswählen" @change="chooseImage">
        <div class="d-flex flex-wrap ga-2 mb-4">
          <v-btn prepend-icon="mdi-camera-outline" :disabled="busy" @click="cameraInput.click()">Foto aufnehmen</v-btn>
          <v-btn prepend-icon="mdi-image-outline" variant="tonal" :disabled="busy" @click="fileInput.click()">Bild auswählen</v-btn>
          <v-btn v-if="imageUrl" prepend-icon="mdi-rotate-right" variant="text" :disabled="busy" @click="rotate">Drehen</v-btn>
        </div>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3" role="alert">{{ error }}</v-alert>
        <template v-if="imageUrl">
          <v-select v-model="format" :items="formats" label="Zettelformat" :disabled="busy" hide-details class="mb-3" />
          <p class="text-body-small mb-2">{{ horizontal ? 'Nur das Zeilenpaar einer Bahn markieren: 15 Volle oben, 15 Abräumen darunter. Beschriftungen und Summen außerhalb lassen. Die 15 Wurffelder müssen zwischen den senkrechten Hilfslinien liegen.' : format === 'vierbahnen' ? 'Eine Bahn markieren: nur die Spalten Wurf und Holz, alle benötigten Zeilen.' : 'Nur die Spalten Wurf, Holz und Zwischensumme markieren. Kegelbild und übrige Spalten weglassen.' }} Zahlen müssen aufrecht stehen. Hilfslinien müssen zwischen den Feldern liegen. Bereich im Bild aufziehen oder Regler verwenden.</p>
          <div class="scan-preview-wrap">
            <div class="scan-preview" @pointerdown.prevent="startCrop" @pointermove="moveCrop" @pointerup="endCrop" @pointercancel="dragStart = null">
              <img ref="previewImage" :src="imageUrl" alt="Spielzettel zum Auswählen des Tabellenbereichs" draggable="false">
              <div class="scan-crop" :style="cropStyle">
                <template v-if="horizontal">
                  <span v-for="cell in 14" :key="cell" class="scan-column-line" :style="{ left: `${cell / 15 * 100}%` }" />
                  <span v-for="(boundary, i) in (rowLayout === 'vier' ? rowBoundaries : [halfBoundary])" :key="`row-${i}`" class="scan-horizontal-line" :style="{ top: `${boundary}%` }" />
                </template>
                <span v-else class="scan-column-line" :style="{ left: `${firstSplit}%` }" />
                <span v-if="!horizontal && format !== 'vierbahnen'" class="scan-column-line" :style="{ left: `${secondSplit}%` }" />
              </div>
            </div>
          </div>
          <v-range-slider v-model="cropX" label="Links / rechts" :min="0" :max="100" :step="0.1" :disabled="busy" thumb-label hide-details class="mt-3" />
          <v-range-slider v-model="cropY" label="Oben / unten" :min="0" :max="100" :step="0.1" :disabled="busy" thumb-label hide-details />
          <template v-if="horizontal">
            <v-select v-model="rowLayout" label="Zeilenaufbau" :items="[{ title: 'Wurfnummern und Holz (4 Zeilen)', value: 'vier' }, { title: 'Nur Holz (2 Zeilen)', value: 'zwei' }]" :disabled="busy" hide-details class="mt-3" />
            <p class="text-body-small mt-2">{{ rowLayout === 'vier' ? 'Von oben: Wurfnummern Volle, Holz Volle, Wurfnummern Abräumen, Holz Abräumen.' : 'Von oben: Holz Volle, Holz Abräumen.' }} Horizontale Linien zwischen die Zeilen legen.</p>
            <template v-if="rowLayout === 'vier'">
              <v-slider v-for="(_, i) in rowBoundaries" :key="i" v-model="rowBoundaries[i]" :label="`Zeilengrenze ${i + 1}`" :min="i ? rowBoundaries[i - 1] + 3 : 3" :max="i < 2 ? rowBoundaries[i + 1] - 3 : 97" :step="1" :disabled="busy" hide-details />
            </template>
            <v-slider v-else v-model="halfBoundary" label="Volle / Abräumen" :min="10" :max="90" :step="1" :disabled="busy" hide-details />
          </template>
          <v-expansion-panels variant="accordion" class="mt-2">
            <v-expansion-panel title="Spalten und Licht anpassen">
              <v-expansion-panel-text>
                <p v-if="!horizontal" class="text-body-small mb-2">Die gestrichelten Linien müssen zwischen den gedruckten Spalten liegen.</p>
                <v-slider v-if="!horizontal" v-model="firstSplit" label="Wurf / Holz" :min="10" :max="80" :step="1" :disabled="busy" hide-details />
                <v-slider v-if="!horizontal && format !== 'vierbahnen'" v-model="secondSplit" label="Holz / Summe" :min="firstSplit + 5" :max="95" :step="1" :disabled="busy" hide-details />
                <v-checkbox v-model="flattenShadows" label="Schatten ausgleichen" :disabled="busy || !supportsShadowFilter" hide-details />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-btn color="primary" class="my-3" :loading="busy" @click="recognize">Würfe erkennen</v-btn>
          <div v-if="busy" role="status">{{ status }}<v-progress-linear :model-value="progress" color="primary" class="mt-2" /></div>
        </template>
        <section v-if="rows.length" aria-labelledby="scan-review-heading">
          <h3 id="scan-review-heading" class="mt-3" tabindex="-1">Würfe prüfen</h3>
          <p class="text-body-small my-2">{{ detected }} von 30 Wurfnummern erkannt. Leere Felder sind keine Null. Erkannte Werte bitte mit dem Foto vergleichen.</p>
          <v-alert v-if="!detected" type="warning" variant="tonal" class="mb-3">Keine Wurfpaare erkannt. Ausschnitt und Drehung prüfen. Werte können auch von Hand ergänzt werden.</v-alert>
          <div class="scan-rows">
            <div v-for="(row, index) in rows" :key="row.throw" class="scan-row" :class="{ 'scan-row-warning': row.issues.length }">
              <label :for="`scan-throw-${row.throw}`">{{ horizontal ? (row.throw <= 15 ? `V ${row.throw}` : `A ${row.throw - 15}`) : `Wurf ${row.throw}` }}</label>
              <input :id="`scan-throw-${row.throw}`" v-model="row.value" type="text" inputmode="numeric" maxlength="1" :aria-label="`Holz für Wurf ${row.throw}`" autocomplete="off">
              <span class="text-body-small">{{ row.issues.join(' · ') || (!row.source ? 'Nicht erkannt' : 'Erkannt') }}<span v-if="index < original.length"> · Bisher {{ original[index] }}</span></span>
            </div>
          </div>
          <p class="mt-3">{{ filledCount }} ausgefüllte Würfe · {{ previewTotal }} Holz</p>
          <v-checkbox v-if="conflicts" v-model="replace" :label="`${conflicts} abweichende vorhandene Würfe ersetzen`" hide-details />
          <p v-if="importError" class="text-error mt-3" role="status">{{ importError }}</p>
          <v-checkbox v-model="reviewed" label="Ich habe die Würfe mit dem Zettel verglichen" hide-details />
        </section>
      </v-card-text>
      <v-card-actions class="flex-wrap">
        <v-btn variant="text" @click="emit('close')">Abbrechen</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" :disabled="busy || !rows.length || !!importError || !reviewed" @click="save">Würfe übernehmen</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.scan-preview-wrap { text-align: center; background: rgba(127,127,127,.1); border-radius: 10px; padding: 8px; }
.scan-preview { position: relative; display: inline-block; overflow: hidden; touch-action: none; line-height: 0; max-width: 100%; cursor: crosshair; }
.scan-preview img { display: block; max-width: 100%; max-height: 420px; width: auto; height: auto; }
.scan-crop { position: absolute; border: 2px solid rgb(var(--v-theme-primary)); box-shadow: 0 0 0 2000px rgba(0,0,0,.45); pointer-events: none; }
.scan-column-line { position: absolute; height: 100%; top: 0; border-left: 2px dashed #f59e0b; }
.scan-horizontal-line { position: absolute; left: 0; width: 100%; border-top: 2px dashed #f59e0b; }
.scan-rows { display: grid; gap: 4px; margin-top: 12px; }
.scan-row { display: grid; grid-template-columns: 64px 48px 1fr; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 6px; }
.scan-row-warning { background: rgba(245,158,11,.15); }
.scan-row input { width: 44px; border: 1px solid rgba(127,127,127,.6); border-radius: 5px; padding: 6px; text-align: center; color: inherit; background: rgb(var(--v-theme-surface)); }
</style>
