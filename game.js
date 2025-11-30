// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
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
let lastTouchX = 0;
let lastTouchY = 0;
let shootKey;
let enemySpawnTimer = 0;
let shootCooldown = 0;
let gameStartTime = 0; // Track when game started

// Scoring constants
const POINTS_FOR_AVOIDING_ENEMY = 10; // Points for avoiding an enemy (when it exits screen)
const POINTS_FOR_SHOOTING_ENEMY = POINTS_FOR_AVOIDING_ENEMY * 5; // 5x points for shooting (50 points)

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

function preload() {
    // Load images first (we'll create sprite sheets from them in create())
    this.load.image('player', 'images/player.png');
    this.load.image('enemy', 'images/enemy.png');
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
    // Create solid black background first
    this.add.rectangle(0, 0, config.width, config.height, 0x000000).setOrigin(0, 0).setDepth(-100);
    
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
        const starsLayer = this.add.tileSprite(0, 0, config.width, config.height * 2, textureToUse);
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
        player = this.physics.add.sprite(config.width / 2, config.height - 100, 'playerSheet');
        
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
        player = this.physics.add.sprite(config.width / 2, config.height - 100, 'player');
        playerScale = 2;
        player.setScale(playerScale);
        console.log('Using fallback player graphics');
    }
    
    player.setCollideWorldBounds(true);
    
    // Create groups for enemies and bullets
    enemies = this.physics.add.group();
    bullets = this.physics.add.group();
    
    // Keyboard controls
    cursors = this.input.keyboard.createCursorKeys();
    shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // Touch controls - drag to move
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.input.on('pointerdown', (pointer) => {
        touchStartTime = this.time.now;
        touchStartX = pointer.x;
        touchStartY = pointer.y;
        touchActive = true;
        lastTouchX = pointer.x;
        lastTouchY = pointer.y;
    });
    
    this.input.on('pointermove', (pointer) => {
        if (touchActive && !gameOver) {
            lastTouchX = pointer.x;
            lastTouchY = pointer.y;
            // Move player towards touch position smoothly
            const distance = Phaser.Math.Distance.Between(player.x, player.y, lastTouchX, lastTouchY);
            if (distance > 5) {
                this.physics.moveTo(player, lastTouchX, lastTouchY, 300);
            } else {
                player.setVelocity(0, 0);
            }
        }
    });
    
    this.input.on('pointerup', (pointer) => {
        const touchDuration = this.time.now - touchStartTime;
        const touchDistance = Phaser.Math.Distance.Between(touchStartX, touchStartY, pointer.x, pointer.y);
        
        // If it was a quick tap (not a drag), shoot
        if (touchDuration < 200 && touchDistance < 10 && !gameOver && shootCooldown <= 0) {
            shootBullet();
            shootCooldown = 10;
        }
        
        touchActive = false;
        if (!gameOver) {
            player.setVelocity(0, 0);
        }
    });
    
    // Collision detection
    this.physics.add.overlap(bullets, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, enemies, hitPlayer, null, this);
    
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
    
    // Initialize game start time
    gameStartTime = this.time.now;
}

