<template>
	<v-app>
		<v-main>
			<v-app-bar color="surface" flat class="app-header" height="76">
				<template #prepend><div id="teleport"></div></template>
				<v-app-bar-title><div class="brand"><v-icon icon="mdi-bowling" color="primary" size="28" /><div><strong>Kegelzettel<wbr>auswertung</strong><span>SG Zechin</span></div></div></v-app-bar-title>
				<template #append>
					<v-btn :icon="isDark ? 'mdi-weather-sunny' : 'mdi-weather-night'"
						:aria-label="isDark ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren'" @click="toggleTheme" />
					<v-menu @update:model-value="loadSavedGames">
						<template #activator="{ props }"><v-btn icon="mdi-dots-vertical" aria-label="Menü öffnen" v-bind="props" /></template>
						<v-list min-width="260" rounded="xl">
							<v-list-item v-if="spielerStore.sessionStarted" title="Neuer Spieltag" prepend-icon="mdi-plus-circle-outline" @click="newGameDialog = true" />
							<v-list-item :disabled="!spielerStore.sessionStarted" title="Speichern" prepend-icon="mdi-content-save-outline" @click="openSaveDialog" />
							<v-list-item :disabled="savedGames.length === 0" @click="openLoadDialog" prepend-icon="mdi-folder-open-outline" :title="`Gespeicherte Ergebnisse (${savedGames.length})`" />
							<v-divider class="my-2" />
							<v-list-item :disabled="!spielerStore.sessionStarted" title="Export" prepend-icon="mdi-export" @click="exportData" />
							<v-list-item title="Import" prepend-icon="mdi-import" @click="openImportDialog" />
							<v-list-item :disabled="!spielerStore.sessionStarted" title="Teilen" prepend-icon="mdi-share-variant-outline" @click="shareData" />
							<v-divider class="my-2" />
							<v-list-item title="Changelog" prepend-icon="mdi-history" @click="navigateTo('/changelog')" />
						</v-list>
					</v-menu>
				</template>
			</v-app-bar>
			<v-dialog v-model="newGameDialog" max-width="480">
				<v-card title="Neuen Spieltag beginnen?">
					<v-card-text>Die aktuelle Eingabe wird zurückgesetzt. Speichere den Spieltag vorher, wenn du ihn behalten möchtest.</v-card-text>
					<v-card-actions><v-spacer /><v-btn @click="newGameDialog = false">Abbrechen</v-btn><v-btn color="primary" @click="newGame">Neuer Spieltag</v-btn></v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Snackbar für Benachrichtigungen -->
			<v-snackbar v-model="snackbar.visible" :timeout="snackbar.timeout">
				{{ snackbar.message }}
				<template v-slot:actions>
					<v-btn color="red" variant="text" @click="snackbar.visible = false">Schließen</v-btn>
				</template>
			</v-snackbar>





			<!-- Teilen Dialog -->
			<v-dialog v-model="shareDialog" max-width="500">
				<v-card>
					<v-card-title class="headline">Spielstand teilen</v-card-title>
					<v-card-text>
						<v-text-field v-model="shareableLink" label="Teilen Sie diesen Link" readonly
							append-icon="mdi-content-copy" @click:append="copyLink"></v-text-field>
						<!-- Optional: QR-Code anzeigen -->
						<!-- Installiere eine QR-Code-Bibliothek wie qrcode.vue -->
						<!-- <qrcode-vue :value="shareableLink"></qrcode-vue> -->
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn variant="text" @click="closeShareDialog">Schließen</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Import Dialog -->
			<v-dialog v-model="importDialog" max-width="500">
				<v-card>
					<v-card-title class="headline">Spielstand importieren</v-card-title>
					<v-card-text>
						<input type="file" @change="handleFileUpload" accept=".json" />
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn variant="text" @click="closeImportDialog">Abbrechen</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Speichern Dialog -->
			<v-dialog v-model="saveDialog" max-width="500">
				<v-card>
					<v-card-title class="headline">Spieltag speichern</v-card-title>
					<v-card-text>
						<v-form ref="saveForm" v-model="isSaveFormValid">
							<v-text-field v-model="saveSpieltag" label="Spieltag"
								:rules="[v => !!v?.trim() || 'Spieltag erforderlich']" required></v-text-field>
							<v-text-field v-model="saveSaison" label="Saison"
								:rules="[v => validSeason(v) || 'Format: 2026/2027 (aufeinanderfolgende Jahre)']" required></v-text-field>
						</v-form>
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn variant="text" @click="closeSaveDialog">Abbrechen</v-btn>
						<v-btn variant="text" @click="saveData" :disabled="!isSaveFormValid">Speichern</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Überschreiben Bestätigungsdialog -->
			<v-dialog :model-value="overwriteDialog" @update:model-value="value => { if (!value) cancelOverwrite() }" max-width="500">
				<v-card>
					<v-card-title class="headline">Überschreiben bestätigen</v-card-title>
					<v-card-text>
						„{{ overwriteSource === 'auto' ? spieltag : saveSpieltag }}“ ist in der Saison {{ overwriteSource === 'auto' ? saison : saveSaison }} bereits gespeichert. Möchtest du das Ergebnis überschreiben?
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn variant="text" @click="cancelOverwrite">Abbrechen</v-btn>
						<v-btn variant="text" @click="confirmOverwrite">Überschreiben</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Gespeicherte Ergebnisse -->
			<v-dialog v-model="loadDialog" max-width="600" scrollable>
				<v-card>
					<v-card-title>Gespeicherte Ergebnisse ({{ savedGames.length }})</v-card-title>
					<v-card-text>
						<v-select v-if="savedGames.length" v-model="seasonFilter" :items="seasonOptions" label="Saison filtern" hide-details class="mb-3" />
						<v-text-field v-if="savedGames.length" v-model="savedGamesSearch"
							label="Spieltag, Saison oder Datum suchen" prepend-inner-icon="mdi-magnify"
							clearable hide-details class="mb-3" />
						<p v-if="!savedGames.length">Noch keine Ergebnisse gespeichert.</p>
						<p v-else-if="!filteredSavedGames.length">Keine passenden Ergebnisse gefunden.</p>
						<div class="season-results">
							<section v-for="group in groupedSavedGames" :key="group.saison" :aria-label="group.saison ? `Saison ${group.saison}` : 'Ohne Saison'">
								<h3 class="season-heading">{{ group.saison ? `Saison ${group.saison}` : 'Ohne Saison' }} ({{ group.games.length }})</h3>
								<div v-for="item in group.games" :key="item.key" class="saved-result-row">
									<div class="saved-result-info"><strong>{{ item.spieltag }}</strong><span class="muted text-body-small">Gespeichert: {{ item.datum }}</span></div>
									<div class="saved-result-actions">
										<v-btn variant="text" size="small" @click="loadData(item)"
											:aria-label="`Ergebnis ${item.spieltag} (${item.saison || 'ohne Saison'}) anzeigen`">Anzeigen</v-btn>
										<v-btn icon="mdi-delete-outline" variant="text" color="error"
											:aria-label="`Ergebnis ${item.spieltag} (${item.saison || 'ohne Saison'}) löschen`" @click="gameToDelete = item" />
									</div>
								</div>
							</section>
						</div>
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn @click="closeLoadDialog">Schließen</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-dialog :model-value="!!gameToDelete" @update:model-value="gameToDelete = null" max-width="500">
				<v-card>
					<v-card-title>Ergebnis löschen?</v-card-title>
					<v-card-text>
						Das gespeicherte Ergebnis „{{ gameToDelete?.spieltag }}“ ({{ gameToDelete?.saison || 'ohne Saison' }}) wird dauerhaft gelöscht.
						Die aktuell angezeigten Spieldaten bleiben erhalten.
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn @click="gameToDelete = null">Abbrechen</v-btn>
						<v-btn color="error" @click="deleteSavedGame">Löschen</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<div class="app-content">
                <div v-if="spielerStore.sessionStarted && router.currentRoute.value.path !== '/changelog'" class="autosave-bar">
                    <AutosaveControl />
                </div>
				<router-view />
			</div>
		</v-main>
	</v-app>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, reactive, computed, onMounted, onUnmounted, toRef, watch } from 'vue';
