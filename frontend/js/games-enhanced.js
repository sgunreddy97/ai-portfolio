// Enhanced Games Manager with Mind Games and Puzzles
class EnhancedGameManager {
    constructor() {
        this.currentGame = null;
        this.gameContainer = null;
        this.canvas = null;
        this.ctx = null;
        this.gameState = {
            score: 0,
            level: 1,
            lives: 3,
            timer: 0
        };
    }
    
    // Replace the initGameContainer method:
    initGameContainer() {
        this.gameContainer = document.getElementById('game-play-container');
        this.canvas = document.getElementById('game-canvas');
        
        // Clear any existing game content first
        const existingGrids = this.gameContainer.querySelectorAll('#memory-grid, #math-challenge, #pattern-game, #word-puzzle');
        existingGrids.forEach(el => el.remove());
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupCanvas();
            // Show canvas by default
            this.canvas.style.display = 'block';
        }
    }
    
    setupCanvas() {
        // Set canvas size
        const w = Math.min(window.innerWidth  * 0.96, 1024);
        const h = Math.min(window.innerHeight * 0.72,  680);
        this.canvas.width  = w;
        this.canvas.height = h;
        this.canvas.style.maxWidth = '100%';
        this.canvas.style.height   = 'auto';
        
        // Handle resize
        window.addEventListener('resize', () => {
            if (this.canvas) {
                const rw = Math.min(window.innerWidth  * 0.96, 1024);
                const rh = Math.min(window.innerHeight * 0.72,  680);
                this.canvas.width  = rw;
                this.canvas.height = rh;
                this.canvas.style.maxWidth = '100%';
                this.canvas.style.height   = 'auto';
                if (this.currentGame && this.currentGame.resize) {
                    this.currentGame.resize();
                }
            }
        });
    }
    
    // Update the launchGame method:
    launchGame(gameType) {
        if (!this.gameContainer) {
            this.initGameContainer();
        }
        
        // Clear previous game content
        const existingContent = this.gameContainer.querySelectorAll('#memory-grid, #math-challenge, #pattern-game, #word-puzzle');
        existingContent.forEach(el => el.remove());
        
        // Reset canvas visibility
        if (this.canvas) {
            this.canvas.style.display = 'block';
        }
        
        // Show game container
        this.gameContainer.classList.remove('hidden');
        
        // Stop current game if any
        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
        }
        
        // Rest of the existing code...
        
        // Reset game state
        this.gameState = {
            score: 0,
            level: 1,
            lives: 3,
            timer: 0
        };
        
        // Update UI
        this.updateGameUI();
        
        // Start selected game
        switch(gameType) {
            case 'invaders':
                this.currentGame = new SpaceInvadersEnhanced(this.canvas, this.ctx, this);
                break;
            case 'memory':
                this.currentGame = new MemoryMatrix(this);
                break;
            case 'math':
                this.currentGame = new MathChallenge(this);
                break;
            case 'pattern':
                this.currentGame = new PatternRecognition(this);
                break;
            case 'wordpuzzle':
                this.currentGame = new WordPuzzle(this);
                break;
        }
        
        if (this.currentGame) {
            this.currentGame.start();
            const mob = document.getElementById('mobile-controls');
            if (mob) mob.style.display = (gameType === 'invaders') ? 'flex' : 'none';
            
            // Play start sound
            if (window.audioManager) {
                window.audioManager.playSound('gameStart');
            }
        }
    }
    
    updateGameUI() {
        const scoreEl = document.getElementById('current-score');
        const livesEl = document.getElementById('current-lives');
        const levelEl = document.getElementById('current-level');
        const timerEl = document.getElementById('game-timer');
        
        if (scoreEl) scoreEl.textContent = this.gameState.score;
        if (livesEl) livesEl.textContent = this.gameState.lives;
        if (levelEl) levelEl.textContent = this.gameState.level;
        if (timerEl) {
            if (this.currentGame && (this.currentGame.type === 'wordpuzzle' || this.currentGame.type === 'math')) {
                timerEl.parentElement.style.display = 'inline-flex';
            } else {
                timerEl.parentElement.style.display = 'none';
            }
        }
    }
    
    updateScore(points) {
        this.gameState.score += points;
        this.updateGameUI();
        
        // Play sound
        if (window.audioManager) {
            window.audioManager.playSound('collectItem');
        }
    }
    
    loseLife() {
        this.gameState.lives--;
        this.updateGameUI();
        
        if (this.gameState.lives <= 0) {
            this.gameOver();
        } else {
            if (window.audioManager) {
                window.audioManager.playSound('playerHit');
            }
        }
    }
    
    nextLevel() {
        this.gameState.level++;
        this.updateGameUI();
        
        if (window.audioManager) {
            window.audioManager.playSound('levelUp');
        }
    }
    
    pauseGame() {
        if (this.currentGame && this.currentGame.pause) {
            this.currentGame.pause();
        }
        
        const pausedOverlay = document.getElementById('game-paused');
        if (pausedOverlay) {
            pausedOverlay.classList.remove('hidden');
        }
        
        if (window.audioManager) {
            window.audioManager.playSound('gamePause');
        }
    }
    
    resumeGame() {
        if (this.currentGame && this.currentGame.resume) {
            this.currentGame.resume();
        }
        
        const pausedOverlay = document.getElementById('game-paused');
        if (pausedOverlay) {
            pausedOverlay.classList.add('hidden');
        }
        
        if (window.audioManager) {
            window.audioManager.playSound('gameResume');
        }
    }
    
    restartGame() {
        const gameType = this.currentGame ? this.currentGame.type : 'invaders';
        this.launchGame(gameType);
    }
    
    exitGame() {
        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
        }
        
        this.currentGame = null;
        
        if (this.gameContainer) {
            this.gameContainer.classList.add('hidden');
        }
        
        // Reset overlays
        const pausedOverlay = document.getElementById('game-paused');
        const gameOverOverlay = document.getElementById('game-over');
        if (pausedOverlay) pausedOverlay.classList.add('hidden');
        if (gameOverOverlay) gameOverOverlay.classList.add('hidden');
        const mob = document.getElementById('mobile-controls');
        if (mob) mob.style.display = 'none';
    }
    
    gameOver() {
        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
        }
        
        const gameOverOverlay = document.getElementById('game-over');
        const finalScoreEl = document.getElementById('final-score');
        
        if (gameOverOverlay) {
            gameOverOverlay.classList.remove('hidden');
        }
        
        if (finalScoreEl) {
            finalScoreEl.textContent = this.gameState.score;
        }
        
        // Check high score
        const highScoreKey = `highScore_${this.currentGame ? this.currentGame.type : 'game'}`;
        const currentHighScore = parseInt(localStorage.getItem(highScoreKey) || '0');
        
        if (this.gameState.score > currentHighScore) {
            localStorage.setItem(highScoreKey, this.gameState.score);
            const messageEl = document.querySelector('.high-score-message');
            if (messageEl) {
                messageEl.classList.remove('hidden');
            }
            
            if (window.audioManager) {
                window.audioManager.playSound('gameWin');
            }
        } else {
            if (window.audioManager) {
                window.audioManager.playSound('gameOver');
            }
        }
    }
    
    toggleSound() {
        if (window.audioManager) {
            window.audioManager.toggle();
            const soundBtn = document.querySelector('.game-controls-bar button[onclick*="toggleSound"] i');
            if (soundBtn) {
                soundBtn.className = window.audioManager.enabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
            }
        }
    }
}

