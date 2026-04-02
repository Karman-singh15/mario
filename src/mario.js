
import { Controls } from './controls.js';

export class MarioGame {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        // Disable image smoothing for crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.controls = new Controls();

        // Game state
        this.gameState = 'TITLE'; // 'TITLE' or 'PLAYING'
        this.score = 0;
        this.coins = 22;
        this.world = '1-1';
        this.timer = 400;
        this.lives = 3;

        // Load Mario Title Screen
        this.marioTitle = new Image();
        this.marioTitle.src = '/mario_title.png';

        // Game constants
        this.GRAVITY = 1500;
        this.JUMP_FORCE = -450;
        this.MOVE_SPEED = 120;

        // Load Mario Sprites individually for reliability
        this.marioSprites = {
            idle: new Image(),
            walk: [new Image(), new Image(), new Image()],
            jump: new Image()
        };
        this.marioSprites.idle.src = '/final_idle.png';
        this.marioSprites.walk[0].src = '/final_walk1.png';
        this.marioSprites.walk[1].src = '/final_walk2.png';
        this.marioSprites.walk[2].src = '/final_walk3.png';
        this.marioSprites.jump.src = '/final_jump.png';

        // Load Sprite Sheet for level elements
        this.spriteSheet = new Image();
        this.spriteSheet.src = '/characters.png';

        // Player state
        this.player = {
            x: 50,
            y: 100,
            width: 16,
            height: 16,
            vx: 0,
            vy: 0,
            grounded: false,
            facingRight: true,
            state: 'idle', // idle, walk, jump
            walkFrame: 0,
            walkTimer: 0
        };

        // Sprite mappings (verified from characters.png)
        this.sprites = {
            tiles: {
                ground: { x: 336, y: 432, w: 16, h: 16 },
                brick: { x: 288, y: 272, w: 16, h: 16 },
                question: { x: 304, y: 272, w: 16, h: 16 },
                questionEmpty: { x: 432, y: 16, w: 16, h: 16 }
            },
            bg: {
                cloud: { x: 336, y: 336, w: 48, h: 24 }, // Assuming 3x1.5 tiles
                hill: { x: 336, y: 352, w: 48, h: 24 },
                bush: { x: 336, y: 272, w: 48, h: 16 }
            },
            enemies: {
                goomba: { x: 288, y: 336, w: 16, h: 16 },
                goombaWalk: [
                    { x: 288, y: 336, w: 16, h: 16 },
                    { x: 304, y: 336, w: 16, h: 16 }
                ],
                goombaFlat: { x: 320, y: 336, w: 16, h: 16 }
            }
        };

        // Static level data (for demo)
        this.blocks = [
            // Ground
            { x: 0, y: height - 16, width: width * 3, height: 16, type: 'ground' },
            // Platforms
            { x: 80, y: height - 60, width: 48, height: 16, type: 'brick' },
            { x: 160, y: height - 90, width: 32, height: 16, type: 'question' },
            { x: 50, y: height - 90, width: 16, height: 16, type: 'brick' },
        ];

        this.background = [
            { x: 20, y: 30, type: 'cloud' },
            { x: 120, y: 50, type: 'cloud' },
            { x: 60, y: height - 40, type: 'hill' },
            { x: 180, y: height - 32, type: 'bush' },
        ];

        // Enemies
        this.enemies = [
            { x: 150, y: height - 32, vx: -40, type: 'goomba', alive: true },
            { x: 300, y: height - 32, vx: -40, type: 'goomba', alive: true },
        ];