function update() {
    if (gameOver) {
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
        if (starLayer.tilePositionY <= -config.height) {
            starLayer.tilePositionY = 0;
        }
    });
    
    // Keyboard movement
    if (!touchActive) {
        const speed = 300;
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
    
    // Spawn enemies with increasing difficulty (based on both score AND time)
    enemySpawnTimer++;
    
    // Calculate elapsed time in seconds
    const elapsedTime = (this.time.now - gameStartTime) / 1000; // Convert to seconds
    
    // Calculate difficulty based on BOTH score and time
    const baseSpawnInterval = 120; // 2 seconds at start
    const minSpawnInterval = 40; // Minimum 0.67 seconds (very fast)
    
    // Score-based difficulty (0 to 1)
    const maxScoreForSpawnRate = 300;
    const scoreDifficulty = Math.min(1, score / maxScoreForSpawnRate);
    
    // Time-based difficulty (0 to 1) - increases over 2 minutes
    const timeDifficultyMaxSeconds = 120; // 2 minutes
    const timeDifficulty = Math.min(1, elapsedTime / timeDifficultyMaxSeconds);
    
    // Combine both factors (weighted: 40% score, 60% time)
    const combinedDifficulty = (scoreDifficulty * 0.4) + (timeDifficulty * 0.6);
    
    // Calculate spawn interval based on combined difficulty
    const spawnInterval = Math.max(
        minSpawnInterval,
        baseSpawnInterval - Math.floor(combinedDifficulty * (baseSpawnInterval - minSpawnInterval))
    );
    
    // Calculate number of enemies to spawn based on BOTH score and time
    // Score factor: 1 enemy per 200 points
    // Time factor: +1 enemy every 30 seconds
    const scoreEnemies = Math.floor(score / 200);
    const timeEnemies = Math.floor(elapsedTime / 30);
    const enemiesPerWave = Math.min(6, Math.max(1, 1 + scoreEnemies + timeEnemies));
    
    if (enemySpawnTimer > spawnInterval) {
        // Spawn multiple enemies in a wave
        for (let i = 0; i < enemiesPerWave; i++) {
            // Stagger spawn positions slightly to avoid overlap
            const delay = i * 10; // Small delay between each enemy in the wave
            this.time.delayedCall(delay, () => {
                spawnEnemy(this, score, elapsedTime);
            });
        }
        enemySpawnTimer = 0;
    }
    
    // Remove bullets that go off screen
    bullets.children.entries.forEach((bullet) => {
        if (bullet.y < 0) {
            bullet.destroy();
        }
    });
    
    // Remove enemies that go off screen (player avoided them - award points)
    enemies.children.entries.forEach((enemy) => {
        if (enemy.y > config.height + 50) {
            // Award points for successfully avoiding the enemy
            score += POINTS_FOR_AVOIDING_ENEMY;
            scoreText.setText('Score: ' + score);
            enemy.destroy();
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
    const x = Phaser.Math.Between(50, config.width - 50);
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
}

function hitEnemy(bullet, enemy) {
    // Store position before destroying
    const enemyX = enemy.x;
    const enemyY = enemy.y;
    const scene = bullet.scene;
    
    // Destroy bullet and enemy
    bullet.destroy();
    enemy.destroy();
    
    // Play enemy shot sound effect
    playEnemyShotSound();
    
    // Update score (5x points for shooting vs avoiding)
    score += POINTS_FOR_SHOOTING_ENEMY;
    scoreText.setText('Score: ' + score);
    
    // Create dramatic explosion effect
    try {
        // Create initial flash effect (bright white flash that fades quickly)
        const flash = scene.add.particles(enemyX, enemyY, 'explosionFlash', {
            speed: 0,
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0xffffff,
            lifespan: 100,
            quantity: 1
        });
        
        // Main explosion - red/orange fire particles
        const fireParticles = scene.add.particles(enemyX, enemyY, 'explosionParticle', {
            speed: { min: 100, max: 250 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xff0000, 0xff4400, 0xff8800], // Red, orange-red, orange
            lifespan: { min: 400, max: 600 },
            quantity: 15,
            gravityY: 50 // Slight downward pull
        });
        
        // Secondary explosion - yellow sparks
        const sparkParticles = scene.add.particles(enemyX, enemyY, 'explosionParticle', {
            speed: { min: 150, max: 300 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffff00, 0xffaa00], // Yellow, orange-yellow
            lifespan: { min: 300, max: 500 },
            quantity: 10
        });
        
        // Debris particles - darker chunks
        const debrisParticles = scene.add.particles(enemyX, enemyY, 'explosionParticle', {
            speed: { min: 80, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 0.8, end: 0 },
            tint: [0x333333, 0x666666, 0x999999], // Dark gray debris
            lifespan: { min: 500, max: 700 },
            quantity: 8,
            gravityY: 100 // More gravity for debris
        });
        
        // Clean up all particle emitters after animation completes
        scene.time.delayedCall(700, () => {
            if (flash && flash.active) flash.destroy();
            if (fireParticles && fireParticles.active) fireParticles.destroy();
            if (sparkParticles && sparkParticles.active) sparkParticles.destroy();
            if (debrisParticles && debrisParticles.active) debrisParticles.destroy();
        });
    } catch (e) {
        // If particles fail, just continue - don't freeze the game
        console.log('Explosion effect error (non-critical):', e);
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
    
    // Clear any existing game over texts first
    gameOverTexts.forEach(text => {
        if (text && text.active) {
            text.destroy();
        }
    });
    gameOverTexts = [];
    
    // Game Over text
    const gameOverText = scene.add.text(config.width / 2, config.height / 2 - 50, 'GAME OVER', {
        fontSize: '48px',
        fill: '#ff0000',
        stroke: '#000',
        strokeThickness: 4
    });
    gameOverText.setOrigin(0.5);
    gameOverTexts.push(gameOverText);
    
    const finalScoreText = scene.add.text(config.width / 2, config.height / 2 + 20, 'Final Score: ' + score, {
        fontSize: '32px',
        fill: '#fff',
        stroke: '#000',
        strokeThickness: 4
    });
    finalScoreText.setOrigin(0.5);
    gameOverTexts.push(finalScoreText);
    
    const restartText = scene.add.text(config.width / 2, config.height / 2 + 80, 'Tap or Click to Restart', {
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
    gameStartTime = player.scene.time.now; // Reset game start time
    
    // Clear all sprites
    enemies.clear(true, true);
    bullets.clear(true, true);
    
    // Reset player
    player.setPosition(config.width / 2, config.height - 100);
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
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, config.width, config.height * 2);
        
        // Add some white dots as stars
        graphics.fillStyle(0xffffff, 1);
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * config.width;
            const y = Math.random() * config.height * 2;
            const size = Math.random() * 2 + 0.5;
            graphics.fillCircle(x, y, size);
        }
        
        graphics.generateTexture('fallbackStars', config.width, config.height * 2);
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

