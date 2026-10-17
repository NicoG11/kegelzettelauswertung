<script setup>
import {
	calculateFines,
	germanCurrencyFormat,
	getBahnGesamtSumme,
	calculateCrossLane9ers,
	calculateLane9ers,
} from "@/services/rules";
import { useSpielerStore } from "@/stores/spielerStore";

import { computed, onMounted, onUnmounted, ref, watch, nextTick, reactive } from "vue";
import { useRouter } from "vue-router";
import { createModel } from 'vosk-browser';
import { parseSpokenScores, speechGrammar, addSpokenScore } from '@/services/speechScores';



const isRecording = ref(false);
const isStartingRecognition = ref(false);
const speechLane = ref(null);
const speechPreview = ref('');
const microphoneLevel = ref(0);
const microphoneGain = ref(2);
let recognitionRequest = 0;
let disposed = false;


let recognizer = null;
let mediaStream = null;
let audioContext = null;
let loadedModel = null;
let recognizerNode = null;

const modelUrl = `${import.meta.env.BASE_URL}vosk-model-small-de-0.15.tar.gz`;



// Snackbar Zustand
const snackbar = reactive({
	visible: false,
	message: '',
	timeout: 3000, // Zeit in Millisekunden, wie lange die Snackbar angezeigt wird
});



const startRecognition = async (lane) => {
	const request = ++recognitionRequest;
	const playerId = spielerStore.selectedPlayer?.id;
	isStartingRecognition.value = true;
	speechLane.value = lane;
	try {
		snackbar.message = 'Lade Spracherkennungsmodell...';
		snackbar.visible = true;

		// Lade das Modell nur, wenn es noch nicht geladen wurde
		if (!loadedModel) {
			// Lade das Modell
			loadedModel = await createModel(modelUrl);
		}
		if (disposed) { loadedModel.terminate(); loadedModel = null; return; }
		if (request !== recognitionRequest) return;


		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		await audioContext.resume();
		if (request !== recognitionRequest || disposed) return;
		const sampleRate = audioContext.sampleRate;
		speechPreview.value = '';

		snackbar.message = 'Erstelle Recognizer...';
		snackbar.visible = true;
		// Erstelle einen Recognizer
		recognizer = new loadedModel.KaldiRecognizer(sampleRate, JSON.stringify(speechGrammar));


		// Überprüfe, ob der Recognizer erstellt wurde
		if (!recognizer) {
			// console.error('Recognizer konnte nicht erstellt werden.');
			snackbar.message = 'Recognizer konnte nicht erstellt werden.';
			snackbar.visible = true;
			return;
		}
		const activeRecognizer = recognizer;
		recognizer.setWords(true);

		snackbar.message = 'Erstelle Recognizermethoden...';
		snackbar.visible = true;

		recognizer.on('result', (message) => {
			if (request !== recognitionRequest || recognizer !== activeRecognizer || spielerStore.selectedPlayer?.id !== playerId) return;
			speechPreview.value = '';
			processResult(message.result.text, lane);
		});
		recognizer.on('partialresult', (message) => {
			if (request !== recognitionRequest || recognizer !== activeRecognizer || spielerStore.selectedPlayer?.id !== playerId) return;
			speechPreview.value = parseSpokenScores(message.result.partial).join(' · ');
		});

		recognizer.on('error', (message) => {
			// console.error('Recognizer Error:', message);
			snackbar.message = 'Recognizer Error: ' + message;
			snackbar.visible = true;
		});

		snackbar.message = 'Erlauben Sie den Zugriff auf das Mikrofon...';
		snackbar.visible = true;

		// Zugriff auf das Mikrofon
		const stream = await navigator.mediaDevices.getUserMedia({
			video: false,
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
				autoGainControl: true,
			},
		});

		if (request !== recognitionRequest || disposed) {
			stream.getTracks().forEach(track => track.stop());
			return;
		}
		mediaStream = stream;

		// Erstelle einen Audio-Kontext
		const source = audioContext.createMediaStreamSource(mediaStream);

		// Verwende ScriptProcessorNode (falls AudioWorkletNode nicht verfügbar)
		recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);

		recognizerNode.onaudioprocess = (event) => {
			if (request !== recognitionRequest || recognizer !== activeRecognizer) return;
			const samples = event.inputBuffer.getChannelData(0);
			let energy = 0;
			for (let i = 0; i < samples.length; i++) {
				samples[i] = Math.max(-1, Math.min(1, samples[i] * microphoneGain.value));
				energy += samples[i] * samples[i];
			}
			microphoneLevel.value = Math.min(100, Math.sqrt(energy / samples.length) * 500);
			activeRecognizer.acceptWaveform(event.inputBuffer);
		};

		source.connect(recognizerNode);
		recognizerNode.connect(audioContext.destination);

		isRecording.value = true;
		snackbar.message = 'Aufnahme läuft. Zahlen werden nach einer kurzen Sprechpause übernommen.';
		snackbar.visible = true;
	} catch (error) {
		if (request !== recognitionRequest || disposed) return;
		// console.error('Fehler bei der Initialisierung der Spracherkennung:', error);
		snackbar.message = 'Fehler bei der Initialisierung der Spracherkennung. ' + error;
		snackbar.visible = true;
		stopRecognition();
	} finally {
		if (request === recognitionRequest) isStartingRecognition.value = false;
	}
};


