
export class Controls {
  constructor() {
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false, // Jump / Action
      b: false, // Run / Action
      start: false,
      select: false
    };

    window.addEventListener('keydown', (e) => this.handleKey(e, true));
    window.addEventListener('keyup', (e) => this.handleKey(e, false));
  }

  handleKey(e, isDown) {
    const key = e.key.toLowerCase();
    
    // Arrow keys
    if (key === 'arrowup' || key === 'w') this.keys.up = isDown;
    if (key === 'arrowdown' || key === 's') this.keys.down = isDown;
    if (key === 'arrowleft' || key === 'a') this.keys.left = isDown;
    if (key === 'arrowright' || key === 'd') this.keys.right = isDown;

    // Action buttons
    if (key === 'z' || key === ' ') this.keys.a = isDown; // Z or Space for A
    if (key === 'x') this.keys.b = isDown; // X for B
    if (key === 'enter') this.keys.start = isDown;
    if (key === 'shift') this.keys.select = isDown;
  }
}
