import RAPIER from '@dimforge/rapier3d-compat';
import { WebSocketServer } from 'ws';
import { APP_VERSION, createWorldSnapshot, DEV_TUNING_TYPE, INPUT_TYPE, PROTOCOL_VERSION } from '@folkrejs/shared';
import { OBSTACLE_CONFIG, TRACK_CONFIG, VEHICLE_CONFIG } from '@folkrejs/shared/vehicle';
import { MATCH_PHASE, MatchManager } from './match-manager.js';
import {
  createTrackProgress,
  resetCurrentLap,
  trackProgressSnapshot,
  updateTrackProgress
} from './track-progress.js';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8080);
const FIXED_STEP_SECONDS = 1 / 60;
const SNAPSHOT_EVERY_TICKS = 2;
const START_YAW = Math.PI / 2;
let resetCooldownTicks = 0;

await RAPIER.init();

const world = new RAPIER.World({ x: 0, y: -18, z: 0 });
const groundBody = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
world.createCollider(RAPIER.ColliderDesc.cuboid(150, 0.1, 150).setFriction(0.05), groundBody);

function createCarBody(x, z, yaw = START_YAW) {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(x, 0.7, z)
    .setRotation({ x: 0, y: Math.sin(yaw / 2), z: 0, w: Math.cos(yaw / 2) })
    .setLinearDamping(0.05)
    .setAngularDamping(VEHICLE_CONFIG.angularDamping)
    .setAdditionalSolverIterations(4)
    .setCcdEnabled(true)
    .enabledRotations(true, true, true)
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(
    VEHICLE_CONFIG.chassisHalfExtents.x,
    VEHICLE_CONFIG.chassisHalfExtents.y,
    VEHICLE_CONFIG.chassisHalfExtents.z
    ).setMass(VEHICLE_CONFIG.mass).setFriction(0.05).setRestitution(0.05).setContactSkin(0.025),
    body
  );
  return { body, collider };
}

const playerCar = createCarBody(0, TRACK_CONFIG.startZ);
const opponentCar = createCarBody(12, TRACK_CONFIG.startZ);
const obstacleBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.fixed().setTranslation(
    OBSTACLE_CONFIG.position.x,
    OBSTACLE_CONFIG.position.y,
    OBSTACLE_CONFIG.position.z
  )
);
const obstacleCollider = world.createCollider(
  RAPIER.ColliderDesc.cuboid(
    OBSTACLE_CONFIG.halfExtents.x,
    OBSTACLE_CONFIG.halfExtents.y,
    OBSTACLE_CONFIG.halfExtents.z
  ).setFriction(0.4).setRestitution(0.05),
  obstacleBody
);
const carBody = playerCar.body;
const opponentBody = opponentCar.body;
const vehicleController = world.createVehicleController(carBody);
vehicleController.indexUpAxis = 1;
vehicleController.setIndexForwardAxis = 2;
const playerDamage = { engine: 100, steering: 100, wheels: 100 };
const opponentDamage = { engine: 100, steering: 100, wheels: 100 };
let lastImpact = { speedKmh: 0, level: 'ingen' };
let carsWereTouching = false;
let obstacleWasTouching = false;
let playerTrackProgress = createTrackProgress();
const matchManager = new MatchManager({ now: () => performance.now() });
matchManager.join('player-car', 'Förare');
const WARMUP_MS = 3000;
let playerKnockoutReported = false;

function isPlayerKnockedOut() {
  return (playerDamage.engine <= 0 && playerDamage.wheels <= 70)
    || (playerDamage.steering <= 0 && playerDamage.wheels <= 40);
}

const websocketServer = new WebSocketServer({ host: HOST, port: PORT });
let tick = 0;
let input = { throttle: 0, brake: 0, steering: 0, handbrake: false };
const vehicleTuning = { ...VEHICLE_CONFIG };
const tuningLimits = Object.freeze({
  mass: [500, 1800],
  centerOfMassZ: [-0.55, 0.55],
  engineForcePerDrivenWheel: [1500, 18000],
  powerOversteer: [0, 1],
  brakeForcePerWheel: [2, 60],
  handbrakeForcePerRearWheel: [0, 40],
  angularDamping: [0, 4],
  rearSideGripScale: [0.3, 1.2],
  tireFrictionSlip: [0.5, 4],
  tireSideFriction: [0.1, 1.5],
  suspensionStiffness: [10, 55],
  suspensionTravel: [0.1, 0.55],
  maxSteerAngle: [10 * Math.PI / 180, 60 * Math.PI / 180],
  antiRollStrength: [0, 40000]
});