// Sprachaufnahme stoppen
const stopRecognition = () => {
	recognitionRequest++;
	isStartingRecognition.value = false;
	speechLane.value = null;
	speechPreview.value = '';
	microphoneLevel.value = 0;
	try {
		if (recognizerNode) {
			recognizerNode.disconnect();
			recognizerNode = null; // Setze auf null, um sicherzustellen, dass der Garbage Collector es aufräumt
		}

		if (audioContext) {
			audioContext.close();
			audioContext = null; // Setze auf null, um sicherzustellen, dass der Garbage Collector es aufräumt
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null; // Setze auf null, um sicherzustellen, dass der Garbage Collector es aufräumt
		}

		recognizer?.remove();
		recognizer = null; // Recognizer ebenfalls freigeben
		isRecording.value = false;
		snackbar.message = 'Spracherkennung beendet.';
		snackbar.visible = true;
	} catch (error) {
		snackbar.message = 'Fehler beim Stoppen der Spracherkennung: ' + error;
		snackbar.visible = true;
	}
};

const toggleSpeechRecognition = async (lane) => {
	if (isRecording.value || isStartingRecognition.value) {
		stopRecognition();
	} else if (spielerStore.selectedPlayer && lane >= 1 && lane <= 4) {
		if (spielerStore.selectedPlayer.bahnen[lane].length >= 30) {
			snackbar.message = `Bahn ${lane} enthält bereits 30 Würfe.`;
			snackbar.visible = true;
			return;
		}
		await startRecognition(lane);
	}
};

const processResult = (text, lane) => {
	if (text && text.length > 0) {
		console.log('Erkannt:', text);

		// Hier kannst du das Ergebnis weiter verarbeiten
		processSpeechResult(text, lane);
	}
};



const processSpeechResult = (text, lane) => {
	for (const number of parseSpokenScores(text)) {
		if (!isRecording.value) break;
		addNumberToLaneScore(number, lane);
	}
};


const router = useRouter();

const spielerStore = useSpielerStore();

const ownFinesWaived = computed(() => !!spielerStore.selectedPlayer && spielerStore.is600(spielerStore.selectedPlayer));
const aktuellerSchritt = ref(1);
const anzahlBahnen = ref(4);

const dialog = ref(false);
const newValue = ref("");
const currentLane = ref(null);
const currentIndex = ref(null);



