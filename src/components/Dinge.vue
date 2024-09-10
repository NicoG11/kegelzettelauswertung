<script setup>
import {useSpielerStore} from '@/stores/spielerStore';

const spielerStore = useSpielerStore();

// Eine computed Property für alle `dinge`
const computedDinge = computed(() => {
    return spielerStore.dinge.map(ding => {
        return {
            tier: spielerStore[ding]()?.tier,
            sum: spielerStore[ding]()?.sum || spielerStore[ding]()?.number,
            title: spielerStore[ding]()?.title,
            playerName: spielerStore[ding]()?.number > 0 ? spielerStore[ding]().player?.name : '-',
        };
    });
});
</script>

<template>
    <v-list lines="two" rounded variant="elevated" class="pb-0 my-4 bg-green align-start">
        <v-list-subheader color="white" class="text-h6">Wer muss was mitnehmen </v-list-subheader>

        <v-list-item v-for="(ding, index) in computedDinge" :key="`${ding}${index}`" :elevation="2" class="py-3">
            <v-list-item-title class="d-flex justify-space-between">
                <div>
                    {{ ding?.tier }}
                </div>
                <div class="text-right mr-12 text-subtitle-2">{{ ding?.sum }}</div>
            </v-list-item-title>

            <v-list-item-subtitle>{{ ding?.title }}</v-list-item-subtitle>

            <template v-slot:append>
                <div class="text-subtitle-2 text-right" :style="{'min-width': '50px'}">{{ ding?.playerName }}</div>
            </template>
        </v-list-item>
    </v-list>
</template>
