<script setup>
import {useSpielerStore} from '@/store/spielerStore';
import {useAppStore} from '@/store/appStore';
import {ref, computed, onMounted} from 'vue';
import {watch} from 'vue';
import Tesseract, {PSM} from 'tesseract.js';

const spielerStore = useSpielerStore();
const appStore = useAppStore();
const aktuellerSchritt = ref(1);
const zetteltyp = ref('Lang');

const videoStream = ref(null);
const videoElement = ref(null);
const canvasRefs = ref([]);
const canvasImage = ref([]);
const canvasSelections = ref([]);
const fileInputRefs = ref([]);

function addCanvasRef(el, index) {
    if (el) {
        canvasRefs.value[index] = el;
    }
}

function addFileInput(el, index) {
    console.log('addFileInput', index, el);
    if (el) {
        fileInputRefs.value[index] = el;
    }
}

function triggerFileInput(index) {
    console.log('triggerFileInput', index, fileInputRefs.value[index]);
    if (fileInputRefs.value[index]) {
        fileInputRefs.value[index].click();
    }
}

const MAX_WIDTH = 380; // Maximale Breite
const MAX_HEIGHT = 600; // Maximale Höhe

const uploadImage = (event, index) => {
    event.preventDefault();
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

                const canvas = canvasRefs.value[index];
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Event-Listener für das Zeichnen des Rechtecks erneut hinzufügen
                canvas.onmousedown = event => startSelection(index, event);
                canvas.onmousemove = event => drawSelection(index, event);
                canvas.onmouseup = event => endSelection(index, event);
                canvas.ontouchstart = event => startSelection(index, event);
                canvas.ontouchmove = event => drawSelection(index, event);
                canvas.ontouchend = event => endSelection(index, event);

                canvasImage.value[index] = new Image();
                canvasImage.value[index].src = canvas.toDataURL('image/png');

                canvasRefs.value[index].replaceWith(canvas);
                canvasRefs.value[index] = canvas;

                console.log('canvasRefs', canvasRefs.value[index]);

                // Zurücksetzen der Auswahl und des File Inputs
                canvasSelections.value[index] = null;
                event.target.value = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const startSelection = (index, event) => {
    event.preventDefault();
    const selection = canvasSelections.value[index];
    if (selection?.isDrawing) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;

    const rect = canvasRefs.value[index].getBoundingClientRect();
    canvasSelections.value[index] = {
        x1: clientX - rect.left,
        y1: clientY - rect.top,
        x2: clientX - rect.left,
        y2: clientY - rect.top,
        isDrawing: true,
    };
};

const drawSelection = (index, event) => {
    event.preventDefault();
    const selection = canvasSelections.value[index];
    if (!selection || !selection.isDrawing) return;

    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    const rect = canvasRefs.value[index].getBoundingClientRect();
    selection.x2 = clientX - rect.left;
    selection.y2 = clientY - rect.top;

    // Löschen Sie den vorherigen Zustand des Canvas
    const context = canvasRefs.value[index].getContext('2d');
    context.clearRect(0, 0, canvasRefs.value[index].width, canvasRefs.value[index].height);

    // Stellen Sie das vorherige Bild wieder her, bevor das neue Rechteck gezeichnet wird
    if (canvasImage.value[index]) {
        context.drawImage(canvasImage.value[index], 0, 0);
    }

    // Zeichnen Sie das neue Rechteck
    context.beginPath();
    context.strokeStyle = 'red'; // Sie können die Farbe des Rahmens ändern
    context.rect(selection.x1, selection.y1, selection.x2 - selection.x1, selection.y2 - selection.y1);
    context.stroke();
};

const endSelection = (index, event) => {
    event.preventDefault();

    const selection = canvasSelections.value[index];
    if (selection && selection.isDrawing) {
        const originalCanvas = canvasRefs.value[index];
        const context = originalCanvas.getContext('2d');

        // Berechnen der Größe und Position des Auswahlrechtecks
        const width = selection.x2 - selection.x1;
        const height = selection.y2 - selection.y1;

        // Erstellen eines neuen Canvas-Elements
        const newCanvas = document.createElement('canvas');
        newCanvas.width = width;
        newCanvas.height = height;
        const newContext = newCanvas.getContext('2d');

        // Kopieren des ausgewählten Bereichs in das neue Canvas
        newContext.drawImage(originalCanvas, selection.x1, selection.y1, width, height, 0, 0, width, height);

        // Ersetzen des originalen Canvas durch das neue Canvas
        canvasRefs.value[index].replaceWith(newCanvas);
        canvasRefs.value[index] = newCanvas;

        selection.isDrawing = false;
        recognizeTextFromCanvas(newCanvas, index);
    }
};

const anzahlBahnen = computed(() => {
    return zetteltyp.value === 'Lang' ? 4 : 1;
});

const disabled = computed(() => {
    return aktuellerSchritt.value === 1 ? 'prev' : aktuellerSchritt.value === 3 + anzahlBahnen.value ? 'next' : undefined;
});

// create watch element for aktuellerSchritt
watch(aktuellerSchritt, async (newValue, oldValue) => {
    if (newValue > 2 && appStore.cameraAccess && !videoStream.value) {
        videoStream.value = await navigator.mediaDevices.getUserMedia({video: true});
        videoElement.value.srcObject = videoStream.value;
    } else if (newValue < 2 && videoStream.value) {
        videoStream.value?.getTracks().forEach(track => track.stop());
        videoStream.value = null;
    } else if (newValue === 3 + anzahlBahnen.value) {
        // Alle Bahnen wurden gescannt, berechnung ausführen
        videoStream.value?.getTracks().forEach(track => track.stop());
        videoStream.value = null;
        videoElement.value = null;
        recognizeText();
    }
});

const recognizeText = async () => {
    captureImage(); // Stellt sicher, dass das neueste Bild im Canvas ist

    for (let i = 0; i < canvasRefs.value.length; i++) {
        await recognizeTextFromCanvas(canvasRefs.value[i], i);
    }
};

function enhanceContrast(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Konvertierung in Graustufen für einheitlichen Kontrast
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Anpassen des Kontrasts (Sie können mit dem Faktor experimentieren)
        const contrast = (gray - 128) * 1.8 + 128; // Erhöhung des Kontrastfaktors

        // Aktualisierung des Pixels
        data[i] = data[i + 1] = data[i + 2] = contrast;
    }

    ctx.putImageData(imageData, 0, 0);

    /* old
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const contrast = (brightness - 128) * 2 + 128;
        data[i] = data[i + 1] = data[i + 2] = contrast;
    }

    ctx.putImageData(imageData, 0, 0);
	*/
}

