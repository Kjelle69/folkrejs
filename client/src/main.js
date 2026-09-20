import * as THREE from 'three';
import { APP_VERSION, DEV_TUNING_TYPE, INPUT_TYPE, PROTOCOL_VERSION, SNAPSHOT_TYPE } from '@folkrejs/shared';
import { OBSTACLE_CONFIG, TRACK_CONFIG, VEHICLE_CONFIG } from '@folkrejs/shared/vehicle';
import './style.css';

const statusElement = document.querySelector('#connection-status');
const vehicleStateElement = document.querySelector('#vehicle-state');
const raceStateElement = document.querySelector('#race-state');
const damageStateElement = document.querySelector('#damage-state');
const gamepadStateElement = document.querySelector('#gamepad-state');
const keys = new Set();
document.querySelector('h1').textContent = `Folkrejs – körprototyp v${APP_VERSION}`;
const devMode = new URLSearchParams(window.location.search).has('dev')
  || window.location.hash.toLowerCase().includes('dev');
const devValues = {};
let devDiagnosticsElement = null;
const devControls = [
  ['mass', 'Vikt (kg)', 500, 1800, 25],
  ['centerOfMassZ', 'Tyngdpunkt (− bak / + fram)', -0.55, 0.55, 0.05],
  ['engineForcePerDrivenWheel', 'Motor', 1500, 18000, 250],
  ['powerOversteer', 'Gassladd', 0, 1, 0.02],
  ['brakeForcePerWheel', 'Broms', 2, 60, 1],
  ['handbrakeForcePerRearWheel', 'Handbroms', 0, 40, 1],
  ['angularDamping', 'Rotationsdämpning', 0, 4, 0.05],
  ['tireFrictionSlip', 'Däckgrepp', 0.5, 4, 0.05],
  ['tireSideFriction', 'Sidgrepp', 0.1, 1.5, 0.02],
  ['rearSideGripScale', 'Bakgrepp ×', 0.3, 1.2, 0.02],
  ['suspensionStiffness', 'Fjädring', 10, 55, 1],
  ['suspensionTravel', 'Fjädringsväg', 0.1, 0.55, 0.01],
  ['maxSteerAngle', 'Styrutslag (°)', 10, 60, 1, Math.PI / 180],
  ['antiRollStrength', 'Krängningshämmare', 0, 40000, 500]
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x182025);
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.querySelector('#app').appendChild(renderer.domElement);

if (devMode) {
  const panel = document.createElement('aside');
  panel.className = 'dev-panel';
  panel.innerHTML = `<h2>Fysiktrimning · v${APP_VERSION} / p${PROTOCOL_VERSION}</h2>`;
  devValues.drivetrain = VEHICLE_CONFIG.drivetrain;
  devValues.artificialYawEnabled = VEHICLE_CONFIG.artificialYawEnabled;
  devValues.powerSlipEnabled = VEHICLE_CONFIG.powerSlipEnabled;
  const drivetrainRow = document.createElement('label');
  drivetrainRow.innerHTML = '<span>Drivning</span><select><option value="rear">Bak</option><option value="front">Fram</option><option value="all">4WD</option></select>';
  drivetrainRow.querySelector('select').value = devValues.drivetrain;
  drivetrainRow.querySelector('select').addEventListener('change', (event) => {
    devValues.drivetrain = event.target.value;
    sendDevTuning();
  });
  panel.appendChild(drivetrainRow);
  for (const [name, label] of [
    ['artificialYawEnabled', 'Extra girmoment'],
    ['powerSlipEnabled', 'Artificiell gassladd']
  ]) {
    const row = document.createElement('label');
    row.className = 'dev-toggle';
    row.innerHTML = `<input type="checkbox"><span>${label}</span>`;
    const checkbox = row.querySelector('input');
    checkbox.checked = devValues[name];
    checkbox.addEventListener('change', () => {
      devValues[name] = checkbox.checked;
      sendDevTuning();
    });
    panel.appendChild(row);
  }
  for (const [name, label, min, max, step, serverScale = 1] of devControls) {
    devValues[name] = VEHICLE_CONFIG[name];
    const displayValue = Number((devValues[name] / serverScale).toFixed(2));
    const row = document.createElement('label');
    row.innerHTML = `<span>${label}: <output>${displayValue}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${displayValue}">`;
    const inputElement = row.querySelector('input');
    const outputElement = row.querySelector('output');
    inputElement.addEventListener('input', () => {
      devValues[name] = Number(inputElement.value) * serverScale;
      outputElement.value = inputElement.value;
      sendDevTuning();
    });
    panel.appendChild(row);
  }
  devDiagnosticsElement = document.createElement('div');
  devDiagnosticsElement.className = 'dev-diagnostics';
  panel.appendChild(devDiagnosticsElement);
  document.querySelector('#app').appendChild(panel);
}

