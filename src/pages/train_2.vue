<template>
    <div>
        <h1>Zahlen Erkennung</h1>
        <div>
            <input type="file" @change="onFileSelected" />
            <img :src="imageUrl" v-if="imageUrl" />
            <button @click="predict">Vorhersagen</button>
            <div>{{ result }}</div>
        </div>
    </div>
</template>

<script setup>
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import {onMounted, ref} from 'vue';

const model = ref(null);
const imageUrl = ref(null);
const result = ref('');

async function initializeTF() {
    try {
        await tf.setBackend('cpu');
        await tf.ready();
        tf.enableDebugMode();
        console.log('TensorFlow.js initialized with backend:', tf.getBackend());
    } catch (error) {
        console.error('Error initializing TensorFlow.js:', error);
    }
}

async function loadModel() {
    try {
        model.value = await tf.loadLayersModel('/trained_model/model.json');
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
    }
}

onMounted(async () => {
    await initializeTF();
    await loadModel();
});

const onFileSelected = event => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            imageUrl.value = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const predict = async () => {
    if (!model.value) {
        console.error('Model is not loaded');
        return;
    }

    await initializeTF(); // Stellen Sie sicher, dass TF.js initialisiert ist

    const image = new Image();
    image.src = imageUrl.value;
    image.onload = async () => {
        try {
            const tensor = await tf.tidy(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 96;
                canvas.height = 96;
                ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);

                // Bild in Graustufen konvertieren
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const grayscaleData = new Uint8ClampedArray(canvas.width * canvas.height);

                for (let i = 0; i < imageData.data.length; i += 4) {
                    const gray = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
                    grayscaleData[i / 4] = gray;
                }

                return tf.tensor3d(grayscaleData, [96, 96, 1], 'float32').div(255).expandDims(0);
            });

            console.log('Tensor shape:', tensor.shape);

            await initializeTF(); // Erneut sicherstellen, dass das Backend verfügbar ist
            const predictions = await model.value.predict(tensor);
            const classIndex = predictions.argMax(1).dataSync()[0];
            result.value = `Vorhergesagte Ziffer: ${classIndex}`;

            tensor.dispose();
            predictions.dispose();
        } catch (error) {
            console.error('Fehler bei der Vorhersage:', error);
            result.value = 'Fehler bei der Vorhersage';
        }
    };
};
</script>