const recognizeTextFromCanvas = async (canvas, index) => {
    console.log('canvas', canvas, index);
    const canvasToText = canvas ? canvas : canvasRefs.value[index];

    console.log('canvasToText', canvasToText);
    if (canvasToText) {
        try {
            //get image from canvas for tesseract
            enhanceContrast(canvasToText);

            const image = canvasToText.toDataURL();
            // console.log(image);
            const result = await Tesseract.recognize(image, 'eng', {
                tessedit_char_whitelist: '0123456789',
                tessedit_pageseg_mode: 4, // PSM.SINGLE_COLUMN (4)war okay, 6
            });

            // splitte den text \n und schriewbe die zahlen in array
            const text = result.data?.text?.split('\n');
            //entferne, das letzte lement wenn es leer ist
            if (text[text.length - 1] === '') {
                text.pop();
            }
            console.info('Ergebnis:', text);
            alert(text.join(', '));
        } catch (error) {
            console.error('Fehler bei der Texterkennung:', error);
        }
    }
};

const setzeZetteltyp = typ => {
    zetteltyp.value = typ;
    weiterZumNaechstenSchritt();
};

const weiterZumNaechstenSchritt = async () => {
    if (aktuellerSchritt.value < 2 + anzahlBahnen.value) {
        aktuellerSchritt.value++;
    }
};

const startCamera = async () => {
    if (!appStore.cameraAccess) {
        try {
            await navigator.mediaDevices.getUserMedia({video: true});
            appStore.setCameraAccess(true);
            // Hinweis: Das Video-Element wird noch nicht hier, sondern in den Bahn-Schritten zugewiesen.
            weiterZumNaechstenSchritt();
        } catch (error) {
            alert('Fehler beim Zugriff auf die Kamera:', error);
            appStore.setCameraAccess(false);
        }
    } else {
        weiterZumNaechstenSchritt();
    }
};

const captureImage = async index => {
    const canvas = canvasRefs.value[index];

    if (videoElement.value && canvas) {
        const context = canvas.getContext('2d');
        canvas.width = videoElement.value.videoWidth;
        canvas.height = videoElement.value.videoHeight;
        context.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height);

        // Event-Listener für das Zeichnen des Rechtecks erneut hinzufügen
        canvas.onmousedown = event => startSelection(index, event);
        canvas.onmousemove = event => drawSelection(index, event);
        canvas.onmouseup = event => endSelection(index, event);
        canvas.ontouchstart = event => startSelection(index, event);
        canvas.ontouchmove = event => drawSelection(index, event);
        canvas.ontouchend = event => endSelection(index, event);

        canvasImage.value[index] = new Image();
        canvasImage.value[index].src = canvas.toDataURL('image/png');

        // Vorheriges Auswahlrechteck zurücksetzen
        canvasSelections.value[index] = null;
    }
};

