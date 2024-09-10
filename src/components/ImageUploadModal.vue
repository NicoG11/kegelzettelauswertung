<script setup>
import {ref, onMounted, watch, nextTick} from 'vue';
import Tesseract from 'tesseract.js';

const props = defineProps({
    modelValue: Boolean,
    lane: Number,
});

const emit = defineEmits(['update:modelValue', 'numbersExtracted']);

const extractProgress = ref(0);
const dialogVisible = ref(props.modelValue);
const lane = ref(props.lane);
const canvas = ref(null);
const ctx = ref(null);
const canvasImage = ref(null);
const selection = ref(null);

const useGrayscale = ref(false);
const scaleFactor = ref(4);

watch(
    () => props.modelValue,
    newValue => {
        dialogVisible.value = newValue;
    }
);

watch(
    () => props.lane,
    newValue => {
        lane.value = newValue;
    }
);

watch(dialogVisible, newValue => {
    if (newValue) {
        nextTick(() => {
            if (canvas.value) {
                ctx.value = canvas.value.getContext('2d');
            }
        });
    }
});

const MAX_WIDTH = 360; // Maximale Breite
const MAX_HEIGHT = 580; // Maximale Höhe

// onMounted(() => {
//     if (canvas.value) {
//         canvas.value.width = MAX_HEIGHT;
//         canvas.value.height = MAX_HEIGHT;
//         ctx.value = canvas.value.getContext('2d');
//     }
// });

const uploadImage = event => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Berechnen der neuen Größe
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                // Berechnen des Seitenverhältnisses des Bildes
                const ratio = width / height;

                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width / height > MAX_WIDTH / MAX_HEIGHT) {
                        // Breite ist der begrenzende Faktor
                        height = Math.round(MAX_WIDTH / ratio);
                        width = MAX_WIDTH;
                    } else {
                        // Höhe ist der begrenzende Faktor
                        width = Math.round(MAX_HEIGHT * ratio);
                        height = MAX_HEIGHT;
                    }
                }

                if (canvas.value && ctx.value) {
                    canvas.value.width = width;
                    canvas.value.height = height;
                    ctx.value.drawImage(img, 0, 0, width, height);
                    // convertToGrayscale(canvas.value);

                    canvas.value.onmousedown = event => startSelection(event);
                    canvas.value.onmousemove = event => drawSelection(event);
                    canvas.value.onmouseup = event => endSelection(event);
                    canvas.value.ontouchstart = event => startSelection(event);
                    canvas.value.ontouchmove = event => drawSelection(event);
                    canvas.value.ontouchend = event => endSelection(event);

                    canvasImage.value = new Image();
                    canvasImage.value.src = canvas.value.toDataURL('image/png');
                } else {
                    console.error('Canvas oder Kontext ist nicht verfügbar');
                }
            };
            img.onerror = () => {
                console.error('Fehler beim Laden des Bildes');
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            console.error('Fehler beim Lesen der Datei');
        };
        reader.readAsDataURL(file);
    }
};

const startSelection = event => {
    if (!canvas.value || !ctx.value) return;
    event.preventDefault();
    if (selection.value?.isDrawing) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const rect = canvas.value.getBoundingClientRect();
    selection.value = {
        x1: clientX - rect.left,
        y1: clientY - rect.top,
        x2: clientX - rect.left,
        y2: clientY - rect.top,
        isDrawing: true,
    };
};

const drawSelection = event => {
    if (!canvas.value || !ctx.value || !selection.value || !selection.value.isDrawing) return;
    event.preventDefault();

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const rect = canvas.value.getBoundingClientRect();
    selection.value.x2 = clientX - rect.left;
    selection.value.y2 = clientY - rect.top;

    // Zeichnen Sie die Auswahl
    ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height);
    if (canvasImage.value) {
        ctx.value.drawImage(canvasImage.value, 0, 0);
    }

    ctx.value.beginPath();
    ctx.value.strokeStyle = 'red';
    ctx.value.rect(selection.value.x1, selection.value.y1, selection.value.x2 - selection.value.x1, selection.value.y2 - selection.value.y1);
    ctx.value.stroke();
};

const endSelection = event => {
    if (!canvas.value || !ctx.value || !selection.value) return;
    event.preventDefault();

    if (selection.value.isDrawing) {
        const originalCanvas = canvas.value;

        // Überprüfen Sie, ob die Auswahl gültige Dimensionen hat
        const width = Math.abs(selection.value.x2 - selection.value.x1);
        const height = Math.abs(selection.value.y2 - selection.value.y1);

        // Erstellen eines neuen Canvas-Elements
        const newCanvas = document.createElement('canvas');
        newCanvas.width = width;
        newCanvas.height = height;
        const newContext = newCanvas.getContext('2d');

        // Kopieren des ausgewählten Bereichs in das neue Canvas
        newContext.drawImage(originalCanvas, selection.value.x1, selection.value.y1, width, height, 0, 0, width, height);

        // Ersetzen des originalen Canvas durch das neue Canvas
        canvas.value.replaceWith(newCanvas);
        canvas.value = newCanvas;

        selection.value.isDrawing = false;
    }
};

const extractNumbers = async () => {
    if (!canvas.value) return;
    try {
        let processedCanvas = canvas.value;
        processedCanvas = preprocessImage(processedCanvas);

        const {
            data: {lines},
        } = await Tesseract.recognize(processedCanvas, 'eng', {
            logger: m => {
                if (m.progress) {
                    extractProgress.value = Math.round(m.progress * 100);
                }
            },
            tessedit_char_whitelist: '0123456789',
        });

        console.log({lines});

        // Filtern Sie leere Zeilen und extrahieren Sie nur die Zahlen

        // emit('numbersExtracted', {text: lines, lane: lane.value});
        // closeDialog();
        extractProgress.value = 0;
    } catch (error) {
        console.error('Fehler bei der Texterkennung:', error);
    }
};

const closeDialog = () => {
    extractProgress.value = 0;

    dialogVisible.value = false;
    emit('update:modelValue', false);
};

const preprocessImage = canvas => {
    const ctx = canvas.getContext('2d');
    ctx.filter = 'contrast(120%)';
    ctx.drawImage(canvas, 0, 0);

    // ctx.filter = 'invert(1)';
    // ctx.drawImage(canvas, 0, 0);

    return canvas;
};
</script>

<template>
    <v-dialog v-model="dialogVisible" scrollable max-width="800px">
        <v-card>
            <v-card-title>Bahn {{ lane }} - Zettelupload</v-card-title>
            <v-card-text>
                <v-file-input label="Bild auswählen" accept="image/*" @change="uploadImage"></v-file-input>
                <v-divider />

                <canvas ref="canvas" @mousedown="startSelection" @mousemove="drawSelection" @mouseup="endSelection" @touchstart="startSelection" @touchmove="drawSelection" @touchend="endSelection"></canvas>
            </v-card-text>
            <v-progress-linear v-model="extractProgress"></v-progress-linear>
            <v-card-actions class="border-t">
                <v-btn @click="extractNumbers" :disabled="!canvasImage">Zahlen extrahieren</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog">Schließen</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