// Memory Matrix Game - Test your memory
class MemoryMatrix {
    constructor(gameManager) {
        this.gm = gameManager;
        this.type = 'memory';
        this.gridSize = 4;
        this.pattern = [];
        this.userPattern = [];
        this.patternLength = 3;
        this.showingPattern = false;
        this.cells = [];
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.setupGrid();
        this.nextRound();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        this.isRunning = true;
    }
    
    setupGrid() {
        const canvas = this.gm.canvas;
        canvas.style.display = 'none';
        
        // Create grid container
        const container = document.createElement('div');
        container.id = 'memory-grid';
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.gridSize}, 100px);
            gap: 10px;
            padding: 20px;
            justify-content: center;
            margin-top: 50px;
        `;
        
        // Create cells
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.style.cssText = `
                width: 100px;
                height: 100px;
                background: rgba(102, 126, 234, 0.2);
                border: 2px solid rgba(102, 126, 234, 0.5);
                border-radius: 10px;
                cursor: pointer;
                transition: all 0.3s ease;
            `;
            cell.dataset.index = i;
            cell.onclick = () => this.cellClicked(i);
            container.appendChild(cell);
            this.cells.push(cell);
        }
        
        this.gm.gameContainer.appendChild(container);
    }
    
    nextRound() {
        this.pattern = [];
        this.userPattern = [];
        
        // Generate random pattern
        for (let i = 0; i < this.patternLength; i++) {
            this.pattern.push(Math.floor(Math.random() * (this.gridSize * this.gridSize)));
        }
        
        // Show pattern
        this.showPattern();
    }
    
    showPattern() {
        this.showingPattern = true;
        
        // Disable clicks
        this.cells.forEach(cell => cell.style.pointerEvents = 'none');
        
        let index = 0;
        const showNext = () => {
            if (index < this.pattern.length) {
                const cellIndex = this.pattern[index];
                this.cells[cellIndex].style.background = 'linear-gradient(135deg, #00ff88, #00ffff)';
                
                setTimeout(() => {
                    this.cells[cellIndex].style.background = 'rgba(102, 126, 234, 0.2)';
                    index++;
                    setTimeout(showNext, 300);
                }, 800);
            } else {
                // Enable clicks
                this.showingPattern = false;
                this.cells.forEach(cell => cell.style.pointerEvents = 'auto');
            }
        };
        
        setTimeout(showNext, 1000);
    }
    
    cellClicked(index) {
        if (this.showingPattern || !this.isRunning) return;
        
        // Highlight cell
        this.cells[index].style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        setTimeout(() => {
            this.cells[index].style.background = 'rgba(102, 126, 234, 0.2)';
        }, 300);
        
        this.userPattern.push(index);
        
        // Check if pattern matches
        if (this.userPattern[this.userPattern.length - 1] !== this.pattern[this.pattern.length - 1 - (this.pattern.length - this.userPattern.length)]) {
            // Wrong pattern
            this.gm.loseLife();
            if (this.gm.gameState.lives > 0) {
                setTimeout(() => this.showPattern(), 1000);
                this.userPattern = [];
            }
        } else if (this.userPattern.length === this.pattern.length) {
            // Correct pattern
            this.gm.updateScore(100 * this.patternLength);
            this.patternLength++;
            
            if (this.patternLength > 3 + this.gm.gameState.level * 2) {
                this.gm.nextLevel();
                this.patternLength = 3 + this.gm.gameState.level;
                this.gridSize = Math.min(6, 4 + Math.floor(this.gm.gameState.level / 3));
            }
            
            setTimeout(() => this.nextRound(), 1500);
        }
    }
}

// Math Challenge Game
class MathChallenge {
    constructor(gameManager) {
        this.gm = gameManager;
        this.type = 'math';
        this.currentProblem = null;
        this.isRunning = false;
        this.timeLimit = 30;
        this.timer = null;
    }
    
    start() {
        this.isRunning = true;
        this.setupUI();
        this.nextProblem();
        this.startTimer();
    }
    
    stop() {
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
    }
    
    pause() {
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
    }
    
    resume() {
        this.isRunning = true;
        this.startTimer();
    }
    
    setupUI() {
        const canvas = this.gm.canvas;
        canvas.style.display = 'none';
        
        const container = document.createElement('div');
        container.id = 'math-challenge';
        container.style.cssText = `
            padding: 40px;
            text-align: center;
            color: white;
            font-family: 'Orbitron', monospace;
        `;
        
        container.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 30px; color: #00ffff;" id="math-problem"></div>
            <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                <button class="math-option" style="padding: 20px 40px; font-size: 1.5em; background: rgba(102, 126, 234, 0.2); border: 2px solid #667eea; border-radius: 10px; color: white; cursor: pointer;"></button>
                <button class="math-option" style="padding: 20px 40px; font-size: 1.5em; background: rgba(102, 126, 234, 0.2); border: 2px solid #667eea; border-radius: 10px; color: white; cursor: pointer;"></button>
                <button class="math-option" style="padding: 20px 40px; font-size: 1.5em; background: rgba(102, 126, 234, 0.2); border: 2px solid #667eea; border-radius: 10px; color: white; cursor: pointer;"></button>
                <button class="math-option" style="padding: 20px 40px; font-size: 1.5em; background: rgba(102, 126, 234, 0.2); border: 2px solid #667eea; border-radius: 10px; color: white; cursor: pointer;"></button>
            </div>
            <div style="font-size: 1.5em; color: #00ff88;">Time: <span id="math-timer">${this.timeLimit}</span>s</div>
        `;
        
        this.gm.gameContainer.appendChild(container);
    }
    
    generateProblem() {
        const level = this.gm.gameState.level;
        const operations = ['+', '-', '*'];
        if (level > 3) operations.push('/');
        
        const op = operations[Math.floor(Math.random() * operations.length)];
        let a, b, answer;
        
        switch(op) {
            case '+':
                a = Math.floor(Math.random() * (10 * level)) + 1;
                b = Math.floor(Math.random() * (10 * level)) + 1;
                answer = a + b;
                break;
            case '-':
                a = Math.floor(Math.random() * (10 * level)) + 10;
                b = Math.floor(Math.random() * (10 * level)) + 1;
                answer = a - b;
                break;
            case '*':
                a = Math.floor(Math.random() * (5 * level)) + 2;
                b = Math.floor(Math.random() * 10) + 1;
                answer = a * b;
                break;
            case '/':
                b = Math.floor(Math.random() * 10) + 1;
                answer = Math.floor(Math.random() * (5 * level)) + 1;
                a = b * answer;
                break;
        }
        
        return {
            question: `${a} ${op} ${b} = ?`,
            answer: answer,
            options: this.generateOptions(answer)
        };
    }
    
    generateOptions(correctAnswer) {
        const options = [correctAnswer];
        
        while (options.length < 4) {
            const variation = Math.floor(Math.random() * 20) - 10;
            const wrongAnswer = correctAnswer + variation;
            
            if (!options.includes(wrongAnswer) && wrongAnswer > 0) {
                options.push(wrongAnswer);
            }
        }
        
        // Shuffle options
        return options.sort(() => Math.random() - 0.5);
    }
    
    nextProblem() {
        this.currentProblem = this.generateProblem();
        this.timeLimit = Math.max(10, 30 - this.gm.gameState.level * 2);
        
        // Update UI
        const problemEl = document.getElementById('math-problem');
        const optionEls = document.querySelectorAll('.math-option');
        const timerEl = document.getElementById('math-timer');
        
        if (problemEl) problemEl.textContent = this.currentProblem.question;
        if (timerEl) timerEl.textContent = this.timeLimit;
        
        optionEls.forEach((btn, index) => {
            btn.textContent = this.currentProblem.options[index];
            btn.onclick = () => this.checkAnswer(this.currentProblem.options[index]);
        });
    }
    
    checkAnswer(answer) {
        if (!this.isRunning) return;
        
        if (answer === this.currentProblem.answer) {
            // Correct
            this.gm.updateScore(100 + (this.timeLimit * 10));
            
            if (this.gm.gameState.score > 1000 * this.gm.gameState.level) {
                this.gm.nextLevel();
            }
            
            this.nextProblem();
        } else {
            // Wrong
            this.gm.loseLife();
            if (this.gm.gameState.lives > 0) {
                this.nextProblem();
            }
        }
    }
    
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        let timeLeft = this.timeLimit;
        this.timer = setInterval(() => {
            if (!this.isRunning) return;
            
            timeLeft--;
            const timerEl = document.getElementById('math-timer');
            if (timerEl) timerEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.gm.loseLife();
                if (this.gm.gameState.lives > 0) {
                    this.nextProblem();
                    timeLeft = this.timeLimit;
                } else {
                    clearInterval(this.timer);
                }
            }
        }, 1000);
    }
}