scene.add(new THREE.HemisphereLight(0xddeeff, 0x334455, 2));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(8, 12, 5);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x66736b, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const track = new THREE.Mesh(
  new THREE.RingGeometry(TRACK_CONFIG.innerRadius, TRACK_CONFIG.outerRadius, 96),
  new THREE.MeshStandardMaterial({ color: 0x92704b, roughness: 1 })
);
track.rotation.x = -Math.PI / 2;
track.position.y = 0.015;
scene.add(track);

const innerGrass = new THREE.Mesh(
  new THREE.CircleGeometry(TRACK_CONFIG.innerRadius, 96),
  new THREE.MeshStandardMaterial({ color: 0x526b58, roughness: 1 })
);
innerGrass.rotation.x = -Math.PI / 2;
innerGrass.position.y = 0.02;
scene.add(innerGrass);

const startLine = new THREE.Mesh(
  new THREE.BoxGeometry(0.15, 0.02, 6),
  new THREE.MeshBasicMaterial({ color: 0xf4e6bd })
);
startLine.position.set(0, 0.04, TRACK_CONFIG.startZ);
scene.add(startLine);

for (const checkpoint of TRACK_CONFIG.checkpoints.filter(({ finish }) => !finish)) {
  const marker = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.02, TRACK_CONFIG.outerRadius - TRACK_CONFIG.innerRadius),
    new THREE.MeshBasicMaterial({ color: 0xe9b949, transparent: true, opacity: 0.45 })
  );
  marker.position.set(checkpoint.x, 0.04, checkpoint.z);
  marker.rotation.y = checkpoint.rotationY;
  scene.add(marker);
}

const obstacle = new THREE.Mesh(
  new THREE.BoxGeometry(
    OBSTACLE_CONFIG.halfExtents.x * 2,
    OBSTACLE_CONFIG.halfExtents.y * 2,
    OBSTACLE_CONFIG.halfExtents.z * 2
  ),
  new THREE.MeshStandardMaterial({ color: 0x8b8f92, roughness: 0.9 })
);
obstacle.position.set(
  OBSTACLE_CONFIG.position.x,
  OBSTACLE_CONFIG.position.y,
  OBSTACLE_CONFIG.position.z
);
obstacle.castShadow = true;
obstacle.receiveShadow = true;
scene.add(obstacle);

const car = new THREE.Group();
const chassis = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 0.7, 2.7),
  new THREE.MeshStandardMaterial({ color: 0xe85d4a, roughness: 0.65 })
);
chassis.position.y = 0;
chassis.castShadow = true;
car.add(chassis);

const roof = new THREE.Mesh(
  new THREE.BoxGeometry(1.35, 0.35, 1.25),
  new THREE.MeshStandardMaterial({ color: 0x29343d, roughness: 0.45 })
);
roof.position.set(0, 0.5, -0.05);
roof.castShadow = true;
car.add(roof);

