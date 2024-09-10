<script setup>
import ImageUploadModal from '@/components/ImageUploadModal.vue';
import {calculateFines, germanCurrencyFormat, getBahnGesamtSumme} from '@/services/rules';
import {useSpielerStore} from '@/stores/spielerStore';

import {computed, onMounted, ref, watch} from 'vue';
import {useRouter} from 'vue-router';

const router = useRouter();

const spielerStore = useSpielerStore();

const aktuellerSchritt = ref(1);
const anzahlBahnen = ref(4);

const dialog = ref(false);
const newValue = ref('');
const currentLane = ref(null);
const currentIndex = ref(null);

const showFileUploadModal = ref(false);

const openFileUploadModal = index => {
    currentLane.value = index;
    console.log('currentLane', currentLane.value);
    showFileUploadModal.value = true;
};

const onNumbersExtracted = numbers => {
    console.log('Extrahierte Zahlen:', numbers);
    // Hier können Sie die extrahierten Zahlen weiterverarbeiten
};

const disabled = computed(() => {
    return aktuellerSchritt.value === 1 ? 'prev' : aktuellerSchritt.value === 5 ? 'next' : undefined;
});

// create watch element for aktuellerSchritt
watch(aktuellerSchritt, async (newValue, oldValue) => {
    if (newValue === 5) {
        //berechnen
    }
});

// const weiterZumNaechstenSchritt = async () => {
//     if (aktuellerSchritt.value < 5) {
//         aktuellerSchritt.value++;
//     }
// };

onMounted(() => {
    if (!spielerStore.selectedPlayer) {
        //r redirect to startpage
        router.push({path: '/'});
    }
});

const changeInputValue = (lane, index) => {
    currentLane.value = lane;
    currentIndex.value = index;
    newValue.value = spielerStore.selectedPlayer?.bahnen[lane][index] || '';
    dialog.value = true;
};
const saveNewValue = () => {
    //check if value existst and valu ein range of 0-9
    if (newValue.value && newValue.value >= 0 && newValue.value <= 9) {
        spielerStore.changeScore(currentLane.value, currentIndex.value, newValue.value);
        dialog.value = false;
    } else {
        alert('Bitte geben Sie einen Wert zwischen 0 und 9 ein');
    }
};
</script>

<template>
    <v-dialog v-model="dialog" max-width="300px">
        <v-card>
            <v-card-title>Wurf {{ currentIndex + 1 }}</v-card-title>
            <v-card-text>
                <v-text-field v-model="newValue" label="Neuer Wert" type="number" autofocus></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="dialog = false">Abbrechen</v-btn>
                <v-btn color="blue darken-1" text @click="saveNewValue">Speichern</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <ImageUploadModal v-model="showFileUploadModal" @numbersExtracted="onNumbersExtracted" :lane="currentLane" />

    <v-container class="fill-height">
        <v-row class="mb-4">
            <v-col cols="2">
                <v-btn @click="$router.push({path: '/'})">Zurück</v-btn>
            </v-col>
            <v-col>
                <div class="text-h5 pt-2 text-center font-weight-light">Auswertung für {{ spielerStore.selectedPlayer?.name }}</div>
            </v-col>
        </v-row>

        <v-stepper non-linear alt-labels v-model="aktuellerSchritt">
            <template v-slot:default="{prev, next}">
                <v-stepper-header>
                    <!-- Dynamische Schritte basierend auf dem Zetteltyp -->
                    <template v-for="n in anzahlBahnen" :key="`bahn-${n}`">
                        <v-stepper-item :complete="aktuellerSchritt > n && spielerStore.selectedPlayer?.bahnen[n].length == 30" editable :title="`Bahn ${n}`" :value="n"></v-stepper-item>
                        <!-- <v-divider v-if="n !== anzahlBahnen"></v-divider> -->
                    </template>
                    <!-- <v-divider></v-divider> -->
                    <v-stepper-item :complete="aktuellerSchritt > anzahlBahnen" editable title="Berechnung" :value="anzahlBahnen + 1"></v-stepper-item>
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
                                            <v-btn color="error" @click="spielerStore.clearLastScore(n)">Letzten Wurf<br />löschen</v-btn>
                                            <v-btn color="error" @click="spielerStore.clearLane(n)">Bahn {{ n }}<br />löschen</v-btn>
                                            <v-btn @click="openFileUploadModal(n)">Bild hochladen</v-btn>
                                        </div>
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
                                                    <td class="text-center px-1 text-subtitle-2">{{ spielerStore.getSum(n, 'volle') }}</td>
                                                    <td class="text-right px-1 text-caption"></td>
                                                    <td class="text-center px-1 text-subtitle-2">{{ spielerStore.getSum(n, 'abr') }}</td>
                                                </tr>
                                            </tfoot>
                                            <tbody>
                                                <tr v-for="(wurf, index) in 15" :key="`volle-${wurf.index}`">
                                                    <td class="text-right px-1 text-caption">{{ wurf }}</td>
                                                    <td class="text-center px-1 text-subtitle-2" @click="changeInputValue(n, index)">
                                                        {{ spielerStore.selectedPlayer?.bahnen[n].length >= wurf ? spielerStore.selectedPlayer?.bahnen[n][index] : '' }}
                                                    </td>
                                                    <td class="text-right px-1 text-caption">{{ wurf + 15 }}</td>
                                                    <td class="text-center px-1 text-subtitle-2" @click="changeInputValue(n, index + 15)">
                                                        {{ spielerStore.selectedPlayer?.bahnen[n].length >= wurf + 15 ? spielerStore.selectedPlayer?.bahnen[n][index + 15] : '' }}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </v-col>
                                </v-row>

                                <v-expansion-panels class="mt-4">
                                    <v-expansion-panel>
                                        <v-expansion-panel-title class="px-2">Auswertung der Bahn auflisten</v-expansion-panel-title>
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
                                                        <td class="text-right px-4 text-subtitle-2">{{ germanCurrencyFormat(getBahnGesamtSumme(calculateFines(spielerStore.selectedPlayer?.bahnen[n]))) }}</td>
                                                        <td class="text-right text-caption">{{ germanCurrencyFormat(getBahnGesamtSumme(calculateFines(spielerStore.selectedPlayer?.bahnen[n]), 'other')) }}</td>
                                                    </tr>
                                                </tfoot>
                                                <tbody>
                                                    <tr v-for="(rule, index) in calculateFines(spielerStore.selectedPlayer?.bahnen[n])" :key="rule.name + index">
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
                                                    <td class="text-right px-4 text-subtitle-2">{{ germanCurrencyFormat(getBahnGesamtSumme(calculateFines(spielerStore.selectedPlayer?.bahnen[n]))) }}</td>
                                                    <td class="text-right text-caption">{{ germanCurrencyFormat(getBahnGesamtSumme(calculateFines(spielerStore.selectedPlayer?.bahnen[n]), 'other')) }}</td>
                                                </tr>
                                            </tfoot>
                                            <tbody>
                                                <tr v-for="(rule, index) in calculateFines(spielerStore.selectedPlayer?.bahnen[n])" :key="rule.name + index">
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
                    </v-stepper-window-item>
                </v-stepper-window>

                <v-stepper-actions :disabled="disabled" color="green" @click:prev="prev" @click:next="next" next-text="weiter" prev-text="zurück"></v-stepper-actions>
            </template>
        </v-stepper>
        <video ref="videoElement" autoplay></video>
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
</style>
