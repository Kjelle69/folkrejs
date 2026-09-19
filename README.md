# Folkrejs

Webbläsarbaserat folkracespel för 1–4 spelare med serverstyrd fysik, gradvisa skador och reparationsdepå. Etapp 0 innehåller en minimal klient/server-demonstration med en Rapier-simulerad kub.

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

Öppna sedan `http://localhost:5173`. Vite-klienten visar en markyta, en kub vars position beräknas av Rapier på servern och anslutningsstatus.

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

## Första uppdraget till Codex

> Läs AGENTS.md, PLAN.md och ARCHITECTURE.md. Inspektera befintliga filer. Genomför endast etapp 0: sätt upp lokal npm-workspace, minimal Three.js/Vite-klient, separat Node/Rapier-server och WebSocket-anslutning. Visa ett objekt vars position beräknas på servern. Verifiera start och frånkoppling. Uppdatera PLAN.md och README.md med verkliga startkommandon. Implementera inte bilar eller spelregler ännu.

## Status

Etapp 0 är genomförd. Bilar, bana, skador, depå, matchmaking och Raspberry Pi-drift ingår inte ännu.
