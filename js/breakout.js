const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game State
let gameState = 'start'; // start, playing, gameover, victory
let score = 0;
let lives = 3;
let level = 1;
let animationId;

// Game Objects
const ball = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    dx: 0,
    dy: 0,
    radius: 8,
    speed: 6,
    color: '#00f3ff'
};

const paddle = {
    height: 15,
    width: 100,
    x: (canvas.width - 100) / 2,
    color: '#bc13fe',
    speed: 8,
    dx: 0
};

const gravity = 0.5;
const jumpForce = -12;
let isJumping = false;

const brickInfo = {
    rowCount: 5,
    colCount: 9,
    width: 75,
    height: 25,
    padding: 10,
    offsetTop: 60,
    offsetLeft: 20,
    colors: ['#ff0000', '#ff8c00', '#ffff00', '#00ff00', '#0000ff'] // Rainbow colors
};

let bricks = [];

// Initialize Bricks
function initBricks() {
    bricks = [];
    for (let c = 0; c < brickInfo.colCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickInfo.rowCount; r++) {
            bricks[c][r] = {
                x: 0,
                y: 0,
                status: 1,
                color: brickInfo.colors[r]
            };
        }
    }
}

// Input Handling
document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') ball.dx = 4;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') ball.dx = -4;
    else if (e.code === 'Space' && gameState === 'playing' && !isJumping) {
        ball.dy = jumpForce;
        isJumping = true;
    }
    else if (e.key === 'Enter' && gameState !== 'playing') startGame();
}

function keyUpHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') ball.dx = 0;
    else if (e.key === 'Left' || e.key === 'ArrowLeft') ball.dx = 0;
}

// UI Elements
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const victoryScreen = document.getElementById('victory-screen');
const restartBtn = document.getElementById('restart-btn');
const nextBtn = document.getElementById('next-level-btn');
const finalScoreEl = document.getElementById('final-score');
const victoryScoreEl = document.getElementById('victory-score');

startScreen.addEventListener('click', startGame);
restartBtn.addEventListener('click', resetGame);
nextBtn.addEventListener('click', resetGame);

function startGame() {
    if (gameState === 'playing') return;
    gameState = 'playing';
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');
    victoryScreen.classList.remove('active');
    draw();
}

function resetGame() {
    score = 0;
    lives = 3;
    level = 1;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    resetLevel();
    startGame();
}

function resetLevel() {
    paddle.x = (canvas.width - paddle.width) / 2;
    resetBall();
    initBricks();
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = 0;
    ball.dy = 0;
    isJumping = false;
}

// Drawing Functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = ball.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawPaddle() {
    ctx.beginPath();
    ctx.roundRect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height, 5);
    ctx.fillStyle = paddle.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = paddle.color;
    ctx.fill();
    ctx.closePath();
    ctx.shadowBlur = 0;
}

function drawBricks() {
    for (let c = 0; c < brickInfo.colCount; c++) {
        for (let r = 0; r < brickInfo.rowCount; r++) {
            if (bricks[c][r].status === 1) {
                const brickX = (c * (brickInfo.width + brickInfo.padding)) + brickInfo.offsetLeft;
                const brickY = (r * (brickInfo.height + brickInfo.padding)) + brickInfo.offsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickInfo.width, brickInfo.height);
                ctx.fillStyle = bricks[c][r].color;
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                // Add glow to some bricks randomly or all? Let's just do all lightly
                // ctx.shadowBlur = 5;
                // ctx.shadowColor = bricks[c][r].color;
                ctx.fill();
                // ctx.stroke();
                ctx.closePath();
                ctx.shadowBlur = 0;
            }
        }
    }
}

// Collision Detection
function collisionDetection() {
    for (let c = 0; c < brickInfo.colCount; c++) {
        for (let r = 0; r < brickInfo.rowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                if (ball.x + ball.radius > b.x && ball.x - ball.radius < b.x + brickInfo.width && ball.y + ball.radius > b.y && ball.y - ball.radius < b.y + brickInfo.height) {
                    // Collision detected, determine side
                    const prevBallY = ball.y - ball.dy;
                    
                    if (prevBallY + ball.radius <= b.y) { // Top collision
                        ball.y = b.y - ball.radius;
                        ball.dy = 0;
                        isJumping = false;
                        b.status = 0; // Break brick from top
                        score += 100;
                        scoreEl.innerText = score;
                        particleExplosion(b.x + brickInfo.width / 2, b.y + brickInfo.height / 2, b.color);
                    } else if (prevBallY - ball.radius >= b.y + brickInfo.height) { // Bottom collision
                        ball.dy = -ball.dy
                        b.status = 0;
                        score += 100;
                        scoreEl.innerText = score;
                        particleExplosion(b.x + brickInfo.width / 2, b.y + brickInfo.height / 2, b.color);
                    } else { // Side collision
                        ball.dx = -ball.dx;
                        if (ball.x < b.x) {
                            ball.x = b.x - ball.radius;
                        } else {
                            ball.x = b.x + brickInfo.width + ball.radius;
                        }
                    }
                }
            }
        }
    }
}

function isLevelCleared() {
    for (let c = 0; c < brickInfo.colCount; c++) {
        for (let r = 0; r < brickInfo.rowCount; r++) {
            if (bricks[c][r].status === 1) return false;
        }
    }
    return true;
}

// Particles System
let particles = [];
function particleExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push({
            x: x,
            y: y,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            radius: Math.random() * 3,
            life: 1.0,
            color: color
        });
    }
}

function drawParticles() {
    particles.forEach((p, index) => {
        if (p.life <= 0) {
            particles.splice(index, 1);
        } else {
            p.x += p.dx;
            p.y += p.dy;
            p.life -= 0.05;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fill();
            ctx.closePath();
            ctx.globalAlpha = 1.0;
        }
    });
}

// Main Game Loop
function draw() {
    if (gameState !== 'playing') {
        cancelAnimationFrame(animationId);
        return;
    }

    // Clear Canvas
    ctx.fillStyle = '#0f0f13'; // Trail effect?
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Clear fully for now
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    drawParticles();

    // Boundry Logic
    if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx;
    }
    if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy;
    } else if (ball.y + ball.dy > canvas.height - ball.radius - 10) { // bottom
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            // Land on paddle
            ball.y = canvas.height - paddle.height - ball.radius - 10;
            ball.dy = 0;
            isJumping = false;
        } else {
            lives--;
            livesEl.innerText = lives;
            if (!lives) {
                gameState = 'gameover';
                finalScoreEl.innerText = score;
                gameOverScreen.classList.add('active');
            } else {
                resetBall();
            }
        }
    }

    // Apply gravity
    ball.dy += gravity;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (isLevelCleared()) {
        gameState = 'victory';
        victoryScoreEl.innerText = score;
        victoryScreen.classList.add('active');
    }

    animationId = requestAnimationFrame(draw);
}

// Init
initBricks();
drawBricks(); // Draw initial state behind menu
drawPaddle();
drawBall();
startScreen.classList.add('active');