const disabled = computed(() => {
	return aktuellerSchritt.value === 1
		? "prev"
		: aktuellerSchritt.value === 5
			? "next"
			: undefined;
});



onMounted(async () => {
	if (!spielerStore.selectedPlayer) {
		// Redirect to startpage
		router.push({ path: "/" });
	}

});

watch(aktuellerSchritt, (step) => {
	if ((isRecording.value || isStartingRecognition.value) && step !== speechLane.value) stopRecognition();
});

onUnmounted(() => {
	disposed = true;
	stopRecognition();
	loadedModel?.terminate();
	loadedModel = null;
});

const changeInputValue = (lane, index) => {
	currentLane.value = lane;
	currentIndex.value = index;
	newValue.value = spielerStore.selectedPlayer?.bahnen[lane][index] ?? "";
	dialog.value = true;
};
const saveNewValue = () => {
	const value = Number(newValue.value);
	if (newValue.value !== "" && Number.isInteger(value) && value >= 0 && value <= 9) {
		spielerStore.changeScore(currentLane.value, currentIndex.value, value);
		dialog.value = false;
	} else {
		alert("Bitte geben Sie einen Wert zwischen 0 und 9 ein");
	}
};

const rules = {
	min: (value) => value > -1 || "Min 0",
	max: (value) => value < 10 || "Max 9",
	number: (value) => !Number.isNaN(value) || "Must be a number",
};

const finesPerBahn = computed(() => {
	const result = {};
	for (let n = 1; n <= anzahlBahnen.value; n++) {
		const fines = calculateFines(spielerStore.selectedPlayer?.bahnen[n]);
		const lane9ers = calculateLane9ers(spielerStore.selectedPlayer?.bahnen[n]);
		result[n] = { ...fines, ...lane9ers };
	}
	return result;
});

const gesamtSummePerBahn = computed(() => {
	const result = {};
	for (let n = 1; n <= anzahlBahnen.value; n++) {
		const fines = finesPerBahn.value[n];
		const regularSum = getBahnGesamtSumme(fines);
		const otherSum = getBahnGesamtSumme(fines, 'other');

		result[n] = {
			regular: regularSum,
			other: otherSum,
			total: regularSum + otherSum,
		};
	}
	return result;
});

const crossLane9ers = computed(() => {
	if (!spielerStore.selectedPlayer) return {};
	return calculateCrossLane9ers(spielerStore.selectedPlayer);
});

const gesamtStatistik = computed(() => {
	if (!spielerStore.selectedPlayer) return {};

	const aggregatedRules = {};

	// Sammle alle Regeln von allen Bahnen
	for (let n = 1; n <= anzahlBahnen.value; n++) {
		const laneRules = finesPerBahn.value[n];

		for (const ruleKey in laneRules) {
			const rule = laneRules[ruleKey];

			if (!aggregatedRules[ruleKey]) {
				aggregatedRules[ruleKey] = {
					name: rule.name,
					cost: rule.cost,
					count: 0,
					total: 0,
					other: rule.other || false,
					info: rule.info || false
				};
			}

			aggregatedRules[ruleKey].count += rule.count;
			aggregatedRules[ruleKey].total += rule.total;
		}
	}

	return aggregatedRules;
});

const gesamtAuswertung = computed(() => {
	if (!spielerStore.selectedPlayer) {
		return { regular: 0, other: 0, bonusGiven: 0, total: 0 };
	}

	// Eigene Strafen (was der Spieler selbst zahlen muss)
	const ownFines = spielerStore.getToPay(spielerStore.selectedPlayer, false);

	// Boni von anderen Spielern (was andere erwirtschaftet haben)
	const bonusFromOthers = spielerStore.getFineFromOtherPlayers(spielerStore.selectedPlayer, false);

	// Boni die dieser Spieler den anderen "aufgedrückt" hat
	const bonusGiven = spielerStore.getToPayOther(spielerStore.selectedPlayer);

	// Apply the same 600-pin exemption and cap as in the overview.
	const total = spielerStore.getGesamtToPay(spielerStore.selectedPlayer, false);

	return {
		regular: ownFines,
		other: bonusFromOthers,
		bonusGiven: bonusGiven,
		total: total,
	};
});