function applyPlayerMassProperties() {
  const { x, y, z } = VEHICLE_CONFIG.chassisHalfExtents;
  const width = x * 2;
  const height = y * 2;
  const depth = z * 2;
  const mass = vehicleTuning.mass;
  playerCar.collider.setMass(0);
  carBody.setAdditionalMassProperties(
    mass,
    { x: 0, y: 0, z: vehicleTuning.centerOfMassZ },
    {
      x: mass * (height ** 2 + depth ** 2) / 12,
      y: mass * (width ** 2 + depth ** 2) / 12,
      z: mass * (width ** 2 + height ** 2) / 12
    },
    { x: 0, y: 0, z: 0, w: 1 },
    true
  );
}

applyPlayerMassProperties();

const wheels = [
  { x: -0.7, z: 1.1, front: true },
  { x: 0.7, z: 1.1, front: true },
  { x: -0.7, z: -1.1, front: false },
  { x: 0.7, z: -1.1, front: false }
];

for (const wheel of wheels) {
  vehicleController.addWheel(
    { x: wheel.x, y: -VEHICLE_CONFIG.chassisHalfExtents.y, z: wheel.z },
    { x: 0, y: -1, z: 0 },
    { x: -1, y: 0, z: 0 },
    VEHICLE_CONFIG.suspensionRestLength,
    VEHICLE_CONFIG.wheelRadius
  );
  const index = vehicleController.numWheels() - 1;
  vehicleController.setWheelMaxSuspensionTravel(index, VEHICLE_CONFIG.suspensionTravel);
  vehicleController.setWheelSuspensionStiffness(index, VEHICLE_CONFIG.suspensionStiffness);
  vehicleController.setWheelSuspensionCompression(index, VEHICLE_CONFIG.suspensionCompression);
  vehicleController.setWheelSuspensionRelaxation(index, VEHICLE_CONFIG.suspensionRelaxation);
  vehicleController.setWheelMaxSuspensionForce(index, VEHICLE_CONFIG.maxSuspensionForce);
  vehicleController.setWheelFrictionSlip(index, VEHICLE_CONFIG.tireFrictionSlip);
  vehicleController.setWheelSideFrictionStiffness(index, VEHICLE_CONFIG.tireSideFriction);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function rotateVector(vector, rotation) {
  const ix = rotation.w * vector.x + rotation.y * vector.z - rotation.z * vector.y;
  const iy = rotation.w * vector.y + rotation.z * vector.x - rotation.x * vector.z;
  const iz = rotation.w * vector.z + rotation.x * vector.y - rotation.y * vector.x;
  const iw = -rotation.x * vector.x - rotation.y * vector.y - rotation.z * vector.z;
  return {
    x: ix * rotation.w + iw * -rotation.x + iy * -rotation.z - iz * -rotation.y,
    y: iy * rotation.w + iw * -rotation.y + iz * -rotation.x - ix * -rotation.z,
    z: iz * rotation.w + iw * -rotation.z + ix * -rotation.y - iy * -rotation.x
  };
}

function horizontalDirection(localDirection, rotation) {
  const direction = rotateVector(localDirection, rotation);
  const length = Math.hypot(direction.x, direction.z) || 1;
  return { x: direction.x / length, y: 0, z: direction.z / length };
}

function inverseRotateVector(vector, rotation) {
  return rotateVector(vector, {
    x: -rotation.x,
    y: -rotation.y,
    z: -rotation.z,
    w: rotation.w
  });
}

function stabilizeBodyRoll() {
  const up = rotateVector({ x: 0, y: 1, z: 0 }, carBody.rotation());
  const angularVelocity = carBody.angvel();
  carBody.applyTorqueImpulse({
    x: (-up.z * vehicleTuning.antiRollStrength
      - angularVelocity.x * vehicleTuning.antiRollDamping) * FIXED_STEP_SECONDS,
    y: 0,
    z: (up.x * vehicleTuning.antiRollStrength
      - angularVelocity.z * vehicleTuning.antiRollDamping) * FIXED_STEP_SECONDS
  }, true);
}

function vehicleTelemetry(body, id, damage) {
  const velocity = body.linvel();
  const rotation = body.rotation();
  const forward = horizontalDirection({ x: 0, y: 0, z: 1 }, rotation);
  const side = horizontalDirection({ x: 1, y: 0, z: 0 }, rotation);
  const forwardSpeed = dot(velocity, forward);
  const sideSpeed = dot(velocity, side);
  const speed = Math.hypot(velocity.x, velocity.z);
  const headingAngle = Math.atan2(forward.x, forward.z);
  const velocityAngle = speed > 0.05 ? Math.atan2(velocity.x, velocity.z) : headingAngle;
  const wheelStates = id === 'player-car' ? wheels.map((_, index) => {
    const connection = vehicleController.wheelChassisConnectionPointCs(index);
    const direction = vehicleController.wheelDirectionCs(index);
    const suspensionLength = vehicleController.wheelSuspensionLength(index)
      ?? vehicleTuning.suspensionRestLength;
    const contact = vehicleController.wheelIsInContact(index);
    const contactPoint = vehicleController.wheelContactPoint(index);
    const contactNormal = vehicleController.wheelContactNormal(index);
    let localPosition = {
      x: connection.x + direction.x * suspensionLength,
      y: connection.y + direction.y * suspensionLength,
      z: connection.z + direction.z * suspensionLength
    };
    if (contact && contactPoint && contactNormal) {
      const bodyPosition = body.translation();
      localPosition = inverseRotateVector({
        x: contactPoint.x + contactNormal.x * vehicleTuning.wheelRadius - bodyPosition.x,
        y: contactPoint.y + contactNormal.y * vehicleTuning.wheelRadius - bodyPosition.y,
        z: contactPoint.z + contactNormal.z * vehicleTuning.wheelRadius - bodyPosition.z
      }, rotation);
    }
    return {
      position: localPosition,
      steering: vehicleController.wheelSteering(index) || 0,
      rotation: vehicleController.wheelRotation(index) || 0,
      suspensionLength,
      contact
    };
  }) : undefined;

  return {
    id,
    position: body.translation(),
    rotation,
    velocity,
    speedKmh: speed * 3.6,
    forwardSpeed,
    sideSpeed,
    grip: clamp(1 - Math.abs(sideSpeed) / 8, 0, 1),
    wheelSteering: id === 'player-car' ? (vehicleController.wheelSteering(0) || 0) : 0,
    wheelRotations: id === 'player-car'
      ? wheels.map((_, index) => vehicleController.wheelRotation(index) || 0)
      : [0, 0, 0, 0],
    wheelStates,
    motion: {
      headingAngle,
      velocityAngle,
      slipAngle: Math.atan2(sideSpeed, Math.max(Math.abs(forwardSpeed), 0.1)),
      yawRate: body.angvel().y
    },
    damage,
    knockedOut: id === 'player-car' ? isPlayerKnockedOut() : false,
    raceProgress: id === 'player-car' ? trackProgressSnapshot(playerTrackProgress) : undefined,
    lastImpact: id === 'player-car' ? lastImpact : undefined
  };
}

function updateVehicleController(drivingAllowed) {
  const telemetry = vehicleTelemetry(carBody, 'player-car', playerDamage);
  const speed = Math.hypot(telemetry.velocity.x, telemetry.velocity.z);
  const engineSpeedLimit = input.throttle >= 0
    ? VEHICLE_CONFIG.maxForwardSpeed
    : VEHICLE_CONFIG.maxReverseSpeed;
  const engineSpeed = input.throttle >= 0
    ? Math.max(telemetry.forwardSpeed, 0)
    : Math.max(-telemetry.forwardSpeed, 0);
  const engineScale = clamp(1 - engineSpeed / engineSpeedLimit, 0, 1);
  const wheelEfficiency = playerDamage.wheels / 100;
  const controlsLocked = !drivingAllowed || resetCooldownTicks > 0 || isPlayerKnockedOut();
  const throttleOpposesMotion = input.throttle === 0
    || Math.sign(input.throttle) !== Math.sign(telemetry.forwardSpeed);
  const brakingToChangeDirection = input.brake > 0
    && Math.abs(telemetry.forwardSpeed) > 0.3
    && throttleOpposesMotion;
  const engineForce = controlsLocked || brakingToChangeDirection ? 0
    : input.throttle * engineScale * vehicleTuning.engineForcePerDrivenWheel
      * (0.25 + playerDamage.engine / 100 * 0.75);
  const regularBrake = controlsLocked ? vehicleTuning.brakeForcePerWheel
    : brakingToChangeDirection ? input.brake * vehicleTuning.brakeForcePerWheel : 0;
  const steering = controlsLocked ? 0
    : -input.steering * vehicleTuning.maxSteerAngle
      * (0.3 + playerDamage.steering / 100 * 0.7);
  const drivenWheelCount = vehicleTuning.drivetrain === 'all' ? 4 : 2;
  const driveForceScale = 2 / drivenWheelCount;

  wheels.forEach((wheel, index) => {
    const driven = vehicleTuning.drivetrain === 'all'
      || (vehicleTuning.drivetrain === 'front' ? wheel.front : !wheel.front);
    vehicleController.setWheelEngineForce(index, driven ? engineForce * driveForceScale : 0);
    vehicleController.setWheelSteering(index, wheel.front ? steering : 0);
    vehicleController.setWheelBrake(index, regularBrake
      + (!wheel.front && input.handbrake ? vehicleTuning.handbrakeForcePerRearWheel : 0));
    vehicleController.setWheelFrictionSlip(index,
      vehicleTuning.tireFrictionSlip * (0.35 + wheelEfficiency * 0.65));
    const throttleSlip = vehicleTuning.powerSlipEnabled && driven
      ? Math.abs(input.throttle) * clamp(speed / 4, 0, 1) * vehicleTuning.powerOversteer
      : 0;
    const axleGripScale = wheel.front ? 1 : vehicleTuning.rearSideGripScale;
    const sideFriction = vehicleTuning.tireSideFriction * axleGripScale
      * (1 - throttleSlip * 0.95);
    vehicleController.setWheelSideFrictionStiffness(index,
      !wheel.front && input.handbrake ? 0.03 : sideFriction);
  });

  const oversteerDriveScale = vehicleTuning.drivetrain === 'rear'
    ? 1
    : vehicleTuning.drivetrain === 'all' ? 0.3 : 0;
  if (vehicleTuning.artificialYawEnabled
      && !controlsLocked
      && Math.abs(input.throttle) > 0.2
      && Math.abs(input.steering) > 0.05) {
    carBody.applyTorqueImpulse({
      x: 0,
      y: -input.steering * Math.abs(input.throttle) * vehicleTuning.powerOversteer
        * oversteerDriveScale * clamp(speed / 5, 0, 1) * 22000 * FIXED_STEP_SECONDS,
      z: 0
    }, true);
  }

  vehicleController.updateVehicle(FIXED_STEP_SECONDS);
  stabilizeBodyRoll();

  if (speed > 0) {
    carBody.applyImpulse({
      x: -telemetry.velocity.x * speed * VEHICLE_CONFIG.airDrag * FIXED_STEP_SECONDS,
      y: 0,
      z: -telemetry.velocity.z * speed * VEHICLE_CONFIG.airDrag * FIXED_STEP_SECONDS
    }, true);
  }
}

function limitVehicleSpeed() {
  const telemetry = vehicleTelemetry(carBody, 'player-car', playerDamage);
  const rotation = telemetry.rotation;
  const forward = horizontalDirection({ x: 0, y: 0, z: 1 }, rotation);
  const limit = telemetry.forwardSpeed >= 0
    ? VEHICLE_CONFIG.maxForwardSpeed
    : VEHICLE_CONFIG.maxReverseSpeed;
  if (Math.abs(telemetry.forwardSpeed) <= limit) return;

  const excess = telemetry.forwardSpeed - Math.sign(telemetry.forwardSpeed) * limit;
  carBody.setLinvel({
    x: telemetry.velocity.x - forward.x * excess,
    y: telemetry.velocity.y,
    z: telemetry.velocity.z - forward.z * excess
  }, true);
}

function stabilizeStoppedVehicle() {
  const telemetry = vehicleTelemetry(carBody, 'player-car', playerDamage);
  const noInput = Math.abs(input.throttle) < 0.01
    && input.brake < 0.01
    && Math.abs(input.steering) < 0.01
    && !input.handbrake;
  if (noInput && Math.hypot(telemetry.velocity.x, telemetry.velocity.z) < 1) {
    carBody.setLinvel({ x: 0, y: telemetry.velocity.y, z: 0 }, true);
    carBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
}

function applyCollisionDamage(relativeImpactSpeed, impactPosition, damagesOpponent = false) {
  const speedKmh = relativeImpactSpeed * 3.6;
  const level = relativeImpactSpeed < 2.5 ? 'lätt'
    : relativeImpactSpeed < 6 ? 'medel' : 'hård';
  lastImpact = { speedKmh, level };
  if (relativeImpactSpeed < 2.5) return;

  const amount = clamp((relativeImpactSpeed - 2.5) * 3, 0, 25);
  const playerPosition = carBody.translation();
  const distance = Math.hypot(
    impactPosition.x - playerPosition.x,
    impactPosition.z - playerPosition.z
  ) || 1;
  const rotation = carBody.rotation();
  const forward = horizontalDirection({ x: 0, y: 0, z: 1 }, rotation);
  const forwardAlignment = Math.abs(
    forward.x * (impactPosition.x - playerPosition.x) / distance
    + forward.z * (impactPosition.z - playerPosition.z) / distance
  );

  if (forwardAlignment > 0.65) {
    playerDamage.engine = clamp(playerDamage.engine - amount, 0, 100);
    playerDamage.wheels = clamp(playerDamage.wheels - amount * 0.35, 0, 100);
  } else {
    playerDamage.steering = clamp(playerDamage.steering - amount, 0, 100);
    playerDamage.wheels = clamp(playerDamage.wheels - amount * 0.7, 0, 100);
  }
  if (damagesOpponent) {
    opponentDamage.engine = clamp(opponentDamage.engine - amount * 0.6, 0, 100);
    opponentDamage.wheels = clamp(opponentDamage.wheels - amount * 0.25, 0, 100);
  }
}

function resetVehicle() {
  carBody.setTranslation({ x: 0, y: 0.7, z: TRACK_CONFIG.startZ }, true);
  carBody.setRotation({ x: 0, y: Math.sin(START_YAW / 2), z: 0, w: Math.cos(START_YAW / 2) }, true);
  carBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  carBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  opponentBody.setTranslation({ x: 12, y: 0.7, z: TRACK_CONFIG.startZ }, true);
  opponentBody.setRotation({ x: 0, y: Math.sin(START_YAW / 2), z: 0, w: Math.cos(START_YAW / 2) }, true);
  opponentBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  opponentBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  carsWereTouching = false;
  obstacleWasTouching = false;
  resetCurrentLap(playerTrackProgress);
  input = { throttle: 0, brake: 1, steering: 0, handbrake: false };
  resetCooldownTicks = 30;
  broadcast();
}

function prepareHeatVehicles() {
  Object.assign(playerDamage, { engine: 100, steering: 100, wheels: 100 });
  Object.assign(opponentDamage, { engine: 100, steering: 100, wheels: 100 });
  lastImpact = { speedKmh: 0, level: 'ingen' };
  playerTrackProgress = createTrackProgress();
  playerKnockoutReported = false;
  resetVehicle();
}

function broadcast() {
  const message = JSON.stringify(createWorldSnapshot({
    tick,
    match: matchManager.snapshot(),
    vehicles: [
      vehicleTelemetry(carBody, 'player-car', playerDamage),
      vehicleTelemetry(opponentBody, 'opponent-car', opponentDamage)
    ]
  }));
  for (const client of websocketServer.clients) {
    if (client.readyState === 1) client.send(message);
  }
}

websocketServer.on('listening', () => {
  console.log(`Folkrejs-server v${APP_VERSION} / protokoll ${PROTOCOL_VERSION} lyssnar på ws://${HOST}:${PORT}`);
});

websocketServer.on('connection', (client) => {
  console.log('Klient ansluten');
  client.send(JSON.stringify(createWorldSnapshot({
    tick,
    match: matchManager.snapshot(),
    vehicles: [
      vehicleTelemetry(carBody, 'player-car', playerDamage),
      vehicleTelemetry(opponentBody, 'opponent-car', opponentDamage)
    ]
  })));

  client.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message.type === DEV_TUNING_TYPE && message.version === PROTOCOL_VERSION) {
        for (const [name, limits] of Object.entries(tuningLimits)) {
          if (!Number.isFinite(message.values?.[name])) continue;
          vehicleTuning[name] = clamp(message.values[name], limits[0], limits[1]);
        }
        if (['front', 'rear', 'all'].includes(message.values?.drivetrain)) {
          vehicleTuning.drivetrain = message.values.drivetrain;
        }
        for (const name of ['artificialYawEnabled', 'powerSlipEnabled']) {
          if (typeof message.values?.[name] === 'boolean') vehicleTuning[name] = message.values[name];
        }
        applyPlayerMassProperties();
        carBody.setAngularDamping(vehicleTuning.angularDamping);
        for (let index = 0; index < wheels.length; index += 1) {
          vehicleController.setWheelSuspensionStiffness(index, vehicleTuning.suspensionStiffness);
          vehicleController.setWheelMaxSuspensionTravel(index, vehicleTuning.suspensionTravel);
        }
        return;
      }
      if (message.type !== INPUT_TYPE || message.version !== PROTOCOL_VERSION) return;
      if (message.reset === true) {
        resetVehicle();
        return;
      }
      input = {
        throttle: clamp(Number(message.throttle) || 0, -1, 1),
        brake: clamp(Number(message.brake) || 0, 0, 1),
        steering: clamp(Number(message.steering) || 0, -1, 1),
        handbrake: Boolean(message.handbrake)
      };
    } catch {
      // Ignorera trasiga klientmeddelanden; servern behåller senaste giltiga indata.
    }
  });

  client.on('close', () => {
    input = { throttle: 0, brake: 1, steering: 0, handbrake: false };
    console.log('Klient frånkopplad');
  });
  client.on('error', (error) => console.error('WebSocket-fel:', error.message));
});

