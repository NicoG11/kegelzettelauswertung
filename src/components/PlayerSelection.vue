<script setup>
import { computed, ref } from 'vue';
import { readPlayerNames, rememberPlayerNames, normalizePlayerName } from '@/services/playerCatalog';
const props = defineProps({ existingNames: { type: Array, default: () => [] }, adding: Boolean, canConfirm: { type: Boolean, default: true } });
const emit = defineEmits(['confirm']);
const names = ref(readPlayerNames());
const selected = ref([]);
const search = ref('');
const newName = ref('');
const message = ref('');
const availableNames = computed(() => names.value.filter(name =>
  !props.existingNames.some(existing => existing.toLocaleLowerCase('de') === name.toLocaleLowerCase('de'))));
const visibleNames = computed(() => availableNames.value.filter(name =>
  name.toLocaleLowerCase('de').includes(search.value.trim().toLocaleLowerCase('de'))));
function addName() {
  const clean = normalizePlayerName(newName.value);
  if (!clean) { message.value = 'Bitte einen Namen eingeben.'; return; }
  const existing = names.value.find(name => name.toLocaleLowerCase('de') === clean.toLocaleLowerCase('de'));
  const name = existing || clean;
  if (props.existingNames.some(value => value.toLocaleLowerCase('de') === name.toLocaleLowerCase('de'))) {
    message.value = 'Dieser Spieler nimmt bereits teil.'; return;
  }
  try { names.value = rememberPlayerNames([name]); }
  catch { message.value = 'Die Namensliste konnte nicht gespeichert werden.'; return; }
  if (!selected.value.includes(name)) selected.value.push(name);
  newName.value = '';
  search.value = '';
  message.value = existing ? 'Name ist bereits in der Liste und jetzt ausgewählt.' : '';
}
function confirm() {
  if (props.canConfirm && selected.value.length) emit('confirm', [...selected.value]);
}
</script>

<template>
  <section class="selection-panel">
    <div class="section-heading">
      <div>
        <h2>{{ adding ? 'Spieler hinzufügen' : 'Spieler auswählen' }}</h2>
      </div>
      <v-icon icon="mdi-account-group-outline" size="32" color="primary" />
    </div>
    <v-text-field v-model="search" label="Spieler suchen" prepend-inner-icon="mdi-magnify" hide-details class="mt-6 mb-3" />
    <div class="d-flex flex-wrap align-center justify-space-between mb-2 ga-2">
      <span class="muted text-body-small">{{ selected.length }} ausgewählt</span>
      <div class="d-flex ga-1">
        <v-btn size="small" variant="text" @click="selected = [...availableNames]">Alle auswählen</v-btn>
        <v-btn size="small" variant="text" :disabled="!selected.length" @click="selected = []">Auswahl leeren</v-btn>
      </div>
    </div>
    <div class="name-grid">
      <v-checkbox v-for="name in visibleNames" :key="name" v-model="selected" :label="name" :value="name" class="name-option" />
    </div>
    <p v-if="!visibleNames.length" class="muted py-4">Keine weiteren passenden Spieler. Du kannst unten einen neuen Namen hinzufügen.</p>
    <div v-if="selected.length" class="d-flex flex-wrap ga-2 mt-4" aria-label="Ausgewählte Spieler">
      <v-chip v-for="name in selected" :key="name" color="primary" closable
        @click:close="selected = selected.filter(value => value !== name)">{{ name }}</v-chip>
    </div>
    <v-divider class="my-5" />
    <form class="add-name-form" @submit.prevent="addName">
      <v-text-field v-model="newName" label="Neuer Spielername" maxlength="80" hide-details />
      <v-btn type="submit" variant="tonal" color="primary" height="52" prepend-icon="mdi-account-plus-outline">Hinzufügen</v-btn>
    </form>
    <p v-if="message" role="status" class="muted mt-2">{{ message }}</p>
    <p class="muted text-body-small mt-3">Neue Namen bleiben für kommende Spieltage in deiner Liste gespeichert.</p>
    <v-btn block color="primary" size="large" class="mt-6" :disabled="!selected.length || !canConfirm" @click="confirm"
      append-icon="mdi-arrow-right">{{ adding ? 'Ausgewählte Spieler hinzufügen' : 'Spieltag starten' }}</v-btn>
  </section>
</template>
