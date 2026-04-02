import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MarioGame } from './mario.js';

// Setup basic scene
const canvas = document.querySelector('#three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 60); // Zoomed out for safety

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0, 0);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(10, 10, 10);
scene.add(mainLight);

const rimLight = new THREE.PointLight(0xffffff, 1.0);
rimLight.position.set(-15, 10, -15);
scene.add(rimLight);

// Mario Game Setup
const marioGame = new MarioGame(160, 144);
const screenTexture = new THREE.CanvasTexture(marioGame.getCanvas());
screenTexture.minFilter = THREE.NearestFilter;
screenTexture.magFilter = THREE.NearestFilter;
screenTexture.flipY = false;

// Load Game Boy GLB
let gameboy;
const gltfLoader = new GLTFLoader();

gltfLoader.load('gameboy.glb', (gltf) => {
  gameboy = gltf.scene;
  scene.add(gameboy);

  // Material refinement - Final Aesthetics
  gameboy.traverse((child) => {
    if (child.isMesh) {
      const name = child.name.toLowerCase();
      
      if (name.includes('screen') || name.includes('display') || name.includes('lcd')) {
        child.material = new THREE.MeshBasicMaterial({ 
          map: screenTexture,
          color: 0xffffff,
          side: THREE.DoubleSide
        });
      } else if (child.material) {
        child.material = child.material.clone();
        child.material.color.set(0xaaaaaa); // Consistent premium grey
        child.material.roughness = 0.4;
        child.material.metalness = 0.1;
        
        // Enhance realism with semi-transparent glass if present
        if (name.includes('glass') || name.includes('plastic') || name.includes('cover')) {
            child.material.transparent = true;
            child.material.opacity = 0.4;
        }
      }
    }
  });

  // Zoome-out scaling
  gameboy.scale.set(1.0, 1.0, 1.0);
  
  const box = new THREE.Box3().setFromObject(gameboy);
  const center = box.getCenter(new THREE.Vector3());
  gameboy.position.sub(center);
  
  gameboy.userData.initialY = gameboy.position.y;
});

// Handle Window Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Logic
let signedIn = false;
const signinBtn = document.querySelector('#signin-btn');
const playBtn = document.querySelector('#play-btn');

signinBtn.addEventListener('click', () => {
    signedIn = !signedIn;
    signinBtn.innerHTML = signedIn ? `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        Karman Singh
    ` : `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        sign in
    `;
});

playBtn.addEventListener('click', () => {
    if (!signedIn) {
        alert('Please sign in to play for free!');
    } else if (marioGame) {
        marioGame.gameState = 'PLAYING';
        playBtn.style.display = 'none'; // Hide play button after starting
        document.querySelector('.arrow-container').style.display = 'none'; // Hide arrow
    }
});

// Animation Loop
let lastTime = performance.now();

function animate(timestamp) {
  if (!timestamp) timestamp = performance.now();
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
  lastTime = timestamp;

  controls.update();

  if (marioGame) {
    try {
      marioGame.update(dt);
      marioGame.draw();
    } catch (e) {
      console.warn('Mario Game Error:', e);
    }
    screenTexture.needsUpdate = true;
  }

  if (gameboy && typeof gameboy.userData.initialY === 'number') {
    gameboy.position.y = gameboy.userData.initialY + Math.sin(timestamp * 0.001) * 0.5;
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);
camera.position.set(0, 5, 50); // Restored zoomed-out view
camera.lookAt(0, 0, 0);
