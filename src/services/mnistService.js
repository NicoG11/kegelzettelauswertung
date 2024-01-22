// mnistService.js

import * as tf from '@tensorflow/tfjs';

export const loadMnistModel = async () => {
    //check if model exists

    console.log('loading model');

    const model = await tf.loadLayersModel('@assets/models/mnist/model.json');

    return model;
};

export const preprocessImageForMnist = image => {
    let processedImage = image;
    // Führe hier die erforderliche Vorverarbeitung durch.

    // Zum Beispiel: Konvertiere das Bild in Graustufen, passe die Größe an, normalisiere Pixelwerte, etc.
    processedImage = tf.image.resizeBilinear(processedImage, [28, 28]);
    processedImage = tf.cast(processedImage, 'float32');
    processedImage = tf.div(processedImage, 255);
    processedImage = tf.sub(processedImage, 1);
    processedImage = tf.mul(processedImage, -1);
    processedImage = tf.reshape(processedImage, [1, 28, 28, 1]);

    return processedImage;
};

export const performDigitRecognition = async (model, image) => {
    const processedImage = preprocessImageForMnist(image);
    const inputTensor = tf.tensor(processedImage).expandDims();
    const predictions = await model.predict(inputTensor);
    // Hier verarbeitest du die Vorhersagen weiter.
    // Zum Beispiel: Extrahiere die Klasse mit der höchsten Wahrscheinlichkeit.
    // Oder: Extrahiere die Top 5 Klassen mit den höchsten Wahrscheinlichkeiten.
    // Oder: Extrahiere die Klasse mit der höchsten Wahrscheinlichkeit und die zugehörige Wahrscheinlichkeit.
    console.log(predictions);
    return predictions;
};