// Pattern Recognition Game
class PatternRecognition {
    constructor(gameManager) {
        this.gm = gameManager;
        this.type = 'pattern';
        this.patterns = [];
        this.currentPattern = null;
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.setupUI();
        this.nextPattern();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        this.isRunning = true;
    }
    
    setupUI() {
        const canvas = this.gm.canvas;
        canvas.style.display = 'none';
        
        const container = document.createElement('div');
        container.id = 'pattern-game';
        container.style.cssText = `
            padding: 40px;
            text-align: center;
            color: white;
        `;
        
        container.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 30px;">Complete the Pattern</h2>
            <div id="pattern-sequence" style="display: flex; gap: 20px; justify-content: center; margin-bottom: 40px;"></div>
            <div id="pattern-options" style="display: grid; grid-template-columns: repeat(3, 100px); gap: 15px; justify-content: center;"></div>
        `;
        
        this.gm.gameContainer.appendChild(container);
    }
    
    generatePattern() {
        const level = this.gm.gameState.level;
        const types = ['number', 'shape', 'color'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let pattern = [];
        let answer = null;
        
        switch(type) {
            case 'number':
                // Arithmetic or geometric sequence
                const start = Math.floor(Math.random() * 10) + 1;
                const step = Math.floor(Math.random() * 5) + 1;
                const isMultiply = level > 3 && Math.random() > 0.5;
                
                for (let i = 0; i < 4; i++) {
                    if (isMultiply) {
                        pattern.push(start * Math.pow(step, i));
                    } else {
                        pattern.push(start + (step * i));
                    }
                }
                
                answer = isMultiply ? start * Math.pow(step, 4) : start + (step * 4);
                break;
                
            case 'shape':
                // Shape patterns
                const shapes = ['○', '□', '△', '◇', '☆'];
                const sequence = [];
                for (let i = 0; i < 3; i++) {
                    sequence.push(shapes[i % shapes.length]);
                }
                pattern = [...sequence, ...sequence, ...sequence].slice(0, 4);
                answer = shapes[4 % shapes.length];
                break;
                
            case 'color':
                // Color patterns
                const colors = ['🔴', '🔵', '🟢', '🟡', '🟣'];
                const colorPattern = [];
                const patternLength = 2 + Math.floor(level / 2);
                
                for (let i = 0; i < patternLength; i++) {
                    colorPattern.push(colors[i % colors.length]);
                }
                
                pattern = [...colorPattern, ...colorPattern].slice(0, 4);
                answer = colorPattern[4 % patternLength];
                break;
        }
        
        return { pattern, answer, type };
    }
    
    nextPattern() {
        this.currentPattern = this.generatePattern();
        
        // Display pattern
        const sequenceEl = document.getElementById('pattern-sequence');
        const optionsEl = document.getElementById('pattern-options');
        
        if (sequenceEl) {
            sequenceEl.innerHTML = '';
            this.currentPattern.pattern.forEach((item, index) => {
                const box = document.createElement('div');
                box.style.cssText = `
                    width: 80px;
                    height: 80px;
                    background: rgba(102, 126, 234, 0.2);
                    border: 2px solid #667eea;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2em;
                `;
                box.textContent = item;
                sequenceEl.appendChild(box);
            });
            
            // Add question mark for missing element
            const questionBox = document.createElement('div');
            questionBox.style.cssText = `
                width: 80px;
                height: 80px;
                background: rgba(255, 107, 107, 0.2);
                border: 2px solid #ff6b6b;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2em;
                animation: pulse 1s infinite;
            `;
            questionBox.textContent = '?';
            sequenceEl.appendChild(questionBox);
        }
        
        // Generate options
        if (optionsEl) {
            optionsEl.innerHTML = '';
            const options = this.generateOptions(this.currentPattern.answer, this.currentPattern.type);
            
            options.forEach(option => {
                const btn = document.createElement('button');
                btn.style.cssText = `
                    width: 100px;
                    height: 100px;
                    background: rgba(102, 126, 234, 0.2);
                    border: 2px solid #667eea;
                    border-radius: 10px;
                    color: white;
                    font-size: 2em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                btn.textContent = option;
                btn.onclick = () => this.checkAnswer(option);
                btn.onmouseover = () => {
                    btn.style.background = 'rgba(102, 126, 234, 0.4)';
                    btn.style.transform = 'scale(1.1)';
                };
                btn.onmouseout = () => {
                    btn.style.background = 'rgba(102, 126, 234, 0.2)';
                    btn.style.transform = 'scale(1)';
                };
                optionsEl.appendChild(btn);
            });
        }
    }
    
    generateOptions(correct, type) {
        const options = [correct];
        
        while (options.length < 6) {
            let wrong;
            
            if (type === 'number') {
                wrong = correct + Math.floor(Math.random() * 20) - 10;
                if (wrong > 0 && !options.includes(wrong)) {
                    options.push(wrong);
                }
            } else if (type === 'shape') {
                const shapes = ['○', '□', '△', '◇', '☆', '⬟', '✦'];
                wrong = shapes[Math.floor(Math.random() * shapes.length)];
                if (!options.includes(wrong)) {
                    options.push(wrong);
                }
            } else if (type === 'color') {
                const colors = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚪', '⚫'];
                wrong = colors[Math.floor(Math.random() * colors.length)];
                if (!options.includes(wrong)) {
                    options.push(wrong);
                }
            }
        }
        
        return options.sort(() => Math.random() - 0.5);
    }
    
    checkAnswer(answer) {
        if (!this.isRunning) return;
        
        if (answer === this.currentPattern.answer) {
            this.gm.updateScore(150);
            
            if (this.gm.gameState.score > 800 * this.gm.gameState.level) {
                this.gm.nextLevel();
            }
            
            this.nextPattern();
        } else {
            this.gm.loseLife();
            if (this.gm.gameState.lives > 0) {
                setTimeout(() => this.nextPattern(), 1000);
            }
        }
    }
}