import { saveAs } from 'file-saver';
import { useSpielerStore } from '@/stores/spielerStore';
import pako from 'pako';
import { useTheme } from 'vuetify';
import { currentSeason, validSeason, gameSeason, savedGameKey, readSavedGames, autosaveTarget } from '@/services/savedGames';
import { normalizePlayerName } from '@/services/playerCatalog';
import AutosaveControl from '@/components/AutosaveControl.vue';

const router = useRouter();
const spielerStore = useSpielerStore();

function navigateTo(link) {
	router.push({ path: link });
}

const theme = useTheme();
const isDark = computed(() => theme.current.value.dark);
async function toggleTheme() {
	const name = isDark.value ? 'clubLight' : 'clubDark';
	await theme.change(name);
	try { localStorage.setItem('kegelzettel_theme', name); } catch { /* Theme still works in this session. */ }
}
const newGameDialog = ref(false);
function newGame() {
	flushAutosave(false);
	cancelAutosave();
	lastPersistedSnapshot = '';
	spielerStore.$reset();
	newGameDialog.value = false;
	router.push('/');
}

// Dialog Zustände
const saveDialog = ref(false);
const overwriteDialog = ref(false);
const loadDialog = ref(false);
const isSaveFormValid = ref(false);

// Snackbar Zustand
const snackbar = reactive({
	visible: false,
	message: '',
	timeout: 3000, // Zeit in Millisekunden, wie lange die Snackbar angezeigt wird
});

