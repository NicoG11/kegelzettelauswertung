<template>
    <v-container>
        <v-row>
            <v-col cols="12" md="6">
                <v-file-input multiple accept="image/*" label="Bilder hochladen" @update:model-value="onFilesSelected"></v-file-input>
            </v-col>
        </v-row>
        <v-row>
            <v-col v-for="(file, index) in selectedFiles" :key="index" cols="4" md="3">
                <v-img :src="getFileUrl(file)" max-height="150" contain></v-img>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field v-model="label" label="Nummer für alle Bilder" type="number"></v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-btn @click="addSelectedToTrainingData" :disabled="!selectedFiles.length || label === null"> Zum Trainingsdatensatz hinzufügen </v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-btn @click="trainModel" :disabled="trainingData.length === 0"> Modell trainieren </v-btn>
            </v-col>
        </v-row>
        <v-row v-if="errorMessage">
            <v-col cols="12">
                <v-alert type="error">{{ errorMessage }}</v-alert>
            </v-col>
        </v-row>

        <v-row>
            <v-col cols="12">
                <h2>Modell testen</h2>
            </v-col>
        </v-row>
        <v-file-input accept="image/*" label="Testbild hochladen" @change="onTestImageSelected"></v-file-input>

        <v-img v-if="testImageUrl" :src="testImageUrl" max-height="200" contain></v-img>

        <v-btn @click="testModel" :disabled="!testImage">Bild testen</v-btn>

        <p v-if="prediction">{{ prediction }}</p>
    </v-container>
</template>

<script setup>
import {ref, onMounted} from 'vue';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';

const testImage = ref(null);
const testImageUrl = ref(null);
const prediction = ref(null);

const model = ref(null);

const IMAGE_WIDTH = 28;
const IMAGE_HEIGHT = 28;
const NUM_CLASSES = 10;

const label = ref(null);
const selectedFiles = ref([]);
const trainingData = ref([]);
const errorMessage = ref('');
const isTraining = ref(false);
const isTfInitialized = ref(false);

// const loadModel = async () => {
//     try {
//         model.value = await tf.loadLayersModel('localstorage://my-model');
//         console.log('Modell erfolgreich geladen');
//     } catch (error) {
//         console.error('Fehler beim Laden des Modells:', error);
//     }
// };

const ensureBackend = async () => {
    await tf.ready();
    if (tf.getBackend() !== 'webgl') {
        try {
            await tf.setBackend('webgl');
            console.log('Switched to WebGL backend');
        } catch (error) {
            console.error('Failed to set WebGL backend:', error);
            // Fallback to CPU if WebGL is not available
            await tf.setBackend('cpu');
            console.log('Fallback to CPU backend');
        }
    }
    if (!tf.getBackend()) {
        throw new Error('No backend available');
    }
    console.log('Current backend:', tf.getBackend());
};

const loadSavedModel = async () => {
    try {
        const loadedModel = await tf.loadLayersModel('localstorage://my-model');
        console.log('Saved model loaded successfully');
        return loadedModel;
    } catch (error) {
        console.error('Failed to load saved model:', error);
        return null;
    }
};

onMounted(async () => {
    try {
        await tf.setBackend('webgl');
        await tf.ready();

        console.log('TensorFlow.js initialized with backend:', tf.getBackend());

        // Versuchen Sie, das gespeicherte Modell zu laden
        const savedModel = await loadSavedModel();
        if (savedModel) {
            model.value = savedModel;
            // Kompilieren Sie das geladene Modell erneut
            const optimizer = tf.train.adam();
            model.value.compile({
                optimizer: optimizer,
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy'],
            });
            console.log('Saved model loaded and compiled');
        } else {
            // Wenn kein gespeichertes Modell verfügbar ist, erstellen Sie ein neues
            model.value = createModel();
            console.log('New model created');
        }

        isTfInitialized.value = true;
    } catch (error) {
        console.error('Failed to initialize TensorFlow.js:', error);
        errorMessage.value = `Failed to initialize TensorFlow.js: ${error.message}`;
    }
});

const getFileUrl = file => {
    return file instanceof File ? URL.createObjectURL(file) : '';
};

const onFilesSelected = files => {
    selectedFiles.value = files || [];
};

const createModel = () => {
    const model = tf.sequential();

    model.add(
        tf.layers.conv2d({
            inputShape: [IMAGE_WIDTH, IMAGE_HEIGHT, 1],
            kernelSize: 5,
            filters: 8,
            strides: 1,
            activation: 'relu',
            kernelInitializer: 'varianceScaling',
        })
    );

    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

    model.add(
        tf.layers.conv2d({
            kernelSize: 5,
            filters: 16,
            strides: 1,
            activation: 'relu',
            kernelInitializer: 'varianceScaling',
        })
    );

    model.add(tf.layers.maxPooling2d({poolSize: [2, 2], strides: [2, 2]}));

    model.add(tf.layers.flatten());

    model.add(
        tf.layers.dense({
            units: NUM_CLASSES,
            kernelInitializer: 'varianceScaling',
            activation: 'softmax',
        })
    );

    const optimizer = tf.train.adam();
    model.compile({
        optimizer: optimizer,
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });

    return model;
};

