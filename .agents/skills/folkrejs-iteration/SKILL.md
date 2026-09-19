---
name: folkrejs-iteration
description: Använd vid en avgränsad utvecklingsiteration i Folkrejs-projektet, exempelvis fysik, webbläsarklient, nätverk, skador, depå, test eller felsökning. Använd inte för helt andra projekt eller för att oombedd bygga flera framtida etapper.
---

# Folkrejs: en verifierbar iteration

1. Läs `AGENTS.md` och aktuell uppgift i `PLAN.md`. Läs enbart berörda delar av `GAME_DESIGN.md`, `ARCHITECTURE.md` och befintlig kod.
2. Sätt ett snävt mål och definiera hur det kontrolleras; bevara fungerande funktioner och användarändringar.
3. Ändra minsta rimliga uppsättning filer. Fatta inte nya spelregler eller inför nya beroenden när det inte behövs.
4. Kör relevanta tester eller starta berörd del. Vid fysik/nätverk: kontrollera vem som äger tillståndet, stabilt fysiksteg och frånkopplingsfall.
5. Uppdatera `PLAN.md` för **verifierat** arbete och bara de dokument vars innehåll faktiskt har förändrats.
6. Rapportera kort på svenska: ändrade filer, vad som fungerar, hur användaren testar, och kvarstående problem. Undvik att återge hela källfiler i chatten.

Särskilt viktigt: en svårt skadad bil ska kunna halta till depån; en definitivt utslagen bil får inte återupplivas. Reparationsgrad beror på faktisk stopptid i depån.
