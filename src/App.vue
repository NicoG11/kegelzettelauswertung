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


</script>