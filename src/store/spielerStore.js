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

        dinge: ['meiste9er', 'schlechtesteBahn', 'wenigsteRaumer', 'meisteRatten', 'letzterPlatz', 'groesteStrafe', 'zweiterPlatz', 'besterSpieler'],

        selectedPlayer: null,
    }),
    getters: {
        meiste9er: state => {
            const meiste9er = {
                number: 0,
                player: null,
                tier: 'Froschkönig',
                title: 'Meiste 9er',
            };

            let count = 0;
            state.spielerListe.forEach(spieler => {
                count = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    count += spieler.bahnen[lane].filter(score => score === 9).length;
                }
                if (count > meiste9er.count) {
                    meiste9er.number = count;
                    meiste9er.player = spieler;
                }
            });
            return meiste9er;
        },

        schlechtesteBahn: state => {
            const schlechtesteBahn = {
                number: 0,
                player: null,
                tier: 'Löwe',
                title: 'Schlechteste Bahn',
            };

            let count = 0;
            state.spielerListe.forEach(spieler => {
                for (let lane = 1; lane <= 4; lane++) {
                    count = 0;
                    count = spieler.bahnen[lane].reduce((a, b) => a + b, 0);
                    console.log('schlechtestebahn', count);
                    if ((count < schlechtesteBahn.number && schlechtesteBahn.number > 0) || schlechtesteBahn.number === 0) {
                        schlechtesteBahn.number = count;
                        schlechtesteBahn.player = spieler;
                    }
                }
            });
            return schlechtesteBahn;
        },

        wenigsteRaumer: state => {
            const wenigsteRaumer = {
                number: 0,
                player: null,
                tier: 'Krokodil',
                title: 'Wenigste Raumer',
            };

            let sum = 0;
            state.spielerListe.forEach(spieler => {
                sum = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    for (let i = 15; i < 30; i++) {
                        if (spieler.bahnen[lane][i]) {
                            sum += spieler.bahnen[lane][i] * 1;
                        }
                    }
                }
                if ((sum < wenigsteRaumer.number && wenigsteRaumer.number > 0) || wenigsteRaumer.number === 0) {
                    wenigsteRaumer.number = sum;
                    wenigsteRaumer.player = spieler;
                }
            });
            return wenigsteRaumer;
        },

        meisteRatten: state => {
            const meisteRatten = {
                number: 0,
                player: null,
                tier: 'Ratte',
                title: 'Meiste Ratten',
            };

            let count = 0;
            state.spielerListe.forEach(spieler => {
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

        letzterPlatz: state => {
            const letzerPlatz = {
                number: 0,
                player: null,
                tier: 'Großer Zonk',
                title: 'Letzter Platz',
            };

            let number = 0;
            state.spielerListe.forEach(spieler => {
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

        groesteStrafe: state => {
            const groesteStrafe = {
                number: 0,
                player: null,
                tier: 'Kegel',
                title: 'An diesem Tag, die größte Strafe',
            };

            //TODO
            return groesteStrafe;
        },

        zweiterPlatz: state => {
            const zweiterPlatz = {
                number: 0,
                player: null,
                tier: 'Kleiner Zonk',
                title: 'Zweiter Platz',
            };

            const spielerErgebnisArray = [];
            let number = 0;
            state.spielerListe.forEach(spieler => {
                number = 0;
                for (let lane = 1; lane <= 4; lane++) {
                    number += spieler.bahnen[lane].reduce((a, b) => a + b, 0);
                }
                spielerErgebnisArray.push({number, spieler});
            });

            spielerErgebnisArray.sort((a, b) => a.number - b.number);

            zweiterPlatz.number = spielerErgebnisArray[1].number;
            zweiterPlatz.player = spielerErgebnisArray[1].spieler;

            return zweiterPlatz;
        },

        besterSpieler: state => {
            const besterSpieler = {
                number: 0,
                player: null,
                tier: 'Green Lantern',
                title: 'Bester Spieler',
            };

            let number = 0;
            state.spielerListe.forEach(spieler => {
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
                console.log('getToPay', player?.bahnen);
                for (let lane = 1; lane <= 4; lane++) {
                    sum += getBahnGesamtSumme(calculateFines(player?.bahnen[lane]));
                }
            }
            if (withCurrency) {
                return germanCurrencyFormat(sum);
            }
            return sum;
        },

        getGesamtToPay(player) {
            let sum = 0;
            if (player) {
                sum += this.getToPay(player);
                sum += this.getFineFromOtherPlayers(player);
            }
            return germanCurrencyFormat(sum);
        },
    },
});
