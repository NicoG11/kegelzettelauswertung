<script setup>
import {
	calculateFines,
	germanCurrencyFormat,
	getBahnGesamtSumme,
	calculateCrossLane9ers,
} from "@/services/rules";
import { useSpielerStore } from "@/stores/spielerStore";

import { computed, onMounted, onUnmounted, ref, watch, nextTick, reactive } from "vue";
import { useRouter } from "vue-router";
import { createModel } from 'vosk-browser';



const isRecording = ref(false);


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



const startRecognition = async () => {
	try {
		snackbar.message = 'Lade Spracherkennungsmodell...';
		snackbar.visible = true;

		// Lade das Modell nur, wenn es noch nicht geladen wurde
		if (!loadedModel) {
			// Lade das Modell
			loadedModel = await createModel(modelUrl);
		}


		const sampleRate = 48000;

		snackbar.message = 'Erstelle Recognizer...';
		snackbar.visible = true;
		// Erstelle einen Recognizer
		recognizer = new loadedModel.KaldiRecognizer(sampleRate);


		// Überprüfe, ob der Recognizer erstellt wurde
		if (!recognizer) {
			// console.error('Recognizer konnte nicht erstellt werden.');
			snackbar.message = 'Recognizer konnte nicht erstellt werden.';
			snackbar.visible = true;
			return;
		}
		recognizer.setWords(true);

		snackbar.message = 'Erstelle Recognizermethoden...';
		snackbar.visible = true;

		recognizer.on('result', (message) => {
			console.log(`Result: ${message.result.text}`);
			processResult(message.result.text);
		});
		recognizer.on('partialresult', (message) => {
			console.log(`Partial result: ${message.result.partial}`);
			// processResult(message.result.partial);
		});

		recognizer.on('error', (message) => {
			// console.error('Recognizer Error:', message);
			snackbar.message = 'Recognizer Error: ' + message;
			snackbar.visible = true;
		});

		snackbar.message = 'Erlauben Sie den Zugriff auf das Mikrofon...';
		snackbar.visible = true;

		// Zugriff auf das Mikrofon
		mediaStream = await navigator.mediaDevices.getUserMedia({
			video: false,
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
			},
		});

		// Erstelle einen Audio-Kontext
		audioContext = new (window.AudioContext || window.webkitAudioContext)();
		const source = audioContext.createMediaStreamSource(mediaStream);

		// Verwende ScriptProcessorNode (falls AudioWorkletNode nicht verfügbar)
		recognizerNode = audioContext.createScriptProcessor(4096, 1, 1);

		recognizerNode.onaudioprocess = (event) => {
			// Übergib das AudioBuffer-Objekt direkt
			recognizer.acceptWaveform(event.inputBuffer);
		};

		source.connect(recognizerNode);
		recognizerNode.connect(audioContext.destination);

		isRecording.value = true;
		snackbar.message = 'Spracherkennung erfolgreich gestartet. Bitte sprechen Sie die Zahlen deutlich aus. Und machen Sie dazischen eine kleine Pause.';
		snackbar.visible = true;
	} catch (error) {
		// console.error('Fehler bei der Initialisierung der Spracherkennung:', error);
		snackbar.message = 'Fehler bei der Initialisierung der Spracherkennung. ' + error;
		snackbar.visible = true;
		stopRecognition();
	}
};


// Sprachaufnahme stoppen
const stopRecognition = () => {
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

	if (isRecording.value) {
		stopRecognition();
	} else {
		snackbar.message = 'Starte Spracherkennung...';
		snackbar.visible = true;
		await startRecognition();

	}
};

const processResult = (text) => {
	if (text && text.length > 0) {
		console.log('Erkannt:', text);

		// Hier kannst du das Ergebnis weiter verarbeiten
		processSpeechResult(text);
	}
};



const numberMap = {
	'zero': 0,
	'nücht': 0,
	'null': 0,
	'ull': 0,
	'fehler': 0,
	'ein': 1,
	'eins': 1,
	'eine': 1,
	'zwei': 2,
	'zwo': 2,
	'drei': 3,
	'brei': 3,
	'vier': 4,
	'schier': 4,
	'fier': 4,
	'für': 4,
	'hier': 4,
	'share': 4,
	'cher': 4,
	'viel': 4,
	'fünf': 5,
	'funf': 5,
	'sechs': 6,
	'sex': 6,
	'sieben': 7,
	'sieb': 7,
	'sie': 7,
	'sie wollen': 7,
	'zielen': 7,
	'siegeln': 7,
	'zählen': 7,
	'acht': 8,
	'ach': 8,
	'neun': 9,
	'neuen': 9,
	'neu': 9,
	'nein': 9,
	'alle': 9,
	// Weitere Zahlen hinzufügen
};