const wheelGeometry = new THREE.CylinderGeometry(
  VEHICLE_CONFIG.wheelRadius,
  VEHICLE_CONFIG.wheelRadius,
  0.18,
  16
);
wheelGeometry.rotateZ(Math.PI / 2);
const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x151719, roughness: 1 });
const wheelMarkerGeometry = new THREE.BoxGeometry(0.025, 0.17, 0.045);
const wheelMarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xc7c9c7 });
const frontWheelPivots = [];
const wheelPivots = [];
const wheelMeshes = [];
for (const { x, z, front } of [
  { x: -0.7, z: 1.1, front: true },
  { x: 0.7, z: 1.1, front: true },
  { x: -0.7, z: -1.1, front: false },
  { x: 0.7, z: -1.1, front: false }
]) {
    const pivot = new THREE.Group();
    pivot.position.set(x, -VEHICLE_CONFIG.chassisHalfExtents.y - VEHICLE_CONFIG.suspensionRestLength, z);
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    const marker = new THREE.Mesh(wheelMarkerGeometry, wheelMarkerMaterial);
    marker.position.set(Math.sign(x) * 0.1, 0.17, 0);
    wheel.add(marker);
    wheel.castShadow = true;
    pivot.add(wheel);
    car.add(pivot);
    wheelPivots.push(pivot);
    wheelMeshes.push(wheel);
    if (front) frontWheelPivots.push(pivot);
}
scene.add(car);

const velocityArrow = new THREE.ArrowHelper(
  new THREE.Vector3(0, 0, 1),
  new THREE.Vector3(),
  3,
  0xffd34d,
  0.35,
  0.18
);
velocityArrow.visible = false;
scene.add(velocityArrow);

const opponentCar = car.clone();
opponentCar.children[0].material = new THREE.MeshStandardMaterial({ color: 0x3478c4, roughness: 0.65 });
scene.add(opponentCar);

let socket;
let reconnectTimer;
let inputTimer;
let lastGamepadInput = '';
let resetButtonWasPressed = false;
let lastGamepadStatusUpdate = 0;
let lastServerTick = null;
const snapshots = [];
const interpolationDelayMs = 75;
const serverTickMs = 1000 / 60;
let latestSnapshotTime = 0;
let serverClockOffsetMs = null;
const interpolatedPosition = new THREE.Vector3();
const interpolatedRotation = new THREE.Quaternion();
const interpolatedOpponentPosition = new THREE.Vector3();
const interpolatedOpponentRotation = new THREE.Quaternion();
const followOffset = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const lookAtTarget = new THREE.Vector3();
const smoothedLookAt = new THREE.Vector3();
const frameClock = new THREE.Clock();
let cameraInitialized = false;
let matchTelemetry = null;
let vehicleTelemetry = {
  speedKmh: 0,
  grip: 1,
  sideSpeed: 0,
  damage: { engine: 100, steering: 100, wheels: 100 },
  knockedOut: false,
  raceProgress: { completedLaps: 0, currentLap: 1, totalLaps: 5, nextCheckpoint: 'east', finished: false },
  lastImpact: { speedKmh: 0, level: 'ingen' }
};

function updateInterpolatedCar(renderTime = performance.now()
  - (serverClockOffsetMs ?? 0) - interpolationDelayMs) {
  while (snapshots.length >= 2 && snapshots[1].time <= renderTime) snapshots.shift();
  if (snapshots.length === 0) return;

  const from = snapshots[0];
  const to = snapshots[1] || from;
  const duration = Math.max(to.time - from.time, 1);
  const alpha = THREE.MathUtils.clamp((renderTime - from.time) / duration, 0, 1);
  interpolatedPosition.lerpVectors(from.position, to.position, alpha);
  interpolatedRotation.copy(from.rotation).slerp(to.rotation, alpha);
  car.position.copy(interpolatedPosition);
  car.quaternion.copy(interpolatedRotation);
  for (let index = 0; index < wheelMeshes.length; index += 1) {
    wheelPivots[index].position.lerpVectors(
      from.wheelPositions[index],
      to.wheelPositions[index],
      alpha
    );
    wheelPivots[index].rotation.y = THREE.MathUtils.lerp(
      from.wheelSteerings[index],
      to.wheelSteerings[index],
      alpha
    );
    wheelMeshes[index].rotation.x = THREE.MathUtils.lerp(
      from.wheelRotations[index],
      to.wheelRotations[index],
      alpha
    );
  }
  if (from.opponentPosition && to.opponentPosition) {
    interpolatedOpponentPosition.lerpVectors(from.opponentPosition, to.opponentPosition, alpha);
    interpolatedOpponentRotation.copy(from.opponentRotation).slerp(to.opponentRotation, alpha);
    opponentCar.position.copy(interpolatedOpponentPosition);
    opponentCar.quaternion.copy(interpolatedOpponentRotation);
  }
}

