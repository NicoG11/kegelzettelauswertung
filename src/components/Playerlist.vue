<script setup>
import {useSpielerStore} from '@/store/spielerStore';
import {useRouter} from 'vue-router';

const spielerStore = useSpielerStore();

const router = useRouter();

function geheZuScannSeite(spieler) {
    spielerStore.setSelectedPlayer(spieler);
    router.push({path: '/scan'});
}

function geheZuManuelSeite(spieler) {
    spielerStore.setSelectedPlayer(spieler);
    router.push({path: '/eingabe'});
}
</script>

<template>
    <v-list lines="three" rounded border variant="elevated" class="pb-0 my-4 bg-green">
        <v-list-subheader color="white" class="text-h6">Spielerliste</v-list-subheader>

        <v-list-item :elevation="2" v-for="(spieler, index) in spielerStore.spielerListe" :key="index" class="py-3">
            <v-list-item-title>{{ spieler.name }}</v-list-item-title>
            <v-list-item-subtitle>
                <span class="text-caption">Zu zahlen: {{ spielerStore.getToPay(spieler, true) }}</span>
                <br />
                <span class="text-caption">+ anderen {{ spielerStore.getFineFromOtherPlayers(spieler, true) }}</span>
                <br />
                =
                <span class="text-subtitle-2 pr-2" :class="{'text-decoration-line-through': spielerStore.is600(spieler)}">{{ spielerStore.getGesamtToPay(spieler) }} </span>
                <span v-if="spielerStore.is600(spieler)"> mehr/gleich als 600er gespielt</span>
            </v-list-item-subtitle>

            <template v-slot:append>
                <div class="d-flex flex-column ga-2">
                    <v-btn flat size="default" @click="geheZuManuelSeite(spieler)">Eingabe</v-btn>
                    <v-btn flat size="default" @click="geheZuScannSeite(spieler)">Scannen</v-btn>
                </div>
            </template>
        </v-list-item>
    </v-list>
</template>
