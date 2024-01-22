<template>
    <v-app>
        <v-main>
            <v-app-bar :elevation="2" color="green">
                <template v-slot:title>
                    <h3 class="text-center text-green-lighten-5">Kegelzettel Auswerter</h3>
                </template>
                <template v-slot:append>
                    <v-btn icon="mdi-dots-vertical" color="green-lighten-5"></v-btn>
                </template>
            </v-app-bar>
            <div class="bg-green-lighten-5">
                <router-view />
            </div>
        </v-main>
    </v-app>
</template>

<script setup>
//
</script>
