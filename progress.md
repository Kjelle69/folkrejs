Original prompt: Genomför etapp 0 enligt PLAN.md med npm-workspace, Vite/Three.js-klient, Node/Rapier-server och WebSocket.

- Etapp 0 implementerad: serverstyrd Rapier-kub, markyta, anslutningsstatus och återanslutning.
- Verifierat: `npm install`, `npm run check` och Vite-produktionsbygge.
- Runtime-test verifierat med startad server/klient och webbläsare; testkuben får periodisk fysikimpuls för att vara synligt rörlig.
- WebSocket-frånkoppling verifierad: klienten tar emot serverns stängning utan krasch.
- Nästa etapp: etapp 1, körbar fordonsprototyp.
