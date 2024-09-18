<script setup>
import { ref, computed } from 'vue';
import { useSpielerStore } from '@/stores/spielerStore';
import { useRouter } from 'vue-router';

const spielerStore = useSpielerStore();

const router = useRouter();

function geheZuSeite(spieler, path) {
	spielerStore.setSelectedPlayer(spieler);

	router.push({ path: path });
}

// Computed-Eigenschaft für die Spielerliste mit berechneten Werten
const spielerListeMitWerten = computed(() => {
	return spielerStore.spielerListe.map(spieler => {
		const is600 = spielerStore.is600(spieler);
		const zuZahlen = spielerStore.getToPay(spieler, true);
		const fineFromOthers = spielerStore.getFineFromOtherPlayers(spieler, true, is600);

		const gesamtZuZahlen = is600 ? fineFromOthers : spielerStore.getGesamtToPay(spieler);
		const gesamtAndere = spielerStore.getFineFromOtherPlayers(spieler, true, is600, true);
		return {
			...spieler,
			is600,
			zuZahlen,
			fineFromOthers,
			gesamtZuZahlen,
			gesamtAndere
		};
	});
});
</script>

<template>
	<v-list lines="three" rounded variant="elevated" class="pb-0 my-4 bg-green">
		<v-list-subheader color="white" class="text-h6">Spielerliste</v-list-subheader>

		<v-list-item :elevation="2" v-for="(spieler, index) in spielerListeMitWerten" :key="index" class="py-3">
			<v-list-item-title>{{ spieler.name }}</v-list-item-title>
			<v-list-item-subtitle>
				<span class="text-caption" :class="{ 'text-decoration-line-through': spieler.is600 }">Zu
					zahlen: {{ spieler.zuZahlen }}</span>
				<span class="text-caption text-green-darken-4" v-if="spieler.is600"> >= 600 </span>
				<br />
				<span class="text-caption">+ anderen {{ spieler.fineFromOthers }}</span>
				<br />
				=
				<span v-if="spieler.is600">
					{{ spieler.gesamtAndere }}
				</span>
				<span v-else class="text-subtitle-2 pr-2">
					{{ spieler.gesamtZuZahlen }}
				</span>
			</v-list-item-subtitle>

			<template v-slot:append>
				<div class="d-flex flex-column ga-2">
					<v-btn flat size="small" color="primary" @click="geheZuSeite(spieler, 'eingabe')">Eingabe</v-btn>
				</div>

			</template>
		</v-list-item>
	</v-list>
</template>