/**
 * Around the World | Globe Runner
 * A premium 3D ball game using Three.js
 */

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.stats = {
            distance: 0,
            laps: 0,
            speed: 0
        };

        this.isGameRunning = false;
        this.ballRadius = 0.5;
        this.earthRadius = 10;
        this.speed = 0.05;
        this.maxSpeed = 0.15;
        this.rotationX = 0;
        this.steering = 0;

        this.obstacles = [];
        this.clouds = [];

        this.initScene();
        this.initLights();
        this.createEarth();
        this.createBall();
        this.createEnvironment();
        this.bindEvents();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0b0e14);
        this.scene.fog = new THREE.Fog(0x0b0e14, 20, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 4, 12);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
    }

    initLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);

        const rimLight = new THREE.PointLight(0x00f2fe, 1, 50);
        rimLight.position.set(-10, 5, -10);
        this.scene.add(rimLight);
    }

    createEarth() {
        // Main globe
        const earthGeometry = new THREE.SphereGeometry(this.earthRadius, 64, 64);
        const earthMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a2a4a,
            roughness: 0.8,
            metalness: 0.2
        });
        this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
        this.earth.receiveShadow = true;
        this.scene.add(this.earth);

        // Add continents (as simplified low-poly features)
        this.continentsGroup = new THREE.Group();
        this.earth.add(this.continentsGroup);

        const continentMaterial = new THREE.MeshStandardMaterial({
            color: 0x27ae60,
            roughness: 0.9
        });

        // Procedurally place "land" on the globe
        for (let i = 0; i < 400; i++) {
            const size = Math.random() * 0.5 + 0.1;
            const geo = new THREE.BoxGeometry(size, size, 0.2);
            const mesh = new THREE.Mesh(geo, continentMaterial);

            // Random position on sphere
            const phi = Math.acos(-1 + (2 * i) / 400);
            const theta = Math.sqrt(400 * Math.PI) * phi;

            mesh.position.setFromSphericalCoords(this.earthRadius, phi, theta);
            mesh.lookAt(0, 0, 0);
            this.continentsGroup.add(mesh);
        }

        // Add glow atmosphere
        const atmosphereGeo = new THREE.SphereGeometry(this.earthRadius * 1.05, 32, 32);
        const atmosphereMat = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.BackSide,
            uniforms: {
                glowColor: { value: new THREE.Color(0x4facfe) },
                viewVector: { value: this.camera.position }
            },
            vertexShader: `
                varying float intensity;
                void main() {
                    vec3 vNormal = normalize(normalMatrix * normal);
                    intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying float intensity;
                void main() {
                    gl_FragColor = vec4(glowColor, intensity);
                }
            `
        });
        this.atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
        this.scene.add(this.atmosphere);
    }

    createBall() {
        const ballGeo = new THREE.SphereGeometry(this.ballRadius, 32, 32);
        const ballMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x00f2fe,
            emissiveIntensity: 1,
            metalness: 1,
            roughness: 0.1
        });
        this.ball = new THREE.Mesh(ballGeo, ballMat);
        this.ball.position.set(0, this.earthRadius + this.ballRadius, 0);
        this.ball.castShadow = true;
        this.scene.add(this.ball);

        // Particle trail
        this.trail = [];
        this.trailCount = 10;
        for (let i = 0; i < this.trailCount; i++) {
            const tGeo = new THREE.SphereGeometry(this.ballRadius * (1 - i / this.trailCount), 16, 16);
            const tMat = new THREE.MeshBasicMaterial({
                color: 0x00f2fe,
                transparent: true,
                opacity: 0.4 * (1 - i / this.trailCount)
            });
            const tMesh = new THREE.Mesh(tGeo, tMat);
            this.scene.add(tMesh);
            this.trail.push(tMesh);
        }
    }

    createEnvironment() {
        // Stars/Space dust
        const starGeo = new THREE.BufferGeometry();
        const starCoords = [];
        for (let i = 0; i < 1000; i++) {
            starCoords.push(
                THREE.MathUtils.randFloatSpread(100),
                THREE.MathUtils.randFloatSpread(100),
                THREE.MathUtils.randFloatSpread(100)
            );
        }
        starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);

        // Initial obstacles
        for (let i = 0; i < 20; i++) {
            this.spawnObstacle();
        }
    }

    spawnObstacle() {
        const size = Math.random() * 0.4 + 0.2;
        const geo = new THREE.ConeGeometry(size, size * 2, 8);
        const mat = new THREE.MeshStandardMaterial({ color: 0xe74c3c });
        const mesh = new THREE.Mesh(geo, mat);

        // Random angle around the world, but ahead of player
        const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.8; // Latitude (steering range)
        const theta = Math.random() * Math.PI * 2; // Longitude

        mesh.position.setFromSphericalCoords(this.earthRadius + size, phi, theta);
        mesh.lookAt(mesh.position.clone().multiplyScalar(1.1));
        mesh.rotateX(Math.PI / 2);

        this.earth.add(mesh);
        this.obstacles.push(mesh);
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        const keys = {};
        window.addEventListener('keydown', (e) => {
            keys[e.key.toLowerCase()] = true;
            if (!this.isGameRunning && e.key === ' ') this.startGame();
        });
        window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

        document.getElementById('start-btn').onclick = () => this.startGame();

        this.updateSteering = () => {
            if (keys['arrowleft'] || keys['a']) this.steering = Math.max(this.steering - 0.05, -1);
            else if (keys['arrowright'] || keys['d']) this.steering = Math.min(this.steering + 0.05, 1);
            else this.steering *= 0.9;
        };
    }

    startGame() {
        this.isGameRunning = true;
        document.getElementById('start-screen').classList.add('hidden');
        this.stats.distance = 0;
        this.stats.laps = 0;
        this.speed = 0.05;
    }

    gameOver() {
        this.isGameRunning = false;
        document.getElementById('game-over').classList.add('visible');
        document.getElementById('final-score').innerText = `Distance: ${Math.floor(this.stats.distance)} km`;
    }

    updatePhysics() {
        if (!this.isGameRunning) return;

        // Increase speed slowly
        this.speed = Math.min(this.speed + 0.00001, this.maxSpeed);

        // Rotate Earth (simulates forward movement)
        this.earth.rotation.z -= this.speed;

        // Steering (Latitude change)
        // We move the ball's X and calculate its Y on the sphere
        const maxSteer = 3;
        const targetX = this.steering * maxSteer;
        this.ball.position.x += (targetX - this.ball.position.x) * 0.1;

        // Calculate Y based on sphere surface: x^2 + y^2 + z^2 = r^2
        // In our case, Z is constant (relative to ball) at 0 for simplicity in this setup
        // But the Earth is rotating around Z axis.
        // Actually, easier to steer by rotating the continents group around X axis!
        this.continentsGroup.rotation.x += this.steering * 0.02;

        // Upate stats
        this.stats.distance += this.speed * 100;
        this.stats.laps = Math.floor(this.stats.distance / 1000);
        this.stats.speed = Math.floor(this.speed * 1000);

        document.getElementById('dist-val').innerText = `${Math.floor(this.stats.distance)} km`;
        document.getElementById('laps-val').innerText = this.stats.laps;
        document.getElementById('speed-val').innerText = `${this.stats.speed} km/h`;

        // Collision Check (Simple distance check)
        const ballWorldPos = new THREE.Vector3();
        this.ball.getWorldPosition(ballWorldPos);

        this.obstacles.forEach((obs) => {
            const obsWorldPos = new THREE.Vector3();
            obs.getWorldPosition(obsWorldPos);

            if (ballWorldPos.distanceTo(obsWorldPos) < this.ballRadius + 0.3) {
                this.gameOver();
            }
        });

        // Update trail
        for (let i = this.trailCount - 1; i > 0; i--) {
            this.trail[i].position.copy(this.trail[i - 1].position);
        }
        this.trail[0].position.copy(this.ball.position);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        this.updateSteering();
        this.updatePhysics();

        // Gentle planet spin even when not playing
        if (!this.isGameRunning) {
            this.earth.rotation.y += 0.002;
        }

        // Ball animation (hover/tilt)
        this.ball.rotation.x += 0.1;
        this.ball.rotation.y += 0.1;

        this.renderer.render(this.scene, this.camera);
    }
}

// Start the game
new Game();
