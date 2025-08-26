// Space Games Manager
class GameManager {
    constructor() {
        this.currentGame = null;
        this.gameContainer = document.getElementById('game-container');
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.init();
    }
    
    init() {
        // Set up canvas
        if (this.canvas) {
            this.canvas.width = window.innerWidth * 0.9;
            this.canvas.height = window.innerHeight * 0.8;
        }
        
        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.currentGame) {
                this.closeGame();
            }
        });
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (this.canvas && this.currentGame) {
                this.canvas.width = window.innerWidth * 0.9;
                this.canvas.height = window.innerHeight * 0.8;
            }
        });
    }
    
    startGame(gameType) {
        // Stop current game if any
        if (this.currentGame) {
            this.currentGame.stop();
        }
        
        // Hide menu, show canvas
        const menu = document.querySelector('.game-menu');
        if (menu) menu.style.display = 'none';
        if (this.canvas) this.canvas.style.display = 'block';
        
        // Start selected game
        if (gameType === 'invaders') {
            this.currentGame = new SpaceInvaders(this.canvas, this.ctx);
        } else if (gameType === 'asteroids') {
            this.currentGame = new AsteroidsGame(this.canvas, this.ctx);
        }
        
        if (this.currentGame) {
            this.currentGame.start();
            
            // Play game start sound
            if (window.audioManager) {
                window.audioManager.playSound('gameStart');
            }
        }
    }
    
    closeGame() {
        if (this.currentGame) {
            this.currentGame.stop();
            this.currentGame = null;
        }
        
        // Show menu, hide canvas
        const menu = document.querySelector('.game-menu');
        if (menu) menu.style.display = 'block';
        if (this.canvas) this.canvas.style.display = 'none';
        
        // Hide game container
        if (this.gameContainer) {
            this.gameContainer.classList.add('hidden');
        }
    }
}

// Space Invaders Game
class SpaceInvaders {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isRunning = false;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameOver = false;
        
        // Game objects
        this.player = {
            x: canvas.width / 2 - 25,
            y: canvas.height - 80,
            width: 50,
            height: 30,
            speed: 7
        };
        
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.stars = [];
        
        // Controls
        this.keys = {};
        this.shootCooldown = false;
        
        // Enemy movement
        this.enemyDirection = 1;
        this.enemySpeed = 0.5;
        