onMounted(() => {
    // Überprüfen, ob die Kamera beim Laden der Komponente bereits aktiv ist
    if (appStore.cameraAccess) {
        weiterZumNaechstenSchritt();
    }
});
</script>

<template>
    <v-container class="fill-height">
        <v-row class="mb-4">
            <v-col cols="2">
                <v-btn @click="$router.push({path: '/'})">Zurück</v-btn>
            </v-col>
            <v-col>
                <div class="text-h5 pt-2 text-center font-weight-light">Auswertung für {{ spielerStore.selectedPlayer?.name }}</div>
            </v-col>
        </v-row>

        <v-stepper v-model="aktuellerSchritt">
            <template v-slot:default="{prev, next}">
                <v-stepper-header>
                    <!-- Schritt für Kamera-Aktivierung und Zetteltyp-Wahl -->
                    <v-stepper-item :complete="aktuellerSchritt > 1" title="Kamera aktivieren" :value="1"></v-stepper-item>
                    <v-divider></v-divider>
                    <!-- <v-stepper-item :complete="aktuellerSchritt > 2" title="Zetteltyp wählen" :value="2"></v-stepper-item> -->
                    <!-- <v-divider></v-divider> -->

                    <!-- Dynamische Schritte basierend auf dem Zetteltyp -->
                    <template v-for="n in anzahlBahnen" :key="`bahn-${n}`">
                        <v-stepper-item :complete="aktuellerSchritt > n + 2" :title="`Bahn ${n}`" :value="n + 2"></v-stepper-item>
                        <v-divider v-if="n !== anzahlBahnen"></v-divider>
                    </template>
                    <v-divider></v-divider>
                    <v-stepper-item :complete="aktuellerSchritt > anzahlBahnen + 3" title="Berechnung" :value="anzahlBahnen + 3"></v-stepper-item>
                </v-stepper-header>

                <v-stepper-window>
                    <v-stepper-window-item :value="1">
                        <v-responsive class="fill-height">
                            <div class="text-h5 text-center font-weight-light">Für Fotoaufnahmen brauchen wir die "Kamera-Berechtigung".<br />Bitte Kamera aktivieren.</div>
                            <div class="text-center my-4"><v-btn @click="startCamera">Kamera aktivieren</v-btn></div>
                        </v-responsive>
                    </v-stepper-window-item>
                    <v-stepper-window-item :value="2">
                        <!-- Inhalt für Zetteltyp-Wahl -->
                        <v-btn @click="setzeZetteltyp('DIN_A4')">DIN A4</v-btn>
                        <v-btn @click="setzeZetteltyp('Lang')">Lang</v-btn>
                    </v-stepper-window-item>
                    <v-stepper-window-item v-for="(n, index) in anzahlBahnen" :key="`bahn-content-${n}`" :value="n + 2">
                        <!-- Inhalt für das Scannen der einzelnen Bahnen -->
                        <v-card>
                            <v-card-title>Bahn {{ n }} einlesen</v-card-title>
                            <v-card-text>
                                <canvas
                                    :ref="el => addCanvasRef(el, index)"
                                    @mousedown="startSelection(index, $event)"
                                    @mousemove="drawSelection(index, $event)"
                                    @mouseup="endSelection(index, $event)"
                                    @touchstart="startSelection(index, $event)"
                                    @touchmove="drawSelection(index, $event)"
                                    @touchend="endSelection(index, $event)"
                                >
                                </canvas>
                            </v-card-text>
                            <div class="d-felx flex-column text-center">
                                <v-btn class="my-1" @click="captureImage(index)">Zettel Aufnehmen</v-btn>
                                <v-btn class="my-1" @click="recognizeTextFromCanvas(null, index)">erkenne zahlen</v-btn>
                                <v-btn class="my-1" @click="triggerFileInput(index)">Zettel von Device laden</v-btn>
                                <input type="file" :ref="el => addFileInput(el, index)" hidden @change="uploadImage($event, index)" accept="image/*" />
                            </div>
                        </v-card>
                    </v-stepper-window-item>

                    <v-stepper-window-item :value="anzahlBahnen + 3">
                        <!-- Berechnungen -->
                        <h4>Berechnungen</h4>
                    </v-stepper-window-item>
                </v-stepper-window>

                <v-stepper-actions :disabled="disabled" color="green" @click:prev="prev" @click:next="next" next-text="weiter" prev-text="zurück"></v-stepper-actions>
            </template>
        </v-stepper>
        <video ref="videoElement" autoplay></video>
    </v-container>
</template>
