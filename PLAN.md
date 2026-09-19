# PLAN – Folkrejs

**Status:** Etapp 0 genomförd och verifierad lokalt. Nästa arbete är etapp 1.

## Principer

En spelbar minsta version före grafikpolering. Varje etapp ska gå att demonstrera. Klient/server-uppdelningen byggs från början, men spel för flera personer och Raspberry Pi-drift kommer först när grunden fungerar.

## Etapp 0 – Miljö och minsta klient/server-test [x]

**Mål:** Starta klient och server lokalt på Windows och se ett objekt vars rörelse simuleras *på servern*.

- [x] Inspektera projektmappen och befintliga filer; skriv inte över användarens arbete.
- [x] Kontrollera Node.js/npm och tillgängliga paketversioner; välj kompatibla, underhållna versioner. Undvik global installation utan godkännande.
- [x] Skapa npm-workspace med `client/`, `server/`, `shared/`, `.gitignore` och skript för `npm install`, utvecklingsstart och enkel kontroll.
- [x] Skapa Vite + Three.js-klient med markplan och en enkel visuell kub.
- [x] Starta separat Node-server och Rapier i Node; kör ett fast fysiksteg på servern.
- [x] Koppla klient och server via WebSocket. Visa anslutningsstatus och ett serverstyrt objekts position i klienten.
- [x] Skriv startinstruktioner och nödvändiga miljövariabler i `README.md`. Klienten återansluter vid förlorad anslutning.
- [x] Verifiera: ren installation, synlig serverstyrd rörelse, stoppad server ger synlig frånkoppling och ingen okontrollerad krasch.

**Inte i etapp 0:** bil, hjulfysik, bana, skadefunktioner, depå, matchmaking, internetpublicering eller Pi-installation.

## Etapp 1 – Körbar prototyp lokalt [ ]

- [ ] Enkel testbana med grusliknande körkänsla och kamera bakom bilen.
- [ ] En bil med massa, styrning, gas, broms, back och handbroms; fyrhjulig enkel fordonsmodell med serverstyrd fysik.
- [ ] Körkänsla på tangentbord, relevant felsökningsvy för hastighet och grepp.
- [ ] Fysik och rendering är fortsatt separerade; dokumentera vilka fordonsparametrar som är justerbara.

## Etapp 2 – Kollisioner och skador [ ]

- [ ] Två–fyra serverstyrda bilar, till en början med enkla former.
- [ ] Kollisioner med bilar och hinder; skador kopplade till träff och komponent, inte enbart en global hälsomätare.
- [ ] Gradvis sämre motoreffekt, styrning eller hjulfunktion; bilen kan fortfarande halta till depån före total utslagning.
- [ ] Tydliga och reproducerbara villkor för definitiv utslagning. Ingen respawn eller automatisk bärgning.

## Etapp 3 – Bana, varv och depå [ ]

- [ ] Kompakt folkracebana, start/mål och korrekt varvräkning utan genvägsfusk.
- [ ] Depåinfart, reparationszon och utfart.
- [ ] Reparation börjar när bilen står stilla i zonen och avbryts om den kör därifrån; längre stopp reparerar mer.
- [ ] Utslagna bilar kan aldrig återställas i depån. Depåskydd och reparationshastigheter provas i speltest.

## Etapp 4 – Match och 1–4 spelare [ ]

- [ ] Lobby/rum, anslutning och återkoppling till spelarna.
- [ ] Auktoritativ server, klientinterpolering och vid behov egen rörelseprediktion.
- [ ] Gemensam nedräkning, placering, avslut och resultat enligt valda spelregler.
- [ ] Minst två webbläsare testade samtidigt; belastning för fyra spelare.

## Etapp 5 – Raspberry Pi 5 och spel på distans [ ]

- [ ] Installera och verifiera Node-miljö på Raspberry Pi 5 (64-bitars OS).
- [ ] Kör servern på Pi:n; mät serverns simuleringsfrekvens och minne med fyra bilar.
- [ ] Börja över lokalt nätverk; välj sedan säker åtkomst för vänner via internet.
- [ ] Dokumentera start, uppdatering, omstart och loggar utan hårdkodade lösenord.

## Aktuellt arbetsuppdrag för Codex

**Gör endast etapp 0.** Läs `AGENTS.md`, `ARCHITECTURE.md` och detta dokument, inspektera mappen och bygg därefter minsta körbara lösning. Avsluta med exakta startkommandon och resultatet av verifieringen.
