<script setup>
import {useSpielerStore} from '@/store/spielerStore';

const spielerStore = useSpielerStore();
</script>

<template>
    <v-list lines="three" rounded border variant="elevated" class="pb-0 my-4 bg-green">
        <v-list-subheader color="white" class="text-h6">Wer muss was mitnehmen </v-list-subheader>

        <v-list-item :elevation="2" class="py-3">
            <v-list-item-title>Name</v-list-item-title>
            <v-list-item-subtitle> Anzal </v-list-item-subtitle>

            <template v-slot:append>
                <div class="d-flex flex-column ga-2">Spielername</div>
            </template>
        </v-list-item>
    </v-list>
</template>