// Form Daten
const spieltag = toRef(spielerStore, 'spieltag');
const saison = toRef(spielerStore, 'saison');
const pendingOverwriteKey = ref(null);
const saveSpieltag = ref('');
const saveSaison = ref('');
const overwriteSource = ref('manual');

// Gespeicherte Spiele
const savedGames = ref([]);
const savedGamesSearch = ref('');
const seasonFilter = ref('');
const gameToDelete = ref(null);
const filteredSavedGames = computed(() => {
	const search = (savedGamesSearch.value || '').trim().toLocaleLowerCase('de');
	return savedGames.value.filter(item =>
		(!seasonFilter.value || (item.saison || 'unknown') === seasonFilter.value) &&
		`${item.spieltag} ${item.saison} ${item.datum}`.toLocaleLowerCase('de').includes(search));
});

const seasonOptions = computed(() => [
	{ title: 'Alle Saisons', value: '' },
	...[...new Set(savedGames.value.map(item => item.saison))].map(value => ({ title: value || 'Ohne Saison', value: value || 'unknown' })),
]);
const groupedSavedGames = computed(() => {
	const groups = new Map();
	for (const item of filteredSavedGames.value) {
		if (!groups.has(item.saison)) groups.set(item.saison, []);
		groups.get(item.saison).push(item);
	}
	return [...groups].map(([saison, games]) => ({ saison, games }));
});

function deleteSavedGame() {
	if (!gameToDelete.value) return;
	const currentKey = spieltag.value.trim() && validSeason(saison.value) ? savedGameKey(saison.value.trim(), spieltag.value.trim()) : null;
	if (gameToDelete.value.key === spielerStore.savedGameKey || gameToDelete.value.key === currentKey ||
		(gameToDelete.value.spieltag === spieltag.value.trim() && gameToDelete.value.saison === saison.value.trim())) {
		spielerStore.autoSaveEnabled = false;
		spielerStore.autoSaveStatus = '';
		cancelAutosave();
	}
	localStorage.removeItem(gameToDelete.value.key);
	gameToDelete.value = null;
	loadSavedGames();
	snackbar.message = 'Gespeichertes Ergebnis wurde gelöscht.';
	snackbar.visible = true;
}

const importDialog = ref(false);

const shareDialog = ref(false);
const shareableLink = ref('');

