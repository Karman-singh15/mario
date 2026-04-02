
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MarioGame } from './mario.js';

// Setup basic scene
const canvas = document.querySelector('#three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d0d0d); // Dark background common in premium mockups

// Camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 50); // Zoomed out and slightly raised for a better default view
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 50;
controls.autoRotate = false; // Let user move it manually like in mockup

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Key light
const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
mainLight.position.set(10, 10, 10);
scene.add(mainLight);

// Rim light (makes the edges pop)
const rimLight = new THREE.PointLight(0xffffff, 1.5);
rimLight.position.set(-15, 10, -15);
scene.add(rimLight);

// Fill light
const fillLight = new THREE.PointLight(0xffffff, 0.5);
fillLight.position.set(5, -10, 5);
scene.add(fillLight);

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

  // Material refinement
  gameboy.traverse((child) => {
    if (child.isMesh) {
      if (child.material) {
        child.material = child.material.clone();
        // A slightly cooler, "premium" grey
        child.material.color.set(0xaaaaaa);
        child.material.roughness = 0.3;
        child.material.metalness = 0.2;
      }
      
      const name = child.name.toLowerCase();
      if (name.includes('screen') || name.includes('display') || name.includes('plane')) {
        child.material = new THREE.MeshBasicMaterial({ 
          map: screenTexture,
          side: THREE.DoubleSide
        });
      }
    }
  });

  // Scale and center precisely
  gameboy.scale.set(1.0, 1.0, 1.0); // Reset scale for better default zoom
  
  const box = new THREE.Box3().setFromObject(gameboy);
  const center = box.getCenter(new THREE.Vector3());
  gameboy.position.sub(center); // Fully center it at 0,0,0
});

// Handle Window Resize
window.addEventListener('resize', () => {
  const container = document.querySelector('#app-container');
  const width = container.clientWidth;
  const height = container.clientHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Animation Loop
let lastTime = 0;

function animate(timestamp) {
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  controls.update();

  if (marioGame) {
    marioGame.update(dt);
    marioGame.draw();
    screenTexture.needsUpdate = true;
  }

  if (gameboy) {
    // Smoother "floating" effect, but keep it straight as requested
    gameboy.position.y = Math.sin(timestamp * 0.001) * 0.4;
    gameboy.rotation.set(0, 0, 0); // Keep it straight
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Initial trigger for renderer size
window.dispatchEvent(new Event('resize'));
requestAnimationFrame(animate);
