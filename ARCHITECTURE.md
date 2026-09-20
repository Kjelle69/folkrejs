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

## Serverstyrd matchhanterare

Matchhanteraren ska vara en separat servermodul och får inte byggas in i fordonsfysiken. Den äger:

- matchfas: `warmup`, `countdown`, `racing` eller `results`;
- anslutna spelare, validerade förarnamn och högst fyra aktiva deltagare;
- väntande spelare som anslutit under ett pågående heat;
- heatets fem varv, kontrollpunkter, placering, målgång, DNF och solotid;
- tio sekunders resultatfas och automatisk förberedelse av nästa heat.

Fordonsfysiken äger rigid bodies, rörelse, kollisioner och komponentskador. Matchhanteraren läser tydliga domänhändelser från fysik/banlogik, exempelvis passerad kontrollpunkt, passerad mållinje och definitiv utslagning. Den skickar i sin tur avgränsade kommandon som att låsa startbilar, skapa startuppställning och återställa fordon inför ett nytt heat. Matchhanteraren ska inte applicera krafter eller avgöra kollisionsskada.

Klienten skickar förarnamn och förarindata men beslutar aldrig fas, varv eller resultat. Serverns snapshots kompletteras senare med matchtillstånd och deltagarstatus. En sen anslutning får världstillståndet för åskådning men ingen aktiv tävlingsbil förrän nästa heat.

```text
WebSocket-sessioner ──> Matchhanterare ──> deltagare, fas, varv, resultat
                             ↑    │
                banhändelser │    │ start/reset/låsning
                             │    ↓
                       Banlogik + fordonsfysik
```

Vid `results` ligger utslagna bilar kvar i fysikvärlden. Först när nästa `warmup` förbereds återställs bilar, skador och startpositioner. Matchtillståndet bör kunna testas med en simulerad klocka utan att Rapier behöver köras.

Den rena `MatchManager`-modulen implementerar nu fasövergångarna med en injicerad klocka. Den fryser deltagarlistan när nedräkningen börjar, låter senare anslutningar få status `waiting`, avslutar heatet när alla aktiva är `finished` eller `knockedOut`, sorterar målgång före DNF och återgår till uppvärmning efter tio sekunder. Modulen har inga beroenden till Rapier, WebSocket eller Three.js.

Serverloopen översätter nu `lap-completed` och definitiv utslagning till anrop på matchhanteraren. Under den tillfälliga enspelarinkopplingen körs tre sekunders uppvärmning följt av tre sekunders nedräkning; fysiken låses under nedräkning och resultat. Matchtillstånd skickas som en separat del av världssnapshoten. Matchhanteraren känner fortfarande inte till Rapier-objekt.

Banlogiken ligger i en egen ren servermodul. Fyra kontrollzoner måste passeras i ordningen öst, norr, väst och mål. Modulen producerar händelser för kontrollpunkt, fullbordat varv och målgång; fordonsfysiken lämnar endast bilens position. Teståterställning mitt under ett varv nollställer kontrollsekvensen men tar inte bort redan fullbordade varv.

## Tid och nätverk

- Nuvarande lokala riktvärde: fast fysiksteg 60 Hz och snapshots 30 Hz; mät och justera på Raspberry Pi 5 i stället för att lova viss prestanda.
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

Spelarens bil använder en sammanhängande Rapier-rigid-body och Rapiers `DynamicRayCastVehicleController`. Fyra raycast-hjul sköter fjädring, markkontakt, bromsning och sidgrepp utan separata cylindercolliders; endast bakhjulen får motorkraft. Klienten visar serverns styr- och rotationsvinklar men skickar endast validerad förarindata och interpolerar snapshots; den simulerar inte bilen själv.

Utvecklingsläget kan A/B-testa två uttryckligen artificiella hjälpmedel: direkt girmoment på karossen och gasstyrd minskning av drivhjulens sidgrepp. Båda är avstängda som standard, så grundläget får girrörelse enbart från Rapier-hjulen och kollisioner. Hjulens lokala position, fjädringslängd, styrvinkel och rotation kommer från fordonskontrollern och används av klientens visuella hjul.

Etapp 2 börjar med två dynamiska serverbilar. Bådas transform skickas i samma snapshot och interpoleras på klienten; Rapier avgör bil–bil-kollisionen.
Skada registreras endast när en ny kontakt börjar och baseras på relativ hastighet före kontakten. Motor, styrning och hjul har separata skickvärden som påverkar respektive fordonsfunktion; stillastående kontakt ger inte upprepad skada.
En bil blir definitivt utslagen när motorn är 0% och hjulen högst 70%, eller när styrningen är 0% och hjulen högst 40%. Då ignoreras driv- och styrkrafter permanent för matchen; teståterställningen `R` flyttar bilen men återställer inte komponenter eller utslagningsstatus.
