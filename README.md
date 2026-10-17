## ![workflow](https://github.com/NicoG11/kegelzettelauswertung/actions/workflows/static.yml/badge.svg?branch=gh_page)

## ![buildprocess](https://github.com/NicoG11/kegelzettelauswertung/actions/workflows/static.yml/badge.svg?event=push)

# Kegelzettelauswertung
- aktuelle Version: 1.5.3
- [Demo GithubPage](https://nicog11.github.io/kegelzettelauswertung/)

## Lokal mit Docker

Im Projektverzeichnis starten:

```sh
docker compose up -d --build
```

Danach im Browser öffnen: http://localhost:8095

Der Port ist nur auf diesem Rechner erreichbar. Bei Bedarf einen anderen Port
verwenden: `PORT=8096 docker compose up -d`.

Stoppen: `docker compose down`. Nach Codeänderungen erneut mit `--build` starten.
Status und Logs: `docker compose ps` und `docker compose logs`.

Gespeicherte Spieltage liegen im lokalen Browserspeicher und bleiben beim Stoppen
des Containers erhalten. Für dieselben Daten immer dieselbe Browseradresse und
dasselbe Browserprofil verwenden. Spieltage vor dem Löschen der Browserdaten
über die Exportfunktion sichern. Die Spracheingabe benötigt eine Mikrofonfreigabe;
`localhost` erlaubt diese auch ohne HTTPS.

## Entwicklung ohne Docker

Mit Node.js 22 (ab 22.12):

```sh
npm ci
npm run dev
```

Adresse: http://localhost:3000. Wenn `localhost-key.pem` und `localhost.pem`
vorhanden sind, startet der Entwicklungsserver stattdessen mit HTTPS.
Der bestehende GitHub-Pages-Build über `npm run build` bleibt erhalten.

## Spieltag vorbereiten

Beim Start Spieltag (Name oder Nummer) und Saison angeben, die Teilnehmer aus der Namensliste wählen und „Spieltag starten“
anklicken. Eigene Namen können ergänzt werden und bleiben im Browser gespeichert.
Die Liste enthält auch Lucas Topka. Danach Würfe über „Eingabe“ per Tastenfeld oder
Sprache erfassen. Weitere Teilnehmer lassen sich über „Spieler hinzufügen“ ergänzen.
Über das Menü können gespeicherte Ergebnisse geöffnet oder ein neuer Spieltag
begonnen werden. Den aktuellen Spieltag vorher speichern oder exportieren.

Das Sonnen-/Mondsymbol schaltet zwischen hellem und dunklem Design um. Die
Themeauswahl und die Namensliste bleiben lokal im selben Browserprofil gespeichert.
Die Anwendung verwendet Vuetify 4.2.6.

Gespeicherte Ergebnisse werden nach Saison gruppiert. Die Vorgabe für neue
Spieltage ist das aktuelle Kalenderjahr und Folgejahr, z. B. 2026/2027. Die Saison
kann geändert werden. Spieltage mit demselben Namen in verschiedenen Saisons
bleiben getrennt. Bei alten Ergebnissen wird die Saison aus dem gespeicherten
Datum ermittelt; fehlt das Jahr, erscheinen sie unter „Ohne Saison“.

Prüfungen für Saisonzuordnung und Speicherformate: `npm test`.

Mit „Automatisches Speichern aktivieren“ wird der aktuelle Spieltag zwei Sekunden
nach der letzten Änderung lokal gespeichert. Weitere Änderungen aktualisieren
immer denselben Eintrag. Beim Laden eines Spieltags kann die Funktion erneut
aktiviert werden. Ein anderer bereits gespeicherter Spieltag mit gleichem Namen
und gleicher Saison wird erst nach Bestätigung überschrieben. Beim Löschen des
aktuellen gespeicherten Spieltags wird das automatische Speichern abgeschaltet.
