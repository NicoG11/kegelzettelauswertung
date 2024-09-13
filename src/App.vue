<template>
	<v-app>
		<v-main>
			<v-app-bar color="green" flat>
				<template v-slot:title>
					<div id="teleport" class="float-left"></div>
					<h3 class="text-center text-green-lighten-5">Kegelzettel Auswerter</h3>
				</template>

				<template v-slot:append>
					<v-menu>
						<template v-slot:activator="{ props }">
							<v-btn icon="mdi-dots-vertical" color="green-lighten-5" v-bind="props"></v-btn>
						</template>

						<v-list>
							<v-list-item v-for="(item, i) in menu" :key="i">
								<v-list-item-title @click="navigateTo(item.link)">{{ item.title }}</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-title @click="openSaveDialog"><v-icon>mdi-content-save</v-icon>
									Speichern</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-title @click="openLoadDialog"><v-icon>mdi-folder-open</v-icon>
									Öffnen</v-list-item-title>
							</v-list-item>

							<v-list-item>
								<v-list-item-title @click="exportData"><v-icon>mdi-export</v-icon>
									Export</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-title @click="openImportDialog"><v-icon>mdi-import</v-icon>
									Import</v-list-item-title>
							</v-list-item>
							<v-list-item>
								<v-list-item-title @click="shareData"><v-icon>mdi-share-variant</v-icon>
									Teilen</v-list-item-title>
							</v-list-item>



						</v-list>
					</v-menu>
				</template>
			</v-app-bar>

			<!-- Snackbar für Benachrichtigungen -->
			<v-snackbar v-model="snackbar.visible" :timeout="snackbar.timeout">
				{{ snackbar.message }}
				<template v-slot:action="{ attrs }">
					<v-btn color="red" text @click="snackbar.visible = false" v-bind="attrs">Schließen</v-btn>
				</template>
			</v-snackbar>




			<!-- Teilen Dialog -->
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
						<v-btn text @click="closeShareDialog">Schließen</v-btn>
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
						<v-btn text @click="closeImportDialog">Abbrechen</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Speichern Dialog -->
			<v-dialog v-model="saveDialog" max-width="500">
				<v-card>
					<v-card-title class="headline">Spieltag speichern</v-card-title>
					<v-card-text>
						<v-form ref="saveForm" v-model="isSaveFormValid">
							<v-text-field v-model="spieltag" label="Spieltag"
								:rules="[v => !!v || 'Spieltag erforderlich']" required></v-text-field>
						</v-form>
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn text @click="closeSaveDialog">Abbrechen</v-btn>
						<v-btn text @click="saveData" :disabled="!isSaveFormValid">Speichern</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Überschreiben Bestätigungsdialog -->
			<v-dialog v-model="overwriteDialog" max-width="500">
				<v-card>
					<v-card-title class="headline">Überschreiben bestätigen</v-card-title>
					<v-card-text>
						Es existieren bereits Daten für diesen Spieltag. Möchtest du sie überschreiben?
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn text @click="cancelOverwrite">Abbrechen</v-btn>
						<v-btn text @click="confirmOverwrite">Überschreiben</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<!-- Laden Dialog -->
			<v-dialog v-model="loadDialog" max-width="500">
				<v-card>
					<v-card-title class="headline">Spieltag laden</v-card-title>
					<v-card-text>
						<v-list>
							<v-list-item v-for="(item, index) in savedGames" :key="index"
								@click="loadData(item.spieltag)" :title="'Spieltag: ' + item.spieltag"
								:subtitle="'Datum: ' + item.datum">
							</v-list-item>
						</v-list>
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn text @click="closeLoadDialog">Schließen</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<div class="bg-green-lighten-5">
				<router-view />
			</div>
		</v-main>
	</v-app>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, reactive, computed, onMounted } from 'vue';
import { saveAs } from 'file-saver';
import { useSpielerStore } from '@/stores/spielerStore';

const router = useRouter();
const spielerStore = useSpielerStore();

function navigateTo(link) {
	router.push({ path: link });
}

const menu = [{ title: "Changelog", link: "changelog" }];

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
const spieltag = ref('');

// Gespeicherte Spiele
const savedGames = ref([]);

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
	saveDialog.value = true;
}

function closeSaveDialog() {
	saveDialog.value = false;
}