const addSelectedToTrainingData = async () => {
    if (!selectedFiles.value || selectedFiles.value.length === 0) {
        errorMessage.value = 'Please select images first.';
        return;
    }
    if (label.value === null || isNaN(label.value)) {
        errorMessage.value = 'Please enter a valid number for the label.';
        return;
    }

    try {
        for (let file of selectedFiles.value) {
            if (file instanceof File) {
                trainingData.value.push({
                    image: file, // Store the File object directly
                    label: Number(label.value),
                });
            }
        }
        console.log(`Training dataset: ${trainingData.value.length} images`);
        console.log('Sample training data:', trainingData.value[trainingData.value.length - 1]);
        selectedFiles.value = [];
        label.value = null;
        errorMessage.value = '';
    } catch (error) {
        console.error('Failed to process images:', error);
        errorMessage.value = `Failed to process images: ${error.message}`;
    }
};

const trainModel = async () => {
    if (!isTfInitialized.value || trainingData.value.length === 0) {
        errorMessage.value = 'TensorFlow.js is not initialized or no training data available.';
        return;
    }

    isTraining.value = true;
    errorMessage.value = '';

    try {
        await tf.ready();
        await tf.setBackend('webgl');
        console.log('Using backend:', tf.getBackend());

        if (!model.value) {
            model.value = createModel();
        } else {
            const optimizer = tf.train.adam();
            model.value.compile({
                optimizer: optimizer,
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy'],
            });
        }

        const dataArray = [...trainingData.value];
        console.log('Data array length:', dataArray.length);

        const imageTensors = [];
        const labels = [];

        for (let i = 0; i < dataArray.length; i++) {
            const data = dataArray[i];
            const imageTensor = await tf.browser
                .fromPixels(await createImageBitmap(data.image), 1)
                .resizeBilinear([IMAGE_WIDTH, IMAGE_HEIGHT])
                .toFloat()
                .div(tf.scalar(255));

            imageTensors.push(imageTensor);
            labels.push(data.label);

            console.log(`Processed image ${i + 1}/${dataArray.length}`);
            await tf.nextFrame();
        }

        const xs = tf.stack(imageTensors);
        const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), NUM_CLASSES);

        console.log('xs shape:', xs.shape);
        console.log('ys shape:', ys.shape);

        const BATCH_SIZE = 32;
        const TRAIN_DATA_SIZE = xs.shape[0];
        const TEST_DATA_SIZE = Math.floor(TRAIN_DATA_SIZE / 5);

        const [trainXs, testXs] = tf.split(xs, [TRAIN_DATA_SIZE - TEST_DATA_SIZE, TEST_DATA_SIZE]);
        const [trainYs, testYs] = tf.split(ys, [TRAIN_DATA_SIZE - TEST_DATA_SIZE, TEST_DATA_SIZE]);

        await model.value.fit(trainXs, trainYs, {
            batchSize: BATCH_SIZE,
            validationData: [testXs, testYs],
            epochs: 20,
            callbacks: {
                onEpochBegin: async epoch => {
                    console.log(`Epoch ${epoch + 1} starting...`);
                },
                onBatchEnd: async (batch, logs) => {
                    console.log(`Batch ${batch + 1}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                    await tf.nextFrame();
                },
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1} finished: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`);
                },
            },
        });

        console.log('Training completed');

        const testResult = model.value.evaluate(testXs, testYs);
        console.log(`Test loss: ${testResult[0].dataSync()[0].toFixed(4)}`);
        console.log(`Test accuracy: ${testResult[1].dataSync()[0].toFixed(4)}`);

        await model.value.save('localstorage://my-model');
        console.log('Model saved');

        // Dispose tensors
        xs.dispose();
        ys.dispose();
        trainXs.dispose();
        trainYs.dispose();
        testXs.dispose();
        testYs.dispose();
        imageTensors.forEach(tensor => tensor.dispose());
    } catch (error) {
        console.error('Failed to train the model:', error);
        errorMessage.value = `Failed to train the model: ${error.message}`;
    } finally {
        isTraining.value = false;
        tf.disposeVariables();
    }
};

const onTestImageSelected = event => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
        testImage.value = file;
        testImageUrl.value = URL.createObjectURL(file);
    } else {
        testImage.value = null;
        testImageUrl.value = null;
    }
};

const testModel = async () => {
    if (!testImage.value) {
        console.error('Kein Testbild ausgewählt');
        return;
    }

    try {
        // Stelle sicher, dass TensorFlow.js initialisiert ist und das Backend gesetzt ist
        await tf.ready();
        await tf.setBackend('webgl');
        console.log('Using backend for testing:', tf.getBackend());

        const img = await createImageBitmap(testImage.value);

        const tensor = tf.tidy(() => {
            return tf.browser.fromPixels(img).resizeBilinear([IMAGE_WIDTH, IMAGE_HEIGHT]).mean(2).expandDims(2).expandDims().toFloat().div(255.0);
        });

        // Überprüfe, ob das Modell geladen ist
        if (!model.value) {
            throw new Error('Model is not loaded');
        }

        const predictions = await model.value.predict(tensor).data();
        const maxPrediction = Math.max(...predictions);
        const predictedClass = predictions.indexOf(maxPrediction);

        prediction.value = `Die erkannte Zahl ist ${predictedClass} mit einer Wahrscheinlichkeit von ${(maxPrediction * 100).toFixed(2)}%`;

        tensor.dispose();
    } catch (error) {
        console.error('Fehler beim Testen des Modells:', error);
        prediction.value = `Fehler bei der Vorhersage: ${error.message}`;
    }
};
</script>

<style scoped>
.v-container {
    max-width: 800px;
    margin: 0 auto;
}
</style>
