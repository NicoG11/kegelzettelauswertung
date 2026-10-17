<script setup>
const items = [
	{
		id: 18,
		color: "primary",
		icon: "mdi-table-row",
		date: "17.10.2026",
		title: "Version 1.6.1 - Zeilenweise Spielzettel",
		text: 'Zusätzliches Scanformat für waagerechte Wurfreihen: 15 Volle über 15 Abräumen, wahlweise mit eigenen Wurfnummernzeilen. Ein Bahnblock wird ausgewählt und mit Hilfslinien ausgerichtet. Ergebnisse werden anhand ihrer Position den Würfen 1–30 zugeordnet; fehlende Felder verschieben die folgenden Würfe nicht. Mehrere Ziffern im selben Feld bleiben zur Prüfung leer.',
	},
	{
		id: 17,
		color: "primary",
		icon: "mdi-camera-outline",
		date: "17.10.2026",
		title: "Version 1.6.0 - Zettelscanner",
		text: 'Erste Version der zusätzlichen Eingabe per Foto oder Bildauswahl mit lokaler Texterkennung. Bilder lassen sich drehen und auf den Tabellenbereich zuschneiden. Unterstützung für FUNK- und Möckel-Bons sowie einzelne Bahnen eines Vier-Bahnen-Zettels. Erkannte Würfe werden nach Wurfnummer zur Prüfung angezeigt; fehlende Werte bleiben leer und widersprüchliche Zwischensummen werden markiert. Vorhandene Würfe werden nur nach ausdrücklicher Bestätigung ersetzt. Fotos werden nicht gespeichert oder hochgeladen.',
	},
	{
		id: 16,
		color: "primary",
		icon: "mdi-microphone",
		date: "17.10.2026",
		title: "Version 1.5.3 - Spracheingabe verbessert",
		text: 'Laufende Zahlenvorschau und Mikrofonpegel während der Aufnahme. Automatische Mikrofonverstärkung und ein zusätzlicher Verstärkungsregler unterstützen leise Eingaben. Die Erkennung verwendet die tatsächliche Abtastrate des Mikrofons und einen auf Zahlen begrenzten Wortschatz. Zwischenergebnisse bleiben Vorschau; erst abgeschlossene Ergebnisse werden eingetragen, damit wiederholte Vorschauen keine doppelten Würfe erzeugen.',
	},
	{
		id: 15,
		color: "primary",
		icon: "mdi-microphone-check",
		date: "16.10.2026",
		title: "Version 1.5.2 - Spracheingabe korrigiert",
		text: 'Erkannte Zahlen werden der Bahn zugeordnet, auf der die Spracheingabe gestartet wurde. Das manuelle Korrigieren eines Wurfs ändert dieses Ziel nicht mehr. Beim Bahnwechsel und nach 30 Würfen wird die Aufnahme beendet. Verspätete Erkennungsergebnisse einer beendeten Aufnahme werden ignoriert.',
	},
	{
		id: 14,
		color: "primary",
		icon: "mdi-update",
		date: "16.10.2026",
		title: "Version 1.5.1 - Überarbeitete Auswertung",
		text: 'Lokaler Testbetrieb mit Docker und Aktualisierung auf Vuetify 4. GitHub Pages baut und prüft die Anwendung automatisch vor der Veröffentlichung. Neues helles und dunkles Design. Spieltag, Saison und Teilnehmer werden vor der Eingabe festgelegt; eigene Spielernamen bleiben gespeichert. Gespeicherte Ergebnisse lassen sich nach Saison gruppieren, suchen, laden und löschen sowie mit Saisonangabe exportieren und teilen. Optionales automatisches Speichern aktualisiert denselben Spieltag lokal nach zwei Sekunden ohne weitere Änderungen. Die kompakte Spielerübersicht zeigt Strafensumme und Durchschnitt pro Spieler. Ab 600 Holz entfallen die eigenen Strafen und werden durchgestrichen; die Berechnung ist in Übersicht und Gesamtauswertung einheitlich.',
	},
	{
		id: 7,
		color: "primary",
		icon: "mdi-bug",
		date: "22.09.2025",
		title: "Version 1.3.3 - Bugfix",
		text: '9er Bahnübergreifend werden jetzt gezählt',
	},
	{
		id: 6,
		color: "primary",
		icon: "mdi-bug",
		date: "29.10.2024",
		title: "Version 1.3.2 - Bugfix",
		text: 'Im Abräumen werden jetzt auch 0,1,2 korrekt erkannt',
	},
	{
		id: 5,
		color: "primary",
		icon: "mdi-clock-time-four-outline",
		date: "18.09.2024",
		title: "Version 1.3.0 - Spracherkennung",
		text: 'Zahlen per Sprache eingeben',
	},
	{
		id: 4,
		color: "primary",
		icon: "mdi-clock-time-four-outline",
		date: "16.09.2024",
		title: "Version 1.1.3 - Bugfix",
		text: 'Bugfix, Computed, Daten aktualisieren sich nicht bei der Auswertung.',
	},
	{
		id: 3,
		color: "primary",
		icon: "mdi-clock-time-four-outline",
		date: "13.09.2024",
		title: "Version 1.1.2 - Export/Import",
		text: 'Export und Import der Daten um die Ergebnisse Lokal zu speichern und wieder zu laden. JSON Format zum teilen der Daten. Share Funktion um die Daten per Link zu teilen.',
	},
	{
		id: 2,
		color: "primary",
		icon: "mdi-clock-time-four-outline",
		date: "13.09.2024",
		title: "Version 1.0.2 - Speichern",
		text: 'Speichern und Laden Button um die Ergebnisse Lokal zu speichern und wieder zu laden. Keine Datenbank, wird alles nur lokal im Browser gespeichert. Werden die Datengelöscht sin dsie auch weg.',
	},
	{
		id: 1,
		color: "primary",
		icon: "mdi-clock-time-four-outline",
		date: "13.09.2024",
		title: "Version 1.0.1 - Init()",
		text: 'Erste Version des Kegelzettel Auswerters 2024. Überarbeitet wurde "Wer bekommt was" (Es wird nach Abräumen, Fehlwürfe und Volle unterschieden.)',
	}
];
</script>

<template>
	<Teleport to="#teleport">
		<v-btn size="small" @click="$router.push({ path: '/' })">Zurück</v-btn>
	</Teleport>
	<v-container class="fill-height">
		<v-responsive class="fill-height">
			<v-row class="mb-4">

				<v-col>
					<div class="text-headline-small pt-2 text-center font-weight-light">Changelog</div>
				</v-col>
			</v-row>

			<v-timeline side="end">
				<v-timeline-item v-for="item in items" :key="item.id" :dot-color="item.color" size="small">



					<v-card>
						<v-card-title :class="['text-title-large', `bg-${item.color}`]">
							<v-icon>{{ item.icon }}</v-icon> {{ item.date }}
							<br />
							{{ item.title }}
						</v-card-title>
						<v-card-text class="bg-surface pa-4 text-body-large">
							<p>{{ item.text }}</p>
						</v-card-text>
					</v-card>

				</v-timeline-item>
			</v-timeline>


		</v-responsive>
	</v-container>
</template>