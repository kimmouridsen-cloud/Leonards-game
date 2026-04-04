// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let enemies;
let bullets;
let stars;
let score = 0;
let health = 3;
let scoreText;
let healthText;
let gameOver = false;
let gameOverTexts = []; // Store references to game over text objects
let touchActive = false;
let shootKey;
let enemySpawnTimer = 0;
let shootCooldown = 0;
let gameStartTime = 0; // Track when game started

// Boss state
let boss = null;
let bossActive = false;
let bossHP = 0;
const BOSS_MAX_HP = 20;
let bossHealthBar = null;
let bossHealthBarBg = null;
let bossBullets;
let bossShootTimer = 0;
let lastBossSpawnTime = 0;
let bossDriftTime = 0;
let gameLevel = 1;
let levelText;

// Scoring constants
const POINTS_FOR_AVOIDING_ENEMY = 10;
const POINTS_FOR_SHOOTING_ENEMY = POINTS_FOR_AVOIDING_ENEMY * 5;
const POINTS_FOR_SHOOTING_BOSS = POINTS_FOR_SHOOTING_ENEMY * 30;

// Math equation state
let mathEquation = null;
let mathAnswer = 0;
let mathSpawnTimer = 0;
let mathPaused = false;
let mathInputText = '';
let mathCountdown = 0;
let mathNumberButtons = [];
let mathInputDisplay = null;
let mathCountdownText = null;
let mathOverlay = null;
let mathQuestionText = null;
let mathSubmitButton = null;
let mathSubmitLabel = null;
let mathClearButton = null;
let mathClearLabel = null;
let mathTimerEvent = null;
let mathKeyboardHandler = null;
let mathStoredVelocities = [];
const MATH_SPAWN_INTERVAL = 15;
const MATH_FALL_SPEED = 120;
const MATH_PAUSE_DURATION = 6;
const MATH_CORRECT_POINTS = 300;
const MATH_MISS_PENALTY = 300;

// Sound effect functions using Web Audio API
function playEnemyShotSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Explosion sound: quick descending frequency
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.type = 'sawtooth';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Silently fail if audio context not available
        console.log('Audio not available');
    }
}

function playPlayerHitSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Hit sound: sharp, short impact sound
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        
        oscillator.type = 'square';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
    } catch (e) {
        // Silently fail if audio context not available
        console.log('Audio not available');
    }
}

function playPlayerDeathSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Death sound: low descending tone
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.type = 'sine';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        // Silently fail if audio context not available
        console.log('Audio not available');
    }
}

function playBossShootSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Deep, menacing shot: low frequency sweep
        oscillator.frequency.setValueAtTime(180, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.2);

        gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

        oscillator.type = 'triangle';
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
        console.log('Audio not available');
    }
}

function preload() {
    // Load images first (we'll create sprite sheets from them in create())
    this.load.image('player', 'images/player.png');
    this.load.image('enemy', 'images/enemy.png');
    this.load.image('boss', 'images/boss.png');
    this.load.image('stars0', 'images/stars_0.png');
    this.load.image('stars1', 'images/stars_1.png');
    this.load.image('stars2', 'images/stars_2.png');
    
    // Handle loading errors
    this.load.on('filecomplete', (key, type, data) => {
        console.log('Loaded:', key);
    });
    
    this.load.on('loaderror', (file) => {
        console.error('Failed to load:', file.key);
    });
}

