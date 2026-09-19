# Codex-instruktioner för Folkrejs

Det här dokumentet gäller hela projektet. Arbetsmappen på utvecklingsdatorn är
`C:\Users\kjell\Desktop\Programmering\Folkrejs`.

## Projektets kärna

Folkrejs är ett webbläsarspel för 1–4 spelare: klassiskt folkrace på en bana med varvräkning, kollisioner, gradvisa funktionsskador och en depå där körbara bilar repareras ju längre de står stilla. En bil som är helt utslagen är permanent utslagen ur den aktuella matchen. Dessförinnan ska den kunna *limpa* till depån även vid mycket svåra skador. Se `GAME_DESIGN.md` för spelregler och `ARCHITECTURE.md` för tekniska beslut.

## Hur du ska arbeta

1. Läs `PLAN.md` och den/de relevanta avsnitten i `GAME_DESIGN.md` och `ARCHITECTURE.md` innan du ändrar kod. Utgå från den översta ej avklarade uppgiften om ingen annan uppgift anges.
2. Gör **en avgränsad etapp i taget**. Implementera inte framtida etapper i förskott. Vid större arkitekturändringar: redovisa kort konsekvenserna innan du genomför dem.
3. Inspektera befintliga filer och kommandon innan du skapar, installerar eller skriver över något. Bevara fungerande kod, lokala ändringar och Git-historik. Installera inte global programvara och ändra inte Raspberry Pi utan uttrycklig instruktion.
4. Håll klientens rendering separat från serverns auktoritativa fysik och spellogik. Körbar lokal utveckling på Windows först; serverkoden ska även kunna köras på Raspberry Pi 5 med 64-bitars Linux.
5. Undvik onödiga beroenden, genererad komplexitet och lång, repetitiv terminalutskrift. Använd små, tydliga moduler. Dokumentera *varför* bakom icke-triviala val.
6. Verifiera berörd funktion med tillgängliga tester och korta manuella kontroller. Redovisa ärligt vad som inte gick att verifiera.
7. Uppdatera `PLAN.md` när en etapp är verifierad. Uppdatera relevanta dokument när faktiska tekniska beslut eller spelregler ändras. Gör inte `git commit` utan att användaren ber om det.

## Kommunikation och tokenekonomi

- Svara på svenska, kortfattat. Visa ändrade filnamn, testresultat och nästa konkreta steg; klistra inte in hela filer om det inte efterfrågas.
- Fråga bara om ett beslut verkligen blockerar uppgiften. Välj annars en enkel, reversibel standard och märk osäkra antaganden.
- När uppgiften handlar om en liten ändring, läs bara berörda källfiler och nödvändiga delar av dokumentationen.
- Använd gärna den lokala skillen `folkrejs-iteration` för den återkommande arbetscykeln.

## Föreslagen teknik (revidera endast med motivering)

- JavaScript ES Modules, Node.js, npm workspaces, Vite, Three.js, Rapier 3D, WebSocket.
- Ingen React eller tung backend behövs i grundversionen.
- Serverstyrd fysik med fast tidssteg; klienten visar/interpolerar tillstånd. Läs `ARCHITECTURE.md` för separering och nätverksprinciper.

## Klart-kriterier per ändring

- Ändringen kan startas eller testas enligt dokumenterade kommandon.
- Inga uppenbara fel i terminal eller webbläsarkonsol, eller så är de redovisade.
- Dokumentationen beskriver aktuell verklighet, inte planerade funktioner som om de redan finns.