function addNumberToLaneScore(number, lane) {
	const result = addSpokenScore(spielerStore, lane, number);
	if (result === 'added' && spielerStore.selectedPlayer.bahnen[lane].length < 30) return;
	if (result === 'invalid-number') return;
	stopRecognition();
	snackbar.message = result === 'full' || result === 'added'
		? `Bahn ${lane} ist vollständig (30 Würfe).`
		: result === 'no-player' ? 'Bitte zuerst einen Spieler auswählen.' : 'Bitte zuerst eine Bahn auswählen.';
	snackbar.visible = true;
}




</script>



<template>
	<!-- Snackbar für Hinweise -->
	<v-snackbar v-model="snackbar.visible" :timeout="snackbar.timeout">
		{{ snackbar.message }}
		<template v-slot:actions>
			<v-btn color="red" variant="text" @click="snackbar.visible = false">Schließen</v-btn>
		</template>
	</v-snackbar>

	<v-dialog v-model="dialog" max-width="300px">
		<v-card>
			<v-card-title>Wurf {{ currentIndex + 1 }}</v-card-title>
			<v-card-text>
				<v-text-field v-model="newValue" label="Neuer Wert" type="number" autofocus variant="outlined"
					:rules="[rules.number, rules.min, rules.max]"></v-text-field>
			</v-card-text>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="primary" variant="text" @click="dialog = false">Abbrechen</v-btn>
				<v-btn color="primary" variant="text" @click="saveNewValue">Speichern</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-container class="entry-shell">
		<Teleport to="#teleport">
			<v-btn icon="mdi-arrow-left" aria-label="Zurück zur Übersicht" @click="$router.push({ path: '/' })" />
		</Teleport>
		<header class="entry-heading"><p class="eyebrow">Würfe erfassen</p><h1>{{ spielerStore.selectedPlayer?.name }}</h1><p class="muted">Per Tastenfeld oder Mikrofon. Einzelne Würfe zum Korrigieren antippen.</p></header>

		<v-stepper non-linear alt-labels v-model="aktuellerSchritt">
			<template v-slot:default="{ prev, next }">
				<v-stepper-header>
					<!-- Dynamische Schritte basierend auf dem Zetteltyp -->
					<template v-for="n in anzahlBahnen" :key="`bahn-${n}`">
						<v-stepper-item
							:complete="aktuellerSchritt > n && spielerStore.selectedPlayer?.bahnen[n].length == 30"
							editable :title="`Bahn ${n}`" :value="n"></v-stepper-item>
					</template>
					<v-stepper-item :complete="aktuellerSchritt > anzahlBahnen" editable title="Berechnung"
						:value="anzahlBahnen + 1"></v-stepper-item>
				</v-stepper-header>

				<v-stepper-window>
					<v-stepper-window-item v-for="(n, index) in anzahlBahnen" :key="`bahn-content-${n}`" :value="n">
						<!-- Inhalt für das Scannen der einzelnen Bahnen -->
						<v-card>
							<v-card-text class="pa-0">
								<div class="lane-summary">
									<div><span>Volle</span><strong>{{ spielerStore.getSum(n, 'volle') }}</strong></div>
									<div><span>Abräumen</span><strong>{{ spielerStore.getSum(n, 'abr') }}</strong></div>
									<div><span>Gesamt</span><strong>{{ spielerStore.getSum(n, 'volle') + spielerStore.getSum(n, 'abr') }}</strong></div>
								</div>
								<!-- Ziffernblatt eingeben -->
								<v-row>
									<v-col cols="7">
										<h4 class="text-subtitle mb-2">Bahn {{ n }} einlesen</h4>
										<Numberpad :lane="n" />
										<v-divider class="my-4"></v-divider>
										<div class="entry-controls">
											<v-btn variant="tonal" color="primary" @click="toggleSpeechRecognition(n)"
												:loading="isStartingRecognition" :prepend-icon="isRecording ? 'mdi-stop' : 'mdi-microphone-outline'" :class="{ recording: isRecording }">
												{{ isRecording ? 'Aufnahme stoppen' : 'Spracheingabe' }}</v-btn>
											<v-btn variant="text" color="error" :disabled="!spielerStore.selectedPlayer?.bahnen[n].length"
												@click="spielerStore.clearLane(n)">Bahn {{ n }} löschen</v-btn>
										</div>
										<div v-if="isRecording && speechLane === n" class="mt-3" role="status" aria-live="polite">
											<div class="text-body-small">Mikrofonpegel</div>
											<v-progress-linear :model-value="microphoneLevel" color="primary" height="6" rounded class="my-2" aria-label="Mikrofonpegel" />
											<v-slider v-model="microphoneGain" :min="1" :max="5" :step="0.5" label="Verstärkung" thumb-label hide-details />
											<div class="text-body-small mt-2">Vorschau: {{ speechPreview || '…' }}</div>
											<div class="text-body-small text-medium-emphasis">Übernahme nach kurzer Sprechpause.</div>
										</div>
									</v-col>
									<v-col cols="5" class="px-0">
										<table class="score-table">
											<thead>
												<tr>
													<th class="text-right px-1 text-body-small">W</th>
													<th class="text-center px-2 text-title-small">V</th>
													<th class="text-right px-1 text-body-small">W</th>
													<th class="text-center px-2 text-title-small">A</th>
												</tr>
											</thead>
											<tfoot>
												<tr>
													<td class="text-right px-1 text-body-small"></td>
													<td class="text-center px-1 text-title-small">{{
														spielerStore.getSum(n, 'volle') }}
													</td>
													<td class="text-right px-1 text-body-small"></td>
													<td class="text-center px-1 text-title-small">{{
														spielerStore.getSum(n, 'abr') }}
													</td>
												</tr>
											</tfoot>
											<tbody>
												<tr v-for="(wurf, index) in 15" :key="`volle-${wurf}`">
													<td class="text-right px-1 text-body-small">{{ wurf }}</td>
													<td class="text-center px-1 text-title-small"
														@click="changeInputValue(n, index)">
														{{ spielerStore.selectedPlayer?.bahnen[n].length >= wurf ?
															spielerStore.selectedPlayer?.bahnen[n][index] : '' }}
													</td>
													<td class="text-right px-1 text-body-small">{{ wurf + 15 }}</td>
													<td class="text-center px-1 text-title-small"
														@click="changeInputValue(n, index + 15)">
														{{ spielerStore.selectedPlayer?.bahnen[n].length >= wurf + 15 ?
															spielerStore.selectedPlayer?.bahnen[n][index + 15] : '' }}
													</td>
												</tr>
											</tbody>
										</table>
									</v-col>
								</v-row>


								<v-expansion-panels class="mt-4">
									<v-expansion-panel>
										<v-expansion-panel-title class="px-2">Auswertung der Bahn
											auflisten</v-expansion-panel-title>
										<v-expansion-panel-text class="px-0">
											<table class="auswertung">
												<thead>
													<tr>
														<th class="text-left">Regel + Preis</th>
														<th class="text-right">Anzahl</th>
														<th class="text-right px-4">Summe</th>
														<th class="text-right">Alle</th>
													</tr>
												</thead>
												<tfoot>
													<tr>
														<td class="text-left">Gesamt</td>
														<td></td>
														<td class="text-right px-4 text-title-small">
															{{ germanCurrencyFormat(gesamtSummePerBahn[n].regular) }}
														</td>
														<td class="text-right text-body-small">{{
															germanCurrencyFormat(gesamtSummePerBahn[n].other) }}</td>
													</tr>
												</tfoot>
												<tbody>
													<tr v-for="(rule, index) in finesPerBahn[n]"
														:key="rule.name + index" :class="{ 'text-blue-darken-1': rule.info }">
														<td>
															<span class="text-title-small">{{ rule.name }}</span>
															<br v-if="!rule.info" />
															<span v-if="!rule.info" class="text-body-small">{{
																germanCurrencyFormat(rule.cost) }}</span>
														</td>
														<td class="text-right">{{ rule.count }}x</td>
														<td class="text-right px-4">{{ rule.other ? '' :
															germanCurrencyFormat(rule.total) }}</td>
														<td class="text-right text-body-small">{{ rule.other ?
															germanCurrencyFormat(rule.total) : '' }}</td>
													</tr>
												</tbody>
											</table>
										</v-expansion-panel-text>
									</v-expansion-panel>
								</v-expansion-panels>
							</v-card-text>
						</v-card>

					</v-stepper-window-item>

					<v-stepper-window-item :value="anzahlBahnen + 1">
						<!-- Berechnungen -->
						<h4>Auswertungen</h4>

						<!-- Grid für Bahnauswertungen (single column on mobile) -->
						<v-row>
							<!-- Bahn 1 und 2 -->
							<v-col cols="12" md="6" v-for="n in [1, 2]" :key="`bahn-row1-${n}`">
								<v-card>
									<v-card-text class="pa-2">
										<h4 class="text-subtitle my-1">Auswertung der Bahn {{ n }}</h4>
										<table class="auswertung">
											<thead>
												<tr>
													<th class="text-left">Regel + Preis</th>
													<th class="text-right">Anzahl</th>
													<th class="text-right px-2">Summe</th>
													<th class="text-right">Alle</th>
												</tr>
											</thead>
											<tfoot>
												<tr>
													<td class="text-left">Gesamt</td>
													<td></td>
													<td class="text-right px-2 text-title-small">{{
														germanCurrencyFormat(gesamtSummePerBahn[n].regular) }}</td>
													<td class="text-right text-body-small">{{
														germanCurrencyFormat(gesamtSummePerBahn[n].other) }}</td>
												</tr>
											</tfoot>
											<tbody>
												<tr v-for="(rule, index) in finesPerBahn[n]" :key="rule.name + index" :class="{ 'text-blue-darken-1': rule.info }">
													<td>
														<span class="text-title-small">{{ rule.name }}</span>
														<br v-if="!rule.info" />
														<span v-if="!rule.info" class="text-body-small">{{ germanCurrencyFormat(rule.cost) }}</span>
													</td>
													<td class="text-right">{{ rule.count }}x</td>
													<td class="text-right px-2">{{ rule.other ? '' :
														germanCurrencyFormat(rule.total) }}
													</td>
													<td class="text-right text-body-small">{{ rule.other ?
														germanCurrencyFormat(rule.total)
														: '' }}</td>
												</tr>
											</tbody>
										</table>
									</v-card-text>
								</v-card>
							</v-col>
							<!-- Bahn 3 und 4 -->
							<v-col cols="12" md="6" v-for="n in [3, 4]" :key="`bahn-row2-${n}`">
								<v-card>
									<v-card-text class="pa-2">
										<h4 class="text-subtitle my-1">Auswertung der Bahn {{ n }}</h4>
										<table class="auswertung">
											<thead>
												<tr>
													<th class="text-left">Regel + Preis</th>
													<th class="text-right">Anzahl</th>
													<th class="text-right px-2">Summe</th>
													<th class="text-right">Alle</th>
												</tr>
											</thead>
											<tfoot>
												<tr>
													<td class="text-left">Gesamt</td>
													<td></td>
													<td class="text-right px-2 text-title-small">{{
														germanCurrencyFormat(gesamtSummePerBahn[n].regular) }}</td>
													<td class="text-right text-body-small">{{
														germanCurrencyFormat(gesamtSummePerBahn[n].other) }}</td>
												</tr>
											</tfoot>
											<tbody>
												<tr v-for="(rule, index) in finesPerBahn[n]" :key="rule.name + index" :class="{ 'text-blue-darken-1': rule.info }">
													<td>
														<span class="text-title-small">{{ rule.name }}</span>
														<br v-if="!rule.info" />
														<span v-if="!rule.info" class="text-body-small">{{ germanCurrencyFormat(rule.cost) }}</span>
													</td>
													<td class="text-right">{{ rule.count }}x</td>
													<td class="text-right px-2">{{ rule.other ? '' :
														germanCurrencyFormat(rule.total) }}
													</td>
													<td class="text-right text-body-small">{{ rule.other ?
														germanCurrencyFormat(rule.total)
														: '' }}</td>
												</tr>
											</tbody>
										</table>
									</v-card-text>
								</v-card>
							</v-col>
						</v-row>

						<!-- Bahnübergreifende Auswertung -->
						<v-card class="mt-4">
							<v-card-text class="pa-0">
								<v-divider class="my-4"></v-divider>
								<v-row>
									<v-col cols="12">
										<h4 class="text-subtitle my-1">Bahnübergreifende Auswertung</h4>
										<table class="auswertung">
											<thead>
												<tr>
													<th class="text-left">Regel + Preis</th>
													<th class="text-right">Anzahl</th>
													<th class="text-right px-4">Summe</th>
													<th class="text-right">Alle</th>
												</tr>
											</thead>
											<tbody>
												<tr v-for="(rule, key) in crossLane9ers" :key="key">
													<td>
														<span class="text-title-small">{{ rule.name }}</span>
														<br />
														<span class="text-body-small">{{ germanCurrencyFormat(rule.cost) }}</span>
													</td>
													<td class="text-right">{{ rule.count }}x</td>
													<td class="text-right px-4">{{ rule.other ? '' : germanCurrencyFormat(rule.total) }}</td>
													<td class="text-right text-body-small">{{ rule.other ? germanCurrencyFormat(rule.total) : '' }}</td>
												</tr>
											</tbody>
										</table>
									</v-col>
								</v-row>
							</v-card-text>
						</v-card>

						<!-- Zusammenfassung aller Bahnen -->
						<v-card class="mt-4">
							<v-card-text class="pa-0">
								<v-divider class="my-4"></v-divider>
								<v-row>
									<v-col cols="12">
										<h4 class="text-subtitle my-1">Zusammenfassung aller Bahnen</h4>
										<table class="auswertung">
											<thead>
												<tr>
													<th class="text-left">Regel + Preis</th>
													<th class="text-right">Anzahl</th>
													<th class="text-right px-4">Summe</th>
													<th class="text-right">Alle</th>
												</tr>
											</thead>
											<tbody>
												<tr v-for="(rule, key) in gesamtStatistik" :key="key" :class="{ 'text-blue-darken-1': rule.info }">
													<td>
														<span class="text-title-small">{{ rule.name }}</span>
														<br v-if="!rule.info" />
														<span v-if="!rule.info" class="text-body-small">{{ germanCurrencyFormat(rule.cost) }}</span>
													</td>
													<td class="text-right">{{ rule.count }}x</td>
													<td class="text-right px-4">{{ rule.other ? '' : germanCurrencyFormat(rule.total) }}</td>
													<td class="text-right text-body-small">{{ rule.other ? germanCurrencyFormat(rule.total) : '' }}</td>
												</tr>
											</tbody>
										</table>
									</v-col>
								</v-row>
							</v-card-text>
						</v-card>

						<!-- Gesamtauswertung -->
						<v-card class="mt-4">
							<v-card-text class="pa-0">
								<v-divider class="my-4"></v-divider>
								<v-row>
									<v-col cols="12">
										<h4 class="text-subtitle my-1">Gesamtauswertung</h4>
										<table class="auswertung">
											<thead>
												<tr>
													<th class="text-left">Kategorie</th>
													<th class="text-right px-4">Summe</th>
													<th class="text-right">Alle</th>
													<th></th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td class="text-title-small"><span :class="{ 'waived-own-fine': ownFinesWaived }">Eigene Strafen</span><span v-if="ownFinesWaived" class="d-block text-body-small text-primary">Entfallen ab 600 Holz</span></td>
													<td class="text-right px-4" :class="{ 'waived-own-fine': ownFinesWaived }">{{ germanCurrencyFormat(gesamtAuswertung.regular) }}</td>
													<td class="text-right text-body-small"></td>
													<td class="text-right"></td>
												</tr>
												<tr>
													<td class="text-title-small">Boni von anderen</td>
													<td class="text-right px-4"></td>
													<td class="text-right text-body-small">{{ germanCurrencyFormat(gesamtAuswertung.other) }}</td>
													<td class="text-right text-body-small"></td>
												</tr>
												<tr class="text-grey-darken-1">
													<td class="text-body-small">Den anderen "aufgedrückt"</td>
													<td class="text-right text-body-small"></td>
													<td class="text-right text-body-small"></td>
													<td class="text-right px-4 text-body-small">{{ germanCurrencyFormat(gesamtAuswertung.bonusGiven) }}</td>
												</tr>
											</tbody>
											<tfoot>
												<tr>
													<td class="text-left text-title-large">Gesamt zu zahlen</td>
													<td colspan="2" class="text-center px-4 text-title-large">{{ germanCurrencyFormat(gesamtAuswertung.total) }}</td>
													<td></td>
												</tr>
											</tfoot>
										</table>
									</v-col>
								</v-row>
							</v-card-text>
						</v-card>
					</v-stepper-window-item>
				</v-stepper-window>

				<v-stepper-actions :disabled="disabled" color="primary" @click:prev="prev" @click:next="next"
					:next-text="aktuellerSchritt < 4 ? `Weiter zu Bahn ${aktuellerSchritt + 1}` : 'Zur Berechnung'" prev-text="Zurück"></v-stepper-actions>
			</template>
		</v-stepper>
	</v-container>