// Enhanced Space Invaders (keeping original but improved)
class SpaceInvadersEnhanced {
    constructor(canvas, ctx, gameManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.gm = gameManager;
        this.type = 'invaders';
        this.isRunning = false;
        this.isPaused = false;
        
        // Game objects
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerUps = [];
        
        // Controls
        this.keys = {};
        this.touchControls = { left: false, right: false, fire: false };
        
        this.init();
    }
    
    init() {
        // Initialize player
        this.player = {
            x: this.canvas.width / 2 - 25,
            y: this.canvas.height - 80,
            width: 50,
            height: 30,
            speed: 7,
            shootCooldown: 0
        };
        
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
        // Mobile buttons & touch drag on canvas
        this.bindMobileControls();
    }

    bindMobileControls() {
        this.touchControls = this.touchControls || { left: false, right: false, fire: false };

        const leftBtn  = document.getElementById('btn-left');
        const rightBtn = document.getElementById('btn-right');
        const fireBtn  = document.getElementById('btn-fire');

        const set = (k, v) => { this.touchControls[k] = v; };
        const wire = (btn, key) => {
            if (!btn) return;
            if (btn.dataset.bound === '1') return;   // <-- prevent duplicate bindings
            const down = e => { e.preventDefault(); set(key, true); };
            const up   = e => { e.preventDefault(); set(key, false); };
            btn.addEventListener('pointerdown', down);
            btn.addEventListener('pointerup',   up);
            btn.addEventListener('pointerleave',up);
            btn.addEventListener('touchstart',  down, { passive: false });
            btn.addEventListener('touchend',    up);
            btn.dataset.bound = '1';
        };

        wire(leftBtn,  'left');
        wire(rightBtn, 'right');
        wire(fireBtn,  'fire');

        // Drag finger to move horizontally (bind once per canvas)
        if (this.canvas && !this.canvas._dragBound) {
            const moveTo = (clientX) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = clientX - rect.left;
                this.player.x = Math.max(
                  0,
                  Math.min(this.canvas.width - this.player.width, x - this.player.width / 2)
                );
            };
            this.canvas.addEventListener('pointermove', (e) => {
                if (e.pointerType !== 'mouse' && this.isRunning) moveTo(e.clientX);
            });
            this.canvas.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) moveTo(e.touches[0].clientX);
            }, { passive: false });
            this.canvas._dragBound = true;
        }
    }
    
    createEnemies() {
        this.enemies = [];
        const rows = 3 + Math.floor(this.gm.gameState.level / 2);
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
                    type: row === 0 ? 'special' : 'normal',
                    points: row === 0 ? 50 : 10,
                    color: row === 0 ? '#ff00ff' : '#00ff00',
                    speed: 0.5 + this.gm.gameState.level * 0.2,
                    direction: 1
                });
            }
        }
    }
    
    start() {
        this.isRunning = true;
        this.isPaused = false;
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
    
    pause() {
        this.isPaused = true;
    }
    
    resume() {
        this.isPaused = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            this.update();
            this.draw();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // Update player
        const moveLeft  = this.keys['ArrowLeft']  || this.touchControls.left;
        const moveRight = this.keys['ArrowRight'] || this.touchControls.right;

        if (moveLeft && this.player.x > 0) {
            this.player.x -= this.player.speed;
        }
        if (moveRight && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += this.player.speed;
        }
        
        // Shooting
        if (this.player.shootCooldown > 0) {
            this.player.shootCooldown--;
        }
        
        const firePressed = this.keys[' '] || this.touchControls.fire;
        if (firePressed && this.player.shootCooldown === 0) {
            this.bullets.push({
                x: this.player.x + this.player.width / 2 - 2,
                y: this.player.y,
                width: 4,
                height: 10,
                speed: 10
            });
            this.player.shootCooldown = 15;
            
            if (window.audioManager) {
                window.audioManager.playSound('playerShoot');
            }
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.y -= bullet.speed;
            
            // Check collision with enemies
            let hit = false;
            this.enemies = this.enemies.filter(enemy => {
                if (this.checkCollision(bullet, enemy)) {
                    hit = true;
                    this.gm.updateScore(enemy.points);
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                    return false;
                }
                return true;
            });
            
            return !hit && bullet.y > 0;
        });
        
        // Update enemies
        let shouldDrop = false;
        this.enemies.forEach(enemy => {
            enemy.x += enemy.direction * enemy.speed;
            
            if (enemy.x <= 0 || enemy.x >= this.canvas.width - enemy.width) {
                shouldDrop = true;
            }
        });
        
        if (shouldDrop) {
            this.enemies.forEach(enemy => {
                enemy.direction *= -1;
                enemy.y += 30;
            });
        }
        
        // Random enemy shooting
        if (Math.random() < 0.02 && this.enemies.length > 0) {
            const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
            this.enemyBullets.push({
                x: shooter.x + shooter.width / 2,
                y: shooter.y + shooter.height,
                width: 4,
                height: 10,
                speed: 3 + this.gm.gameState.level * 0.5
            });
        }
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.speed;
            
            if (this.checkCollision(bullet, this.player)) {
                this.gm.loseLife();
                this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2);
                return false;
            }
            
            return bullet.y < this.canvas.height;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            return particle.life > 0;
        });
        
        // Check if all enemies destroyed
        if (this.enemies.length === 0) {
            this.gm.nextLevel();
            this.createEnemies();
        }
    }

    drawPlayerShip() {
        const ctx = this.ctx;
        const { x, y, width, height } = this.player;
        const cx = x + width / 2;

        ctx.save();
        // Body (triangle pointing up)
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(cx, y);                  // nose
        ctx.lineTo(x,  y + height);         // left base
        ctx.lineTo(x + width, y + height);  // right base
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#80ffff';
        ctx.fillRect(cx - 2, y + height * 0.35, 4, height * 0.25);

        // Thrusters glow
        ctx.fillStyle = 'rgba(255,160,40,0.8)';
        ctx.beginPath();
        ctx.arc(x + width * 0.25,  y + height, 4, 0, Math.PI, true);
        ctx.arc(x + width * 0.75,  y + height, 4, 0, Math.PI, true);
        ctx.fill();
        ctx.restore();
    } 

    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 20, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = `rgba(255, ${particle.g}, 0, ${particle.life / particle.maxLife})`;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        });
        
        // Draw player
        this.drawPlayerShip();
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        });
        
        // Draw bullets
        this.ctx.fillStyle = '#ffff00';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
        
        // Draw enemy bullets
        this.ctx.fillStyle = '#ff0000';
        this.enemyBullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
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
                g: Math.floor(Math.random() * 100 + 155)
            });
        }
        
        if (window.audioManager) {
            window.audioManager.playSound('smallExplosion');
        }
    }
}

