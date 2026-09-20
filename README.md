# Folkrejs

Webbläsarbaserat folkracespel för 1–4 spelare med serverstyrd fysik, gradvisa skador och reparationsdepå. Etapp 1 innehåller en lokal körprototyp med en Rapier-simulerad bil.

## Projektmapp på Windows

`C:\Users\kjell\Desktop\Programmering\Folkrejs`

Öppna mappen i VS Code och kör kommandona nedan i den inbyggda terminalen.

## Starta lokalt

Installera beroenden (första gången):

```powershell
npm install
```

Starta klient och server tillsammans:

```powershell
npm run dev
```

Öppna sedan `http://localhost:5173`. Klienten visar en enkel grusliknande testbana, en serverstyrd bil och anslutningsstatus.

Styr med W/upp (gas), S/ned (broms/back), A/D eller vänster/höger (styrning), mellanslag (handbroms) och R (återställ bilen). HUD:en visar hastighet, sidledsslipp och uppskattat grepp.

Separat går det även att köra `npm run dev:server` och `npm run dev:client`. Serverns WebSocket lyssnar på `127.0.0.1:8080`; portarna kan ändras med miljövariablerna `PORT`, `HOST` och `VITE_WS_PORT`.

Kontrollera bygget med:

```powershell
npm run check
```

Om serverprocessen stoppas ska klienten visa att servern är frånkopplad och försöka ansluta igen. Starta servern igen för att återansluta.

## Dokument

- `AGENTS.md` – stående instruktioner för Codex i detta repo.
- `PLAN.md` – prioriterad etappplan och avprickning.
- `GAME_DESIGN.md` – spelkänsla, depå, skador och utslagning.
- `ARCHITECTURE.md` – klient/server, nätverk och Pi 5.
- `.agents/skills/folkrejs-iteration/SKILL.md` – lokal skill för små, verifierbara Codex-iterationer.

## Teknisk avgränsning i etapp 1

Servern simulerar en enkel rigid-body-bil med samlade fyrhjuls-krafter för hjulgrepp, styrning, motor, broms och handbroms. Tuningsiffrorna finns i `shared/src/vehicle.js`. Det är ännu inte full hjulfjädring, skador, kollisioner mellan bilar eller multiplayer.

## Status

Etapp 1 är genomförd lokalt. Skador, depå, matchmaking och Raspberry Pi-drift ingår inte ännu.
