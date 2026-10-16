<script setup>
import { useSpielerStore } from '@/stores/spielerStore';
const store = useSpielerStore();
const props = defineProps({ lane: { type: Number, required: true } });
function add(number) {
  if (store.selectedPlayer?.bahnen[props.lane].length < 30) store.addScore(props.lane, number);
}
</script>
<template>
  <div class="numberpad">
    <v-btn v-for="number in [7,8,9,4,5,6,1,2,3]" :key="number" variant="tonal"
      :disabled="!store.selectedPlayer || store.selectedPlayer.bahnen[lane].length >= 30" @click="add(number)">{{ number }}</v-btn>
    <span /><v-btn variant="tonal" :disabled="!store.selectedPlayer || store.selectedPlayer.bahnen[lane].length >= 30" @click="add(0)">0</v-btn>
    <v-btn variant="text" icon="mdi-backspace-outline" aria-label="Letzten Wurf löschen"
      :disabled="!store.selectedPlayer?.bahnen[lane].length" @click="store.clearLastScore(lane)" />
  </div>
</template>