function setStatus(text, className) {
  statusElement.textContent = text;
  statusElement.className = `status ${className}`;
}

function gamepadInput() {
  const gamepad = activeGamepad();
  if (!gamepad) return { throttle: 0, brake: 0, steering: 0, handbrake: false, reset: false };
  const rawSteering = gamepad.axes[0] || 0;
  const steering = Math.abs(rawSteering) < 0.12
    ? 0
    : Math.sign(rawSteering) * (Math.abs(rawSteering) - 0.12) / 0.88;
  const accelerator = Number((gamepad.buttons[7]?.value || 0).toFixed(3));
  const reverse = Number((gamepad.buttons[6]?.value || 0).toFixed(3));
  return {
    throttle: accelerator - reverse,
    brake: reverse,
    steering: Number(steering.toFixed(3)),
    handbrake: Boolean(gamepad.buttons[0]?.pressed),
    reset: Boolean(gamepad.buttons[3]?.pressed)
  };
}

function activeGamepad() {
  return Array.from(navigator.getGamepads?.() || [])
    .find((candidate) => candidate?.connected) || null;
}

function currentInput() {
  const forward = keys.has('w') || keys.has('arrowup');
  const backward = keys.has('s') || keys.has('arrowdown');
  const gamepad = gamepadInput();
  const keyboardThrottle = forward ? 1 : backward ? -1 : 0;
  const keyboardSteering = (keys.has('a') || keys.has('arrowleft') ? -1 : 0)
    + (keys.has('d') || keys.has('arrowright') ? 1 : 0);
  return {
    type: INPUT_TYPE,
    version: PROTOCOL_VERSION,
    throttle: keyboardThrottle || gamepad.throttle,
    brake: backward ? 1 : gamepad.brake,
    steering: keyboardSteering || gamepad.steering,
    handbrake: keys.has(' ') || gamepad.handbrake,
    gamepadReset: gamepad.reset
  };
}

function resetVehicle() {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: INPUT_TYPE, version: PROTOCOL_VERSION, reset: true }));
  }
}

function sendInput() {
  if (socket?.readyState !== WebSocket.OPEN) return;
  const { gamepadReset, ...networkInput } = currentInput();
  socket.send(JSON.stringify(networkInput));
  if (gamepadReset && !resetButtonWasPressed) resetVehicle();
  resetButtonWasPressed = gamepadReset;
}

function sendDevTuning() {
  if (!devMode || socket?.readyState !== WebSocket.OPEN) return;
  socket.send(JSON.stringify({
    type: DEV_TUNING_TYPE,
    version: PROTOCOL_VERSION,
    values: devValues
  }));
}

function pollGamepad() {
  const signature = JSON.stringify(currentInput());
  if (signature !== lastGamepadInput) {
    lastGamepadInput = signature;
    sendInput();
  }
  const now = performance.now();
  if (now - lastGamepadStatusUpdate < 100) return;
  lastGamepadStatusUpdate = now;
  const gamepad = activeGamepad();
  if (!gamepad) {
    gamepadStateElement.textContent = 'Xbox: ej upptäckt – fokusera sidan och tryck A';
    return;
  }
  const input = gamepadInput();
  gamepadStateElement.textContent = `Xbox ansluten: ${gamepad.id.slice(0, 34)} · spak ${input.steering.toFixed(2)} · LT ${input.brake.toFixed(2)} · RT ${Math.max(input.throttle + input.brake, 0).toFixed(2)}`;
}