function openLoadDialog() {
	loadDialog.value = true;
	loadSavedGames();
}

function closeLoadDialog() {
	loadDialog.value = false;
}

// Speichern der Daten
function saveData() {
	const key = `spieltag_${spieltag.value}`;
	const existingData = localStorage.getItem(key);
	if (existingData) {
		// Dialog zum Überschreiben anzeigen
		saveDialog.value = false;
		overwriteDialog.value = true;
	} else {
		performSave();
	}
}

function performSave() {
	const datenZumSpeichern = {
		spieltag: spieltag.value,
		datum: new Date().toLocaleDateString(),
		spielerListe: spielerStore.spielerListe,
	};
	localStorage.setItem(`spieltag_${spieltag.value}`, JSON.stringify(datenZumSpeichern));
	overwriteDialog.value = false;
	saveDialog.value = false;
	// spieltag.value = '';
	// Snackbar anzeigen
	snackbar.message = 'Daten wurden erfolgreich gespeichert.';
	snackbar.visible = true;
}

function confirmOverwrite() {
	performSave();
}

function cancelOverwrite() {
	overwriteDialog.value = false;
}

// Laden der gespeicherten Spiele
function loadSavedGames() {
	const alleSchluessel = Object.keys(localStorage).filter((key) => key.startsWith('spieltag_'));
	savedGames.value = alleSchluessel.map((key) => {
		const daten = JSON.parse(localStorage.getItem(key));
		return {
			spieltag: daten.spieltag,
			datum: daten.datum,
		};
	});
}

function loadData(selectedSpieltag) {
	spieltag.value = selectedSpieltag;
	const daten = JSON.parse(localStorage.getItem(`spieltag_${selectedSpieltag}`));
	spielerStore.spielerListe = daten.spielerListe;
	closeLoadDialog();
	// Snackbar anzeigen
	snackbar.message = `Spieltag ${selectedSpieltag} wurde erfolgreich geladen.`;
	snackbar.visible = true;
}

function exportData() {

	if (spielerStore.spielerListe.length === 0 || !spieltag.value || spieltag.value === '') {
		snackbar.message = 'Es sind keine Daten vorhanden, die exportiert werden können.';
		snackbar.visible = true;
		return;
	}

	const datenZumExportieren = {
		spieltag: spieltag.value,
		datum: new Date().toLocaleDateString(),
		spielerListe: spielerStore.spielerListe,
	};
	const blob = new Blob([JSON.stringify(datenZumExportieren)], { type: 'application/json;charset=utf-8' });
	saveAs(blob, `spieltag_${spieltag.value || 'unbenannt'}.json`);
}

function openImportDialog() {
	importDialog.value = true;
}

function closeImportDialog() {
	importDialog.value = false;
}

function handleFileUpload(event) {
	const file = event.target.files[0];
	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const daten = JSON.parse(e.target.result);
			spielerStore.spielerListe = daten.spielerListe;
			spieltag.value = daten.spieltag || '';
			snackbar.message = 'Daten wurden erfolgreich importiert.';
			snackbar.visible = true;
			closeImportDialog();
		} catch (error) {
			snackbar.message = 'Fehler beim Importieren der Daten.';
			snackbar.visible = true;
		}
	};
	reader.readAsText(file);
}

function getShareableLink() {
	const datenZumTeilen = {
		spieltag: spieltag.value,
		datum: new Date().toLocaleDateString(),
		spielerListe: spielerStore.spielerListe,
	};
	const jsonString = JSON.stringify(datenZumTeilen);
	const encodedData = btoa(jsonString); // Base64 kodieren
	const url = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;
	return url;
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
	const params = new URLSearchParams(window.location.search);
	if (params.has('data')) {
		try {
			const encodedData = params.get('data');
			const jsonString = atob(encodedData);
			const daten = JSON.parse(jsonString);
			spielerStore.spielerListe = daten.spielerListe;
			spieltag.value = daten.spieltag || '';
			snackbar.message = 'Daten wurden aus der URL geladen.';
			snackbar.visible = true;
			// Optional: Entferne den data-Parameter aus der URL
			window.history.replaceState({}, document.title, window.location.pathname);
		} catch (error) {
			snackbar.message = 'Fehler beim Laden der Daten aus der URL.';
			snackbar.visible = true;
		}
	}
});

</script>