import Stage from './entities/Stage.js';
import Physics from './engine/Physics.js';
import Player from './entities/Player.js';
import HUD from './ui/HUD.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.targetFPS = 60;
        this.step = 1000 / this.targetFPS;

        this.init();
    }

    init() {
        this.physics = new Physics();
        this.stage = new Stage(this.width, this.height);
        this.hud = new HUD(this.width, this.height);

        this.entities = [
            new Player(200, 100, '#e94560', {
                left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', attack: 'Space'
            }),
            new Player(800, 100, '#0f3460', { // Second player basic setup
                left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', attack: 'Enter'
            })
        ];

        // Start loop
        requestAnimationFrame((ts) => this.loop(ts));
    }

    update(dt) {
        // Update logic here
        this.entities.forEach(entity => entity.update(dt, this.physics, this.stage, this.entities));
    }

    draw() {
        // Clear screen
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw Stage
        this.stage.draw(this.ctx);

        // Draw entities
        this.entities.forEach(entity => entity.draw(this.ctx));

        // Draw HUD
        this.hud.draw(this.ctx, this.entities);
    }

    loop(timestamp) {
        let deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.accumulatedTime += deltaTime;

        // Fixed time step update
        while (this.accumulatedTime >= this.step) {
            this.update(this.step / 1000); // Pass seconds
            this.accumulatedTime -= this.step;
        }

        this.draw();
        requestAnimationFrame((ts) => this.loop(ts));
    }
}

window.onload = () => {
    new Game();
};
