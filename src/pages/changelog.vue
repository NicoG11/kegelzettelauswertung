<script setup>
const items = [
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
					<div class="text-h5 pt-2 text-center font-weight-light">Changelog</div>
				</v-col>
			</v-row>

			<v-timeline side="end">
				<v-timeline-item v-for="item in items" :key="item.id" :dot-color="item.color" size="small">



					<v-card>
						<v-card-title :class="['text-h6', `bg-${item.color}`]">
							<v-icon>{{ item.icon }}</v-icon> {{ item.date }}
							<br />
							{{ item.title }}
						</v-card-title>
						<v-card-text class="bg-white pa-4 text-body-1">
							<p>{{ item.text }}</p>
						</v-card-text>
					</v-card>

				</v-timeline-item>
			</v-timeline>


		</v-responsive>
	</v-container>
</template>