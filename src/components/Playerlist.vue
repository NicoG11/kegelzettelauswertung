<script setup>
import { computed } from 'vue';
import { useSpielerStore } from '@/stores/spielerStore';
import { useRouter } from 'vue-router';
import { germanCurrencyFormat } from '@/services/rules';
const spielerStore = useSpielerStore();
const router = useRouter();
const players = computed(() => spielerStore.spielerListe.map(player => ({
  ...player,
  total: spielerStore.getPlayerSum(player),
  ownFinesWaived: spielerStore.is600(player),
  ownFine: spielerStore.getToPay(player, true),
  otherFine: spielerStore.getFineFromOtherPlayers(player, true, spielerStore.is600(player)),
  totalFine: germanCurrencyFormat(spielerStore.getGesamtToPay(player, false)),
  maximumReached: spielerStore.getGesamtToPay(player, false) >= 15,
})));
function enter(player) {
  spielerStore.setSelectedPlayer(player);
  router.push('/eingabe');
}
</script>
<template>
  <div class="player-cards" aria-label="Spielerliste">
    <v-card v-for="player in players" :key="player.id" class="player-card">
      <v-avatar color="primary" variant="tonal" size="44">{{ player.name.slice(0, 1).toUpperCase() }}</v-avatar>
      <div class="player-info"><h3>{{ player.name }}</h3><p class="muted">{{ player.total }} Holz</p></div>
      <div class="player-fine"><strong>{{ player.totalFine }}</strong><span class="muted">{{ player.maximumReached ? 'Höchstbetrag' : 'zu zahlen' }}</span></div>
      <v-btn variant="outlined" color="primary" @click="enter(player)" :aria-label="`Eingabe für ${player.name}`">Eingabe</v-btn>
      <p v-if="player.ownFinesWaived" class="waived-fine"><s>Eigene Strafen: {{ player.ownFine }}</s><span class="text-primary">Entfallen ab 600 Holz</span></p>
      <details class="fine-detail"><summary>Strafen im Detail</summary><p class="muted"><span v-if="!player.ownFinesWaived">Eigene Strafen: {{ player.ownFine }} · </span>Anteil von anderen: {{ player.otherFine }}</p></details>
    </v-card>
  </div>
</template>
