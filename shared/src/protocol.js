export const APP_VERSION = '20260921g';
export const PROTOCOL_VERSION = 4;
export const SNAPSHOT_TYPE = 'world-snapshot';
export const INPUT_TYPE = 'vehicle-input';
export const DEV_TUNING_TYPE = 'dev-tuning';

export function createWorldSnapshot({ tick, vehicles, match }) {
  return {
    type: SNAPSHOT_TYPE,
    appVersion: APP_VERSION,
    version: PROTOCOL_VERSION,
    tick,
    match,
    objects: vehicles.map((vehicle) => ({
        id: vehicle.id,
        position: { x: vehicle.position.x, y: vehicle.position.y, z: vehicle.position.z },
        rotation: { x: vehicle.rotation.x, y: vehicle.rotation.y, z: vehicle.rotation.z, w: vehicle.rotation.w },
        velocity: { x: vehicle.velocity.x, y: vehicle.velocity.y, z: vehicle.velocity.z },
        speedKmh: vehicle.speedKmh,
        forwardSpeed: vehicle.forwardSpeed,
        sideSpeed: vehicle.sideSpeed,
        grip: vehicle.grip,
        wheelSteering: vehicle.wheelSteering,
        wheelRotations: vehicle.wheelRotations,
        wheelStates: vehicle.wheelStates,
        motion: vehicle.motion,
        damage: vehicle.damage,
        knockedOut: vehicle.knockedOut,
        raceProgress: vehicle.raceProgress,
        lastImpact: vehicle.lastImpact
      }))
  };
}