        this.init();
    }
    
    init() {
        // Create stars background
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.5
            });
        }
        
        // Create enemies
        this.createEnemies();
        
        // Event listeners
        this.handleKeyDown = (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        };
        
        this.handleKeyUp = (e) => {
            this.keys[e.key] = false;
        };
        
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }
    
    createEnemies() {
        this.enemies = [];
        const rows = 4 + this.level;
        const cols = 8;
        const spacing = 60;
        const startX = (this.canvas.width - (cols * spacing)) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.enemies.push({
                    x: startX + col * spacing,
                    y: 50 + row * 50,
                    width: 40,
                    height: 30,
                    type: row === 0 ? 'special' : row < 2 ? 'strong' : 'normal',
                    points: row === 0 ? 50 : row < 2 ? 20 : 10,
                    color: row === 0 ? '#ff00ff' : row < 2 ? '#00ffff' : '#00ff00',
                    animFrame: 0
                });
            }
        }
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameOver) return;
        
        // Update player
        if (this.keys['ArrowLeft'] && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (this.keys['ArrowRight'] && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        if (this.keys[' '] && !this.shootCooldown) {
            this.playerShoot();
        }
        
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });
        
        // Update enemies
        let shouldDrop = false;
        this.enemies.forEach(enemy => {
            enemy.x += this.enemyDirection * (this.enemySpeed + this.level * 0.2);
            enemy.animFrame = (enemy.animFrame + 0.1) % 2;
            
            if (enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.width) {
                shouldDrop = true;
            }
            
            // Check if enemy reached player
            if (enemy.y > this.canvas.height - 120) {
                this.endGame();
            }
        });
        
        if (shouldDrop) {
            this.enemyDirection *= -1;
            this.enemies.forEach(enemy => {
                enemy.y += 30;
            });
        }
        
        // Random enemy shooting
        if (Math.random() < 0.01 * this.level && this.enemies.length > 0) {
            const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyBullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 12,
                speed: 3 + this.level * 0.5
            });
            
            // Play enemy shoot sound
            if (window.audioManager) {
                window.audioManager.playSound('enemyShoot');
            }
        }
        
        // Update player bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= 10;
            
            // Check collision with enemies
            let hit = false;
            this.enemies = this.enemies.filter(enemy => {
                if (this.checkCollision(bullet, enemy)) {
                    hit = true;
                    this.score += enemy.points;
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.color);
                    
                    // Play explosion sound
                    if (window.audioManager) {
                        window.audioManager.playSound('explosion');
                    }
                    
                    return false;
                }
                return true;
            });
            
            return !hit && bullet.y > 0;
        });
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            
            // Check collision with player
            if (this.checkCollision(bullet, this.player)) {
                this.lives--;
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#ff0000');
                
                // Play hit sound
                if (window.audioManager) {
                    window.audioManager.playSound('playerHit');
                }
                
                if (this.lives <= 0) {
                    this.endGame();
                }
                return false;
            }
            
            return bullet.y < this.canvas.height;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.opacity = particle.life / particle.maxLife;
            return particle.life > 0;
        });
        
        // Check level complete
        if (this.enemies.length === 0) {
            this.level++;
            this.createEnemies();
            
            // Play level up sound
            if (window.audioManager) {
                window.audioManager.playSound('levelUp');
            }
        }
    }
    
    draw() {
        // Clear canvas with trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.ctx.fillStyle = '#ffffff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(${particle.color}, ${particle.opacity})`;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        
        // Draw player
        this.drawPlayer();
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.drawEnemy(enemy);
        });
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            // Glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#ffff00';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });
        
        // Draw enemy bullets
        this.ctx.fillStyle = '#ff0000';
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw UI
        this.drawUI();
        
        // Draw game over screen
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawPlayer() {
        const { x, y, width, height } = this.player;
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.beginPath();
        // Draw spaceship shape
        this.ctx.moveTo(x + width/2, y);
        this.ctx.lineTo(x, y + height);
        this.ctx.lineTo(x + width/4, y + height - 10);
        this.ctx.lineTo(x + width*3/4, y + height - 10);
        this.ctx.lineTo(x + width, y + height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Cockpit
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(x + width/2 - 5, y + 10, 10, 10);
    }
    
    drawEnemy(enemy) {
        const { x, y, width, height, color, animFrame } = enemy;
        
        this.ctx.fillStyle = color;
        
        // Animated enemy shape
        if (enemy.type === 'special') {
            // UFO shape
            this.ctx.beginPath();
            this.ctx.ellipse(x + width/2, y + height/2, width/2, height/3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.ellipse(x + width/2, y + height/3, width/3, height/4, 0, 0, Math.PI);
            this.ctx.fill();
        } else {
            // Invader shape with animation
            const offset = Math.floor(animFrame) * 5;
            this.ctx.fillRect(x + 5, y, width - 10, height - 10);
            this.ctx.fillRect(x, y + 10, width, height - 15);
            
            // Eyes
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(x + 10 + offset, y + 10, 5, 5);
            this.ctx.fillRect(x + width - 15 - offset, y + 10, 5, 5);
        }
    }
    
    drawUI() {
        // Score
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Orbitron, monospace';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        
        // Level
        this.ctx.fillText(`Level: ${this.level}`, 200, 30);
        
        // Lives
        this.ctx.fillText(`Lives: `, this.canvas.width - 150, 30);
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#00ffff';
            this.ctx.beginPath();
            this.ctx.moveTo(this.canvas.width - 80 + i * 25, 20);
            this.ctx.lineTo(this.canvas.width - 90 + i * 25, 35);
            this.ctx.lineTo(this.canvas.width - 70 + i * 25, 35);
            this.ctx.closePath();
            this.ctx.fill();
        }
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '48px Orbitron, monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '24px Orbitron, monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 20);
        this.ctx.fillText(`Level Reached: ${this.level}`, this.canvas.width/2, this.canvas.height/2 + 60);
        this.ctx.fillText('Press ESC to exit', this.canvas.width/2, this.canvas.height/2 + 120);
        
        this.ctx.textAlign = 'left';
    }
    
    playerShoot() {
        this.bullets.push({
            x: this.player.x + this.player.width/2 - 2,
            y: this.player.y,
            width: 4,
            height: 10
        });
        
        this.shootCooldown = true;
        setTimeout(() => this.shootCooldown = false, 200);
        
        // Play shoot sound
        if (window.audioManager) {
            window.audioManager.playSound('laser');
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    createExplosion(x, y, color) {
        const colorRgb = this.hexToRgb(color);
        
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 3 + 1,
                life: 30,
                maxLife: 30,
                color: `${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}`,
                opacity: 1
            });
        }
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
    
    endGame() {
        this.gameOver = true;
        this.isRunning = false;
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.playSound('gameOver');
        }
    }
}

