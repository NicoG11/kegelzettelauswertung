import {calculateFines, germanCurrencyFormat, getBahnGesamtSumme} from '@/services/rules';
import {defineStore} from 'pinia';

export const useSpielerStore = defineStore('spielerStore', {
    state: () => ({
        spielerListe: [
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Nico', id: 1},
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Jerry', id: 2},
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Max', id: 3},
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Robi', id: 4},
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Kaschi', id: 5},
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'KT', id: 6},
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Philipp', id: 7},
        ],

        dinge: ['besterSpieler', 'meiste9er', 'zweiterPlatz', 'schlechtesteBahn', 'wenigsteRaumer', 'meisteRatten', 'letzterPlatz', 'groesteStrafe'],

        selectedPlayer: null,
    }),
    getters: {},
    actions: {
        spielerHinzufuegen(name) {
            const length = this.spielerListe.length;
            this.spielerListe.push({bahnen: {1: [], 2: [], 3: [], 4: []}, name, id: length + 1});
        },

        setSelectedPlayer(spieler) {
            this.selectedPlayer = this.spielerListe.find(s => s.id === spieler.id);
        },

        addScore(lane, score) {
            if (this.selectedPlayer) {
                this.selectedPlayer.bahnen[lane].push(score);
            }
        },

        clearLane(lane) {
            if (this.selectedPlayer) {
                this.selectedPlayer.bahnen[lane] = [];
            }
        },

        clearLastScore(lane) {
            if (this.selectedPlayer) {
                this.selectedPlayer.bahnen[lane].pop();
            }
        },

        is600(spieler) {
            const currentPlayer = this.spielerListe.find(s => s.id === spieler.id);
            let sum = 0;
            if (currentPlayer) {
                for (let lane = 1; lane <= 4; lane++) {
                    if (currentPlayer.bahnen[lane].length <= 0) {
                        sum += 0;
                    } else {
                        for (let i = 0; i < 30; i++) {
                            if (currentPlayer.bahnen[lane][i]) {
                                sum += currentPlayer.bahnen[lane][i] * 1;
                            }
                        }
                    }
                }
            }
            return sum >= 600;
        },

        getSum(lane, what = 'volle') {
            if (what === 'volle') {
                return this.getSumVolle(lane);
            }
            if (what === 'abr') {
                return this.getSumAbr(lane);
            }
        },

        getSumVolle(lane) {
            if (this.selectedPlayer) {
                if (this.selectedPlayer.bahnen[lane].length <= 0) {
                    return 0;
                }
                let sum = 0;
                for (let i = 0; i < 15; i++) {
                    if (this.selectedPlayer.bahnen[lane][i]) {
                        sum += this.selectedPlayer.bahnen[lane][i] * 1;
                    }
                }
                return sum;
            }
        },

        getSumAbr(lane) {
            if (this.selectedPlayer) {
                if (this.selectedPlayer.bahnen[lane].length <= 15) {
                    return 0;
                }
                let sum = 0;
                for (let i = 15; i < 30; i++) {
                    if (this.selectedPlayer.bahnen[lane][i]) {
                        sum += this.selectedPlayer.bahnen[lane][i] * 1;
                    }
                }
                return sum;
            }
        },

        getFineFromOtherPlayers(spieler, withCurrency = false) {
            const exludePlayer = spieler;

            let sum = 0;
            if (exludePlayer) {
                this.spielerListe.forEach(spieler => {
                    if (spieler.id !== exludePlayer.id) {
                        sum += this.getToPayOther(spieler);
                    }
                });
            }

            if (withCurrency) {
                return germanCurrencyFormat(sum);
            }
            return sum;
        },

        getToPayOther(player) {
            if (player) {
                let sum = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    sum += getBahnGesamtSumme(calculateFines(player?.bahnen[lane]), 'other');
                }
                return sum;
            }

            return 0;
        },

        getToPay(player, withCurrency = false) {
            let sum = 0;
            if (player) {
                for (let lane = 1; lane <= 4; lane++) {
                    sum += getBahnGesamtSumme(calculateFines(player?.bahnen[lane]));
                }
            }
            if (withCurrency) {
                return germanCurrencyFormat(sum);
            }
            return sum;
        },

        getGesamtToPay(player, withCurrency = true) {
            let sum = 0;
            if (player) {
                sum += this.getToPay(player);
                sum += this.getFineFromOtherPlayers(player);
            }
            if (withCurrency) {
                return germanCurrencyFormat(sum);
            }
            return sum;
        },

        meiste9er() {
            const meiste9er = {
                number: 0,
                player: null,
                tier: 'Froschkönig',
                title: 'Meiste 9er',
            };

            let count = 0;
            this.spielerListe.forEach(spieler => {
                count = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    count += spieler.bahnen[lane].filter(score => score === 9).length;
                }
                if (count > meiste9er.number) {
                    meiste9er.number = count;
                    meiste9er.player = spieler;
                }
            });
            return meiste9er;
        },

        schlechtesteBahn() {
            const schlechtesteBahn = {
                number: 0,
                player: null,
                tier: 'Löwe',
                title: 'Schlechteste Bahn',
            };

            let count = 0;
            this.spielerListe.forEach(spieler => {
                for (let lane = 1; lane <= 4; lane++) {
                    count = 0;
                    count = spieler.bahnen[lane].reduce((a, b) => a + b, 0);

                    if ((count > 0 && count < schlechtesteBahn.number && schlechtesteBahn.number > 0) || schlechtesteBahn.number === 0) {
                        schlechtesteBahn.number = count;
                        schlechtesteBahn.player = spieler;
                    }
                }
            });
            return schlechtesteBahn;
        },

        wenigsteRaumer() {
            const wenigsteRaumer = {
                number: 0,
                player: null,
                tier: 'Krokodil',
                title: 'Wenigste Raumer',
            };

            let sum = 0;
            this.spielerListe.forEach(spieler => {
                sum = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    for (let i = 15; i < 30; i++) {
                        if (spieler.bahnen[lane][i]) {
                            sum += spieler.bahnen[lane][i] * 1;
                        }
                    }
                }
                if ((sum > 0 && sum < wenigsteRaumer.number && wenigsteRaumer.number > 0) || wenigsteRaumer.number === 0) {
                    wenigsteRaumer.number = sum;
                    wenigsteRaumer.player = spieler;
                }
            });
            return wenigsteRaumer;
        },

        meisteRatten() {
            const meisteRatten = {
                number: 0,
                player: null,
                tier: 'Ratte',
                title: 'Meiste Ratten',
            };

            let count = 0;
            this.spielerListe.forEach(spieler => {
                count = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    count += spieler.bahnen[lane].filter(score => score === 0).length;
                }
                if (count > meisteRatten.number) {
                    meisteRatten.number = count;
                    meisteRatten.player = spieler;
                }
            });
            return meisteRatten;
        },

        letzterPlatz() {
            const letzerPlatz = {
                number: 0,
                player: null,
                tier: 'Großer Zonk',
                title: 'Letzter Platz',
            };

            let number = 0;
            this.spielerListe.forEach(spieler => {
                number = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    number += spieler.bahnen[lane].reduce((a, b) => a + b, 0);
                }
                if ((number < letzerPlatz.number && number > 0) || letzerPlatz.number === 0) {
                    letzerPlatz.number = number;
                    letzerPlatz.player = spieler;
                }
            });

            return letzerPlatz;
        },

        groesteStrafe() {
            const groesteStrafe = {
                sum: 0,
                number: 0,
                player: null,
                tier: 'Kegel',
                title: 'An diesem Tag, die größte Strafe',
            };

            const spielerArray = [];
            this.spielerListe.forEach(spieler => {
                spielerArray.push({spieler, number: this.getGesamtToPay(spieler, false)});
            });

            spielerArray.sort((a, b) => b.number - a.number);

            groesteStrafe.sum = germanCurrencyFormat(spielerArray[0].number);
            groesteStrafe.number = spielerArray[0].number;
            groesteStrafe.player = spielerArray[0].spieler;

            return groesteStrafe;
        },

        zweiterPlatz() {
            const zweiterPlatz = {
                number: 0,
                player: null,
                tier: 'Kleiner Zonk',
                title: 'Zweiter Platz',
            };

            const spielerErgebnisArray = [];
            let count = 0;
            this.spielerListe.forEach(spieler => {
                count = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    count += spieler.bahnen[lane].reduce((a, b) => a + b, 0);
                }
                spielerErgebnisArray.push({number: count, spieler});
            });

            spielerErgebnisArray.sort((a, b) => b.number - a.number);

            zweiterPlatz.number = spielerErgebnisArray[1].number;
            zweiterPlatz.player = spielerErgebnisArray[1].spieler;

            return zweiterPlatz;
        },

        besterSpieler() {
            const besterSpieler = {
                number: 0,
                player: null,
                tier: 'Green Lantern',
                title: 'Bester Spieler',
            };

            let number = 0;
            this.spielerListe.forEach(spieler => {
                number = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    number += spieler.bahnen[lane].reduce((a, b) => a + b, 0);
                }
                if (number > besterSpieler.number) {
                    besterSpieler.number = number;
                    besterSpieler.player = spieler;
                }
            });
            return besterSpieler;
        },
    },
});
