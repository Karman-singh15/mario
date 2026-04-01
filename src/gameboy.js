
import * as THREE from 'three';

export function createGameBoy(screenCanvas) {
    const gameboyGroup = new THREE.Group();

    // Materials
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.4 });
    const darkGreyMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6 });
    const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const screenBorderMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });
    const buttonRedMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000, roughness: 0.3 });

    // Reusable Geometries
    const bodyGeo = new THREE.BoxGeometry(9, 14.8, 2.5);
    const screenBorderGeo = new THREE.BoxGeometry(8, 6, 0.2);
    const screenGeo = new THREE.PlaneGeometry(5.2, 4.6); // Slightly smaller than border

    // --- Main Body ---
    const body = new THREE.Mesh(bodyGeo, bodyMaterial);
    // Add rounded corners visually by adding cylinders? Too complex, sticking to Box with bevel if needed or just Box for style.
    gameboyGroup.add(body);

    // --- Screen Area ---
    const screenBorder = new THREE.Mesh(screenBorderGeo, screenBorderMaterial);
    screenBorder.position.set(0, 2.5, 1.3);
    gameboyGroup.add(screenBorder);

    // Screen Texture
    const screenTexture = new THREE.CanvasTexture(screenCanvas);
    screenTexture.minFilter = THREE.NearestFilter;
    screenTexture.magFilter = THREE.NearestFilter;
    const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture });

    const screen = new THREE.Mesh(screenGeo, screenMaterial);
    screen.position.set(0, 2.5, 1.41);
    gameboyGroup.add(screen);

    // --- Interactive Buttons Storage ---
    const buttons = {};

    // --- D-Pad ---
    const dpadGroup = new THREE.Group();
    dpadGroup.position.set(-2.5, -2.5, 1.3);
    gameboyGroup.add(dpadGroup);

    const dpadSize = 0.8;
    const dpadThickness = 0.5;
    const dpadGeo = new THREE.BoxGeometry(dpadSize, dpadSize, dpadThickness);

    // Center Piece (static)
    const dpadCenter = new THREE.Mesh(dpadGeo, blackMaterial);
    dpadGroup.add(dpadCenter);

    // Up
    buttons.up = new THREE.Mesh(dpadGeo, blackMaterial);
    buttons.up.position.set(0, dpadSize, 0);
    dpadGroup.add(buttons.up);

    // Down
    buttons.down = new THREE.Mesh(dpadGeo, blackMaterial);
    buttons.down.position.set(0, -dpadSize, 0);
    dpadGroup.add(buttons.down);

    // Left
    buttons.left = new THREE.Mesh(dpadGeo, blackMaterial);
    buttons.left.position.set(-dpadSize, 0, 0);
    dpadGroup.add(buttons.left);

    // Right
    buttons.right = new THREE.Mesh(dpadGeo, blackMaterial);
    buttons.right.position.set(dpadSize, 0, 0);
    dpadGroup.add(buttons.right);


    // --- A/B Buttons ---
    const buttonGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 32);
    buttonGeo.rotateX(Math.PI / 2);

    buttons.a = new THREE.Mesh(buttonGeo, buttonRedMaterial);
    buttons.a.position.set(3, -1.5, 1.3);
    gameboyGroup.add(buttons.a);

    buttons.b = new THREE.Mesh(buttonGeo, buttonRedMaterial);
    buttons.b.position.set(1.5, -2.2, 1.3);
    gameboyGroup.add(buttons.b);

    // --- Start/Select ---
    // Using Box for pill shape approximation or Capsules if available in easier versions
    const pillGeo = new THREE.CapsuleGeometry(0.25, 0.8, 4, 8);
    pillGeo.rotateZ(Math.PI / 4); // Slanted
    pillGeo.rotateX(Math.PI / 2); // Lay flat on surface
    // Actually CapsuleGeometry is vertical. rotateZ tilts it. 
    // Let's use simple boxes with rotation for reliable positioning
    const startSelectGeo = new THREE.BoxGeometry(0.3, 0.8, 0.2);

    buttons.select = new THREE.Mesh(startSelectGeo, darkGreyMaterial);
    buttons.select.rotation.z = -0.5; // Slanted
    buttons.select.position.set(-0.5, -5.5, 1.3);
    gameboyGroup.add(buttons.select);

    buttons.start = new THREE.Mesh(startSelectGeo, darkGreyMaterial);
    buttons.start.rotation.z = -0.5;
    buttons.start.position.set(1.5, -5.5, 1.3);
    gameboyGroup.add(buttons.start);

    // --- Animation Helper ---
    const initialZ = {
        dpad: 0,
        ab: 1.3,
        ss: 1.3
    };
    const pressDepth = 0.15;

    function updateButtons(keys) {
        if (!keys) return;

        // D-Pad
        // Visual press: move z down slightly
        buttons.up.position.z = keys.up ? -pressDepth : 0;
        buttons.down.position.z = keys.down ? -pressDepth : 0;
        buttons.left.position.z = keys.left ? -pressDepth : 0;
        buttons.right.position.z = keys.right ? -pressDepth : 0;

        // A/B
        buttons.a.position.z = initialZ.ab + (keys.a ? -pressDepth : 0);
        buttons.b.position.z = initialZ.ab + (keys.b ? -pressDepth : 0);

        // Start/Select
        buttons.start.position.z = initialZ.ss + (keys.start ? -pressDepth : 0);
        buttons.select.position.z = initialZ.ss + (keys.select ? -pressDepth : 0);
    }

    return { mesh: gameboyGroup, screenTexture, updateButtons };
}