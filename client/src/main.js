import * as THREE from 'three';
import { PROTOCOL_VERSION, SNAPSHOT_TYPE } from '@folkrejs/shared';
import './style.css';

const statusElement = document.querySelector('#connection-status');
const cubeStateElement = document.querySelector('#cube-state');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x182025);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(8, 7, 10);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.querySelector('#app').appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xddeeff, 0x334455, 2));
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.position.set(4, 8, 5);
sun.castShadow = true;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.BoxGeometry(20, 1, 20),
  new THREE.MeshStandardMaterial({ color: 0x66736b, roughness: 1 })
);
ground.position.y = -0.5;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(20, 20, 0x9aab9e, 0x849188);
grid.position.y = 0.01;
scene.add(grid);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1.5, 1.5, 1.5),
  new THREE.MeshStandardMaterial({ color: 0xe85d4a, roughness: 0.65 })
);
cube.castShadow = true;
cube.position.set(0, 4, 0);
scene.add(cube);

let targetPosition = cube.position.clone();
let targetRotation = cube.quaternion.clone();
let socket;
let reconnectTimer;
let lastServerTick = null;

function setStatus(text, className) {
  statusElement.textContent = text;
  statusElement.className = `status ${className}`;
}

function connect() {
  clearTimeout(reconnectTimer);
  setStatus('Ansluter till servern…', 'status-connecting');
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const port = import.meta.env.VITE_WS_PORT || '8080';
  socket = new WebSocket(`${protocol}://${window.location.hostname}:${port}`);

  socket.addEventListener('open', () => {
    setStatus('Server ansluten', 'status-connected');
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.type !== SNAPSHOT_TYPE || message.version !== PROTOCOL_VERSION) {
      return;
    }

    const object = message.objects.find(({ id }) => id === 'test-cube');
    if (!object) {
      return;
    }

    targetPosition.set(object.position.x, object.position.y, object.position.z);
    targetRotation.set(object.rotation.x, object.rotation.y, object.rotation.z, object.rotation.w);
    lastServerTick = message.tick;
    cubeStateElement.textContent = `Serverposition: x ${object.position.x.toFixed(2)}, y ${object.position.y.toFixed(2)}, z ${object.position.z.toFixed(2)}`;
  });

  socket.addEventListener('close', () => {
    setStatus('Server frånkopplad – försöker igen…', 'status-disconnected');
    reconnectTimer = setTimeout(connect, 1000);
  });

  socket.addEventListener('error', () => {
    socket.close();
  });
}

function animate() {
  requestAnimationFrame(animate);
  cube.position.lerp(targetPosition, 0.16);
  cube.quaternion.slerp(targetRotation, 0.16);
  renderer.render(scene, camera);
}

window.render_game_to_text = () => JSON.stringify({
  coordinateSystem: 'x höger, y upp, z mot kameran',
  serverConnected: socket?.readyState === WebSocket.OPEN,
  serverTick: lastServerTick,
  cube: {
    x: Number(cube.position.x.toFixed(2)),
    y: Number(cube.position.y.toFixed(2)),
    z: Number(cube.position.z.toFixed(2))
  }
});

window.advanceTime = (milliseconds) => {
  const frames = Math.max(1, Math.round(milliseconds / (1000 / 60)));
  for (let frame = 0; frame < frames; frame += 1) {
    cube.position.lerp(targetPosition, 0.16);
    cube.quaternion.slerp(targetRotation, 0.16);
  }
  renderer.render(scene, camera);
};

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

connect();
animate();