// Asteroids Game (simplified version)
class AsteroidsGame {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.isRunning = false;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        
        // Ship
        this.ship = {
            x: canvas.width / 2,
            y: canvas.height / 2,
            angle: 0,
            vx: 0,
            vy: 0,
            radius: 10
        };
        
        // Game objects  
        this.asteroids = [];
        this.bullets = [];
        this.particles = [];
        
        // Controls
        this.keys = {};
        
        this.init();
    }
    
    init() {
        // Create initial asteroids
        for (let i = 0; i < 5; i++) {
            this.createAsteroid();
        }
        
        // Event listeners
        this.handleKeyDown = (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') e.preventDefault();
        };
        
        this.handleKeyUp = (e) => {
            this.keys[e.key] = false;
        };
        
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }
    
    createAsteroid(x, y, radius) {
        if (!x || !y) {
            // Random position away from ship
            do {
                x = Math.random() * this.canvas.width;
                y = Math.random() * this.canvas.height;
            } while (this.distance(x, y, this.ship.x, this.ship.y) < 150);
        }
        
        this.asteroids.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: radius || 40,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }
    
    start() {
        this.isRunning = true;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.gameOver) return;
        
        // Ship controls
        if (this.keys['ArrowLeft']) {
            this.ship.angle -= 0.1;
        }
        if (this.keys['ArrowRight']) {
            this.ship.angle += 0.1;
        }
        if (this.keys['ArrowUp']) {
            // Thrust
            this.ship.vx += Math.cos(this.ship.angle) * 0.5;
            this.ship.vy += Math.sin(this.ship.angle) * 0.5;
            
            // Thrust particles
            this.createThrustParticle();
        }
        if (this.keys[' ']) {
            this.shoot();
        }
        
        // Update ship position
        this.ship.x += this.ship.vx;
        this.ship.y += this.ship.vy;
        
        // Friction
        this.ship.vx *= 0.99;
        this.ship.vy *= 0.99;
        
        // Wrap ship
        this.ship.x = (this.ship.x + this.canvas.width) % this.canvas.width;
        this.ship.y = (this.ship.y + this.canvas.height) % this.canvas.height;
        
        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.rotation += asteroid.rotationSpeed;
            
            // Wrap asteroids
            asteroid.x = (asteroid.x + this.canvas.width) % this.canvas.width;
            asteroid.y = (asteroid.y + this.canvas.height) % this.canvas.height;
            
            // Check collision with ship
            if (this.distance(asteroid.x, asteroid.y, this.ship.x, this.ship.y) < asteroid.radius + this.ship.radius) {
                this.lives--;
                this.createExplosion(this.ship.x, this.ship.y);
                
                // Reset ship
                this.ship.x = this.canvas.width / 2;
                this.ship.y = this.canvas.height / 2;
                this.ship.vx = 0;
                this.ship.vy = 0;
                
                if (this.lives <= 0) {
                    this.endGame();
                }
                
                // Play hit sound
                if (window.audioManager) {
                    window.audioManager.playSound('playerHit');
                }
            }
        });
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            bullet.life--;
            
            // Check collision with asteroids
            let hit = false;
            this.asteroids = this.asteroids.filter(asteroid => {
                if (this.distance(bullet.x, bullet.y, asteroid.x, asteroid.y) < asteroid.radius) {
                    hit = true;
                    this.score += Math.floor(100 / asteroid.radius * 10);
                    this.createExplosion(asteroid.x, asteroid.y);
                    
                    // Break asteroid
                    if (asteroid.radius > 20) {
                        for (let i = 0; i < 2; i++) {
                            this.createAsteroid(asteroid.x, asteroid.y, asteroid.radius / 2);
                        }
                    }
                    
                    // Play explosion sound
                    if (window.audioManager) {
                        window.audioManager.playSound('explosion');
                    }
                    
                    return false;
                }
                return true;
            });
            
            return !hit && bullet.life > 0;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.opacity = particle.life / particle.maxLife;
            return particle.life > 0;
        });
        
        // Check if all asteroids destroyed
        if (this.asteroids.length === 0) {
            // Create new wave
            for (let i = 0; i < 5 + Math.floor(this.score / 1000); i++) {
                this.createAsteroid();
            }
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 20, 0.2)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(255, 150, 0, ${particle.opacity})`;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        
        // Draw ship
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);
        
        this.ctx.strokeStyle = '#00ffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // Thrust flame
        if (this.keys['ArrowUp']) {
            this.ctx.strokeStyle = '#ff6600';
            this.ctx.beginPath();
            this.ctx.moveTo(-5, -4);
            this.ctx.lineTo(-15 - Math.random() * 5, 0);
            this.ctx.lineTo(-5, 4);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // Draw asteroids
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            
            this.ctx.strokeStyle = '#888888';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            
            const points = 12;
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2;
                const radius = asteroid.radius + (Math.sin(i * 3) * asteroid.radius * 0.2);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.restore();
        });
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw UI
        this.drawUI();
        
        if (this.gameOver) {
            this.drawGameOver();
        }
    }
    
    drawUI() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Orbitron, monospace';
        this.ctx.fillText(`Score: ${this.score}`, 20, 30);
        this.ctx.fillText(`Lives: ${this.lives}`, 200, 30);
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00ffff';
        this.ctx.font = '48px Orbitron, monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width/2, this.canvas.height/2 - 50);
        
        this.ctx.font = '24px Orbitron, monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width/2, this.canvas.height/2 + 20);
        this.ctx.fillText('Press ESC to exit', this.canvas.width/2, this.canvas.height/2 + 80);
        
        this.ctx.textAlign = 'left';
    }
    
    shoot() {
        if (!this.keys[' ']) return; // Prevent auto-fire
        
        const bulletSpeed = 10;
        this.bullets.push({
            x: this.ship.x + Math.cos(this.ship.angle) * 15,
            y: this.ship.y + Math.sin(this.ship.angle) * 15,
            vx: Math.cos(this.ship.angle) * bulletSpeed,
            vy: Math.sin(this.ship.angle) * bulletSpeed,
            life: 60
        });
        
        this.keys[' '] = false; // One shot per press
        
        // Play laser sound
        if (window.audioManager) {
            window.audioManager.playSound('laser');
        }
    }
    
    createExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 3 + 1,
                life: 30,
                maxLife: 30,
                opacity: 1
            });
        }
    }
    
    createThrustParticle() {
        const angle = this.ship.angle + Math.PI;
        this.particles.push({
            x: this.ship.x + Math.cos(angle) * 10,
            y: this.ship.y + Math.sin(angle) * 10,
            vx: Math.cos(angle) * 2 + (Math.random() - 0.5),
            vy: Math.sin(angle) * 2 + (Math.random() - 0.5),
            size: 2,
            life: 15,
            maxLife: 15,
            opacity: 1
        });
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    endGame() {
        this.gameOver = true;
        this.isRunning = false;
        
        // Play game over sound
        if (window.audioManager) {
            window.audioManager.playSound('gameOver');
        }
    }
}

// Initialize game manager
window.gameManager = new GameManager();