function connect() {
  clearTimeout(reconnectTimer);
  setStatus('Ansluter till servern…', 'status-connecting');
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const port = import.meta.env.VITE_WS_PORT || '8080';
  socket = new WebSocket(`${protocol}://${window.location.hostname}:${port}`);
  socket.addEventListener('open', () => {
    snapshots.length = 0;
    serverClockOffsetMs = null;
    setStatus(`Server ansluten · v${APP_VERSION} / p${PROTOCOL_VERSION}`, 'status-connected');
    sendInput();
    sendDevTuning();
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type !== SNAPSHOT_TYPE || message.version !== PROTOCOL_VERSION) return;
    const object = message.objects.find(({ id }) => id === 'player-car');
    const opponent = message.objects.find(({ id }) => id === 'opponent-car');
    if (!object) return;
    const receivedAt = performance.now();
    latestSnapshotTime = message.tick * serverTickMs;
    const measuredClockOffset = receivedAt - latestSnapshotTime;
    serverClockOffsetMs = serverClockOffsetMs === null
      ? measuredClockOffset
      : Math.min(serverClockOffsetMs, measuredClockOffset);
    snapshots.push({
      time: latestSnapshotTime,
      position: new THREE.Vector3(object.position.x, object.position.y, object.position.z),
      rotation: new THREE.Quaternion(object.rotation.x, object.rotation.y, object.rotation.z, object.rotation.w),
      wheelSteering: object.wheelSteering || 0,
      wheelRotations: object.wheelRotations || [0, 0, 0, 0],
      wheelPositions: (object.wheelStates || []).map(({ position }) => new THREE.Vector3(
        position.x,
        position.y,
        position.z
      )),
      wheelSteerings: (object.wheelStates || []).map(({ steering }) => steering),
      opponentPosition: opponent
        ? new THREE.Vector3(opponent.position.x, opponent.position.y, opponent.position.z)
        : null,
      opponentRotation: opponent
        ? new THREE.Quaternion(opponent.rotation.x, opponent.rotation.y, opponent.rotation.z, opponent.rotation.w)
        : null
    });
    if (snapshots.length > 6) snapshots.shift();
    if (snapshots.length === 1) {
      car.position.copy(snapshots[0].position);
      car.quaternion.copy(snapshots[0].rotation);
      if (snapshots[0].opponentPosition) {
        opponentCar.position.copy(snapshots[0].opponentPosition);
        opponentCar.quaternion.copy(snapshots[0].opponentRotation);
      }
    }
    vehicleTelemetry = object;
    matchTelemetry = message.match || null;
    lastServerTick = message.tick;
    vehicleStateElement.textContent = `Hastighet: ${object.speedKmh.toFixed(1)} km/h · Grepp: ${(object.grip * 100).toFixed(0)}% · sidled: ${object.sideSpeed.toFixed(2)} m/s`;
    const progress = object.raceProgress || vehicleTelemetry.raceProgress;
    const nextCheckpoint = TRACK_CONFIG.checkpoints.find(({ id }) => id === progress.nextCheckpoint);
    raceStateElement.textContent = progress.finished
      ? `Mål efter ${progress.totalLaps} varv`
      : `Varv ${progress.currentLap}/${progress.totalLaps} · nästa: ${nextCheckpoint?.label || 'mållinjen'}`;
    const damage = object.damage || vehicleTelemetry.damage;
    const impact = object.lastImpact || vehicleTelemetry.lastImpact;
    const driveStatus = object.knockedOut ? 'UTSLAGEN' : 'körbar';
    damageStateElement.textContent = `Skick: ${driveStatus} · motor ${damage.engine.toFixed(0)}% · styrning ${damage.steering.toFixed(0)}% · hjul ${damage.wheels.toFixed(0)}% · senaste smäll: ${impact.level} ${impact.speedKmh.toFixed(0)} km/h`;
    if (devDiagnosticsElement && object.motion) {
      const degrees = 180 / Math.PI;
      devDiagnosticsElement.innerHTML = [
        `Karossriktning: ${(object.motion.headingAngle * degrees).toFixed(1)}°`,
        `Hastighetsriktning: ${(object.motion.velocityAngle * degrees).toFixed(1)}°`,
        `Sidglidningsvinkel: ${(object.motion.slipAngle * degrees).toFixed(1)}°`,
        `Girhastighet: ${(object.motion.yawRate * degrees).toFixed(1)}°/s`
      ].join('<br>');
    }
  });
  socket.addEventListener('close', () => {
    setStatus('Server frånkopplad – försöker igen…', 'status-disconnected');
    reconnectTimer = setTimeout(connect, 1000);
  });
  socket.addEventListener('error', () => socket.close());
}

