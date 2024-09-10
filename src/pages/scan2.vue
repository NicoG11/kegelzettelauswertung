<script setup>
import Tesseract from 'tesseract.js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import {ref, nextTick, onMounted} from 'vue';

const extractedImages = ref([]);
const extractedCanvasRefs = ref([]);
const userInputs = ref([]);
const loading = ref(false);

const model = ref(null);
const trainingData = ref([]);

// Funktion zum Erstellen des Modells
function createModel() {
    const model = tf.sequential();
    model.add(tf.layers.conv2d({inputShape: [28, 28, 1], filters: 32, kernelSize: 3, activation: 'relu'}));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.conv2d({filters: 64, kernelSize: 3, activation: 'relu'}));
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 64, activation: 'relu'}));
    model.add(tf.layers.dense({units: 10, activation: 'softmax'}));

    model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy', metrics: ['accuracy']});
    return model;
}

// Funktion zum Trainieren des Modells
async function trainModel() {
    if (trainingData.value.length === 0) {
        console.error('No training data available');
        return;
    }

    const xs = tf.stack(trainingData.value.map(d => d.image));
    const ys = tf.oneHot(
        trainingData.value.map(d => d.label),
        10
    );

    await model.value.fit(xs, ys, {
        epochs: 50,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
            },
        },
    });

    console.log('Model training complete');
}

onMounted(() => {
    model.value = createModel();
});

const handleFileUpload = event => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                processImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

// Die restlichen Funktionen (processImage, findColumnX, markRows, extractElement) bleiben unverändert
const processImage = async img => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const {
        data: {lines},
    } = await Tesseract.recognize(canvas, 'eng', {
        logger: m => (loading.value = m.status === 'recognizing text'),
    });

    const columnX = findColumnX(lines, 'H');
    if (columnX !== null) {
        markRows(ctx, lines, columnX);
    } else {
        alert("Column 'H' not found.");
    }
};

const findColumnX = (lines, columnName) => {
    for (const line of lines) {
        for (const word of line.words) {
            if (word.text.trim().toUpperCase() === columnName.toUpperCase()) {
                return word.bbox.x0;
            }
        }
    }
    return null;
};

const markRows = (ctx, lines, columnX) => {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;

    let startMarking = false;
    extractedImages.value = []; // Clear previous extracted images

    for (const line of lines) {
        for (const word of line.words) {
            if (/^\d{3}$/.test(word.text.trim()) && word.text.trim() !== '000' && word.text.trim() !== '800') {
                startMarking = true;
            }
            if (startMarking && word.bbox.x0 > columnX - 18 && word.bbox.x0 < columnX + 18) {
                const y = word.bbox.y0;
                const height = word.bbox.y1 - word.bbox.y0;
                console.log(columnX, word.bbox.x0, word.bbox.x1, y, height);
                // ctx.strokeRect(columnX - 15, y, 60, height);

                extractElement(ctx, columnX - 15, y, 60, height);
            }
            if (/^015$/.test(word.text.trim()) || /^030$/.test(word.text.trim()) || /^815$/.test(word.text.trim()) || /^830$/.test(word.text.trim())) {
                startMarking = false;
            }
        }
    }

    nextTick(() => {
        for (let i = 0; i < extractedImages.value.length; i++) {
            const canvasRef = extractedCanvasRefs.value[i];
            if (canvasRef) {
                const ctx = canvasRef.getContext('2d');
                const img = extractedImages.value[i];
                canvasRef.width = img.width;
                canvasRef.height = img.height;
                ctx.drawImage(img, 0, 0);

                // // Verwende das Modell, um die Zahlen zu erkennen
                // // recognizeNumber(canvasRef, i);
                // predictNumber(canvasRef, i);
            }
        }
    });
};

const extractElement = (ctx, x, y, width, height) => {
    const extractedCanvas = document.createElement('canvas');
    const extractedCtx = extractedCanvas.getContext('2d');
    extractedCanvas.width = width;
    extractedCanvas.height = height;
    extractedCtx.drawImage(ctx.canvas, x, y, width, height, 0, 0, width, height);
    extractedImages.value.push(extractedCanvas);
};

const addExtractedCanvasRef = (el, index) => {
    if (el) {
        extractedCanvasRefs.value[index] = el;
    }
};

const handleUserInput = (index, value) => {
    userInputs.value[index] = parseInt(value, 10);
};

const addToTrainingData = () => {
    extractedCanvasRefs.value.forEach((canvas, index) => {
        if (canvas && userInputs.value[index] !== undefined) {
            const ctx = canvas.getContext('2d');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const tensor = tf.browser.fromPixels(imageData, 1).resizeBilinear([28, 28]).toFloat().div(tf.scalar(255)).reshape([28, 28, 1]);

            trainingData.value.push({
                image: tensor,
                label: userInputs.value[index],
            });
        }
    });
    console.log(`Added ${extractedCanvasRefs.value.length} images to training data`);
};
</script>

<template>
    <div class="pa-4">
        <v-row class="pa-4">
            <v-col cols="12">
                <h4>Upload Image</h4>
                <input type="file" @change="handleFileUpload" />
            </v-col>
        </v-row>

        <v-row class="pa-4">
            <v-col cols="12" lg="6">
                <h4>Extracted Elements</h4>
                <v-progress-linear v-if="loading" indeterminate></v-progress-linear>
                <v-table>
                    <tbody>
                        <tr v-for="(extracted, index) in extractedImages" :key="index">
                            <td>{{ index + 1 }}</td>
                            <td>
                                <canvas :ref="el => addExtractedCanvasRef(el, index)" class="extracted-canvas"></canvas>
                            </td>
                            <td>
                                <v-text-field v-model="userInputs[index]" type="number" label="Enter number" @input="handleUserInput(index, $event.target.value)"></v-text-field>
                            </td>
                        </tr>
                    </tbody>
                </v-table>
            </v-col>
        </v-row>

        <v-row class="pa-4">
            <v-col cols="12">
                <v-btn @click="addToTrainingData">Add to Training Data</v-btn>
                <v-btn @click="trainModel" class="ml-4">Train Model</v-btn>
            </v-col>
        </v-row>
    </div>
</template>

<style lang="css" scoped>
canvas {
    border: 1px solid #000;
    max-width: 250px;
}
.extracted-canvas {
    margin-top: 10px;
    border: 1px solid #000;
}
.extractedImages {
    display: inline-block;
}
</style>
