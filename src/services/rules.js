export function germanCurrencyFormat(number = null, currency = {id: 1, name: 'Euro', short: '€', code: 'EUR', vat: '19', default: true}, notation = 'standard') {
    if (number === null) {
        return '';
    }
    const numberFormatOptions = {style: 'currency', currency: currency.code, maximumFractionDigits: 2, minimumFractionDigits: 2, notation};
    return new Intl.NumberFormat('de-DE', numberFormatOptions).format(number);
}

export function calculateFines(throws) {
    const rules = {
        '0InVolle': {count: 0, cost: 2, total: 0, name: '0 aufs volle Bild'},
        '1InVolle': {count: 0, cost: 1, total: 0, name: '1 aufs volle Bild'},
        '2InVolle': {count: 0, cost: 0.5, total: 0, name: '2 aufs volle Bild'},
        '0InAbraumen': {count: 0, cost: 0.2, total: 0, name: 'Fehlwurf im Abräumen'},
        OIn29thIf1Pin: {count: 0, cost: 0.5, total: 0, name: 'Fehlwurf auf einzelnen 29.Wurf'},
        '105Volle': {count: 0, cost: 1, total: 0, name: '>= 105 Volle', other: true}, // Für andere Spieler
        '60Abraumen': {count: 0, cost: 1, total: 0, name: '>= 60 Abräumen', other: true},
        '160bahn': {count: 0, cost: 1, total: 0, name: '>= 160 Bahn', other: true},
        consecutive9: {count: 0, cost: 1, total: 0, name: 'Drei 9er + folgende', other: true},
        '9In29th': {count: 0, cost: 0.5, total: 0, name: '9 auf den 29 Wurf', other: true},
        cleanedImage: {count: 0, cost: 0, total: 0, name: 'Geräumte Bilder', show: false}, // Keine direkte Strafe
    };

    let consecutive9Count = 0;
    let totalVolle = 0;
    let totalAbraumen = 0;

    let pinsLeft = 9;
    let vorletzterWurf = 0;

    if (throws?.length > 0) {
        throws.forEach((throwNumber, index) => {
            if (index < 15) {
                totalVolle += throwNumber;
                // Volle
                if (throwNumber === 0) rules['0InVolle'].count++;
                if (throwNumber === 1) rules['1InVolle'].count++;
                if (throwNumber === 2) rules['2InVolle'].count++;
            } else {
                // Abräumen
                totalAbraumen += throwNumber;

                //Fehlwurf in Abräumen aber Volles bild
                if (pinsLeft === 9 && throwNumber === 0) rules['0InVolle'].count++;
                if (pinsLeft === 9 && throwNumber === 1) rules['1InVolle'].count++;
                if (pinsLeft === 9 && throwNumber === 2) rules['2InVolle'].count++;
                // wenn der vorletze wurf eine 0 wa run dder jetzige wurdf eine 9 ist dann  rules['0InVolle'].count--;
                vorletzterWurf = throws[index - 1];
                if (vorletzterWurf === 0 && pinsLeft === 9 && throwNumber === 9) rules['0InVolle'].count--;
                if (vorletzterWurf === 1 && pinsLeft === 8 && throwNumber === 8) rules['1InVolle'].count--;
                if (vorletzterWurf === 2 && pinsLeft === 7 && throwNumber === 7) rules['2InVolle'].count--;

                // Fehlwurf im Abräumen
                if (throwNumber === 0 && pinsLeft < 9) rules['0InAbraumen'].count++;

                // Bild geräumt Regel

                pinsLeft -= throwNumber;
                if (pinsLeft === 0) {
                    rules['cleanedImage'].count++;
                    pinsLeft = 9; // Zurücksetzen für das nächste Bild
                }

                // Regel für 1 Kegel auf dem 29. Wurf, wenn Wurf = 0
                if (index === 28 && pinsLeft === 1 && throwNumber === 0) {
                    rules['OIn29thIf1Pin'].count++;
                }
            }

            // Regel für 9er
            if (throwNumber === 9) {
                consecutive9Count++;
                if (consecutive9Count >= 3) rules['consecutive9'].count++;
                if (index === 28) rules['9In29th'].count++;
            } else {
                consecutive9Count = 0;
            }
        });
    }

    if (totalVolle >= 105) rules['105Volle'].count++;
    if (totalAbraumen >= 60) rules['60Abraumen'].count++;
    if (totalAbraumen + totalVolle >= 160) rules['160bahn'].count++;

    // Berechnung der Gesamtsummen
    for (const rule in rules) {
        rules[rule].total = rules[rule].count * rules[rule].cost;
    }

    // remove from rules wehre show:false
    const retRules = {};
    for (const rule in rules) {
        if (rules[rule].show !== false) {
            retRules[rule] = rules[rule];
        }
    }

    return retRules;
}

export function getBahnGesamtSumme(rules, what = 'spieler') {
    let sum = 0;
    for (const rule in rules) {
        if (what === 'other' && rules[rule].other) {
            sum += rules[rule].total;
        }
        if (what === 'spieler' && !rules[rule].other) {
            sum += rules[rule].total;
        }
    }
    return sum;
}
