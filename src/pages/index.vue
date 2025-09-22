<script setup>
import {useSpielerStore} from '@/stores/spielerStore';
import {ref} from 'vue';
import Playerlist from '@/components/Playerlist.vue';
import Dinge from '@/components/Dinge.vue';

const spielerStore = useSpielerStore();

const neuerSpielerName = ref('');
const tab = ref('strafe');

function spielerHinzufuegen() {
    if (neuerSpielerName.value) {
        spielerStore.spielerHinzufuegen(neuerSpielerName.value);
        neuerSpielerName.value = '';
    }
}
</script>

<template>
    <v-container class="fill-height">
        <v-responsive class="fill-height">
            <v-tabs v-model="tab" bg-color="white" selected-class="text-green-darken-2 font-weight-black" grow>
                <v-tab value="strafe" class="text-green">Strafen</v-tab>
                <v-tab value="dinge" class="text-green">wer bekommt was</v-tab>
            </v-tabs>

            <v-window v-model="tab">
                <v-window-item value="strafe">
                    <Playerlist />
                    <v-card flat>
                        <div class="bg-green h4 py-2 px-5">Spieler hinzufügen</div>
                        <v-card-text>
                            <v-text-field label="Spielername" v-model="neuerSpielerName" :rules="[v => !!v || 'Name ist erforderlich']"></v-text-field>
                            <v-btn @click="spielerHinzufuegen">Hinzufügen</v-btn>
                        </v-card-text>
                    </v-card>
                </v-window-item>
                <v-window-item value="dinge">
                    <Dinge />
                </v-window-item>
            </v-window>
        </v-responsive>
    </v-container>
</template>
