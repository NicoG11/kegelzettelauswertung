<script setup>
import Tesseract from 'tesseract.js';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import {ref, nextTick, watch, onMounted} from 'vue';

async function initTensorFlow() {
    await tf.ready();
    if (tf.getBackend() !== 'webgl') {
        try {
            await tf.setBackend('webgl');
        } catch (e) {
            console.error('Failed to set backend to WebGL:', e);
            console.log('Available backends:', tf.engine().registryFactory.getKeys());
        }
    }
    console.log('TensorFlow.js initialized with backend:', tf.getBackend());
    console.log('TensorFlow.js version:', tf.version.tfjs);
}

const extractedImages = ref([]);
const extractedCanvasRefs = ref([]);
const numbers = ref([]);
const loading = ref(false);

const model = ref(null);

function createModel() {
    const model = tf.sequential();

    model.add(
        tf.layers.conv2d({
            inputShape: [28, 28, 1],
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            kernelInitializer: 'glorotUniform',
            biasInitializer: 'zeros',
        })
    );
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));

    model.add(
        tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            kernelInitializer: 'glorotUniform',
            biasInitializer: 'zeros',
        })
    );
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));

    model.add(
        tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            kernelInitializer: 'glorotUniform',
            biasInitializer: 'zeros',
        })
    );
    model.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));

    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 128, activation: 'relu', kernelInitializer: 'glorotUniform', biasInitializer: 'zeros'}));
    model.add(tf.layers.dense({units: 10, activation: 'softmax', kernelInitializer: 'glorotUniform', biasInitializer: 'zeros'}));

    return model;
}
async function loadModelWeights(jsonUrl) {
    const response = await fetch(jsonUrl);
    const modelJSON = await response.json();

    if (!modelJSON.weightsManifest || !Array.isArray(modelJSON.weightsManifest)) {
        throw new Error('Invalid weights manifest');
    }

    const weightManifest = modelJSON.weightsManifest[0];
    const modelDir = jsonUrl.substring(0, jsonUrl.lastIndexOf('/') + 1);

    const weightDataResponse = await fetch(modelDir + weightManifest.paths[0]);
    const weightData = new Float32Array(await weightDataResponse.arrayBuffer());

    return {weightSpecs: weightManifest.weights, weightData};
}

async function testModel(model) {
    try {
        console.log('Starting testModel');

        const testInput = tf.randomNormal([1, 28, 28, 1]);
        console.log('Test input created:', testInput.shape);

        if (!model) {
            console.error('Model not loaded');
            return;
        }

        console.log('Model layers:', model.layers.length);

        let layerInput = testInput;
        for (let i = 0; i < model.layers.length; i++) {
            const layer = model.layers[i];
            console.log(`Testing layer ${i}: ${layer.name}`);
            try {
                layerInput = layer.apply(layerInput);
                console.log(`Layer ${i} output shape:`, layerInput.shape);
            } catch (error) {
                console.error(`Error in layer ${i} (${layer.name}):`, error);
                break;
            }
        }

        console.log('All layers tested individually');

        try {
            const prediction = model.predict(testInput);
            console.log('Full model prediction made successfully');
            console.log('Prediction shape:', prediction.shape);
            const predictionArray = Array.from(prediction.dataSync());
            console.log('Prediction:', predictionArray);
            tf.dispose([testInput, prediction]);
        } catch (error) {
            console.error('Error during full model prediction:', error);
        }
    } catch (error) {
        console.error('Error in testModel:', error);
    }
}