function simulateStep() {
  const previousPhase = matchManager.phase;
  matchManager.update();
  if (previousPhase === MATCH_PHASE.RESULTS && matchManager.phase === MATCH_PHASE.WARMUP) {
    prepareHeatVehicles();
  }
  if (matchManager.phase === MATCH_PHASE.WARMUP
      && performance.now() - matchManager.phaseStartedAt >= WARMUP_MS) {
    prepareHeatVehicles();
    matchManager.beginCountdown();
  }
  const playerVelocity = carBody.linvel();
  const opponentVelocity = opponentBody.linvel();
  const relativeImpactSpeed = Math.hypot(
    playerVelocity.x - opponentVelocity.x,
    playerVelocity.z - opponentVelocity.z
  );
  const drivingAllowed = matchManager.phase === MATCH_PHASE.WARMUP
    || matchManager.phase === MATCH_PHASE.RACING;
  updateVehicleController(drivingAllowed);
  if (resetCooldownTicks > 0 || !drivingAllowed) {
    carBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    carBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
  world.step();
  let carsAreTouching = false;
  world.contactPair(playerCar.collider, opponentCar.collider, () => {
    carsAreTouching = true;
  });
  if (carsAreTouching && !carsWereTouching) {
    applyCollisionDamage(relativeImpactSpeed, opponentBody.translation(), true);
  }
  carsWereTouching = carsAreTouching;
  let obstacleIsTouching = false;
  world.contactPair(playerCar.collider, obstacleCollider, () => {
    obstacleIsTouching = true;
  });
  if (obstacleIsTouching && !obstacleWasTouching) {
    applyCollisionDamage(
      Math.hypot(playerVelocity.x, playerVelocity.z),
      OBSTACLE_CONFIG.position
    );
  }
  obstacleWasTouching = obstacleIsTouching;
  const trackEvents = matchManager.phase === MATCH_PHASE.RACING
    ? updateTrackProgress(playerTrackProgress, carBody.translation())
    : [];
  for (const event of trackEvents) {
    if (event.type === 'lap-completed') matchManager.recordLap('player-car');
  }
  if (matchManager.phase === MATCH_PHASE.RACING
      && isPlayerKnockedOut()
      && !playerKnockoutReported) {
    matchManager.knockOut('player-car');
    playerKnockoutReported = true;
  }
  limitVehicleSpeed();
  if (resetCooldownTicks > 0) {
    carBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    carBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
  stabilizeStoppedVehicle();
  if (resetCooldownTicks > 0) resetCooldownTicks -= 1;
  tick += 1;
  if (tick % SNAPSHOT_EVERY_TICKS === 0) broadcast();
}

let previousTime = performance.now();
let accumulatedSeconds = 0;
const simulationTimer = setInterval(() => {
  const now = performance.now();
  accumulatedSeconds += Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  while (accumulatedSeconds >= FIXED_STEP_SECONDS) {
    simulateStep();
    accumulatedSeconds -= FIXED_STEP_SECONDS;
  }
}, 4);

function shutdown() {
  clearInterval(simulationTimer);
  websocketServer.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