</template>

<style scoped>
.v-stepper--alt-labels .v-stepper-item {
	flex-basis: auto !important;
	padding: 1rem;
}

table thead tr th {
	border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

table tfoot tr td {
	border-top: 1px solid rgba(var(--v-border-color), 0.12);
	padding-top: 2px;
}

table.auswertung tr td {
	border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.v-expansion-panel-text > .v-expansion-panel-text__wrapper {
	padding: 0 !important;
}

.text-title-small {
	line-height: normal;
}

.speech-btn {
	cursor: pointer;
}

.speech-icon {
	position: relative;

	border: 2px solid transparent;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: border-color 0.3s, background-color 0.3s;
}

.speech-btn.recording .speech-icon {
	border-color: red;
	background-color: rgba(255, 0, 0, 0.1);
}

.speech-btn.recording .speech-icon v-icon {
	color: red;
}


.speech-btn.recording .speech-icon {
	border-color: red;
	background-color: rgba(255, 0, 0, 0.1);
	animation: pulse 1s infinite;
}

@keyframes pulse {
	0% {
		box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4);
	}

	70% {
		box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
	}

	100% {
		box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
	}
}

.image-container {
	position: relative;
	display: inline-block;
}

.preview-image {
	max-width: 100%;
	display: block;
}

.selection-box {
	position: absolute;
	border: 2px solid red;
	cursor: move;
	background-color: rgba(255, 0, 0, 0.1);
	/* Leichte Transparenz, um die Auswahl besser zu sehen */
}
</style>