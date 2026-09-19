export const PROTOCOL_VERSION = 1;
export const SNAPSHOT_TYPE = 'world-snapshot';

export function createWorldSnapshot({ tick, position, rotation }) {
  return {
    type: SNAPSHOT_TYPE,
    version: PROTOCOL_VERSION,
    tick,
    objects: [
      {
        id: 'test-cube',
        position: { x: position.x, y: position.y, z: position.z },
        rotation: { x: rotation.x, y: rotation.y, z: rotation.z, w: rotation.w }
      }
    ]
  };
}