function shareData() {
	shareableLink.value = getShareableLink();
	shareDialog.value = true;
}

function closeShareDialog() {
	shareDialog.value = false;
}



// Methoden zum Öffnen/Schließen der Dialoge
function openSaveDialog() {
	saveSpieltag.value = spieltag.value;
	saveSaison.value = saison.value || currentSeason();
	cancelAutosave();
	saveDialog.value = true;
}

function closeSaveDialog() {
	saveDialog.value = false;
}

function openLoadDialog() {
	savedGamesSearch.value = '';
	seasonFilter.value = '';
	loadDialog.value = true;
	loadSavedGames();
}

function closeLoadDialog() {
	loadDialog.value = false;
}

// Speichern der Daten
function sessionData() {
	return {
		spieltag: spieltag.value.trim(),
		saison: saison.value.trim(),
		datum: new Date().toLocaleDateString('de-DE'),
		spielerListe: spielerStore.spielerListe,
	};
}

function saveData() {
	if (!saveSpieltag.value.trim() || !validSeason(saveSaison.value)) return;
	saveSpieltag.value = saveSpieltag.value.trim();
	saveSaison.value = saveSaison.value.trim();
	overwriteSource.value = 'manual';
	loadSavedGames();
	const key = savedGameKey(saveSaison.value, saveSpieltag.value);
	const matches = savedGames.value.filter(item => item.spieltag === saveSpieltag.value && item.saison === saveSaison.value);
	const existing = matches.find(item => item.key === spielerStore.savedGameKey) || matches.find(item => item.key === key) || matches[0];
	pendingOverwriteKey.value = existing?.key || null;
	if (existing) {
		saveDialog.value = false;
		overwriteDialog.value = true;
	} else {
		performSave();
	}
}

function performSave() {
	cancelAutosave();
	const data = { ...sessionData(), spieltag: saveSpieltag.value, saison: saveSaison.value };
	const key = savedGameKey(data.saison, data.spieltag);
	try {
		localStorage.setItem(key, JSON.stringify(data));
		if (pendingOverwriteKey.value && pendingOverwriteKey.value !== key) localStorage.removeItem(pendingOverwriteKey.value);
	} catch {
		snackbar.message = 'Der Spieltag konnte nicht gespeichert werden.';
		snackbar.visible = true;
		return;
	}
	spieltag.value = data.spieltag;
	saison.value = data.saison;
	spielerStore.savedGameKey = key;
	lastPersistedSnapshot = JSON.stringify(data);
	if (spielerStore.autoSaveEnabled) spielerStore.autoSaveStatus = 'Änderungen gespeichert.';
	pendingOverwriteKey.value = null;
	loadSavedGames();
	overwriteDialog.value = false;
	saveDialog.value = false;
	snackbar.message = 'Spieltag gespeichert.';
	snackbar.visible = true;
}

function confirmOverwrite() {
	if (overwriteSource.value === 'auto') {
		spielerStore.savedGameKey = pendingOverwriteKey.value;
		pendingOverwriteKey.value = null;
		overwriteDialog.value = false;
		flushAutosave();
	} else {
		performSave();
	}
}

function cancelOverwrite() {
	if (overwriteSource.value === 'auto') {
		spielerStore.autoSaveEnabled = false;
		spielerStore.autoSaveStatus = '';
		cancelAutosave();
	}
	pendingOverwriteKey.value = null;
	overwriteDialog.value = false;
}