onMounted(async () => {
    try {
        loading.value = true;
        await initTensorFlow();

        const emptyModel = createModel();
        console.log('Empty model created successfully');
        await testModel(emptyModel); // Test the empty model first

        console.log('Model summary:', emptyModel.summary());

        const {weightSpecs, weightData} = await loadModelWeights('/v3/model.json');
        console.log('Weight specs and data loaded successfully');
        console.log('Weight specs:', weightSpecs);

        let offset = 0;
        const weights = [];
        for (const spec of weightSpecs) {
            const size = spec.shape.reduce((a, b) => a * b);
            const values = weightData.slice(offset, offset + size);
            const tensor = tf.tensor(values, spec.shape, spec.dtype);
            weights.push(tensor);
            offset += size;
        }

        console.log('Weights created successfully');
        console.log('Total weights:', weights.length);
        console.log('Model layers:', emptyModel.layers.length);

        for (let i = 0; i < emptyModel.layers.length; i++) {
            const layer = emptyModel.layers[i];
            console.log(`Layer ${i} (${layer.name}): ${layer.getWeights().length} weights`);
        }

        // Setze die Gewichte für jede Schicht
        let weightIndex = 0;
        for (let i = 0; i < emptyModel.layers.length; i++) {
            const layer = emptyModel.layers[i];
            const numWeights = layer.getWeights().length;
            if (numWeights > 0) {
                const layerWeights = weights.slice(weightIndex, weightIndex + numWeights);
                layer.setWeights(layerWeights);
                weightIndex += numWeights;
                console.log(`Set weights for layer ${i} (${layer.name})`);
            }
        }

        model.value = emptyModel;
        console.log('Model loaded and weights set successfully');
        loading.value = false;
        // Rufen Sie diese Funktion am Ende von onMounted auf
        await testModel(model.value);
    } catch (error) {
        console.error('Error loading model:', error);
        loading.value = false;
    }
});

// Funktion zum Vorhersagen der Zahl
async function predictNumber(imageData, index) {
    if (!model.value) {
        console.error('Model not loaded');
        return null;
    }

    // Bereiten Sie die Bilddaten für das Modell vor
    let tensor = tf.browser
        .fromPixels(imageData, 1) // Konvertiere zu Graustufen
        .resizeBilinear([28, 28]) // Größe anpassen
        .toFloat()
        .div(tf.scalar(255)) // Normalisieren
        .expandDims(0); // Batch-Dimension hinzufügen

    // Machen Sie eine Vorhersage
    const prediction = model.value.predict(tensor);
    const result = prediction.argMax(1).dataSync()[0];
    console.log(result);
    numbers.value[index] = result;

    return result;
}

// Ihre bestehenden Funktionen hier...

// Beispiel für die Verwendung der predictNumber-Funktion
// watch(extractedCanvasRefs, async () => {
//     if (extractedCanvasRefs.value.length > 0) {
//         for (let i = 0; i < extractedCanvasRefs.value.length; i++) {
//             const canvas = extractedCanvasRefs.value[i];
//             if (canvas) {
//                 const ctx = canvas.getContext('2d');
//                 const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//                 const predictedNumber = await predictNumber(imageData);
//                 console.log(`Recognized number for image ${i}: ${predictedNumber}`);
//                 numbers.value[i] = predictedNumber;
//             }
//         }
//     }
// });

// onMounted(async () => {
//     // Lade das Modell beim Laden der Komponente
//     model.value = await tf.loadLayersModel('/v3/model.json');
// });

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
                console.log('found', word.text);
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

                // Verwende das Modell, um die Zahlen zu erkennen
                // recognizeNumber(canvasRef, i);
                predictNumber(canvasRef, i);
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

// const recognizeNumber = async (canvas, index) => {
//     const img = tf.browser.fromPixels(canvas, 1);
//     const resized = tf.image.resizeBilinear(img, [28, 28]);
//     const normalized = resized.div(255.0).expandDims(0);

//     if (model.value) {
//         const prediction = model.value.predict(normalized);
//         const predictedValue = prediction.argMax(1).dataSync()[0];
//         console.log(`Recognized number for image ${index}: ${predictedValue}`);
//         numbers.value[index] = predictedValue;
//     }
// };

watch(extractedImages, () => {
    // change loading state
    loading.value = extractedImages.value.length > 0 ? false : true;
});
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
                            <td>{{ numbers[index] }}</td>
                        </tr>
                    </tbody>
                </v-table>
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
