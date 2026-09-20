# GAME DESIGN – Folkrejs

## Känsla och format

Klassiskt folkrace i webbläsare, 1–4 personer över nätverk. Ganska trovärdig massa, grepp, sladd och kollisioner; enkel styrning och låg tröskel. Fokus på körglädje och taktik, inte detaljerad verkstadssimulering. En person ska kunna testköra spelet ensam; datorförare kan komma senare.

## Mål och match

- Ett normalt heat körs över fem varv med 1–4 spelare. Fem varv är standard och ska kunna göras konfigurerbart senare.
- Kör heatets varv och försök nå mål före andra förare.
- Kollisioner med andra bilar får försvåra deras körning och kan sätta dem ur spel.
- Målgång avgör placeringen för förare som fullföljer. Utslagna förare får resultatet DNF och sorteras efter hur långt de kom; exakt tiebreaker och eventuell maxtid behöver speltestas.
- Med endast en deltagare körs heatet mot klockan och sluttiden blir resultatet.

## Drop-in och återkommande heat

- Spelaren ansluter direkt i webbläsaren, anger ett förarnamn och behöver inte skapa ett permanent konto.
- Mellan heat råder uppvärmning. Anslutna spelare får köra fritt medan servern förbereder nästa start.
- Ett heat följer flödet `uppvärmning → nedräkning → race → resultat → uppvärmning` och startar om automatiskt.
- Resultatet visas i tio sekunder. Därefter återställs bilar och komponentskador inför nästa heat.
- Spelare som ansluter under race eller resultat blir väntande/åskådare och deltar automatiskt i nästa heat.
- En utslagen förare återupplivas aldrig under samma heat. Bilen ligger kvar som ett fysiskt hinder tills heatet avslutas.
- Ett heat kan köras med en enda spelare. Fler anslutna spelare, upp till fyra totalt, deltar från nästa start.
- Ingen tung lobby eller separat startmeny krävs i grundversionen; en enkel namnvy, anslutningsstatus och information om aktuell fas räcker.

## Skadesystem: kunna halta hem

- Skador ska påverka bilens faktiska funktioner: exempelvis motor/drivning, styrning, hjulupphängning och tålighet.
- En svårt skadad bil kan få kraftigt reducerad fart, sned styrning och besvärlig väghållning men ska kunna *limpa* tillbaka till depån innan den är definitivt utslagen.
- **Definitivt utslagen = permanent ute ur den aktuella matchen.** Ingen respawn, inga gratisreparationer eller automatisk bärgning.
- Gör inte en hård utslagning enbart för att en generell HP-mätare passerar ett godtyckligt tröskelvärde. Ta fram enkla, begripliga funktionsvillkor och speltesta dem.
- Ett skadat men drivbart fordon ska kunna fortsätta köra efter delvis reparation.

## Depå

- Kör in i depån och stanna i reparationsområdet.
- Så länge bilen står stilla där repareras den stegvis; längre stopp ger mer reparation.
- Föraren kan avbryta depåstoppet när som helst och köra ut med delvis reparerad bil.
- En redan definitivt utslagen bil får inte repareras, även om den skulle befinna sig i depån.
- Reparationshastigheter, eventuell prioritering av komponenter och graden av skydd mot kollisioner inne i depån bestäms efter speltest.

## Basstyrning (förslag)

W/upp = gas; S/ned = broms/back; A/D eller vänster/höger = styr; mellanslag = handbroms. Automatisk växling. Återställning av bil som hamnat på taket är en **öppen designfråga** och får inte bli ett sätt att rädda en utslagen bil eller teleportera till depån.

## Föreslagen första visuella version

Enkel testbana på grus, enkel fyrhjulig bil med tydliga färger och följkamera. Bättre bilmodeller, ljud, effekter och banutsmyckning kommer efter verifierad körkänsla och spelregler.
