<template>
    <v-app>
        <v-main>
            <v-app-bar color="green" flat>
                <template v-slot:title>
                    <h3 class="text-center text-green-lighten-5">Kegelzettel Auswerter</h3>
                </template>
                <!-- <template v-slot:append>
                    <v-menu>
                        <template v-slot:activator="{props}">
                            <v-btn icon="mdi-dots-vertical" color="green-lighten-5" v-bind="props"></v-btn>
                        </template>

                        <v-list>
                            <v-list-item v-for="(item, i) in menu" :key="i">
                                <v-list-item-title @click="navigateTo(item.link)">{{ item.title }}</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template> -->
            </v-app-bar>
            <div class="bg-green-lighten-5">
                <router-view />
            </div>
        </v-main>
    </v-app>
</template>

<script setup>
import {useRouter} from 'vue-router';

const router = useRouter();

function navigateTo(link) {
    router.push({path: link});
}

const menu = [
    {title: 'Changelog', link: 'changelog'},
    {title: 'Impressum', link: 'impressum'},
];
</script>
