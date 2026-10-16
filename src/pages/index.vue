<script setup>
import { computed, ref } from 'vue';
import { useSpielerStore } from '@/stores/spielerStore';
import { germanCurrencyFormat } from '@/services/rules';
import PlayerSelection from '@/components/PlayerSelection.vue';
import AutosaveControl from '@/components/AutosaveControl.vue';
import Playerlist from '@/components/Playerlist.vue';
import Dinge from '@/components/Dinge.vue';
import { validSeason } from '@/services/savedGames';
const spielerStore = useSpielerStore();
const tab = ref('strafe');
const addingPlayers = ref(false);
const validMetadata = computed(() => !!spielerStore.spieltag.trim() && validSeason(spielerStore.saison));
const totalFines = computed(() => spielerStore.spielerListe.reduce((sum, player) =>
  sum + spielerStore.getGesamtToPay(player, false), 0));
const averageFines = computed(() => spielerStore.spielerListe.length
  ? totalFines.value / spielerStore.spielerListe.length : 0);
function addPlayers(names) {
  names.forEach(name => spielerStore.spielerHinzufuegen(name));
  addingPlayers.value = false;
}
</script>

<template>
  <v-container class="page-shell">
    <template v-if="!spielerStore.sessionStarted">
      <v-card class="setup-card">
        <section class="session-fields">
          <h1>Spieltag starten</h1>
          <div class="session-fields-grid mt-5">
            <v-text-field v-model="spielerStore.spieltag" label="Spieltag (Name oder Nummer)" maxlength="80" hide-details="auto" />
            <v-text-field v-model="spielerStore.saison" label="Saison" placeholder="2026/2027" hide-details="auto"
              :rules="[value => validSeason(value) || 'Format: 2026/2027 (aufeinanderfolgende Jahre)']" />
          </div>
          <AutosaveControl class="mt-4" />
        </section>
        <PlayerSelection :can-confirm="validMetadata" @confirm="names => spielerStore.startSession(names)" />
      </v-card>
    </template>
    <template v-else>
      <header class="page-intro intro-with-action">
        <div><h1>Auswertung für Spieltag: {{ spielerStore.spieltag || 'Unbenannt' }}</h1><p class="muted">{{ spielerStore.saison ? `Saison ${spielerStore.saison}` : 'Ohne Saison' }}</p></div>
        <v-btn v-if="tab === 'strafe'" color="primary" prepend-icon="mdi-account-plus-outline" @click="addingPlayers = true">Spieler hinzufügen</v-btn>
      </header>
      <div class="summary-grid">
        <v-card class="summary-card"><v-icon icon="mdi-account-group-outline" color="primary" size="30" /><div><strong>{{ spielerStore.spielerListe.length }}</strong><span class="muted">Spieler dabei</span></div></v-card>
        <v-card class="summary-card"><v-icon icon="mdi-cash-multiple" color="primary" size="30" /><div><strong>{{ germanCurrencyFormat(totalFines) }}</strong><span class="muted">Strafen gesamt</span></div></v-card>
        <v-card class="summary-card"><v-icon icon="mdi-calculator-variant-outline" color="primary" size="30" /><div><strong>{{ germanCurrencyFormat(averageFines) }}</strong><span class="muted">Strafen im Durchschnitt</span><small class="muted">pro Spieler</small></div></v-card>
      </div>
      <v-tabs v-model="tab" class="results-tabs mt-6" grow>
        <v-tab value="strafe">Ergebnisse</v-tab><v-tab value="dinge">Wer bekommt was</v-tab>
      </v-tabs>
      <v-window v-model="tab">
        <v-window-item value="strafe"><Playerlist /></v-window-item>
        <v-window-item value="dinge"><Dinge /></v-window-item>
      </v-window>
    </template>
    <v-dialog v-model="addingPlayers" max-width="650">
      <v-card><PlayerSelection adding :existing-names="spielerStore.spielerListe.map(player => player.name)" @confirm="addPlayers" />
        <v-card-actions><v-spacer /><v-btn @click="addingPlayers = false">Abbrechen</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
