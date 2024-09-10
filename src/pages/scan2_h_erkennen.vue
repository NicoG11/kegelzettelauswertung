<script setup>
import {wurfBildRegEx} from '@/services/utils';
import Tesseract from 'tesseract.js';

import {ref, nextTick, watch} from 'vue';

const extractProgress = ref(0);
const canvasRef = ref(null);
const originalImage = ref(null); // Neue ref für das Originalbild

const extractedImages = ref([]);
const extractedCanvasRefs = ref([]);
const numbers = ref([]);
const loading = ref(false);

const handleFileUpload = event => {
    loading.value = true;
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                originalImage.value = img;
                processImage(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const processImage = async img => {
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.filter = 'threshold(0.5)';
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'contrast(150%)';
    ctx.drawImage(img, 0, 0);
    const scaleFactor = 2; // Anpassen nach Bedarf
    canvas.width = img.width * scaleFactor;
    canvas.height = img.height * scaleFactor;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const {
        data: {lines},
    } = await Tesseract.recognize(canvas, 'eng', {
        logger: m => {
            if (m.progress && m.status === 'recognizing text') {
                const value = Math.round(m.progress * 100);
                extractProgress.value = value;
            }
        },
    });

    console.log({lines});

    const columnX = findColumnX(lines);
    if (columnX !== null) {
        markRows(ctx, lines, columnX);
    } else {
        alert("Column 'H' not found.");
    }
};

const findColumnX = (lines, columnName = ['H']) => {
    for (const line of lines) {
        for (const word of line.words) {
            const search = word.text.trim().toUpperCase();
            if (columnName.includes(search)) {
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
            if (
                /^\d{3}$/.test(word.text.trim()) &&
                word.text.trim() !== '000' &&
                word.text.trim() !== '800' &&
                word.text.trim() !== 'bb0' &&
                word.text.trim() !== 'BB0' &&
                word.text.trim() !== 'bB0' &&
                word.text.trim() !== 'Bb0' &&
                word.text.trim() !== 'B00' &&
                word.text.trim() !== 'b00'
            ) {
                startMarking = true;
            }
            if (startMarking && word.bbox.x0 > columnX - 20 && word.bbox.x0 < columnX + 20) {
                const y = word.bbox.y0;
                const height = word.bbox.y1 - word.bbox.y0;
                // ctx.strokeRect(columnX - 15, y, 60, height);
                extractElement(ctx, columnX - 15, y, 60, height, line.text);
            } else {
                console.log(word.text.trim());
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
                const img = extractedImages.value[i].canvas;
                canvasRef.width = img.width;
                canvasRef.height = img.height;
                ctx.drawImage(img, 0, 0);

                const text = extractedImages.value[i].text;
                if (wurfBildRegEx.test(text)) {
                    const words = text.split(' ');
                    //get first char from word[1]
                    const char = words[1].charAt(0);

                    numbers.value[i] = char || 0;
                }
            }
        }

        loading.value = false;
    });
};

const extractElement = (ctx, x, y, width, height, text) => {
    const extractedCanvas = document.createElement('canvas');
    const extractedCtx = extractedCanvas.getContext('2d');
    extractedCanvas.width = width;
    extractedCanvas.height = height;
    extractedCtx.drawImage(ctx.canvas, x, y, width, height, 0, 0, width, height);

    extractedImages.value.push({canvas: extractedCanvas, text: text});
};

const addExtractedCanvasRef = (el, index) => {
    if (el) {
        extractedCanvasRefs.value[index] = el;
    }
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
                <v-progress-linear v-model="extractProgress"></v-progress-linear>
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
        <v-row>
            <v-col cols="12">
                <h4>Original Image</h4>
                <canvas ref="canvasRef"></canvas>
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
