<script setup>
import { computed } from 'vue';
import { useSpielerStore } from '@/stores/spielerStore';
const store = useSpielerStore();
const awards = computed(() => store.dinge.map(key => {
  const result = store[key]();
  return { ...result, playerName: result?.number > 0 ? result.player?.name : 'Noch offen' };
}));
</script>
<template>
  <div class="award-grid">
    <v-card v-for="award in awards" :key="award.title" class="award-card">
      <v-icon icon="mdi-trophy-outline" color="primary" />
      <p class="eyebrow mt-3">{{ award.title }}</p><h3 class="mt-2">{{ award.tier }}</h3>
      <p class="mt-3">{{ award.playerName }}</p><p class="muted text-body-small mt-1">{{ award.sum || award.number || 0 }}</p>
    </v-card>
  </div>
</template>