const processSpeechResult = (text) => {
	const words = text.toLowerCase().split(' ');
	words.forEach((word) => {
		console.log('Erkanntes Wort:', word);
		const number = numberMap[word];
		if (number !== undefined) {
			console.log('Erkannte Zahl:', number);
			// Füge die Zahl in deine Anwendung ein
			addNumberToLaneScore(number);
		}
	});
};


const router = useRouter();

const spielerStore = useSpielerStore();

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

onUnmounted(() => {

	stopRecognition();
});

const changeInputValue = (lane, index) => {
	currentLane.value = lane;
	currentIndex.value = index;
	newValue.value = spielerStore.selectedPlayer?.bahnen[lane][index] || "";
	dialog.value = true;
};
const saveNewValue = () => {
	const value = Number(newValue.value);
	if (!Number.isNaN(value) && value >= 0 && value <= 9) {
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
		result[n] = calculateFines(spielerStore.selectedPlayer?.bahnen[n]);
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

	// Gesamtsumme (mit Deckelung bei 15€)
	const total = Math.min(ownFines + bonusFromOthers, 15);

	return {
		regular: ownFines,
		other: bonusFromOthers,
		bonusGiven: bonusGiven,
		total: total,
	};
});

function addNumberToLaneScore(number) {

	if (typeof number !== 'number' || number < 0 || number > 9) return;

	if (
		spielerStore.selectedPlayer &&
		spielerStore.selectedPlayer.bahnen[currentLane.value] &&
		spielerStore.selectedPlayer.bahnen[currentLane.value].length < 30
	) {
		spielerStore.addScore(currentLane.value, number);
	} else {
		snackbar.message = 'Bedingungen für das Hinzufügen der Zahl sind nicht erfüllt.';
		snackbar.visible = true;
	}
}




</script>