// One pending save for the active game, reset after each edit.
let autosaveTimer = null;
let lastPersistedSnapshot = '';
const autosaveSnapshot = computed(() => JSON.stringify(sessionData()));
function cancelAutosave() {
	clearTimeout(autosaveTimer);
	autosaveTimer = null;
}
function scheduleAutosave() {
	cancelAutosave();
	if (!spielerStore.autoSaveEnabled || !spielerStore.sessionStarted) {
		spielerStore.autoSaveStatus = '';
		return;
	}
	if (!spieltag.value.trim() || !validSeason(saison.value)) {
		spielerStore.autoSaveStatus = 'Zum Speichern Spieltag und Saison angeben.';
		return;
	}
	if (lastPersistedSnapshot === autosaveSnapshot.value) {
		spielerStore.autoSaveStatus = 'Änderungen gespeichert.';
		return;
	}
	if (overwriteDialog.value && overwriteSource.value === 'auto') return;
	spielerStore.autoSaveStatus = 'Speichern ausstehend …';
	if (saveDialog.value || overwriteDialog.value) return;
	autosaveTimer = setTimeout(() => flushAutosave(), 2000);
}
function flushAutosave(interactive = true) {
	cancelAutosave();
	if (!spielerStore.autoSaveEnabled || !spielerStore.sessionStarted || saveDialog.value || overwriteDialog.value ||
		!spieltag.value.trim() || !validSeason(saison.value)) return;
	const data = sessionData();
	const snapshot = JSON.stringify(data);
	if (snapshot === lastPersistedSnapshot) return;
	try {
		const target = autosaveTarget(data, readSavedGames(), spielerStore.savedGameKey);
		if (target.requiresConfirmation) {
			spielerStore.autoSaveStatus = 'Vorhandenen Spieltag zum Überschreiben bestätigen.';
			if (interactive) {
				overwriteSource.value = 'auto';
				pendingOverwriteKey.value = target.key;
				overwriteDialog.value = true;
			}
			return;
		}
		localStorage.setItem(target.key, snapshot);
		spielerStore.savedGameKey = target.key;
		lastPersistedSnapshot = snapshot;
		spielerStore.autoSaveStatus = `Gespeichert um ${new Date().toLocaleTimeString('de-DE')}`;
		loadSavedGames();
	} catch {
		spielerStore.autoSaveStatus = 'Automatisches Speichern fehlgeschlagen. Bitte erneut versuchen oder exportieren.';
	}
}
watch([() => spielerStore.autoSaveEnabled, () => spielerStore.sessionStarted, autosaveSnapshot, saveDialog, overwriteDialog], scheduleAutosave);
function flushOnPageHide() { flushAutosave(false); }
function flushOnVisibilityChange() { if (document.visibilityState === 'hidden') flushAutosave(false); }
onMounted(() => {
	window.addEventListener('pagehide', flushOnPageHide);
	document.addEventListener('visibilitychange', flushOnVisibilityChange);
});
onUnmounted(() => {
	flushAutosave(false);
	cancelAutosave();
	window.removeEventListener('pagehide', flushOnPageHide);
	document.removeEventListener('visibilitychange', flushOnVisibilityChange);
});

// Laden der gespeicherten Spiele
function loadSavedGames() {
	savedGames.value = readSavedGames();
}

function applyGame(data, key = null) {
	if (!data || !Array.isArray(data.spielerListe)) throw new Error('Ungültige Spielerdaten');
	const players = data.spielerListe.map(player => ({ ...player, name: normalizePlayerName(player.name) }));
	flushAutosave(false);
	cancelAutosave();
	lastPersistedSnapshot = '';
	spielerStore.$patch({
		autoSaveEnabled: false,
		autoSaveStatus: '',
		spielerListe: players,
		sessionStarted: true,
		spieltag: String(data.spieltag || '').trim(),
		saison: gameSeason(data),
		savedGameKey: key,
	});
	spielerStore.selectedPlayer = players[0] || null;
}

function loadData(item) {
	try {
		flushAutosave(false);
		applyGame(JSON.parse(localStorage.getItem(item.key)), item.key);
		closeLoadDialog();
		router.push('/');
		snackbar.message = `Spieltag ${spieltag.value} geladen.`;
	} catch {
		loadSavedGames();
		snackbar.message = 'Der Spieltag konnte nicht geladen werden.';
	}
	snackbar.visible = true;
}

