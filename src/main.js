
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createGameBoy } from './gameboy.js';
import { MarioGame } from './mario.js';

// Setup basic scene
const canvas = document.querySelector('#three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 18);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 10;
controls.maxDistance = 40;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
backLight.position.set(-5, -5, -10);
scene.add(backLight);

// Mario Game Setup
const marioGame = new MarioGame(160, 144);

// Create Game Boy
const { mesh: gameboy, screenTexture, updateButtons } = createGameBoy(marioGame.getCanvas());
scene.add(gameboy);

// Tilt forward slightly (X axis)
gameboy.rotation.x = -Math.PI / 8; // ~22.5 degrees forward tilt
gameboy.rotation.y = -Math.PI / 8; // slight angle to side for better look

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
let lastTime = 0;

function animate(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  controls.update();

  // Update Game Logic
  marioGame.update(dt);
  marioGame.draw();
  screenTexture.needsUpdate = true;

  // Update Button Animations
  updateButtons(marioGame.controls.keys);

  gameboy.position.y = Math.sin(timestamp * 0.0015) * 0.5;
  // Slowly rotate Y a bit if desired, or keep fixed
  // gameboy.rotation.y = -Math.PI / 8 + Math.sin(timestamp * 0.0005) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
