import RAPIER from '@dimforge/rapier3d-compat';
import { WebSocketServer } from 'ws';
import { createWorldSnapshot } from '@folkrejs/shared';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8080);
const FIXED_STEP_SECONDS = 1 / 60;
const SNAPSHOT_EVERY_TICKS = 3;
const TEST_BOUNCE_INTERVAL_TICKS = 60 * 3;

await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });

const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
world.createCollider(RAPIER.ColliderDesc.cuboid(10, 0.5, 10), groundBody);

const cubeBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(0, 4, 0)
    .setLinvel(1.2, 0, 0)
);
world.createCollider(
  RAPIER.ColliderDesc.cuboid(0.75, 0.75, 0.75)
    .setRestitution(0.55)
    .setFriction(0.7),
  cubeBody
);

const websocketServer = new WebSocketServer({ host: HOST, port: PORT });
let tick = 0;

function snapshot() {
  return createWorldSnapshot({
    tick,
    position: cubeBody.translation(),
    rotation: cubeBody.rotation()
  });
}

function broadcast() {
  const message = JSON.stringify(snapshot());
  for (const client of websocketServer.clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
}

websocketServer.on('listening', () => {
  console.log(`Folkrejs-server lyssnar på ws://${HOST}:${PORT}`);
});

websocketServer.on('connection', (client) => {
  console.log('Klient ansluten');
  client.send(JSON.stringify(snapshot()));

  client.on('close', () => {
    console.log('Klient frånkopplad');
  });

  client.on('error', (error) => {
    console.error('WebSocket-fel:', error.message);
  });
});

const simulationTimer = setInterval(() => {
  world.step();
  tick += 1;

  // Håller testobjektet synligt rörligt utan att införa spel- eller fordonslogik.
  if (tick % TEST_BOUNCE_INTERVAL_TICKS === 0) {
    cubeBody.applyImpulse({ x: 0, y: 3.5, z: 0 }, true);
  }

  if (tick % SNAPSHOT_EVERY_TICKS === 0) {
    broadcast();
  }
}, FIXED_STEP_SECONDS * 1000);

function shutdown() {
  clearInterval(simulationTimer);
  websocketServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
