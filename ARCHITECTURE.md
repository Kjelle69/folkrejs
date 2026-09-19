# ARCHITECTURE – Folkrejs

## Driftmål

Utveckling lokalt på Windows i `C:\Users\kjell\Desktop\Programmering\Folkrejs`. Senare kan Raspberry Pi 5 med 64-bitars Linux vara värd för spelservern. Webbläsare på datorer fungerar som klienter. Spelet ska även kunna köras lokalt utan att Pi:n är tillgänglig.

## Föreslagen teknik

- `client/`: Vite, JavaScript ES Modules, Three.js; rendering, kamera, inmatning, HUD och mottagning av serverns världstillstånd.
- `server/`: Node.js, Rapier 3D (headless) och WebSocket; världstillstånd, fysik, skador, tävlingsregler och depå.
- `shared/`: små gemensamma meddelandedefinitioner, konfiguration och validering där det behövs.
- Root: npm workspaces, enhetliga startskript och dokumentation.

Teknikvalen är projektets utgångspunkt, inte ett krav att installera alla beroenden innan de används.

## Dataflöde

```text
Tangentbord -> klientens indata -> WebSocket -> Node-server
                                          | serverns fasta fysiksteg
                                          | kollisioner/skador/spellogik
Three.js <- interpolerat världstillstånd <- WebSocket <- server
```

Servern är auktoritativ: klienten får inte själv bestämma träffar, skador, varv eller målgång. Undvik dubbel simulering av oberoende 'sanningar'. Servern ska validera och begränsa indata. För lokal testkörning räcker det först med en klient och ett serverstyrt objekt.

## Tid och nätverk

- Inledande riktvärde: fast fysiksteg 60 Hz, snapshots runt 20 Hz; mät och justera på Raspberry Pi 5 i stället för att lova viss prestanda.
- Renderingen får ha egen frekvens. Klienten interpolerar mellan mottagna snapshots för fjärrbilar; eventuell lokal prediktion och reconciliation är en senare etapp.
- Ha explicit, versionsbart meddelandeformat. Hantera anslutning, avbrott och fel utan att webbläsaren låser sig.
- Bind utvecklingsservern mot localhost som standard. Gör nätverksåtkomst till ett uttryckligt konfigurationsval.

## Säkerhet och distribution

Öppna inte Raspberry Pi:ns WebSocket-port direkt mot internet som ett förvalt installationssteg. För spel med en liten betrodd grupp kan privat nätverk/tunnel övervägas; för publikt spel behövs TLS/WSS, autentisering/rumskontroll, rimliga trafikgränser och genomtänkt hosting. Lägg inte hemligheter i Git. Ingen internetpublicering ingår i etapp 0.

## Praktiska designregler

- Separera fysikobjekt och visuell modell via objekt-ID. Koppla inte spellogik till Three.js-scengrafen.
- Isolera tuningsiffror (fordons- och reparationsparametrar) från implementationen.
- Börja med enkel sammanhängande rigid-body-bil och hjulkrafter/fjädringsmodell; bygg inte ett fullständigt deformabelt chassi i första versionen.
- Lägg till testbar simulering och tydliga start/stopp-kommandon innan fler spelfunktioner införs.
