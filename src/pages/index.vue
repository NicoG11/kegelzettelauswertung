<script setup>
import {germanCurrencyFormat} from '@/services/rules';
import {useSpielerStore} from '@/store/spielerStore';
import {ref, computed} from 'vue';

import {useRouter} from 'vue-router';

const spielerStore = useSpielerStore();
const router = useRouter();
const neuerSpielerName = ref('');

const spielerListe = computed(() => spielerStore.spielerListe);

function spielerHinzufuegen() {
    if (neuerSpielerName.value) {
        spielerStore.spielerHinzufuegen(neuerSpielerName.value);
        neuerSpielerName.value = '';
    }
}

function geheZuScannSeite(spieler) {
    spielerStore.setSelectedPlayer(spieler);
    router.push({path: '/scan'});
}

function geheZuManuelSeite(spieler) {
    spielerStore.setSelectedPlayer(spieler);
    router.push({path: '/eingabe'});
}

// TODO TIERauswertung, wer was bekommt
</script>

<template>
    <v-container class="fill-height">
        <v-responsive class="fill-height">
            <v-list lines="three" rounded border variant="elevated" class="pb-0 mb-8 mt-4 bg-green">
                <v-list-subheader color="white" class="text-h6">Spielerliste</v-list-subheader>

                <v-list-item :elevation="2" v-for="(spieler, index) in spielerListe" :key="index">
                    <v-list-item-title>{{ spieler.name }}</v-list-item-title>
                    <v-list-item-subtitle
                        >Zu zahlen: {{ spielerStore.getToPay(spieler, true) }} + anderen {{ spielerStore.getFineFromOtherPlayers(spieler, true) }} = {{ spielerStore.getGesamtToPay(spieler) }}</v-list-item-subtitle
                    >

                    <template v-slot:append>
                        <v-btn flat class="mx-1 pa-2" size="default" @click="geheZuManuelSeite(spieler)">Eingabe</v-btn>
                        <v-btn flat class="mx-1 mr-0 pa-2" size="default" @click="geheZuScannSeite(spieler)">Scannen</v-btn>
                    </template>
                </v-list-item>
            </v-list>

            <v-card flat>
                <div class="bg-green h4 py-2 px-5">Spieler hinzufügen</div>
                <v-card-text>
                    <v-text-field label="Spielername" v-model="neuerSpielerName" :rules="[v => !!v || 'Name ist erforderlich']"></v-text-field>
                    <v-btn @click="spielerHinzufuegen">Hinzufügen</v-btn>
                </v-card-text>
            </v-card>
        </v-responsive>
    </v-container>
</template>
