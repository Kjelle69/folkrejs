export const VEHICLE_CONFIG = Object.freeze({
  mass: 1050,
  centerOfMassZ: 0.25,
  chassisHalfExtents: Object.freeze({ x: 0.85, y: 0.35, z: 1.35 }),
  wheelBase: 2.2,
  trackWidth: 1.4,
  wheelRadius: 0.32,
  suspensionRestLength: 0.28,
  suspensionTravel: 0.49,
  suspensionStiffness: 20,
  suspensionCompression: 3.2,
  suspensionRelaxation: 6.2,
  maxSuspensionForce: 12000,
  tireFrictionSlip: 2.45,
  tireSideFriction: 0.26,
  antiRollStrength: 8000,
  antiRollDamping: 2600,
  engineForcePerDrivenWheel: 16000,
  drivetrain: 'front',
  powerOversteer: 0.72,
  artificialYawEnabled: false,
  powerSlipEnabled: false,
  brakeForcePerWheel: 18,
  handbrakeForcePerRearWheel: 18,
  angularDamping: 0.25,
  rearSideGripScale: 0.52,
  airDrag: 1.5,
  maxSteerAngle: 49 * Math.PI / 180,
  maxForwardSpeed: 28,
  maxReverseSpeed: 10
});

export const TRACK_CONFIG = Object.freeze({
  innerRadius: 30,
  outerRadius: 60,
  startZ: -45,
  laps: 5,
  checkpointRadius: 7,
  checkpoints: Object.freeze([
    Object.freeze({ id: 'east', label: 'östra kontrollen', x: 45, z: 0, rotationY: Math.PI / 2 }),
    Object.freeze({ id: 'north', label: 'norra kontrollen', x: 0, z: 45, rotationY: 0 }),
    Object.freeze({ id: 'west', label: 'västra kontrollen', x: -45, z: 0, rotationY: Math.PI / 2 }),
    Object.freeze({ id: 'finish', label: 'mållinjen', x: 0, z: -45, rotationY: 0, finish: true })
  ])
});

export const OBSTACLE_CONFIG = Object.freeze({
  position: Object.freeze({ x: 30, y: 0.75, z: -45 }),
  halfExtents: Object.freeze({ x: 0.75, y: 0.75, z: 3.5 })
});
