<script setup>
import {useSpielerStore} from '@/store/spielerStore';

const spielerStore = useSpielerStore();

console.log(spielerStore.meiste9er);
</script>

<template>
    <v-list lines="two" rounded border variant="elevated" class="pb-0 my-4 bg-green">
        <v-list-subheader color="white" class="text-h6">Wer muss was mitnehmen </v-list-subheader>

        <v-list-item v-for="(ding, index) in spielerStore.dinge" :key="`${ding}${index}`" :elevation="2" class="py-3">
            <v-list-item-title class="d-flex justify-space-between">
                <div>
                    {{ spielerStore[ding].tier }}
                </div>
                <div class="text-right mr-12 text-subtitle-2">{{ spielerStore[ding].number }}</div>
            </v-list-item-title>
            <v-list-item-subtitle>{{ spielerStore[ding].title }}</v-list-item-subtitle>

            <template v-slot:append>
                <div class="text-subtitle-2 text-right" :style="{'min-width': '50px'}">{{ spielerStore[ding].number > 0 ? spielerStore[ding].player?.name : '-' }}</div>
            </template>
        </v-list-item>
    </v-list>
</template>