function create() {
    // Create solid black background first - use dynamic dimensions
    const bgRect = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000).setOrigin(0, 0).setDepth(-100);
    
    // Handle window resize
    this.scale.on('resize', (gameSize) => {
        // Update background size
        bgRect.setSize(gameSize.width, gameSize.height);
        // Update camera bounds
        this.cameras.main.setBounds(0, 0, gameSize.width, gameSize.height);
        // Update star layers
        stars.children.entries.forEach((starLayer) => {
            starLayer.setSize(gameSize.width, gameSize.height * 2);
        });
    });
    
    // Create bullet graphic programmatically
    const bulletGraphics = this.add.graphics();
    bulletGraphics.fillStyle(0x00ff00, 1);
    bulletGraphics.fillRect(0, 0, 4, 12);
    bulletGraphics.generateTexture('bullet', 4, 12);
    bulletGraphics.destroy();
    
    // Create explosion particle textures
    const explosionGraphics = this.add.graphics();
    // Create a small circle for explosion particles
    explosionGraphics.fillStyle(0xffffff, 1);
    explosionGraphics.fillCircle(0, 0, 3);
    explosionGraphics.generateTexture('explosionParticle', 6, 6);
    explosionGraphics.destroy();
    
    // Create a larger flash circle for the initial explosion flash
    const flashGraphics = this.add.graphics();
    flashGraphics.fillStyle(0xffffff, 1);
    flashGraphics.fillCircle(0, 0, 8);
    flashGraphics.generateTexture('explosionFlash', 16, 16);
    flashGraphics.destroy();
    
    // Create boss bullet texture (red/orange circle)
    const bossBulletGraphics = this.add.graphics();
    bossBulletGraphics.fillStyle(0xff4400, 1);
    bossBulletGraphics.fillCircle(4, 4, 4);
    bossBulletGraphics.generateTexture('bossBullet', 8, 8);
    bossBulletGraphics.destroy();
    
    // Check if images loaded successfully BEFORE creating fallbacks
    const textures = this.textures.list;
    
    // Helper function to check if texture exists and is valid (not missing)
    const isValidTexture = (key) => {
        if (!textures[key]) return false;
        try {
            const texture = textures[key];
            // Check if it's a missing texture placeholder
            if (texture.key && texture.key.includes('__MISSING')) return false;
            // Check if texture has valid dimensions
            if (texture.source && texture.source[0]) {
                const source = texture.source[0];
                if (source.width > 0 && source.height > 0) {
                    return true;
                }
            }
            return false;
        } catch (e) {
            return false;
        }
    };
    
    // Only create fallbacks if images didn't load
    const playerLoaded = isValidTexture('player');
    const enemyLoaded = isValidTexture('enemy');
    const starsLoaded = isValidTexture('stars0');
    
    console.log('Texture check - Player:', playerLoaded, 'Enemy:', enemyLoaded, 'Stars:', starsLoaded);
    
    if (!playerLoaded) {
        console.log('Creating fallback player');
        createFallbackPlayer(this);
    } else {
        const playerTex = this.textures.get('player');
        console.log('Player image loaded - size:', playerTex.source[0].width, 'x', playerTex.source[0].height);
    }
    
    if (!enemyLoaded) {
        console.log('Creating fallback enemy');
        createFallbackEnemy(this);
    } else {
        const enemyTex = this.textures.get('enemy');
        console.log('Enemy image loaded - size:', enemyTex.source[0].width, 'x', enemyTex.source[0].height);
    }
    
    if (!starsLoaded) {
        createFallbackStarField(this);
    }
    
    // Create parallax star field background
    stars = this.add.group();
    
    // Create multiple layers of stars for parallax effect
    for (let i = 0; i < 3; i++) {
        const starKey = `stars${i}`;
        const textureToUse = isValidTexture(starKey) ? starKey : 'fallbackStars';
        const starsLayer = this.add.tileSprite(0, 0, this.scale.width, this.scale.height * 2, textureToUse);
        starsLayer.setOrigin(0, 0);
        starsLayer.setScrollFactor(0.3 + i * 0.2, 0.3 + i * 0.2);
        stars.add(starsLayer);
    }
    
    // Create player ship with animation
    let playerScale = 1;
    if (isValidTexture('player')) {
        const playerTexture = this.textures.get('player');
        const imgWidth = playerTexture.source[0].width;
        const imgHeight = playerTexture.source[0].height;
        console.log('Player image dimensions:', imgWidth, 'x', imgHeight);
        
        // Detect sprite sheet layout (4 frames horizontally)
        const frameWidth = Math.floor(imgWidth / 4);
        const frameHeight = imgHeight;
        
        // Create sprite sheet from the loaded image texture
        if (!this.textures.exists('playerSheet')) {
            this.textures.addSpriteSheet('playerSheet', playerTexture.source[0].image, {
                frameWidth: frameWidth,
                frameHeight: frameHeight
            });
        }
        
        // Create player sprite from sheet
        player = this.physics.add.sprite(this.scale.width / 2, this.scale.height - 100, 'playerSheet');
        
        // Create animation (4 frames, 10fps, loop)
        if (!this.anims.exists('playerFly')) {
            this.anims.create({
                key: 'playerFly',
                frames: this.anims.generateFrameNumbers('playerSheet', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1 // Loop forever
            });
        }
        
        // Play the animation
        player.play('playerFly');
        
        // Scale based on frame size
        const targetSize = 70;
        const maxDimension = Math.max(frameWidth, frameHeight);
        playerScale = maxDimension > 0 ? targetSize / maxDimension : 1;
        player.setScale(playerScale);
        console.log('Player sprite sheet - frame size:', frameWidth, 'x', frameHeight, 'scale:', playerScale);
    } else {
        // Fallback: use regular image
        player = this.physics.add.sprite(this.scale.width / 2, this.scale.height - 100, 'player');
        playerScale = 2;
        player.setScale(playerScale);
        console.log('Using fallback player graphics');
    }
    
    player.setCollideWorldBounds(true);
    
    // Create groups for enemies, bullets, and boss bullets
    enemies = this.physics.add.group();
    bullets = this.physics.add.group();
    bossBullets = this.physics.add.group();
    
    // Keyboard controls
    cursors = this.input.keyboard.createCursorKeys();
    shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Touch controls - direct relative positioning (spaceship position follows finger offset)
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartPlayerX = 0;
    let touchStartPlayerY = 0;
    
    this.input.on('pointerdown', (pointer) => {
        if (mathPaused) return;
        touchStartTime = this.time.now;
        touchStartX = pointer.x;
        touchStartY = pointer.y;
        touchStartPlayerX = player.x;
        touchStartPlayerY = player.y;
        touchActive = true;
    });
    
    this.input.on('pointermove', (pointer) => {
        if (touchActive && !gameOver && !mathPaused) {
            // Calculate how far finger has moved from initial touch point
            const deltaX = pointer.x - touchStartX;
            const deltaY = pointer.y - touchStartY;
            
            // Calculate target position: player's initial position + finger movement
            const targetX = touchStartPlayerX + deltaX;
            const targetY = touchStartPlayerY + deltaY;
            
            // Clamp to screen bounds
            const clampedX = Math.max(player.width/2, Math.min(targetX, this.scale.width - player.width/2));
            const clampedY = Math.max(player.height/2, Math.min(targetY, this.scale.height - player.height/2));
            
            // Set position directly - no velocity, instant response
            player.setPosition(clampedX, clampedY);
        }
    });
    
    this.input.on('pointerup', (pointer) => {
        const touchDuration = this.time.now - touchStartTime;
        const touchDistance = Phaser.Math.Distance.Between(touchStartX, touchStartY, pointer.x, pointer.y);
        
        // If it was a quick tap (not a drag), shoot
        if (touchDuration < 200 && touchDistance < 10 && !gameOver && !mathPaused && shootCooldown <= 0) {
            shootBullet();
            shootCooldown = 10;
        }
        
        touchActive = false;
    });
    
    // Collision detection
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    this.physics.add.overlap(player, bossBullets, hitPlayerWithBossBullet, null, this);
    
    // UI Text
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '24px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    
    healthText = this.add.text(16, 50, 'Health: 3', {
        fontSize: '24px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    
    levelText = this.add.text(16, 84, 'Level: 1', {
        fontSize: '24px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    
    // Initialize game start time
    gameStartTime = this.time.now;
}

function update() {
    if (gameOver || mathPaused) {
        return;
    }
    
    // Update cooldowns
    if (shootCooldown > 0) {
        shootCooldown--;
    }
    
    // Update parallax scrolling - stars move upward to create forward movement effect
    stars.children.entries.forEach((starLayer, index) => {
        const speed = (index + 1) * 0.3;
        starLayer.tilePositionY -= speed;
        // Loop the tile sprite
        if (starLayer.tilePositionY <= -this.scale.height) {
            starLayer.tilePositionY = 0;
        }
    });
    
    // Keyboard movement
    if (!touchActive) {
        const speed = 600;
        player.setVelocity(0, 0);
        
        if (cursors.left.isDown) {
            player.setVelocityX(-speed);
        } else if (cursors.right.isDown) {
            player.setVelocityX(speed);
        }
        
        if (cursors.up.isDown) {
            player.setVelocityY(-speed);
        } else if (cursors.down.isDown) {
            player.setVelocityY(speed);
        }
    }
    
    // Shooting with spacebar
    if (Phaser.Input.Keyboard.JustDown(shootKey) && shootCooldown <= 0) {
        shootBullet();
        shootCooldown = 10;
    }
    
    // Calculate elapsed time in seconds
    const elapsedTime = (this.time.now - gameStartTime) / 1000;
    const dt = this.game.loop.delta / 1000;
    
    // Boss spawn check: every 60 seconds, if no boss currently active
    if (!bossActive && elapsedTime - lastBossSpawnTime >= 60) {
        spawnBoss(this);
    }
    
    // Math equation spawn check
    mathSpawnTimer += dt;
    if (mathSpawnTimer >= MATH_SPAWN_INTERVAL && !mathEquation && !mathPaused) {
        spawnMathEquation(this);
        mathSpawnTimer = 0;
    }

    // Move math equation straight down
    if (mathEquation && mathEquation.active) {
        mathEquation.y += MATH_FALL_SPEED * dt;
        if (mathEquation.y > this.scale.height + 50) {
            score = Math.max(0, score - MATH_MISS_PENALTY);
            scoreText.setText('Score: ' + score);
            mathEquation.destroy();
            mathEquation = null;
        }
    }

    // Boss update: movement + shooting
    if (bossActive && boss && boss.active) {
        bossDriftTime += dt;
        
        // Horizontal sine-wave drift (~40% of screen width)
        const centerX = this.scale.width / 2;
        const hAmplitude = this.scale.width * 0.35;
        boss.x = centerX + Math.sin(bossDriftTime * 0.3) * hAmplitude;
        
        // Gentle vertical bobbing
        const baseY = 130;
        boss.y = baseY + Math.sin(bossDriftTime * 0.5) * 30;
        
        // Update health bar position to follow boss
        if (bossHealthBarBg && bossHealthBarBg.active) {
            updateBossHealthBar();
        }
        
        // Boss shooting
        bossShootTimer -= dt;
        if (bossShootTimer <= 0) {
            bossShootTimer = 1.5;
            fireBossBullet(this);
        }
    }
    
    // Only spawn regular enemies when boss is NOT active
    if (!bossActive) {
        enemySpawnTimer++;
        
        const baseSpawnInterval = 160;
        const minSpawnInterval = 60;
        
        const maxScoreForSpawnRate = 500;
        const scoreDifficulty = Math.min(1, score / maxScoreForSpawnRate);
        
        const timeDifficultyMaxSeconds = 180;
        const timeDifficulty = Math.min(1, elapsedTime / timeDifficultyMaxSeconds);
        
        const combinedDifficulty = (scoreDifficulty * 0.4) + (timeDifficulty * 0.6);
        
        const spawnInterval = Math.max(
            minSpawnInterval,
            baseSpawnInterval - Math.floor(combinedDifficulty * (baseSpawnInterval - minSpawnInterval))
        );
        
        const scoreEnemies = Math.floor(score / 300);
        const timeEnemies = Math.floor(elapsedTime / 45);
        const enemiesPerWave = Math.min(4, Math.max(1, 1 + scoreEnemies + timeEnemies));
        
        if (enemySpawnTimer > spawnInterval) {
            for (let i = 0; i < enemiesPerWave; i++) {
                const delay = i * 10;
                this.time.delayedCall(delay, () => {
                    spawnEnemy(this, score, elapsedTime);
                });
            }
            enemySpawnTimer = 0;
        }
    }
    
    // Remove bullets that go off screen
    bullets.children.entries.forEach((bullet) => {
        if (bullet.y < 0) {
            bullet.destroy();
        }
    });
    
    // Remove boss bullets that go off screen
    bossBullets.children.entries.forEach((b) => {
        if (b.y > this.scale.height + 20 || b.y < -20 || b.x < -20 || b.x > this.scale.width + 20) {
            b.destroy();
        }
    });
    
    // Update enemy horizontal drift and remove off-screen enemies
    enemies.children.entries.forEach((enemy) => {
        if (enemy === boss) return;
        
        if (enemy.y > this.scale.height + 50) {
            score += POINTS_FOR_AVOIDING_ENEMY;
            scoreText.setText('Score: ' + score);
            enemy.destroy();
            return;
        }

        if (enemy.driftAmp1 != null) {
            enemy.driftTime += dt;
            // Random walk: small random nudges that accumulate over time
            enemy.driftWander += (Math.random() - 0.5) * 120 * dt;
            enemy.driftWander *= 0.97; // dampen so it doesn't run away
            const targetX = enemy.driftOriginX
                + Math.sin(enemy.driftTime * enemy.driftSpd1 + enemy.driftPhase1) * enemy.driftAmp1
                + Math.sin(enemy.driftTime * enemy.driftSpd2 + enemy.driftPhase2) * enemy.driftAmp2
                + enemy.driftWander;
            const clampedX = Phaser.Math.Clamp(targetX, 30, this.scale.width - 30);
            enemy.x = clampedX;
        }
    });
}

function shootBullet() {
    const bullet = bullets.create(player.x, player.y - 30, 'bullet');
    bullet.setScale(1);
    bullet.setTint(0x00ff00);
    bullet.body.setSize(4, 12);
    bullet.setVelocityY(-600);
}

function spawnEnemy(scene, currentScore = 0, elapsedTime = 0) {
    // Distribute enemies across the screen width
    const x = Phaser.Math.Between(50, scene.scale.width - 50);
    const textures = scene.textures.list;
    
    const isValidTexture = (key) => {
        if (!textures[key]) return false;
        try {
            const texture = textures[key];
            if (texture.key && texture.key.includes('__MISSING')) return false;
            if (texture.source && texture.source[0]) {
                const source = texture.source[0];
                if (source.width > 0 && source.height > 0) return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };
    
    let enemy;
    let enemyScale = 1;
    
    if (isValidTexture('enemy')) {
        const enemyTexture = scene.textures.get('enemy');
        const imgWidth = enemyTexture.source[0].width;
        const imgHeight = enemyTexture.source[0].height;
        
        // Detect sprite sheet layout (4 frames horizontally)
        const frameWidth = Math.floor(imgWidth / 4);
        const frameHeight = imgHeight;
        
        // Create sprite sheet from the loaded image texture (only once)
        if (!scene.textures.exists('enemySheet')) {
            scene.textures.addSpriteSheet('enemySheet', enemyTexture.source[0].image, {
                frameWidth: frameWidth,
                frameHeight: frameHeight
            });
            
            // Create animation (only once)
            scene.anims.create({
                key: 'enemyFly',
                frames: scene.anims.generateFrameNumbers('enemySheet', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        
        // Create enemy sprite from sheet
        enemy = enemies.create(x, -50, 'enemySheet');
        
        // Play the animation
        enemy.play('enemyFly');
        
        // Scale based on frame size
        const targetSize = 55;
        const maxDimension = Math.max(frameWidth, frameHeight);
        enemyScale = maxDimension > 0 ? targetSize / maxDimension : 1;
        enemy.setScale(enemyScale);
    } else {
        // Fallback: use regular image
        enemy = enemies.create(x, -50, 'enemy');
        enemyScale = 2;
        enemy.setScale(enemyScale);
    }
    
    // Increase enemy speed based on BOTH score and time
    const baseMinSpeed = 100;
    const baseMaxSpeed = 200;
    const maxMinSpeed = 300;
    const maxMaxSpeed = 400;
    
    // Score-based speed increase
    const speedIncreaseScore = 500;
    const scoreSpeedMultiplier = Math.min(1.3, 1 + (currentScore / speedIncreaseScore));
    
    // Time-based speed increase (over 2 minutes)
    const speedIncreaseTime = 120; // 2 minutes
    const timeSpeedMultiplier = Math.min(1.3, 1 + (elapsedTime / speedIncreaseTime));
    
    // Combine both factors (50/50 weight)
    const combinedSpeedMultiplier = (scoreSpeedMultiplier * 0.5) + (timeSpeedMultiplier * 0.5);
    
    const minSpeed = Math.floor(baseMinSpeed * combinedSpeedMultiplier);
    const maxSpeed = Math.floor(Math.min(maxMaxSpeed, baseMaxSpeed * combinedSpeedMultiplier));
    
    enemy.setVelocityY(Phaser.Math.Between(minSpeed, maxSpeed));
    enemy.body.setSize(enemy.width * 0.8, enemy.height * 0.8);

    if (gameLevel >= 2) {
        enemy.driftOriginX = x;
        enemy.driftAmp1 = Phaser.Math.Between(25, 60);
        enemy.driftAmp2 = Phaser.Math.Between(10, 30);
        enemy.driftSpd1 = Phaser.Math.FloatBetween(0.7, 1.8);
        enemy.driftSpd2 = Phaser.Math.FloatBetween(1.5, 3.5);
        enemy.driftPhase1 = Phaser.Math.FloatBetween(0, Math.PI * 2);
        enemy.driftPhase2 = Phaser.Math.FloatBetween(0, Math.PI * 2);
        enemy.driftWander = 0;
        enemy.driftTime = 0;
    }
}

function spawnMathEquation(scene) {
    if (mathEquation) return;

    const a = Phaser.Math.Between(1, 10);
    const b = Phaser.Math.Between(1, 10);
    mathAnswer = a + b;

    const x = Phaser.Math.Between(80, scene.scale.width - 80);
    mathEquation = scene.add.text(x, -40, `${a}+${b}=?`, {
        fontSize: '36px',
        fontStyle: 'bold',
        fill: '#00ffff',
        stroke: '#003366',
        strokeThickness: 5,
        padding: { x: 10, y: 6 }
    });
    mathEquation.setOrigin(0.5);
    mathEquation.setDepth(5);
    mathEquation.setInteractive({ useHandCursor: true });
    mathEquation.on('pointerdown', () => {
        if (gameOver || mathPaused) return;
        activateMathPause(scene);
    });
}

function activateMathPause(scene) {
    mathPaused = true;
    mathInputText = '';
    mathCountdown = MATH_PAUSE_DURATION;

    // Store velocities of all moving objects so we can restore them
    mathStoredVelocities = [];
    enemies.children.entries.forEach((e) => {
        if (e && e.active && e.body) {
            mathStoredVelocities.push({ obj: e, vx: e.body.velocity.x, vy: e.body.velocity.y });
            e.setVelocity(0, 0);
        }
    });
    bullets.children.entries.forEach((b) => {
        if (b && b.active && b.body) {
            mathStoredVelocities.push({ obj: b, vx: b.body.velocity.x, vy: b.body.velocity.y });
            b.setVelocity(0, 0);
        }
    });
    bossBullets.children.entries.forEach((b) => {
        if (b && b.active && b.body) {
            mathStoredVelocities.push({ obj: b, vx: b.body.velocity.x, vy: b.body.velocity.y });
            b.setVelocity(0, 0);
        }
    });
    player.setVelocity(0, 0);

    // Hide the falling equation
    if (mathEquation && mathEquation.active) {
        mathEquation.setVisible(false);
    }

    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;

    // Semi-transparent overlay
    mathOverlay = scene.add.rectangle(0, 0, scene.scale.width, scene.scale.height, 0x000000, 0.7)
        .setOrigin(0, 0).setDepth(50);

    const eqLabel = mathEquation ? mathEquation.text : `?+?=${mathAnswer}`;
    mathQuestionText = scene.add.text(cx, cy - 120, eqLabel.replace('=?', '= ?'), {
        fontSize: '48px',
        fontStyle: 'bold',
        fill: '#00ffff',
        stroke: '#003366',
        strokeThickness: 5
    }).setOrigin(0.5).setDepth(51);

    // Input display
    mathInputDisplay = scene.add.text(cx, cy - 50, '_ _', {
        fontSize: '44px',
        fontStyle: 'bold',
        fill: '#ffffff',
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(51);

    // Countdown text
    mathCountdownText = scene.add.text(cx, cy - 170, `Time: ${MATH_PAUSE_DURATION}`, {
        fontSize: '28px',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 3
    }).setOrigin(0.5).setDepth(51);

    // Number buttons 0-9
    mathNumberButtons = [];
    const btnSize = 50;
    const btnGap = 8;
    const totalWidth = 5 * btnSize + 4 * btnGap;
    const startX = cx - totalWidth / 2 + btnSize / 2;
    const row1Y = cy + 20;
    const row2Y = cy + 20 + btnSize + btnGap;

    for (let i = 0; i < 10; i++) {
        const row = i < 5 ? 0 : 1;
        const col = i < 5 ? i : i - 5;
        const bx = startX + col * (btnSize + btnGap);
        const by = row === 0 ? row1Y : row2Y;
        const digit = i;

        const btnBg = scene.add.rectangle(bx, by, btnSize, btnSize, 0x334466, 1)
            .setDepth(51).setInteractive({ useHandCursor: true });
        const btnLabel = scene.add.text(bx, by, `${digit}`, {
            fontSize: '28px',
            fontStyle: 'bold',
            fill: '#ffffff'
        }).setOrigin(0.5).setDepth(52);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0x5577aa));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x334466));
        btnBg.on('pointerdown', () => {
            if (mathInputText.length < 2) {
                mathInputText += `${digit}`;
                updateMathInputDisplay();
            }
        });

        mathNumberButtons.push(btnBg, btnLabel);
    }

    // Clear button
    const clearY = row2Y + btnSize + btnGap;
    mathClearButton = scene.add.rectangle(cx - 60, clearY, 100, 44, 0x664433, 1)
        .setDepth(51).setInteractive({ useHandCursor: true });
    mathClearLabel = scene.add.text(cx - 60, clearY, 'Clear', {
        fontSize: '22px', fontStyle: 'bold', fill: '#ffffff'
    }).setOrigin(0.5).setDepth(52);
    mathClearButton.on('pointerover', () => mathClearButton.setFillStyle(0x886644));
    mathClearButton.on('pointerout', () => mathClearButton.setFillStyle(0x664433));
    mathClearButton.on('pointerdown', () => {
        mathInputText = '';
        updateMathInputDisplay();
    });

    // Submit button
    mathSubmitButton = scene.add.rectangle(cx + 60, clearY, 100, 44, 0x336633, 1)
        .setDepth(51).setInteractive({ useHandCursor: true });
    mathSubmitLabel = scene.add.text(cx + 60, clearY, 'OK', {
        fontSize: '22px', fontStyle: 'bold', fill: '#ffffff'
    }).setOrigin(0.5).setDepth(52);
    mathSubmitButton.on('pointerover', () => mathSubmitButton.setFillStyle(0x449944));
    mathSubmitButton.on('pointerout', () => mathSubmitButton.setFillStyle(0x336633));
    mathSubmitButton.on('pointerdown', () => {
        evaluateMathAnswer(scene);
    });

    // Keyboard handler
    mathKeyboardHandler = (event) => {
        if (!mathPaused) return;
        if (event.key >= '0' && event.key <= '9' && mathInputText.length < 2) {
            mathInputText += event.key;
            updateMathInputDisplay();
        } else if (event.key === 'Backspace') {
            mathInputText = mathInputText.slice(0, -1);
            updateMathInputDisplay();
        } else if (event.key === 'Enter') {
            evaluateMathAnswer(scene);
        }
    };
    window.addEventListener('keydown', mathKeyboardHandler);

    // Countdown timer — tick every second
    mathTimerEvent = scene.time.addEvent({
        delay: 1000,
        repeat: MATH_PAUSE_DURATION - 1,
        callback: () => {
            mathCountdown--;
            if (mathCountdownText && mathCountdownText.active) {
                mathCountdownText.setText(`Time: ${mathCountdown}`);
            }
            if (mathCountdown <= 0) {
                evaluateMathAnswer(scene);
            }
        }
    });
}

function updateMathInputDisplay() {
    if (!mathInputDisplay || !mathInputDisplay.active) return;
    if (mathInputText.length === 0) {
        mathInputDisplay.setText('_ _');
    } else if (mathInputText.length === 1) {
        mathInputDisplay.setText(mathInputText + ' _');
    } else {
        mathInputDisplay.setText(mathInputText);
    }
}

function evaluateMathAnswer(scene) {
    if (!mathPaused) return;

    // Prevent double-evaluation
    if (mathTimerEvent) {
        mathTimerEvent.remove(false);
        mathTimerEvent = null;
    }

    const userAnswer = parseInt(mathInputText, 10);
    const correct = (userAnswer === mathAnswer);

    if (correct) {
        score += MATH_CORRECT_POINTS;
        scoreText.setText('Score: ' + score);
        playEnemyShotSound();
        showMathFeedback(scene, 'CORRECT! +300', '#00ff00');
    } else {
        health--;
        healthText.setText('Health: ' + health);
        playPlayerHitSound();
        showMathFeedback(scene, `WRONG! Answer: ${mathAnswer}`, '#ff4444');
        if (health <= 0) {
            cleanupMathUI();
            resumeAfterMath();
            gameOver = true;
            player.setTint(0xff0000);
            playPlayerDeathSound();
            showGameOver();
            return;
        }
    }

    const wasCorrect = correct;
    scene.time.delayedCall(800, () => {
        cleanupMathUI();
        resumeAfterMath();

        if (wasCorrect) {
            const toExplode = enemies.children.entries.slice().filter(
                (e) => e && e.active && !e.isBoss
            );
            playEnemyShotSound();
            toExplode.forEach((enemy, i) => {
                scene.time.delayedCall(i * 50, () => {
                    if (enemy && enemy.active) {
                        createExplosion(scene, enemy.x, enemy.y, 1.0);
                        enemy.destroy();
                    }
                });
            });
        }
    });
}

function showMathFeedback(scene, message, color) {
    const cx = scene.scale.width / 2;
    const cy = scene.scale.height / 2;
    const fb = scene.add.text(cx, cy - 50, message, {
        fontSize: '36px',
        fontStyle: 'bold',
        fill: color,
        stroke: '#000',
        strokeThickness: 4
    }).setOrigin(0.5).setDepth(55);

    // Hide the input/buttons immediately so only feedback shows
    if (mathInputDisplay && mathInputDisplay.active) mathInputDisplay.setVisible(false);
    if (mathCountdownText && mathCountdownText.active) mathCountdownText.setVisible(false);
    mathNumberButtons.forEach(b => { if (b && b.active) b.setVisible(false); });
    if (mathClearButton && mathClearButton.active) mathClearButton.setVisible(false);
    if (mathClearLabel && mathClearLabel.active) mathClearLabel.setVisible(false);
    if (mathSubmitButton && mathSubmitButton.active) mathSubmitButton.setVisible(false);
    if (mathSubmitLabel && mathSubmitLabel.active) mathSubmitLabel.setVisible(false);

    scene.time.delayedCall(750, () => {
        if (fb && fb.active) fb.destroy();
    });
}

function cleanupMathUI() {
    if (mathOverlay && mathOverlay.active) mathOverlay.destroy();
    mathOverlay = null;
    if (mathQuestionText && mathQuestionText.active) mathQuestionText.destroy();
    mathQuestionText = null;
    if (mathInputDisplay && mathInputDisplay.active) mathInputDisplay.destroy();
    mathInputDisplay = null;
    if (mathCountdownText && mathCountdownText.active) mathCountdownText.destroy();
    mathCountdownText = null;
    if (mathClearButton && mathClearButton.active) mathClearButton.destroy();
    mathClearButton = null;
    if (mathClearLabel && mathClearLabel.active) mathClearLabel.destroy();
    mathClearLabel = null;
    if (mathSubmitButton && mathSubmitButton.active) mathSubmitButton.destroy();
    mathSubmitButton = null;
    if (mathSubmitLabel && mathSubmitLabel.active) mathSubmitLabel.destroy();
    mathSubmitLabel = null;
    mathNumberButtons.forEach(b => { if (b && b.active) b.destroy(); });
    mathNumberButtons = [];
    if (mathTimerEvent) { mathTimerEvent.remove(false); mathTimerEvent = null; }
    if (mathKeyboardHandler) { window.removeEventListener('keydown', mathKeyboardHandler); mathKeyboardHandler = null; }
    if (mathEquation && mathEquation.active) mathEquation.destroy();
    mathEquation = null;
}

function resumeAfterMath() {
    mathPaused = false;
    mathInputText = '';
    mathSpawnTimer = 0;

    // Restore stored velocities
    mathStoredVelocities.forEach(({ obj, vx, vy }) => {
        if (obj && obj.active && obj.body) {
            obj.setVelocity(vx, vy);
        }
    });
    mathStoredVelocities = [];
}

function spawnBoss(scene) {
    const textures = scene.textures.list;
    const isValidTexture = (key) => {
        if (!textures[key]) return false;
        try {
            const texture = textures[key];
            if (texture.key && texture.key.includes('__MISSING')) return false;
            if (texture.source && texture.source[0]) {
                const source = texture.source[0];
                if (source.width > 0 && source.height > 0) return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    };

    const startX = scene.scale.width / 2;

    if (isValidTexture('boss')) {
        const bossTexture = scene.textures.get('boss');
        const imgWidth = bossTexture.source[0].width;
        const imgHeight = bossTexture.source[0].height;
        const frameWidth = Math.floor(imgWidth / 4);
        const frameHeight = imgHeight;

        if (!scene.textures.exists('bossSheet')) {
            scene.textures.addSpriteSheet('bossSheet', bossTexture.source[0].image, {
                frameWidth: frameWidth,
                frameHeight: frameHeight
            });
            scene.anims.create({
                key: 'bossFly',
                frames: scene.anims.generateFrameNumbers('bossSheet', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        boss = enemies.create(startX, -80, 'bossSheet');
        boss.play('bossFly');

        const targetSize = 120;
        const maxDimension = Math.max(frameWidth, frameHeight);
        const bossScale = maxDimension > 0 ? targetSize / maxDimension : 2;
        boss.setScale(bossScale);
    } else {
        // Fallback: large red diamond
        if (!scene.textures.exists('bossFallback')) {
            const g = scene.add.graphics();
            g.fillStyle(0xff00ff, 1);
            g.fillRect(-20, -20, 40, 40);
            g.lineStyle(3, 0xffffff, 1);
            g.strokeRect(-20, -20, 40, 40);
            g.generateTexture('bossFallback', 40, 40);
            g.destroy();
        }
        boss = enemies.create(startX, -80, 'bossFallback');
        boss.setScale(3);
    }

    boss.isBoss = true;
    boss.setVelocity(0, 0);
    boss.body.setSize(boss.width * 0.8, boss.height * 0.8);

    // Tween the boss from off-screen down to its hover position
    scene.tweens.add({
        targets: boss,
        y: 130,
        duration: 1500,
        ease: 'Power2'
    });

    bossActive = true;
    bossHP = BOSS_MAX_HP;
    bossDriftTime = 0;
    bossShootTimer = 2.0;

    // Create health bar background (dark red)
    bossHealthBarBg = scene.add.rectangle(
        scene.scale.width / 2, 30, 200, 14, 0x440000
    ).setDepth(10);

    // Create health bar fill (bright red)
    bossHealthBar = scene.add.rectangle(
        scene.scale.width / 2, 30, 200, 14, 0xff0000
    ).setDepth(11);
}

function updateBossHealthBar() {
    if (!bossHealthBar || !bossHealthBar.active) return;
    const ratio = bossHP / BOSS_MAX_HP;
    bossHealthBar.width = 200 * ratio;
    // Shift color from red to green as HP is depleted... actually keep it red-to-yellow
    if (ratio > 0.5) {
        bossHealthBar.setFillStyle(0xff0000);
    } else if (ratio > 0.25) {
        bossHealthBar.setFillStyle(0xff8800);
    } else {
        bossHealthBar.setFillStyle(0xffff00);
    }
}

function fireBossBullet(scene) {
    if (!boss || !boss.active) return;
    const b = bossBullets.create(boss.x, boss.y + 20, 'bossBullet');
    b.setScale(1.5);

    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
    const speed = 280;
    b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    playBossShootSound();
}

function hitPlayerWithBossBullet(playerSprite, bullet) {
    bullet.destroy();
    health--;
    healthText.setText('Health: ' + health);

    playPlayerHitSound();

    playerSprite.setTint(0xff0000);
    playerSprite.scene.time.delayedCall(200, () => {
        playerSprite.clearTint();
    });

    if (health <= 0) {
        gameOver = true;
        playerSprite.setTint(0xff0000);
        playPlayerDeathSound();
        showGameOver();
    }
}

function destroyBoss(scene) {
    if (boss && boss.active) boss.destroy();
    boss = null;
    bossActive = false;
    if (bossHealthBar && bossHealthBar.active) bossHealthBar.destroy();
    if (bossHealthBarBg && bossHealthBarBg.active) bossHealthBarBg.destroy();
    bossHealthBar = null;
    bossHealthBarBg = null;
    bossBullets.clear(true, true);
    lastBossSpawnTime = (player.scene.time.now - gameStartTime) / 1000;

    gameLevel++;
    levelText.setText('Level: ' + gameLevel);
    const announcement = scene.add.text(scene.scale.width / 2, scene.scale.height / 2, `LEVEL ${gameLevel}!`, {
        fontSize: '56px',
        fontStyle: 'bold',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 6
    }).setOrigin(0.5).setDepth(20);
    scene.time.delayedCall(2000, () => {
        if (announcement && announcement.active) announcement.destroy();
    });
}

function hitEnemy(bullet, enemy) {
    const scene = bullet.scene;

    // Boss: absorb hit, decrement HP
    if (enemy.isBoss) {
        bullet.destroy();
        bossHP--;
        updateBossHealthBar();
        playEnemyShotSound();

        // Flash the boss white briefly
        enemy.setTint(0xffffff);
        scene.time.delayedCall(80, () => {
            if (enemy && enemy.active) enemy.clearTint();
        });

        if (bossHP <= 0) {
            const bossX = enemy.x;
            const bossY = enemy.y;

            score += POINTS_FOR_SHOOTING_BOSS;
            scoreText.setText('Score: ' + score);

            destroyBoss(scene);
            createBossExplosion(scene, bossX, bossY);
        }
        return;
    }

    // Regular enemy: destroy immediately
    const enemyX = enemy.x;
    const enemyY = enemy.y;

    bullet.destroy();
    enemy.destroy();

    playEnemyShotSound();

    score += POINTS_FOR_SHOOTING_ENEMY;
    scoreText.setText('Score: ' + score);

    createExplosion(scene, enemyX, enemyY, 1.0);
}

function createExplosion(scene, x, y, scale) {
    try {
        const flash = scene.add.particles(x, y, 'explosionFlash', {
            speed: 0,
            scale: { start: 1.5 * scale, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0xffffff,
            lifespan: 100,
            quantity: 1
        });

        const fireParticles = scene.add.particles(x, y, 'explosionParticle', {
            speed: { min: 100 * scale, max: 250 * scale },
            angle: { min: 0, max: 360 },
            scale: { start: 1 * scale, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff0000, 0xff4400, 0xff8800],
            lifespan: { min: 400, max: 600 },
            quantity: Math.floor(15 * scale),
            gravityY: 50
        });

        const sparkParticles = scene.add.particles(x, y, 'explosionParticle', {
            speed: { min: 150 * scale, max: 300 * scale },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8 * scale, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffff00, 0xffaa00],
            lifespan: { min: 300, max: 500 },
            quantity: Math.floor(10 * scale)
        });

        const debrisParticles = scene.add.particles(x, y, 'explosionParticle', {
            speed: { min: 80 * scale, max: 200 * scale },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2 * scale, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0x333333, 0x666666, 0x999999],
            lifespan: { min: 500, max: 700 },
            quantity: Math.floor(8 * scale),
            gravityY: 100
        });

        const cleanupTime = Math.floor(700 * scale);
        scene.time.delayedCall(cleanupTime, () => {
            if (flash && flash.active) flash.destroy();
            if (fireParticles && fireParticles.active) fireParticles.destroy();
            if (sparkParticles && sparkParticles.active) sparkParticles.destroy();
            if (debrisParticles && debrisParticles.active) debrisParticles.destroy();
        });
    } catch (e) {
        console.log('Explosion effect error (non-critical):', e);
    }
}

function createBossExplosion(scene, x, y) {
    // Multiple staggered explosions for a dramatic boss death
    for (let i = 0; i < 5; i++) {
        scene.time.delayedCall(i * 200, () => {
            const offsetX = x + Phaser.Math.Between(-40, 40);
            const offsetY = y + Phaser.Math.Between(-40, 40);
            createExplosion(scene, offsetX, offsetY, 2.0);
            playEnemyShotSound();
        });
    }
}

function hitPlayer(player, enemy) {
    enemy.destroy();
    health--;
    healthText.setText('Health: ' + health);
    
    // Play hit sound effect (every time player is hit)
    playPlayerHitSound();
    
    // Visual feedback - flash player
    player.setTint(0xff0000);
    player.scene.time.delayedCall(200, () => {
        player.clearTint();
    });
    
    if (health <= 0) {
        gameOver = true;
        player.setTint(0xff0000);
        // Play player death sound effect (different from hit sound)
        playPlayerDeathSound();
        showGameOver();
    }
}

function showGameOver() {
    const scene = player.scene;
    
    // Stop all movement
    player.setVelocity(0, 0);
    enemies.children.entries.forEach((enemy) => {
        enemy.setVelocity(0, 0);
    });
    bullets.children.entries.forEach((bullet) => {
        bullet.setVelocity(0, 0);
    });
    bossBullets.children.entries.forEach((b) => {
        b.setVelocity(0, 0);
    });
    
    // Clear any existing game over texts first
    gameOverTexts.forEach(text => {
        if (text && text.active) {
            text.destroy();
        }
    });
    gameOverTexts = [];
    
    // Game Over text
    const gameOverText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 - 50, 'GAME OVER', {
        fontSize: '48px',
        fill: '#ff0000',
        stroke: '#000',
        strokeThickness: 4
    });
    gameOverText.setOrigin(0.5);
    gameOverTexts.push(gameOverText);
    
    const finalScoreText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 20, 'Final Score: ' + score, {
        fontSize: '32px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    finalScoreText.setOrigin(0.5);
    gameOverTexts.push(finalScoreText);
    
    const restartText = scene.add.text(scene.scale.width / 2, scene.scale.height / 2 + 80, 'Tap or Click to Restart', {
        fontSize: '24px',
        fill: '#ffff00',
        stroke: '#000',
        strokeThickness: 4
    });
    restartText.setOrigin(0.5);
    gameOverTexts.push(restartText);
    
    // Restart on click/tap
    scene.input.once('pointerdown', () => {
        restartGame();
    });
    
    scene.input.keyboard.once('keydown-SPACE', () => {
        restartGame();
    });
}

function restartGame() {
    score = 0;
    health = 3;
    gameOver = false;
    enemySpawnTimer = 0;
    shootCooldown = 0;
    touchActive = false;
    gameStartTime = player.scene.time.now;
    gameLevel = 1;
    levelText.setText('Level: 1');

    // Reset math equation state
    cleanupMathUI();
    mathPaused = false;
    mathInputText = '';
    mathSpawnTimer = 0;
    mathCountdown = 0;
    mathStoredVelocities = [];

    // Reset boss state
    if (bossHealthBar && bossHealthBar.active) bossHealthBar.destroy();
    if (bossHealthBarBg && bossHealthBarBg.active) bossHealthBarBg.destroy();
    bossHealthBar = null;
    bossHealthBarBg = null;
    boss = null;
    bossActive = false;
    bossHP = 0;
    bossShootTimer = 0;
    lastBossSpawnTime = 0;
    bossDriftTime = 0;

    // Clear all sprites
    enemies.clear(true, true);
    bullets.clear(true, true);
    bossBullets.clear(true, true);
    
    // Reset player
    player.setPosition(player.scene.scale.width / 2, player.scene.scale.height - 100);
    player.clearTint();
    player.setVelocity(0, 0);
    
    // Reset UI
    scoreText.setText('Score: 0');
    healthText.setText('Health: 3');
    
    // Remove all game over text objects
    gameOverTexts.forEach(text => {
        if (text && text.active) {
            text.destroy();
        }
    });
    gameOverTexts = [];
    
    // Also search and remove any remaining text objects that might have been missed
    const scene = player.scene;
    scene.children.list.forEach((child) => {
        if (child && child.active && child.type === 'Text') {
            const text = child.text || '';
            if (text === 'GAME OVER' || text.includes('Final Score') || text.includes('Tap or Click') || text.includes('Restart')) {
                child.destroy();
            }
        }
    });
}

function createFallbackStarField(scene) {
    // Always create fallback stars (they'll be used if images don't load)
    if (!scene.textures.exists('fallbackStars')) {
        const graphics = scene.add.graphics();
        const width = scene.scale.width || 800;
        const height = scene.scale.height || 600;
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, width, height * 2);
        
        // Add some white dots as stars
        graphics.fillStyle(0xffffff, 1);
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height * 2;
            const size = Math.random() * 2 + 0.5;
            graphics.fillCircle(x, y, size);
        }
        
        graphics.generateTexture('fallbackStars', width, height * 2);
        graphics.destroy();
    }
}

function createFallbackPlayer(scene) {
    // Only create fallback if player texture doesn't exist or is invalid
    // This function should only be called when we know the image didn't load
    const graphics = scene.add.graphics();
    graphics.fillStyle(0x00ffff, 1);
    graphics.fillTriangle(0, -20, -15, 15, 15, 15);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeTriangle(0, -20, -15, 15, 15, 15);
    graphics.generateTexture('player', 30, 35);
    graphics.destroy();
}

function createFallbackEnemy(scene) {
    // Only create fallback if enemy texture doesn't exist or is invalid
    // This function should only be called when we know the image didn't load
    const graphics = scene.add.graphics();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(-15, -15, 30, 30);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(-15, -15, 30, 30);
    graphics.generateTexture('enemy', 30, 30);
    graphics.destroy();
}

