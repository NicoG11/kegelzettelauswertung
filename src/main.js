/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import {registerPlugins} from '@/plugins';

// Components
import App from './App.vue';

// Composables
import {createApp} from 'vue';

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

async function init() {
    await tf.ready();
    await tf.setBackend('webgl');
    console.log('TensorFlow.js initialized with backend:', tf.getBackend());

    const app = createApp(App);
    registerPlugins(app);
    app.mount('#app');
}

init();

// const app = createApp(App);
// registerPlugins(app);
// app.mount('#app');