// Word Puzzle Game
// Improved Word Puzzle Game with Timer
class WordPuzzle {
    constructor(gameManager) {
        this.gm = gameManager;
        this.type = 'wordpuzzle';
        this.words = [];
        this.gridSize = 10;
        this.grid = [];
        this.foundWords = [];
        this.isRunning = false;
        this.selectedCells = [];
        this.wordPositions = {};
        this.timeLimit = 120; // 2 minutes
        this.timer = null;
        this.isSelecting = false;
    }
    
    start() {
        this.isRunning = true;
        this.setupUI();
        this.generatePuzzle();
        this.startTimer();
    }
    
    stop() {
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
    }
    
    pause() {
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
    }
    
    resume() {
        this.isRunning = true;
        this.startTimer();
    }
    
    setupUI() {
        const canvas = this.gm.canvas;
        canvas.style.display = 'none';
        
        const container = document.createElement('div');
        container.id = 'word-puzzle';
        container.style.cssText = `
            padding: 20px;
            text-align: center;
            color: white;
        `;
        
        container.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 20px;">Find the Hidden Words</h2>
            <div style="color: #ff6b6b; font-size: 1.5em; margin-bottom: 20px;">
                Time: <span id="word-timer">${this.timeLimit}</span>s
            </div>
            <div style="display: flex; gap: 40px; justify-content: center; align-items: flex-start;">
                <div id="word-grid"></div>
                <div id="word-list" style="text-align: left;">
                    <h3 style="color: #00ff88; margin-bottom: 15px;">Find these words:</h3>
                    <div id="words-to-find"></div>
                </div>
            </div>
        `;
        
        this.gm.gameContainer.appendChild(container);
    }
    
    generatePuzzle() {
        const wordBank = [
            'PYTHON','NEURAL','TENSOR','MODEL','DATA','TRAIN','LEARN','DEEP','CLOUD','CODE',
            'NUMPY','PANDAS','TORCH','KERAS','SCIKIT','CUDA','VECTOR','EMBEDDING','ENCODER','DECODER',
            'TRANSFORMER','ATTENTION','GRADIENT','INFERENCE','PROMPT','DATASET','BATCH','EPOCH',
            'REGRESSION','CLASSIFY','METRICS','ROC','AUC','LOSS','RELU','SOFTMAX','ADAM','DROPOUT','RAG','LLM',
            'KUBERNETES','DOCKER','JENKINS','PIPELINES','MLOPS'
        ];
        
        const wordCount = Math.min(4 + Math.floor(this.gm.gameState.level / 2), 7);
        const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
        this.words = shuffled.slice(0, wordCount);
        this.foundWords = [];
        this.wordPositions = {};
        
        // Initialize empty grid
        this.grid = [];
        for (let i = 0; i < this.gridSize; i++) {
            this.grid.push(new Array(this.gridSize).fill(''));
        }
        
        // Place words and store their positions
        this.words.forEach(word => {
            this.placeWordWithPosition(word);
        });
        
        // Fill empty cells
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                if (this.grid[row][col] === '') {
                    this.grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
        
        this.displayGrid();
        this.displayWordList();
    }
    
    placeWordWithPosition(word) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonal down-right
            [-1, 1],  // diagonal up-right
            [0, -1],  // horizontal reverse
            [-1, 0],  // vertical reverse
        ];
        
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const row = Math.floor(Math.random() * this.gridSize);
            const col = Math.floor(Math.random() * this.gridSize);
            
            if (this.canPlaceWord(word, row, col, dir)) {
                const positions = [];
                for (let i = 0; i < word.length; i++) {
                    const r = row + dir[0] * i;
                    const c = col + dir[1] * i;
                    this.grid[r][c] = word[i];
                    positions.push({ row: r, col: c });
                }
                this.wordPositions[word] = positions;
                placed = true;
            }
            attempts++;
        }
    }
    
    canPlaceWord(word, row, col, dir) {
        for (let i = 0; i < word.length; i++) {
            const r = row + dir[0] * i;
            const c = col + dir[1] * i;
            
            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) {
                return false;
            }
            
            if (this.grid[r][c] !== '' && this.grid[r][c] !== word[i]) {
                return false;
            }
        }
        return true;
    }
    
    displayGrid() {
        const gridEl = document.getElementById('word-grid');
        gridEl.style.cssText = `
            display: grid;
            grid-template-columns: repeat(${this.gridSize}, 40px);
            gap: 2px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            user-select: none;
        `;
        
        gridEl.innerHTML = '';
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.style.cssText = `
                    width: 40px;
                    height: 40px;
                    background: rgba(102, 126, 234, 0.1);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2em;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    user-select: none;
                `;
                
                cell.textContent = this.grid[row][col];
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.id = `word-cell-${row}-${col}`;
                
                gridEl.appendChild(cell);
            }
        }
        
        // Add mouse events to grid container
        gridEl.onmousedown = (e) => this.startSelection(e);
        gridEl.onmouseover = (e) => this.continueSelection(e);
        gridEl.onmouseup = () => this.endSelection();
        gridEl.onmouseleave = () => this.endSelection();
        
        // Prevent text selection
                // Touch & pen support
        gridEl.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') this.startSelection(e); });
        gridEl.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') this.continueSelection(e); });
        gridEl.addEventListener('pointerup',   ()  => this.endSelection());
        gridEl.addEventListener('pointerleave',()  => this.endSelection());
        gridEl.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
        gridEl.addEventListener('touchmove',  e => e.preventDefault(), { passive: false });
        gridEl.addEventListener('selectstart', e => e.preventDefault());
    }
    
    displayWordList() {
        const listEl = document.getElementById('words-to-find');
        listEl.innerHTML = this.words.map(word => `
            <div id="word-item-${word}" style="padding: 5px; font-size: 1.2em; ${this.foundWords.includes(word) ? 'text-decoration: line-through; color: #00ff88;' : 'color: white;'}">
                ${word}
            </div>
        `).join('');
    }
    
    startSelection(e) {
        if (!this.isRunning) return;
        
        const cell = e.target;
        if (cell.dataset.row !== undefined) {
            this.isSelecting = true;
            this.selectedCells = [{
                row: parseInt(cell.dataset.row),
                col: parseInt(cell.dataset.col)
            }];
            this.highlightCells();
        }
    }
    
    continueSelection(e) {
        if (!this.isRunning || !this.isSelecting) return;
        
        const cell = e.target;
        if (cell.dataset.row !== undefined) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // Check if it forms a straight line (horizontal, vertical, or diagonal)
            if (this.selectedCells.length === 1) {
                // Any adjacent cell is valid for the second selection
                this.selectedCells.push({ row, col });
                this.highlightCells();
            } else if (this.selectedCells.length >= 2) {
                // Check if it continues in the same direction
                // Continue in the same line (horizontal / vertical / diagonal)
                // First two cells define direction
                const first  = this.selectedCells[0];
                const second = this.selectedCells[1];

                const dirRow = Math.sign(second.row - first.row);
                const dirCol = Math.sign(second.col - first.col);

                // New target must be collinear with the first cell
                const dr = row - first.row;
                const dc = col - first.col;

                const isSameRow = (dirRow === 0 && dr === 0);
                const isSameCol = (dirCol === 0 && dc === 0);
                const isSameDiag = (dirRow !== 0 && dirCol !== 0 && Math.abs(dr) === Math.abs(dc));

                if (isSameRow || isSameCol || isSameDiag) {
                    // Walk from the last selected cell toward the new cell, adding any skipped cells
                    let last = this.selectedCells[this.selectedCells.length - 1];
                    let r = last.row + dirRow;
                    let c = last.col + dirCol;

                    const until = () => (dirRow === 0 || (r - row) * dirRow <= 0) &&
                                        (dirCol === 0 || (c - col) * dirCol <= 0);

                    while (until()) {
                        if (!this.selectedCells.find(cc => cc.row === r && cc.col === c)) {
                            this.selectedCells.push({ row: r, col: c });
                        }
                        if (r === row && c === col) break;
                        r += dirRow; c += dirCol;
                    }
                    this.highlightCells();
                }
            }
        }
    }
    
    endSelection() {
        if (!this.isRunning || !this.isSelecting) return;
        
        this.isSelecting = false;
        
        // Get selected word
        const word = this.selectedCells.map(cell => 
            this.grid[cell.row][cell.col]
        ).join('');
        
        // Also check reverse
        const reverseWord = word.split('').reverse().join('');
        
        let foundWord = null;
        if (this.words.includes(word) && !this.foundWords.includes(word)) {
            foundWord = word;
        } else if (this.words.includes(reverseWord) && !this.foundWords.includes(reverseWord)) {
            foundWord = reverseWord;
        }
        
        if (foundWord) {
            this.foundWords.push(foundWord);
            this.gm.updateScore(foundWord.length * 20);
            
            // Mark cells as found
            this.selectedCells.forEach(cell => {
                const cellEl = document.getElementById(`word-cell-${cell.row}-${cell.col}`);
                if (cellEl) {
                    cellEl.style.background = 'rgba(0, 255, 136, 0.3)';
                    cellEl.style.border = '2px solid #00ff88';
                }
            });
            
            // Update word list
            const wordItem = document.getElementById(`word-item-${foundWord}`);
            if (wordItem) {
                wordItem.style.textDecoration = 'line-through';
                wordItem.style.color = '#00ff88';
            }
            
            // Play sound
            if (window.audioManager) {
                window.audioManager.playSound('collectItem');
            }
            
            // Check if all words found
            if (this.foundWords.length === this.words.length) {
                this.gm.updateScore(200);
                this.gm.nextLevel();
                if (this.timer) clearInterval(this.timer);
                setTimeout(() => {
                    this.generatePuzzle();
                    this.timeLimit = 120 + this.gm.gameState.level * 10;
                    this.startTimer();
                }, 2000);
                
                if (window.audioManager) {
                    window.audioManager.playSound('levelComplete');
                }
            }
        }
        
        // Clear selection
        this.selectedCells = [];
        this.clearHighlights();
    }
    
    highlightCells() {
        this.clearHighlights();
        this.selectedCells.forEach(cell => {
            const cellEl = document.getElementById(`word-cell-${cell.row}-${cell.col}`);
            if (cellEl && !cellEl.style.background.includes('rgba(0, 255, 136')) {
                cellEl.style.background = 'rgba(102, 126, 234, 0.4)';
                cellEl.style.border = '2px solid #667eea';
            }
        });
    }
    
    clearHighlights() {
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cellEl = document.getElementById(`word-cell-${row}-${col}`);
                if (cellEl && !cellEl.style.background.includes('rgba(0, 255, 136')) {
                    cellEl.style.background = 'rgba(102, 126, 234, 0.1)';
                    cellEl.style.border = '1px solid rgba(102, 126, 234, 0.3)';
                }
            }
        }
    }
    
    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        let timeLeft = this.timeLimit;
        this.timer = setInterval(() => {
            if (!this.isRunning) return;
            
            timeLeft--;
            const timerEl = document.getElementById('word-timer');
            if (timerEl) timerEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                this.gm.gameOver();
                clearInterval(this.timer);
            }
        }, 1000);
    }
    }

// Initialize enhanced game manager
window.enhancedGameManager = new EnhancedGameManager();
