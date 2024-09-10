import {calculateFines, germanCurrencyFormat, getBahnGesamtSumme} from '@/services/rules';
import {defineStore} from 'pinia';

// deckelung bei welcher summe
const MaxToPay = 15;

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
            {bahnen: {1: [], 2: [], 3: [], 4: []}, name: 'Lucas', id: 8},
        ],

        dinge: ['besterSpieler'], //['besterSpieler', 'meiste9er', 'zweiterPlatz', 'schlechtesteBahn', 'wenigsteRaumer', 'meisteRatten', 'letzterPlatz', 'groesteStrafe'],

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
        changeScore(lane, index, newValue) {
            if (this.selectedPlayer) {
                this.selectedPlayer.bahnen[lane][index] = newValue;
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

        getPlayerSum(spieler) {
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
            return sum;
        },

        getPlayerAbrSum(spieler) {
            const currentPlayer = this.spielerListe.find(s => s.id === spieler.id);
            let sum = 0;
            if (currentPlayer) {
                for (let lane = 1; lane <= 4; lane++) {
                    if (currentPlayer.bahnen[lane].length <= 15) {
                        sum += 0;
                    } else {
                        for (let i = 15; i < 30; i++) {
                            if (currentPlayer.bahnen[lane][i]) {
                                sum += currentPlayer.bahnen[lane][i] * 1;
                            }
                        }
                    }
                }
            }
            return sum;
        },

        getPlayerVolleSum(spieler) {
            const currentPlayer = this.spielerListe.find(s => s.id === spieler.id);
            let sum = 0;
            if (currentPlayer) {
                for (let lane = 1; lane <= 4; lane++) {
                    if (currentPlayer.bahnen[lane].length <= 0) {
                        sum += 0;
                    } else {
                        for (let i = 0; i < 15; i++) {
                            if (currentPlayer.bahnen[lane][i]) {
                                sum += currentPlayer.bahnen[lane][i] * 1;
                            }
                        }
                    }
                }
            }
            return sum;
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

        fehlwurfSum(spieler) {
            const currentPlayer = this.spielerListe.find(s => s.id === spieler.id);
            let sum = 0;
            if (currentPlayer) {
                for (let lane = 1; lane <= 4; lane++) {
                    if (currentPlayer.bahnen[lane].length <= 0) {
                        sum += 0;
                    } else {
                        for (let i = 0; i < 30; i++) {
                            if (currentPlayer.bahnen[lane][i] === 0) {
                                sum += 1;
                            }
                        }
                    }
                }
            }
            return sum;
        },

        getFineFromOtherPlayers(spieler, withCurrency = false, is600ToPay = false) {
            const exludePlayer = spieler;

            let sum = 0;
            if (exludePlayer) {
                this.spielerListe.forEach(spieler => {
                    if (spieler.id !== exludePlayer.id) {
                        sum += this.getToPayOther(spieler);
                    }
                });
            }

            if (is600ToPay && sum > MaxToPay) {
                sum = MaxToPay;
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
            if (sum > MaxToPay) {
                sum = MaxToPay;
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
                } else if (count === meiste9er.number) {
                    //check wer hat mehr gespielt
                    const playerSum = this.getPlayerSum(spieler);
                    const meiste9erSum = this.getPlayerSum(meiste9er.player);
                    if (playerSum > meiste9erSum) {
                        meiste9er.number = count;
                        meiste9er.player = spieler;
                    } else if (playerSum === meiste9erSum) {
                        //check wer hat mehr abgeräumt
                        const playerAbrSum = this.getPlayerAbrSum(spieler);
                        const meiste9erAbrSum = this.getPlayerAbrSum(meiste9er.player);
                        if (playerAbrSum > meiste9erAbrSum) {
                            meiste9er.number = count;
                            meiste9er.player = spieler;
                        }
                    }
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
                    } else if (count === schlechtesteBahn.number) {
                        //check wer hat mehr gespielt
                        const playerSum = this.getPlayerSum(spieler);
                        const schlechtesteBahnSum = this.getPlayerSum(schlechtesteBahn.player);
                        if (playerSum < schlechtesteBahnSum) {
                            schlechtesteBahn.number = count;
                            schlechtesteBahn.player = spieler;
                        } else if (playerSum === schlechtesteBahnSum) {
                            //check wer hat mehr abgeräumt
                            const playerAbrSum = this.getPlayerAbrSum(spieler);
                            const schlechtesteBahnAbrSum = this.getPlayerAbrSum(schlechtesteBahn.player);
                            if (playerAbrSum < schlechtesteBahnAbrSum) {
                                schlechtesteBahn.number = count;
                                schlechtesteBahn.player = spieler;
                            }
                        }
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
                } else if (sum === wenigsteRaumer.number) {
                    //check wer hat mehr gespielt
                    const playerSum = this.getPlayerSum(spieler);
                    const wenigsteRaumerSum = this.getPlayerSum(wenigsteRaumer.player);
                    if (playerSum < wenigsteRaumerSum) {
                        wenigsteRaumer.number = sum;
                        wenigsteRaumer.player = spieler;
                    } else if (playerSum === wenigsteRaumerSum) {
                        //check wer hat mehr fehlwuerfe
                        const playerFehlwurfSum = this.fehlwurfSum(spieler);
                        const wenigsteRaumerFehlwurfSum = this.fehlwurfSum(wenigsteRaumer.player);
                        if (playerFehlwurfSum < wenigsteRaumerFehlwurfSum) {
                            wenigsteRaumer.number = sum;
                            wenigsteRaumer.player = spieler;
                        } else if (playerFehlwurfSum === wenigsteRaumerFehlwurfSum) {
                            //check wer hat mehr volle
                            const playerVolleSum = this.getPlayerVolleSum(spieler);
                            const wenigsteRaumerVolleSum = this.getPlayerVolleSum(wenigsteRaumer.player);
                            if (playerVolleSum < wenigsteRaumerVolleSum) {
                                wenigsteRaumer.number = sum;
                                wenigsteRaumer.player = spieler;
                            }
                        }
                    }
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
                } else if (count === meisteRatten.number) {
                    //check wer hat mehr abgeraeumt
                    const playerAbrSum = this.getPlayerAbrSum(spieler);
                    const meisteRattenAbrSum = this.getPlayerAbrSum(meisteRatten.player);
                    if (playerAbrSum < meisteRattenAbrSum) {
                        meisteRatten.number = count;
                        meisteRatten.player = spieler;
                    } else if (playerAbrSum === meisteRattenAbrSum) {
                        //check wer hat mehr gespielt
                        const playerSum = this.getPlayerSum(spieler);
                        const meisteRattenSum = this.getPlayerSum(meisteRatten.player);
                        if (playerSum < meisteRattenSum) {
                            meisteRatten.number = count;
                            meisteRatten.player = spieler;
                        }
                    }
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
                } else if (number === letzerPlatz.number) {
                    //check wer hat mehr abgeraeumt
                    const playerAbrSum = this.getPlayerAbrSum(spieler);
                    const letzerPlatzAbrSum = this.getPlayerAbrSum(letzerPlatz.player);
                    if (playerAbrSum < letzerPlatzAbrSum) {
                        letzerPlatz.number = number;
                        letzerPlatz.player = spieler;
                    } else if (playerAbrSum === letzerPlatzAbrSum) {
                        //check wer hat weniger fehlwuerfe
                        const playerFehlwurfSum = this.fehlwurfSum(spieler);
                        const letzerPlatzFehlwurfSum = this.fehlwurfSum(letzerPlatz.player);
                        if (playerFehlwurfSum < letzerPlatzFehlwurfSum) {
                            letzerPlatz.number = number;
                            letzerPlatz.player = spieler;
                        } else if (playerFehlwurfSum === letzerPlatzFehlwurfSum) {
                            //check wer hat mehr volle
                            const playerVolleSum = this.getPlayerVolleSum(spieler);
                            const letzerPlatzVolleSum = this.getPlayerVolleSum(letzerPlatz.player);
                            if (playerVolleSum < letzerPlatzVolleSum) {
                                letzerPlatz.number = number;
                                letzerPlatz.player = spieler;
                            }
                        }
                    }
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

            // check if the first numer existst twice so we need to check who has more played
            if (spielerArray[0].number === spielerArray[1].number) {
                const playerSum = this.getPlayerSum(spielerArray[0].spieler);
                const playerSum2 = this.getPlayerSum(spielerArray[1].spieler);
                if (playerSum2 < playerSum) {
                    groesteStrafe.sum = germanCurrencyFormat(spielerArray[1].number);
                    groesteStrafe.number = spielerArray[1].number;
                    groesteStrafe.player = spielerArray[1].spieler;
                } else if (playerSum2 === playerSum) {
                    //check wer hat mehr abgeraeumt
                    const playerAbrSum = this.getPlayerAbrSum(spielerArray[0].spieler);
                    const playerAbrSum2 = this.getPlayerAbrSum(spielerArray[1].spieler);
                    if (playerAbrSum2 < playerAbrSum) {
                        groesteStrafe.sum = germanCurrencyFormat(spielerArray[1].number);
                        groesteStrafe.number = spielerArray[1].number;
                        groesteStrafe.player = spielerArray[1].spieler;
                    } else if (playerAbrSum2 === playerAbrSum) {
                        //check wer hat weniger fehlwuerfe
                        const playerFehlwurfSum = this.fehlwurfSum(spielerArray[0].spieler);
                        const playerFehlwurfSum2 = this.fehlwurfSum(spielerArray[1].spieler);
                        if (playerFehlwurfSum2 < playerFehlwurfSum) {
                            groesteStrafe.sum = germanCurrencyFormat(spielerArray[1].number);
                            groesteStrafe.number = spielerArray[1].number;
                            groesteStrafe.player = spielerArray[1].spieler;
                        } else if (playerFehlwurfSum2 === playerFehlwurfSum) {
                            //check wer hat mehr volle
                            const playerVolleSum = this.getPlayerVolleSum(spielerArray[0].spieler);
                            const playerVolleSum2 = this.getPlayerVolleSum(spielerArray[1].spieler);
                            if (playerVolleSum2 < playerVolleSum) {
                                groesteStrafe.sum = germanCurrencyFormat(spielerArray[1].number);
                                groesteStrafe.number = spielerArray[1].number;
                                groesteStrafe.player = spielerArray[1].spieler;
                            }
                        }
                    }
                }
            }

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

            //zweiter platz same as first place check if abräumer
            if (spielerErgebnisArray[0].number === spielerErgebnisArray[1].number) {
                const playerAbrSum2 = this.getPlayerAbrSum(spielerErgebnisArray[1].spieler);
                const playerAbrSum = this.getPlayerAbrSum(spielerErgebnisArray[0].spieler);
                if (playerAbrSum < playerAbrSum2) {
                    zweiterPlatz.number = spielerErgebnisArray[0].number;
                    zweiterPlatz.player = spielerErgebnisArray[0].spieler;
                } else if (playerAbrSum === playerAbrSum2) {
                    //check wer hat weniger fehlwuerfe
                    const playerFehlwurfSum = this.fehlwurfSum(spielerErgebnisArray[0].spieler);
                    const playerFehlwurfSum2 = this.fehlwurfSum(spielerErgebnisArray[1].spieler);
                    if (playerFehlwurfSum < playerFehlwurfSum2) {
                        zweiterPlatz.number = spielerErgebnisArray[0].number;
                        zweiterPlatz.player = spielerErgebnisArray[0].spieler;
                    } else if (playerFehlwurfSum === playerFehlwurfSum2) {
                        //check wer hat mehr volle
                        const playerVolleSum = this.getPlayerVolleSum(spielerErgebnisArray[0].spieler);
                        const playerVolleSum2 = this.getPlayerVolleSum(spielerErgebnisArray[1].spieler);
                        if (playerVolleSum < playerVolleSum2) {
                            zweiterPlatz.number = spielerErgebnisArray[0].number;
                            zweiterPlatz.player = spielerErgebnisArray[0].spieler;
                        }
                    }
                }
            } else if (spielerErgebnisArray[1].number === spielerErgebnisArray[2].number) {
                // zweiter platz = dritter platz check all
                const playerAbrSum = this.getPlayerAbrSum(spielerErgebnisArray[1].spieler);
                const playerAbrSum2 = this.getPlayerAbrSum(spielerErgebnisArray[2].spieler);
                if (playerAbrSum < playerAbrSum2) {
                    zweiterPlatz.number = spielerErgebnisArray[2].number;
                    zweiterPlatz.player = spielerErgebnisArray[2].spieler;
                } else if (playerAbrSum === playerAbrSum2) {
                    //check wer hat weniger fehlwuerfe
                    const playerFehlwurfSum = this.fehlwurfSum(spielerErgebnisArray[1].spieler);
                    const playerFehlwurfSum2 = this.fehlwurfSum(spielerErgebnisArray[2].spieler);
                    if (playerFehlwurfSum < playerFehlwurfSum2) {
                        zweiterPlatz.number = spielerErgebnisArray[2].number;
                        zweiterPlatz.player = spielerErgebnisArray[2].spieler;
                    } else if (playerFehlwurfSum === playerFehlwurfSum2) {
                        //check wer hat mehr volle
                        const playerVolleSum = this.getPlayerVolleSum(spielerErgebnisArray[1].spieler);
                        const playerVolleSum2 = this.getPlayerVolleSum(spielerErgebnisArray[2].spieler);
                        if (playerVolleSum < playerVolleSum2) {
                            zweiterPlatz.number = spielerErgebnisArray[2].number;
                            zweiterPlatz.player = spielerErgebnisArray[2].spieler;
                        }
                    }
                }
            }

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
                } else if (number === besterSpieler.number) {
                    //check wer hat mehr abgeräumt
                    const playerAbrSum = this.getPlayerAbrSum(spieler);
                    const besterSpielerAbrSum = this.getPlayerAbrSum(besterSpieler.player);
                    if (playerAbrSum > besterSpielerAbrSum) {
                        besterSpieler.number = number;
                        besterSpieler.player = spieler;
                    } else if (playerAbrSum === besterSpielerAbrSum) {
                        //check wer hat weniger fehlwuerfe
                        const playerFehlwurfSum = this.fehlwurfSum(spieler);
                        const besterSpielerFehlwurfSum = this.fehlwurfSum(besterSpieler.player);
                        if (playerFehlwurfSum < besterSpielerFehlwurfSum) {
                            besterSpieler.number = number;
                            besterSpieler.player = spieler;
                        } else if (playerFehlwurfSum === besterSpielerFehlwurfSum) {
                            //check wer hat mehr volle
                            const playerVolleSum = this.getPlayerVolleSum(spieler);
                            const besterSpielerVolleSum = this.getPlayerVolleSum(besterSpieler.player);
                            if (playerVolleSum > besterSpielerVolleSum) {
                                besterSpieler.number = number;
                                besterSpieler.player = spieler;
                            }
                        }
                    }
                }
            });
            return besterSpieler;
        },
    },
});
