<script setup>
import { useSpielerStore } from '@/stores/spielerStore';
const store = useSpielerStore();
</script>

<template>
  <div class="autosave-control">
    <v-checkbox v-model="store.autoSaveEnabled" label="Automatisch speichern" density="compact" hide-details />
    <p v-if="store.autoSaveStatus" role="status" class="autosave-status muted">{{ store.autoSaveStatus }}</p>
  </div>
</template>
