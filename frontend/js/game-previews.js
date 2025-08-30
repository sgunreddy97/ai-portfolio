// Game Preview Animations for Games Page
function initGamePreviews() {
    // Initialize all game preview canvases
    initInvadersPreview();
    initAsteroidsPreview();
    initMinesweeperPreview();
    initBlockBreakerPreview();
    initSnakePreview();
    initMemoryPreview();
}

function initInvadersPreview() {
    const canvas = document.getElementById('invaders-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 350;
    canvas.height = 200;
    
    let enemies = [];
    let bullets = [];
    let frame = 0;
    
    // Create mini enemies
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
            enemies.push({
                x: 50 + j * 50,
                y: 30 + i * 30,
                size: 15,
                color: `hsl(${i * 120}, 100%, 50%)`
            });
        }
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw enemies
        enemies.forEach((enemy, index) => {
            enemy.x += Math.sin(frame * 0.02 + index) * 0.5;
            
            ctx.fillStyle = enemy.color;
            ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
        });
        
        // Random bullets
        if (frame % 30 === 0) {
            bullets.push({
                x: Math.random() * canvas.width,
                y: canvas.height,
                vy: -5
            });
        }
        
        // Update bullets
        bullets = bullets.filter(bullet => {
            bullet.y += bullet.vy;
            
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(bullet.x, bullet.y, 3, 10);
            
            return bullet.y > -10;
        });
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initAsteroidsPreview() {
    const canvas = document.getElementById('asteroids-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 350;
    canvas.height = 200;
    
    let asteroids = [];
    
    // Create asteroids
    for (let i = 0; i < 5; i++) {
        asteroids.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15 + Math.random() * 20,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1
        });
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        asteroids.forEach(asteroid => {
            asteroid.x += asteroid.vx;
            asteroid.y += asteroid.vy;
            asteroid.rotation += asteroid.rotSpeed;
            
            // Wrap around
            if (asteroid.x < 0) asteroid.x = canvas.width;
            if (asteroid.x > canvas.width) asteroid.x = 0;
            if (asteroid.y < 0) asteroid.y = canvas.height;
            if (asteroid.y > canvas.height) asteroid.y = 0;
            
            // Draw asteroid
            ctx.save();
            ctx.translate(asteroid.x, asteroid.y);
            ctx.rotate(asteroid.rotation);
            
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = asteroid.size + Math.sin(i * 3) * 5;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initMinesweeperPreview() {
    const canvas = document.getElementById('minesweeper-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 350;
    canvas.height = 200;
    
    const gridSize = 8;
    const cellSize = 25;
    const offsetX = (canvas.width - gridSize * cellSize) / 2;
    const offsetY = (canvas.height - gridSize * cellSize) / 2;
    
    let revealedCells = new Set();
    let frame = 0;
    
    function animate() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Randomly reveal cells
        if (frame % 30 === 0 && revealedCells.size < gridSize * gridSize / 2) {
            const x = Math.floor(Math.random() * gridSize);
            const y = Math.floor(Math.random() * gridSize);
            revealedCells.add(`${x},${y}`);
        }
        
        // Draw grid
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = offsetX + j * cellSize;
                const y = offsetY + i * cellSize;
                
                if (revealedCells.has(`${j},${i}`)) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                } else {
                    const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
                    gradient.addColorStop(1, 'rgba(0, 136, 255, 0.1)');
                    ctx.fillStyle = gradient;
                }
                
                ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
                
                // Random numbers in revealed cells
                if (revealedCells.has(`${j},${i}`) && Math.random() > 0.5) {
                    ctx.fillStyle = ['#0088ff', '#00ff00', '#ff0000'][Math.floor(Math.random() * 3)];
                    ctx.font = 'bold 14px Orbitron';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(Math.floor(Math.random() * 3) + 1, x + cellSize/2, y + cellSize/2);
                }
            }
        }
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initBlockBreakerPreview() {
    const canvas = document.getElementById('blockbreaker-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 350;
    canvas.height = 200;
    
    let ball = {
        x: canvas.width / 2,
        y: canvas.height - 50,
        vx: 3,
        vy: -3,
        radius: 5
    };
    
    let paddle = {
        x: canvas.width / 2 - 30,
        y: canvas.height - 20,
        width: 60,
        target: canvas.width / 2
    };
    
    let blocks = [];
    
    // Create blocks
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 8; j++) {
            blocks.push({
                x: 30 + j * 40,
                y: 30 + i * 20,
                width: 35,
                height: 15,
                color: `hsl(${i * 120 + j * 20}, 100%, 50%)`,
                alive: true
            });
        }
    }
    
    function animate() {
        ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update ball
        ball.x += ball.vx;
        ball.y += ball.vy;
        
        // Ball collision with walls
        if (ball.x <= ball.radius || ball.x >= canvas.width - ball.radius) {
            ball.vx = -ball.vx;
        }
        if (ball.y <= ball.radius) {
            ball.vy = -ball.vy;
        }
        if (ball.y >= canvas.height) {
            ball.y = canvas.height - 50;
            ball.vy = -3;
        }
        
        // Ball collision with paddle
        if (ball.y + ball.radius >= paddle.y &&
            ball.x >= paddle.x &&
            ball.x <= paddle.x + paddle.width) {
            ball.vy = -Math.abs(ball.vy);
        }
        
        // Auto-move paddle
        paddle.target = ball.x - paddle.width / 2;
        paddle.x += (paddle.target - paddle.x) * 0.1;
        
        // Ball collision with blocks
        blocks.forEach(block => {
            if (block.alive &&
                ball.x + ball.radius > block.x &&
                ball.x - ball.radius < block.x + block.width &&
                ball.y + ball.radius > block.y &&
                ball.y - ball.radius < block.y + block.height) {
                block.alive = false;
                ball.vy = -ball.vy;
                
                // Respawn block after delay
                setTimeout(() => {
                    block.alive = true;
                }, 3000);
            }
        });
        
        // Draw blocks
        blocks.forEach(block => {
            if (block.alive) {
                ctx.fillStyle = block.color;
                ctx.fillRect(block.x, block.y, block.width, block.height);
            }
        });
        
        // Draw paddle
        const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + paddle.width, paddle.y);
        gradient.addColorStop(0, '#0088ff');
        gradient.addColorStop(0.5, '#00ffff');
        gradient.addColorStop(1, '#0088ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(paddle.x, paddle.y, paddle.width, 10);
        
        // Draw ball
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initSnakePreview() {
    const canvas = document.getElementById('snake-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 350;
    canvas.height = 200;
    
    const gridSize = 20;
    const cellSize = 10;
    
    let snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    let direction = { x: 1, y: 0 };
    let frame = 0;
    let food = { x: 15, y: 10 };
    
    function animate() {
        if (frame % 10 === 0) {
            // Move snake
            const head = { ...snake[0] };
            head.x += direction.x;
            head.y += direction.y;
            
            // Wrap around
            if (head.x < 0) head.x = gridSize - 1;
            if (head.x >= gridSize) head.x = 0;
            if (head.y < 0) head.y = gridSize - 1;
            if (head.y >= gridSize) head.y = 0;
            
            snake.unshift(head);
            
            // Check food
            if (head.x === food.x && head.y === food.y) {
                food = {
                    x: Math.floor(Math.random() * gridSize),
                    y: Math.floor(Math.random() * gridSize)
                };
            } else {
                snake.pop();
            }
            
            // Random direction change
            if (Math.random() < 0.3) {
                const dirs = [
                    { x: 1, y: 0 },
                    { x: -1, y: 0 },
                    { x: 0, y: 1 },
                    { x: 0, y: -1 }
                ];
                const newDir = dirs[Math.floor(Math.random() * dirs.length)];
                if (newDir.x !== -direction.x || newDir.y !== -direction.y) {
                    direction = newDir;
                }
            }
        }
        
        ctx.fillStyle = 'rgba(10, 10, 20, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw snake
        snake.forEach((segment, index) => {
            const x = segment.x * cellSize + (canvas.width - gridSize * cellSize) / 2;
            const y = segment.y * cellSize + (canvas.height - gridSize * cellSize) / 2;
            
            const opacity = 1 - index / snake.length * 0.5;
            ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
            ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
        });
        
        // Draw food
        const foodX = food.x * cellSize + (canvas.width - gridSize * cellSize) / 2;
        const foodY = food.y * cellSize + (canvas.height - gridSize * cellSize) / 2;
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(foodX + cellSize/2, foodY + cellSize/2, cellSize/3, 0, Math.PI * 2);
        ctx.fill();
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}

function initMemoryPreview() {
    const canvas = document.getElementById('memory-preview');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = 350;
    canvas.height = 200;
    
    const icons = ['🚀', '⭐', '🌙', '☄️', '🛸', '🌍', '🪐', '🌌'];
    const grid = 4;
    const cardSize = 40;
    const offsetX = (canvas.width - grid * cardSize) / 2;
    const offsetY = (canvas.height - grid * cardSize) / 2;
    
    let cards = [];
    let flipped = new Set();
    let frame = 0;
    
    // Create cards
    for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
            cards.push({
                x: offsetX + j * cardSize,
                y: offsetY + i * cardSize,
                icon: icons[(i * grid + j) % icons.length]
            });
        }
    }
    
    function animate() {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Randomly flip cards
        if (frame % 60 === 0) {
            const index = Math.floor(Math.random() * cards.length);
            if (flipped.has(index)) {
                flipped.delete(index);
            } else {
                flipped.add(index);
            }
        }
        
        // Draw cards
        cards.forEach((card, index) => {
            if (flipped.has(index)) {
                // Show icon
                ctx.fillStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.fillRect(card.x, card.y, cardSize - 2, cardSize - 2);
                
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(card.icon, card.x + cardSize/2, card.y + cardSize/2);
            } else {
                // Show back
                const gradient = ctx.createLinearGradient(
                    card.x, card.y,
                    card.x + cardSize, card.y + cardSize
                );
                gradient.addColorStop(0, 'rgba(0, 136, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
                ctx.fillStyle = gradient;
                ctx.fillRect(card.x, card.y, cardSize - 2, cardSize - 2);
            }
        });
        
        frame++;
        requestAnimationFrame(animate);
    }
    
    animate();
}

// Load high scores
function loadHighScores() {
    const scores = JSON.parse(localStorage.getItem('gameHighScores') || '{}');
    
    Object.keys(scores).forEach(game => {
        const element = document.getElementById(`${game.toLowerCase()}-high`);
        if (element) {
            if (game.includes('minesweeper') || game.includes('memory')) {
                // Time-based scores
                const minutes = Math.floor(scores[game] / 60);
                const seconds = scores[game] % 60;
                element.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            } else {
                element.textContent = scores[game];
            }
        }
    });
}

// Load leaderboard
function loadLeaderboard(filter = 'all') {
    const leaderboard = JSON.parse(localStorage.getItem('gameLeaderboard') || '[]');
    const content = document.getElementById('leaderboard-content');
    
    if (!content) return;
    
    let filtered = leaderboard;
    
    // Apply filter
    const now = Date.now();
    switch(filter) {
        case 'today':
            filtered = leaderboard.filter(entry => 
                now - entry.timestamp < 24 * 60 * 60 * 1000
            );
            break;
        case 'week':
            filtered = leaderboard.filter(entry => 
                now - entry.timestamp < 7 * 24 * 60 * 60 * 1000
            );
            break;
    }
    
    // Sort by score
    filtered.sort((a, b) => b.score - a.score);
    
    // Display top 10
    content.innerHTML = filtered.slice(0, 10).map((entry, index) => {
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const date = new Date(entry.timestamp).toLocaleDateString();
        
        return `
            <div class="leaderboard-entry">
                <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                <div class="leaderboard-info">
                    <div class="leaderboard-game">${entry.game}</div>
                    <div class="leaderboard-date">${date}</div>
                </div>
                <div class="leaderboard-score">${entry.score}</div>
            </div>
        `;
    }).join('') || '<p style="text-align: center; color: #888;">No scores yet</p>';
}

// Update leaderboard
function showLeaderboard(filter) {
    loadLeaderboard(filter);
    
    // Update active tab
    document.querySelectorAll('.leaderboard-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Game launcher
function launchGame(gameType) {
    // Get selected difficulty
    const diffButtons = document.querySelectorAll(`.diff-btn[data-game="${gameType}"]`);
    let difficulty = 'easy';
    
    diffButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            difficulty = btn.dataset.level;
        }
    });
    
    // Launch game with enhanced game manager
    if (!window.enhancedGameManager) {
        window.enhancedGameManager = new EnhancedGameManager();
    }
    
    window.enhancedGameManager.launchGame(gameType, difficulty);
    
    if (window.audioManager) {
        window.audioManager.playSound('gameSelect');
    }
}

// Difficulty selector
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('diff-btn')) {
        e.stopPropagation();
        
        const game = e.target.dataset.game;
        
        // Update active difficulty for this game
        document.querySelectorAll(`.diff-btn[data-game="${game}"]`).forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        if (window.audioManager) {
            window.audioManager.playSound('buttonClick');
        }
    }
});

// Global game control functions
window.pauseGame = () => window.enhancedGameManager?.pauseGame();
window.resumeGame = () => window.enhancedGameManager?.resumeGame();
window.restartGame = () => window.enhancedGameManager?.restartGame();
window.exitGame = () => window.enhancedGameManager?.exitGame();
window.toggleSound = () => window.enhancedGameManager?.toggleSound();