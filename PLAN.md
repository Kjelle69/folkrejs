# PLAN – Folkrejs

**Status:** Etapp 4 pågår; matchhanteraren tar nu emot varv och utslagning från servervärlden. Förarnamn och riktiga WebSocket-sessioner återstår.

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

## Etapp 1 – Körbar prototyp lokalt [x]

- [x] Enkel testbana med grusliknande körkänsla och kamera bakom bilen.
- [x] En bil med massa, styrning, gas, broms, back och handbroms; fyrhjulig enkel fordonsmodell med serverstyrd fysik.
- [x] Fordonsmodellen uppgraderad till Rapiers raycast-fordon med fyra fjädrade hjul.
- [x] Körkänsla på tangentbord, relevant felsökningsvy för hastighet och grepp.
- [x] Fysik och rendering är fortsatt separerade; justerbara fordonsparametrar dokumenteras i `shared/src/vehicle.js`.

## Etapp 2 – Kollisioner och skador [x]

- [x] Två–fyra serverstyrda bilar, till en början med enkla former.
- [x] Kollisioner med bilar och hinder; skador kopplade till träff och komponent, inte enbart en global hälsomätare.
- [x] Gradvis sämre motoreffekt, styrning eller hjulfunktion; bilen kan fortfarande halta till depån före total utslagning.
- [x] Tydliga och reproducerbara villkor för definitiv utslagning. Ingen respawn eller automatisk bärgning.

## Etapp 3 – Bana och varv [x]

- [x] Kompakt folkracebana, start/mål och korrekt varvräkning utan genvägsfusk.
- [x] Separera banhändelser (kontrollpunkt och mållinje) från fordonsfysiken så matchhanteraren kan konsumera dem.

## Etapp 4 – Drop-in-heat och 1–4 spelare [ ]

- [x] Inför servermodulen `MatchManager` med faserna `warmup`, `countdown`, `racing` och `results`; testa fasbyten med simulerad klocka utan fysik.
- [ ] Lägg till förarnamn och WebSocket-sessioner. Nya spelare deltar i uppvärmning eller väntar automatiskt till nästa heat; högst fyra aktiva bilar.
- [ ] Auktoritativ server, klientinterpolering och vid behov egen rörelseprediktion.
- [x] Koppla fem varv, kontrollpunkter, placering, målgång, DNF och soloklocka till matchhanteraren.
- [ ] Visa gemensam nedräkning och aktuell fas i klienten; lås tävlingsbilar fram till start.
- [ ] Visa resultat i tio sekunder och återställ därefter bilar/skador inför automatisk uppvärmning och nästa heat.
- [ ] Låt utslagna bilar ligga kvar som fysiska hinder till heatets slut; `R`, återanslutning eller sen anslutning får inte återuppliva dem.
- [ ] Minst två webbläsare testade samtidigt; belastning för fyra spelare.

### Föreslagen implementationsordning för etapp 3–4

1. Bana med ordnade kontrollpunkter och serververifierad varvräkning för en bil.
2. Ren `MatchManager` med deterministiska tester av fasflöde, fem varv, solotid, DNF och tio sekunders resultat.
3. Koppling mellan banhändelser, utslagning och matchhanteraren utan att flytta fysikansvar till matchmodulen.
4. Förarnamn, sessions-ID och deltagarstatus (`active`, `waiting`, `finished`, `knockedOut`).
5. Klient-HUD för uppvärmning, nedräkning, varv, placering, vänteläge och resultat.
6. Automatisk heatåterställning och verifiering med 1–4 webbläsare, inklusive anslutning mitt under race.
7. Depå och reparation kopplas därefter till samma heatlivscykel och testas utan att kunna återuppliva utslagna bilar.

## Etapp 5 – Depå [ ]

- [ ] Depåinfart, reparationszon och utfart.
- [ ] Reparation börjar när bilen står stilla i zonen och avbryts om den kör därifrån; längre stopp reparerar mer.
- [ ] Utslagna bilar kan aldrig återställas i depån. Depåskydd och reparationshastigheter provas i speltest.

## Etapp 6 – Raspberry Pi 5 och spel på distans [ ]

- [ ] Installera och verifiera Node-miljö på Raspberry Pi 5 (64-bitars OS).
- [ ] Kör servern på Pi:n; mät serverns simuleringsfrekvens och minne med fyra bilar.
- [ ] Börja över lokalt nätverk; välj sedan säker åtkomst för vänner via internet.
- [ ] Dokumentera start, uppdatering, omstart och loggar utan hårdkodade lösenord.

## Aktuellt arbetsuppdrag för Codex

**Nästa koditeration:** lägg till validerade förarnamn och separata WebSocket-sessioner med deltagarstatus, utan att samtidigt bygga hela klientmenyn.