function exportData() {

	if (spielerStore.spielerListe.length === 0 || !spieltag.value || spieltag.value === '') {
		snackbar.message = 'Es sind keine Daten vorhanden, die exportiert werden können.';
		snackbar.visible = true;
		return;
	}

	const datenZumExportieren = sessionData();
	const blob = new Blob([JSON.stringify(datenZumExportieren)], { type: 'application/json;charset=utf-8' });
	saveAs(blob, `spieltag_${saison.value.replace('/', '-')}_${spieltag.value || 'unbenannt'}.json`);
}

function openImportDialog() {
	importDialog.value = true;
}

function closeImportDialog() {
	importDialog.value = false;
}

function handleFileUpload(event) {
	const file = event.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			applyGame(JSON.parse(e.target.result));
			snackbar.message = 'Spieltag importiert.';
			closeImportDialog();
			router.push('/');
		} catch {
			snackbar.message = 'Fehler beim Importieren der Daten.';
		}
		snackbar.visible = true;
	};
	reader.readAsText(file);
}


function copyLink() {
	if (navigator.clipboard && window.isSecureContext) {
		// Moderne Methode mit Clipboard API
		navigator.clipboard.writeText(shareableLink.value)
			.then(() => {
				snackbar.message = 'Link wurde in die Zwischenablage kopiert.';
				snackbar.visible = true;
			})
			.catch(err => {
				snackbar.message = 'Fehler beim Kopieren des Links.';
				snackbar.visible = true;
			});
	} else {
		// Fallback-Methode für ältere Browser
		const textArea = document.createElement('textarea');
		textArea.value = shareableLink.value;
		// Verhindere, dass die Seite nach unten scrollt
		textArea.style.position = 'fixed';
		textArea.style.top = '0';
		textArea.style.left = '0';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();
		try {
			const successful = document.execCommand('copy');
			snackbar.message = successful ? 'Link wurde in die Zwischenablage kopiert.' : 'Fehler beim Kopieren des Links.';
			snackbar.visible = true;
		} catch (err) {
			snackbar.message = 'Fehler beim Kopieren des Links.';
			snackbar.visible = true;
		}
		document.body.removeChild(textArea);
	}
}

onMounted(() => {
	loadSavedGames();
	loadDataFromUrl();
	if (!spielerStore.sessionStarted && router.currentRoute.value.path === '/eingabe') {
		// Require player selection before score entry
		router.push({ path: '/' });
	}

});

function getShareableLink() {
	const datenZumTeilen = sessionData();

	const jsonString = JSON.stringify(datenZumTeilen);


	// Komprimiere die Daten und erhalte ein Uint8Array
	const compressedData = pako.deflate(jsonString);


	// Konvertiere das Uint8Array in Base64
	const base64Data = arrayBufferToBase64(compressedData);


	// URL-enkodiere die Base64-Daten
	const urlSafeData = encodeURIComponent(base64Data);


	const url = `${window.location.origin}${window.location.pathname}?data=${urlSafeData}`;
	return url;
}

function loadDataFromUrl() {
	const params = new URLSearchParams(window.location.search);
	if (params.has('data')) {
		try {
			const urlSafeData = params.get('data');


			// URL-dekodieren
			const base64Data = decodeURIComponent(urlSafeData);


			// Base64-dekodieren und in ArrayBuffer umwandeln
			const compressedDataBuffer = base64ToArrayBuffer(base64Data);


			// Dekomprimiere die Daten
			const jsonString = pako.inflate(new Uint8Array(compressedDataBuffer), { to: 'string' });


			const daten = JSON.parse(jsonString);


			applyGame(daten);

			snackbar.message = 'Daten wurden aus der URL geladen.';
			snackbar.visible = true;

			// Entferne den data-Parameter aus der URL
			window.history.replaceState({}, document.title, window.location.pathname);
		} catch (error) {
			snackbar.message = `Fehler beim Laden der Daten aus der URL: ${error.message}`;
			snackbar.visible = true;
		}
	}
}


function arrayBufferToBase64(buffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

function base64ToArrayBuffer(base64) {
	const binary_string = atob(base64);
	const len = binary_string.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binary_string.charCodeAt(i);
	}
	return bytes.buffer;
}

</script>