        this.sprites.enemies = {
            goomba: { x: 0, y: 16 * 1, w: 16, h: 16 }, // Approximate
            goombaWalk: [
                { x: 0, y: 16, w: 16, h: 16 },
                { x: 16, y: 16, w: 16, h: 16 }
            ],
            goombaFlat: { x: 32, y: 16, w: 16, h: 16 }
        };
    }

    update(dt) {
        if (this.gameState !== 'PLAYING') return;

        // Timer countdown
        this.timer -= dt * 2.5; // Custom speed for demo
        if (this.timer < 0) this.timer = 0;

        // Horizontal movement
        if (this.controls.keys.left) {
            this.player.vx = -this.MOVE_SPEED;
            this.player.facingRight = false;
        } else if (this.controls.keys.right) {
            this.player.vx = this.MOVE_SPEED;
            this.player.facingRight = true;
        } else {
            this.player.vx = 0;
        }

        // Jumping
        if (this.controls.keys.a && this.player.grounded) {
            this.player.vy = this.JUMP_FORCE;
            this.player.grounded = false;
        }

        // Apply gravity
        this.player.vy += this.GRAVITY * dt;

        // Apply velocity
        this.player.x += this.player.vx * dt;
        this.checkHorizontalCollisions();

        this.player.y += this.player.vy * dt;
        this.player.grounded = false; // Assume falling until collision proves otherwise
        this.checkVerticalCollisions();

        // Screen boundaries
        if (this.player.x < 0) this.player.x = 0;
        // Allow some scrolling or just stop at edge
        if (this.player.x + this.player.width > this.width * 3) this.player.x = this.width * 3 - this.player.width;
        
        if (this.player.y > this.height) { // Reset if fallen off
            this.player.x = 50;
            this.player.y = 100;
            this.player.vy = 0;
        }

        // Update enemies
        this.updateEnemies(dt);

        // Update Animation State
        if (!this.player.grounded) {
            this.player.state = 'jump';
        } else if (Math.abs(this.player.vx) > 0) {
            this.player.state = 'walk';
            // Update walk animation frame
            this.player.walkTimer += dt;
            if (this.player.walkTimer > 0.08) { // Slightly faster animation
                this.player.walkFrame = (this.player.walkFrame + 1) % 3;
                this.player.walkTimer = 0;
            }
        } else {
            this.player.state = 'idle';
            this.player.walkFrame = 0; // Reset
        }
    }

    updateEnemies(dt) {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;

            enemy.x += enemy.vx * dt;

            // Check collisions with blocks to turn around
            for (const block of this.blocks) {
                if (this.checkCollision(enemy, { ...block, width: block.width, height: block.height })) {
                    enemy.vx = -enemy.vx;
                    enemy.x += enemy.vx * dt;
                    break;
                }
            }

            // Player collision
            if (this.checkCollision(this.player, { ...enemy, width: 14, height: 14 })) {
                if (this.player.vy > 0 && this.player.y < enemy.y) {
                    // Stomp!
                    enemy.alive = false;
                    this.player.vy = -300;
                    this.score += 100;
                } else {
                    // Die! (Reset for now)
                    this.player.x = 50;
                    this.player.y = 100;
                    this.player.vy = 0;
                    this.lives--;
                    if (this.lives < 0) this.lives = 3;
                }
            }
        }
    }

    checkHorizontalCollisions() {
        for (const block of this.blocks) {
            if (this.checkCollision(this.player, block)) {
                if (this.player.vx > 0) {
                    this.player.x = block.x - this.player.width;
                } else if (this.player.vx < 0) {
                    this.player.x = block.x + block.width;
                }
            }
        }
    }

    checkVerticalCollisions() {
        for (const block of this.blocks) {
            if (this.checkCollision(this.player, block)) {
                if (this.player.vy > 0) { // Falling down
                    this.player.y = block.y - this.player.height;
                    this.player.vy = 0;
                    this.player.grounded = true;
                } else if (this.player.vy < 0) { // Jumping up
                    this.player.y = block.y + block.height;
                    this.player.vy = 0;
                }
            }
        }
    }

    checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    draw() {
        if (this.gameState === 'TITLE') {
            this.ctx.fillStyle = '#5C94FC'; // Classic Mario Blue
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.safeDrawImage(this.marioTitle, 0, 0, this.marioTitle.width, this.marioTitle.height, 0, 0, this.width, this.height);
            return;
        }

        // Calculate camera offset
        this.cameraX = Math.max(0, this.player.x - this.width / 2);
        // Constrain to level width
        const maxScroll = this.width * 2; // Level is 3 widths, so max scroll is 2 widths
        if (this.cameraX > maxScroll) this.cameraX = maxScroll;

        // Clear background (sky blue)
        this.ctx.fillStyle = '#5C94FC';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.renderBackground();
        
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);
        
        this.renderLevel();
        this.renderEnemies();
        this.renderPlayer();
        
        this.ctx.restore();
        
        this.renderHUD();
    }

    safeDrawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) {
        if (!img || !img.complete || img.naturalWidth === 0) return false;
        try {
            if (arguments.length === 9) {
                this.ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
            } else if (arguments.length === 5) {
                this.ctx.drawImage(img, sx, sy, sw, sh);
            } else if (arguments.length === 3) {
                this.ctx.drawImage(img, sx, sy);
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    renderEnemies() {
        for (const enemy of this.enemies) {
            if (!enemy.alive) continue;
            const walkFrame = Math.floor(Date.now() / 200) % 2;
            const sprite = this.sprites.enemies.goombaWalk[walkFrame];
            this.safeDrawImage(
                this.spriteSheet,
                sprite.x, sprite.y, sprite.w, sprite.h,
                enemy.x, enemy.y, 16, 16
            );
        }
    }

    renderHUD() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '8px "Press Start 2P", cursive';
        if (!this.ctx.font.includes('Press Start 2P')) {
            this.ctx.font = 'bold 8px Courier New';
        }

        const margin = 10;
        const y1 = 12;
        const y2 = 22;

        this.ctx.fillText('MARIO', margin, y1);
        this.ctx.fillText(String(this.score).padStart(6, '0'), margin, y2);
        this.ctx.fillText('COINS', margin + 50, y1);
        this.ctx.fillText('x' + String(this.coins).padStart(2, '0'), margin + 50, y2);
        this.ctx.fillText('WORLD', margin + 90, y1);
        this.ctx.fillText(this.world, margin + 95, y2);
        this.ctx.fillText('TIME', margin + 125, y1);
        this.ctx.fillText(String(Math.floor(this.timer)).padStart(3, '0'), margin + 130, y2);
    }

    renderBackground() {
        for (const element of this.background) {
            const sprite = this.sprites.bg[element.type];
            const parallaxX = element.x - this.cameraX * 0.5;
            this.safeDrawImage(
                this.spriteSheet,
                sprite.x, sprite.y, sprite.w, sprite.h,
                parallaxX, element.y, sprite.w, sprite.h
            );
        }
    }

    renderLevel() {
        const hasSpriteSheet = this.spriteSheet.complete && this.spriteSheet.naturalWidth > 0;
        
        for (const block of this.blocks) {
            const sprite = this.sprites.tiles[block.type === 'ground' ? 'ground' : (block.type === 'question' ? 'question' : 'brick')];
            
            if (!hasSpriteSheet) {
                this.ctx.fillStyle = block.type === 'ground' ? '#8B4513' : '#CD853F';
                this.ctx.fillRect(block.x, block.y, block.width, block.height);
                continue;
            }

            for (let x = 0; x < block.width; x += 16) {
                for (let y = 0; y < block.height; y += 16) {
                    this.safeDrawImage(
                        this.spriteSheet,
                        sprite.x, sprite.y, sprite.w, sprite.h,
                        block.x + x, block.y + y, 16, 16
                    );
                }
            }
        }
    }

    renderPlayer() {
        let currentSprite;
        if (this.player.state === 'idle') {
            currentSprite = this.marioSprites.idle;
        } else if (this.player.state === 'jump') {
            currentSprite = this.marioSprites.jump;
        } else if (this.player.state === 'walk') {
            currentSprite = this.marioSprites.walk[this.player.walkFrame];
        }

        if (!currentSprite || !currentSprite.complete || currentSprite.naturalWidth === 0) {
            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            return;
        }

        this.ctx.save();
        if (!this.player.facingRight) {
            this.ctx.translate(this.player.x + this.player.width, this.player.y);
            this.ctx.scale(-1, 1);
            this.safeDrawImage(currentSprite, 0, 0, currentSprite.width, currentSprite.height, 0, 0, this.player.width, this.player.height);
        } else {
            this.safeDrawImage(currentSprite, 0, 0, currentSprite.width, currentSprite.height, this.player.x, this.player.y, this.player.width, this.player.height);
        }
        this.ctx.restore();
    }

    getCanvas() {
        return this.canvas;
    }
}