<template>
	<!-- Snackbar für Hinweise -->
	<v-snackbar v-model="snackbar.visible" :timeout="snackbar.timeout">
		{{ snackbar.message }}
		<template v-slot:action="{ attrs }">
			<v-btn color="red" text @click="snackbar.visible = false" v-bind="attrs">Schließen</v-btn>
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
				<v-btn color="blue darken-1" text @click="dialog = false">Abbrechen</v-btn>
				<v-btn color="blue darken-1" text @click="saveNewValue">Speichern</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-container class="">
		<Teleport to="#teleport">
			<v-btn @click="$router.push({ path: '/' })">Zurück</v-btn>
		</Teleport>
		<v-row class="mb-4">
			<v-col>
				<div class="text-h5 pt-2 text-center font-weight-light">Auswertung für {{
					spielerStore.selectedPlayer?.name }}</div>
			</v-col>
		</v-row>

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
								<!-- Ziffernblatt eingeben -->
								<v-row>
									<v-col cols="7">
										<h4 class="text-subtitle mb-2">Bahn {{ n }} einlesen</h4>
										<Numberpad :lane="n" />
										<v-divider class="my-4"></v-divider>
										<div class="d-flex flex-column ga-4">
											<v-btn color="error" @click="spielerStore.clearLastScore(n)">Letzten
												Wurf<br />löschen</v-btn>
											<v-btn color="error" @click="spielerStore.clearLane(n)">Bahn {{ n
												}}<br />löschen</v-btn>
										</div>
										<v-divider class="my-4"></v-divider>

										<v-btn variant="outlined" @click="toggleSpeechRecognition(n)" class="speech-btn"
											:class="{ recording: isRecording }">
											<div class="speech-icon">
												<v-icon v-if="isRecording">mdi-stop</v-icon>
												<v-icon v-else>mdi-microphone</v-icon>
											</div>
										</v-btn>
									</v-col>
									<v-col cols="5" class="px-0">
										<table>
											<thead>
												<tr>
													<th class="text-right px-1 text-caption">W</th>
													<th class="text-center px-2 text-subtitle-2">V</th>
													<th class="text-right px-1 text-caption">W</th>
													<th class="text-center px-2 text-subtitle-2">A</th>
												</tr>
											</thead>
											<tfoot>
												<tr>
													<td class="text-right px-1 text-caption"></td>
													<td class="text-center px-1 text-subtitle-2">{{
														spielerStore.getSum(n, 'volle') }}
													</td>
													<td class="text-right px-1 text-caption"></td>
													<td class="text-center px-1 text-subtitle-2">{{
														spielerStore.getSum(n, 'abr') }}
													</td>
												</tr>
											</tfoot>
											<tbody>
												<tr v-for="(wurf, index) in 15" :key="`volle-${wurf.index}`">
													<td class="text-right px-1 text-caption">{{ wurf }}</td>
													<td class="text-center px-1 text-subtitle-2"
														@click="changeInputValue(n, index)">
														{{ spielerStore.selectedPlayer?.bahnen[n].length >= wurf ?
															spielerStore.selectedPlayer?.bahnen[n][index] : '' }}
													</td>
													<td class="text-right px-1 text-caption">{{ wurf + 15 }}</td>
													<td class="text-center px-1 text-subtitle-2"
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
														<td class="text-right px-4 text-subtitle-2">
															{{ germanCurrencyFormat(gesamtSummePerBahn[n].regular) }}
														</td>
														<td class="text-right text-caption">{{
															germanCurrencyFormat(gesamtSummePerBahn[n].other) }}</td>
													</tr>
												</tfoot>
												<tbody>
													<tr v-for="(rule, index) in finesPerBahn[n]"
														:key="rule.name + index">
														<td>
															<span class="text-subtitle-2">{{ rule.name }}</span>
															<br />
															<span class="text-caption">{{
																germanCurrencyFormat(rule.cost) }}</span>
														</td>
														<td class="text-right">{{ rule.count }}x</td>
														<td class="text-right px-4">{{ rule.other ? '' :
															germanCurrencyFormat(rule.total) }}</td>
														<td class="text-right text-caption">{{ rule.other ?
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
						<v-card v-for="(n, index) in anzahlBahnen" :key="`bahn-auswerten-content-${n}`">
							<v-card-text class="pa-0">
								<!-- Ziffernblatt eingeben -->
								<v-divider class="my-4"></v-divider>
								<v-row>
									<v-col cols="12">
										<h4 class="text-subtitle my-1">Auswertung der Bahn {{ n }}</h4>
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
													<td class="text-right px-4 text-subtitle-2">{{
														germanCurrencyFormat(gesamtSummePerBahn[n].regular) }}</td>
													<td class="text-right text-caption">{{
														germanCurrencyFormat(gesamtSummePerBahn[n].other) }}</td>
												</tr>
											</tfoot>
											<tbody>
												<tr v-for="(rule, index) in finesPerBahn[n]" :key="rule.name + index">
													<td>
														<span class="text-subtitle-2">{{ rule.name }}</span>
														<br />
														<span class="text-caption">{{ germanCurrencyFormat(rule.cost)
															}}</span>
													</td>
													<td class="text-right">{{ rule.count }}x</td>
													<td class="text-right px-4">{{ rule.other ? '' :
														germanCurrencyFormat(rule.total) }}
													</td>
													<td class="text-right text-caption">{{ rule.other ?
														germanCurrencyFormat(rule.total)
														: '' }}</td>
												</tr>
											</tbody>
										</table>
									</v-col>
								</v-row>
							</v-card-text>
						</v-card>

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
														<span class="text-subtitle-2">{{ rule.name }}</span>
														<br />
														<span class="text-caption">{{ germanCurrencyFormat(rule.cost) }}</span>
													</td>
													<td class="text-right">{{ rule.count }}x</td>
													<td class="text-right px-4">{{ rule.other ? '' : germanCurrencyFormat(rule.total) }}</td>
													<td class="text-right text-caption">{{ rule.other ? germanCurrencyFormat(rule.total) : '' }}</td>
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
													<td class="text-subtitle-2">Eigene Strafen</td>
													<td class="text-right px-4">{{ germanCurrencyFormat(gesamtAuswertung.regular) }}</td>
													<td class="text-right text-caption"></td>
													<td class="text-right"></td>
												</tr>
												<tr>
													<td class="text-subtitle-2">Boni von anderen</td>
													<td class="text-right px-4"></td>
													<td class="text-right text-caption">{{ germanCurrencyFormat(gesamtAuswertung.other) }}</td>
													<td class="text-right text-caption"></td>
												</tr>
												<tr class="text-grey-darken-1">
													<td class="text-caption">Den anderen "aufgedrückt"</td>
													<td class="text-right text-caption"></td>
													<td class="text-right text-caption"></td>
													<td class="text-right px-4 text-caption">{{ germanCurrencyFormat(gesamtAuswertung.bonusGiven) }}</td>
												</tr>
											</tbody>
											<tfoot>
												<tr>
													<td class="text-left text-h6">Gesamt zu zahlen</td>
													<td colspan="2" class="text-center px-4 text-h6">{{ germanCurrencyFormat(gesamtAuswertung.total) }}</td>
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

				<v-stepper-actions :disabled="disabled" color="green" @click:prev="prev" @click:next="next"
					next-text="weiter" prev-text="zurück"></v-stepper-actions>
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
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

table tfoot tr td {
	border-top: 1px solid rgba(0, 0, 0, 0.12);
	padding-top: 2px;
}

table.auswertung tr td {
	border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.v-expansion-panel-text > .v-expansion-panel-text__wrapper {
	padding: 0 !important;
}

.text-subtitle-2 {
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