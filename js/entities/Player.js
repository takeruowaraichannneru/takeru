export default class Player {
    constructor(x, y, color, controls) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.color = color;
        this.controls = controls;

        // Physics
        this.vx = 0;
        this.vy = 0;
        this.speed = 400; // Pixels per second
        this.jumpForce = -700;
        this.grounded = false;
        this.doubleJumpAvailable = true;

        // Stats
        this.percentage = 0;
        this.stocks = 3;

        // Input State
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            attack: false
        };

        // Key Mapping
        this.keyMap = {
            [controls.left]: 'left',
            [controls.right]: 'right',
            [controls.up]: 'up',
            [controls.down]: 'down',
            [controls.attack]: 'attack'
        };

        this.setupInputs();
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            if (this.keyMap[e.code]) {
                this.input[this.keyMap[e.code]] = true;
                if (this.keyMap[e.code] === 'up') this.jump();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keyMap[e.code]) {
                this.input[this.keyMap[e.code]] = false;
            }
        });
    }

    jump() {
        if (this.grounded) {
            this.vy = this.jumpForce;
            this.grounded = false;
            this.doubleJumpAvailable = true;
        } else if (this.doubleJumpAvailable) {
            this.vy = this.jumpForce * 0.85; // Slightly weaker double jump
            this.doubleJumpAvailable = false;
        }
    }

    update(dt, physics, stage, entities) {
        this.handleInput(dt);
        this.applyPhysics(dt, physics);
        this.checkStageCollisions(stage);
        this.handleCombat(dt, physics, entities);

        // Screen Boundaries (Respawn)
        if (this.y > 1000) {
            this.respawn(stage);
        }
    }

    handleInput(dt) {
        if (this.isStunned) {
            this.stunTimer -= dt;
            if (this.stunTimer <= 0) this.isStunned = false;
            return;
        }

        // Horizontal Movement
        if (this.input.left) {
            this.vx = -this.speed;
            this.facingRight = false;
        } else if (this.input.right) {
            this.vx = this.speed;
            this.facingRight = true;
        } else {
            // Friction
            if (Math.abs(this.vx) > 10) {
                // Less friction in air
                const friction = this.grounded ? 1000 : 200;
                this.vx += (this.vx > 0 ? -1 : 1) * friction * dt;
            } else {
                this.vx = 0;
            }
        }

        // Attack
        if (this.input.attack && !this.isAttacking) {
            this.attack();
        }
    }

    applyPhysics(dt, physics) {
        // Apply Gravity
        this.vy += physics.gravity * dt;

        // Apply Velocity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    checkStageCollisions(stage) {
        this.grounded = false;
        stage.platforms.forEach(platform => {
            if (
                this.y + this.height >= platform.y &&
                this.y + this.height <= platform.y + platform.height + 20 &&
                this.x + this.width > platform.x &&
                this.x < platform.x + platform.width &&
                this.vy >= 0
            ) {
                this.y = platform.y - this.height;
                this.vy = 0;
                this.grounded = true;
                this.doubleJumpAvailable = true;
                this.isAttacking = false; // Cancel aerials on landing logic could go here
            }
        });
    }

    attack() {
        this.isAttacking = true;
        this.attackTimer = 0.2; // Attack duration
        // Simple hitbox in front of player
        this.hitbox = {
            x: this.facingRight ? this.x + this.width : this.x - 60,
            y: this.y + 10,
            width: 60,
            height: 40,
            active: true
        };
    }

    handleCombat(dt, physics, entities) {
        if (this.isAttacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.hitbox = null;
            } else if (this.hitbox) {
                // Update hitbox position
                this.hitbox.x = this.facingRight ? this.x + this.width : this.x - 60;
                this.hitbox.y = this.y + 10;

                // Check collisions with other entities
                entities.forEach(other => {
                    if (other !== this && physics.checkCollision(this.hitbox, other)) {
                        // Apply hit
                        const knockbackDir = this.facingRight ? 1 : -1;
                        other.takeDamage(10, knockbackDir, 10);
                        this.hitbox.active = false; // One hit per attack
                        this.hitbox = null;
                    }
                });
            }
        }
    }

    takeDamage(damage, dir, baseKnockback) {
        if (this.invulnerable) return;

        this.percentage += damage;

        // Knockback Formula
        // Scaling increases significantly with percentage
        const scaling = 1 + (this.percentage / 20);
        this.vx = dir * baseKnockback * 50 * scaling;
        this.vy = -baseKnockback * 50 * scaling * 0.5; // Upward launch

        this.isStunned = true;
        this.stunTimer = 0.3 * scaling; // Longer stun at higher %
    }

    respawn(stage) {
        this.x = stage.platforms[0].x + stage.platforms[0].width / 2;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.percentage = 0;
        this.stocks--;
        this.isStunned = false;
        this.isAttacking = false;
    }

    draw(ctx) {
        ctx.fillStyle = this.isStunned ? 'yellow' : this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw Attack Hitbox (Debug)
        if (this.isAttacking && this.hitbox) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(this.hitbox.x, this.hitbox.y, this.hitbox.width, this.hitbox.height);
        }
    }
}