function animate() {
  requestAnimationFrame(animate);
  pollGamepad();
  const deltaSeconds = Math.min(frameClock.getDelta(), 0.1);
  updateInterpolatedCar();
  if (devMode && vehicleTelemetry.velocity) {
    const velocityDirection = new THREE.Vector3(
      vehicleTelemetry.velocity.x,
      0,
      vehicleTelemetry.velocity.z
    );
    const horizontalSpeed = velocityDirection.length();
    velocityArrow.visible = horizontalSpeed > 0.25;
    if (velocityArrow.visible) {
      velocityDirection.normalize();
      velocityArrow.position.copy(car.position).add(new THREE.Vector3(0, 2, 0));
      velocityArrow.setDirection(velocityDirection);
      velocityArrow.setLength(Math.min(1.5 + horizontalSpeed * 0.12, 4), 0.35, 0.18);
    }
  } else {
    velocityArrow.visible = false;
  }
  followOffset.set(0, 4.5, -7).applyQuaternion(car.quaternion);
  cameraTarget.copy(car.position).add(followOffset);
  lookAtTarget.set(0, 0.5, 2).applyQuaternion(car.quaternion).add(car.position);
  if (!cameraInitialized) {
    camera.position.copy(cameraTarget);
    smoothedLookAt.copy(lookAtTarget);
    cameraInitialized = true;
  } else {
    camera.position.lerp(cameraTarget, 1 - Math.exp(-5 * deltaSeconds));
    smoothedLookAt.lerp(lookAtTarget, 1 - Math.exp(-8 * deltaSeconds));
  }
  camera.lookAt(smoothedLookAt);
  renderer.render(scene, camera);
}

window.render_game_to_text = () => JSON.stringify({
  coordinateSystem: 'x höger, y upp, z framåt enligt bilens riktning',
  serverConnected: socket?.readyState === WebSocket.OPEN,
  serverTick: lastServerTick,
  car: { x: Number(car.position.x.toFixed(2)), y: Number(car.position.y.toFixed(2)), z: Number(car.position.z.toFixed(2)) },
  opponent: { x: Number(opponentCar.position.x.toFixed(2)), y: Number(opponentCar.position.y.toFixed(2)), z: Number(opponentCar.position.z.toFixed(2)) },
  speedKmh: Number(vehicleTelemetry.speedKmh.toFixed(1)),
  wheelSteering: Number((vehicleTelemetry.wheelSteering || 0).toFixed(2)),
  grip: Number(vehicleTelemetry.grip.toFixed(2)),
  damage: vehicleTelemetry.damage,
  knockedOut: vehicleTelemetry.knockedOut,
  raceProgress: vehicleTelemetry.raceProgress,
  lastImpact: vehicleTelemetry.lastImpact,
  match: matchTelemetry,
  controls: 'Tangentbord: W/S/A/D, Space, R. Xbox: vänster spak, RT gas, LT broms/back, A handbroms, Y återställ'
});

window.advanceTime = (milliseconds) => {
  updateInterpolatedCar(latestSnapshotTime - interpolationDelayMs + milliseconds);
  renderer.render(scene, camera);
};

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'r') {
    event.preventDefault();
    resetVehicle();
    return;
  }
  if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    event.preventDefault();
    keys.add(key);
    sendInput();
  }
});
window.addEventListener('keyup', (event) => {
  keys.delete(event.key.toLowerCase());
  sendInput();
});
window.addEventListener('blur', () => {
  keys.clear();
  sendInput();
});
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Tangentändringar skickas direkt; denna heartbeat håller servern synkroniserad.
inputTimer = setInterval(sendInput, 250);
connect();
animate();
