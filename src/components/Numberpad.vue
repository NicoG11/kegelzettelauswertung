<script setup>
import {useSpielerStore} from '@/stores/spielerStore';

const spielerStore = useSpielerStore();

const props = defineProps({
    lane: {
        type: Number,
        required: true,
    },
});

function addNumberToLaneScore(number = 0) {
    if (number < 0 || number > 9) return;
    if (props.lane && spielerStore.selectedPlayer.bahnen[props.lane].length < 30) {
        spielerStore.addScore(props.lane, number);
    }
}
</script>

<template>
    <v-container class="pa-0">
        <v-row no-gutters>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(7)">7</v-btn></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(8)">8</v-btn></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(9)">9</v-btn></v-col>
        </v-row>
        <v-row no-gutters class="my-1">
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(4)">4</v-btn></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(5)">5</v-btn></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(6)">6</v-btn></v-col>
        </v-row>
        <v-row no-gutters>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(1)">1</v-btn></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(2)">2</v-btn></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(3)">3</v-btn></v-col>
        </v-row>
        <v-row no-gutters class="my-1">
            <v-col></v-col>
            <v-col><v-btn flat variant="outlined" size="small" @click="addNumberToLaneScore(0)">0</v-btn></v-col>
            <v-col></v-col>
        </v-row>
    </v-container>
</template>
