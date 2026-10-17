# Zettelscanner: Entwurf anhand der Beispielzettel

Stand: 17.10.2026. Fotoimport mit lokaler OCR, Drehung, Ausschnittwahl und Prüfansicht in Version 1.6.0 umgesetzt. Dieser Entwurf dokumentiert außerdem die noch offenen Ausbaustufen (Livekamera, Entzerrung und Import mehrerer Bahnen).

## Beobachtete Formate

- `wurfzettel-version-3.jpg`: seitlich fotografierter Vier-Bahnen-Zettel; je Bahn Wurf, Holz, Wurfbild, Ereignis, Fehler und laufende Gesamtsumme. Gedruckte Bahnsummen 175, 153, 195, 176; Gesamtergebnis 699.
- `IMG20240120171438.jpg`, `IMG20240120171444.jpg`: zwei Aufnahmen desselben Möckel-Bons. Wurfnummer, Einzelergebnis und laufende Summe; 15 Volle und 15 Abräumen, getrennt durch eine Summenzeile. Sichtbare Bahnsumme 127 = 92 + 35. Hand, Schatten und Papierkrümmung erschweren automatische Erkennung.
- `IMG20240120171507.jpg`: Detailaufnahme der ersten 15 Würfe desselben Bons. Nur ein Ausschnitt, keine vollständige Bahn.
- `IMG20240120171537.jpg`, `IMG20240120171547.jpg`, `IMG20240126133057.jpg`: Aufnahmen desselben FUNK-Trend-4000-Ergebnisses. Spalten Wurf, H, Ges., FW, Kegelbild, Zeit. Zeile 000 ist ein Anfangsstand und kein Wurf. 001–030 sind die eigentlichen Würfe. Summe 116 = 90 + 26; drei Fehlwürfe.

Die sieben Dateien sind keine sieben unabhängigen Spiele. Varianten desselben Ausdrucks dürfen bei einer späteren Evaluation nicht als unabhängige Trainings- und Testbeispiele behandelt werden.

## Erste Ausbaustufe

Eingabe je ausgewähltem Spieler und Bahn: Manuell / Sprache / Zettel scannen.
Foto aufnehmen oder lokal auswählen, drehen, zuschneiden und Format wählen.
Beim Vier-Bahnen-Zettel zunächst den einzelnen Bahnblock auswählen; später alle vier Blöcke gemeinsam erkennen.
Bild lokal aufbereiten, anschließend OCR mit Koordinaten ausführen. Parser je Layout ordnet die Spalten zu.
Ergebnis als bis zu 30 nummerierte Würfe zur Prüfung zeigen; Bildausschnitt bei unsicheren Werten zugänglich machen.
Erst bestätigte Würfe werden in den Store übernommen und vom bestehenden Autospeichern gespeichert.

## Regeln für Parser und Prüfung

- Nur Wurfnummern 1–30 und Ergebnisse 0–9 akzeptieren. Anfangsstand 000, Summen-, Kopf- und Fußzeilen auslassen.
- Führende Nullen in Wurfnummern zulassen. Sterne und Ereignismarkierungen getrennt von der Holzzahl behandeln.
- Kegelbild, Zeit, Fehlerzähler und Gesamtsummen niemals als Einzelwurf lesen.
- Fehlende oder verdeckte Werte bleiben unbekannt; niemals automatisch Null einsetzen.
- Laufende Summendifferenzen zur Kontrolle verwenden, sofern Anfangsstand und Summenbezug sicher erkannt sind. Widersprüche markieren, nicht still korrigieren.
- Genau 15 Volle und 15 Abräumen sowie Bahnsummen prüfen, soweit auf dem Foto vorhanden.
- Wurfnummern erhalten: eine fehlende Zeile darf die folgenden Würfe nicht verschieben.
- Bereits belegte Würfe als Konflikte zeigen; explizite Auswahl zum Ersetzen. Doppelte Fotos nicht anhängen.
- Teilaufnahmen zusammenführen anhand Spieler/Bahn/Wurfnummer; widersprechende Werte zur Prüfung anzeigen.

## Technik und nächste Schritte

Browser-Kamera über getUserMedia; Canvas für Vorschau und Ausschnitt; Tesseract.js im Worker für einen ersten lokalen OCR-Prototyp. OpenCV.js erst bei belegtem Bedarf für Entzerrung und Kontrastaufbereitung hinzunehmen. Bilder nicht in Git oder localStorage ablegen; private Testfotos bleiben außerhalb des Repositories.

Zuerst bekannte Wurfwerte manuell als Referenz erfassen und OCR auf ausgeschnittenen Tabellen testen. Messen: korrekt zugeordnete Würfe, fehlende Werte, falsche sichere Werte und Bearbeitungszeit pro Gerät. Ein OCR-Konfidenzwert allein gilt nicht als Zuverlässigkeitsnachweis.

Danach Import mit Prüfansicht entwickeln; laufenden Kamerascan erst nach zuverlässiger Zuordnung umsetzen. Für Livebilder nur stabile Erkennungen mehrerer Aufnahmen vorschlagen und dieselbe Wurfnummer deduplizieren. Aktuelle Zettel später als zusätzliche, unabhängige Testfälle aufnehmen.
