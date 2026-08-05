(function() {
    'use strict';

    // ============================================================
    // 1. DOM ELEMENT REFERENCES
    // ============================================================
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const currentScoreSpan = document.getElementById('currentScore');
    const playerNameInput = document.getElementById('playerNameInput');
    const startBtn = document.getElementById('startGameBtn');
    const restartBtn = document.getElementById('restartBtn');
    const highScoreList = document.getElementById('highScoreList');
    const reviveBanner = document.getElementById('reviveBanner');
    const reviveEquationSpan = document.getElementById('reviveEquation');
    const reviveBtn = document.getElementById('reviveBtn');
    const soundBtn = document.getElementById('soundBtn');

    // ============================================================
    // 2. RESPONSIVE CANVAS
    // ============================================================
    function resizeCanvas() {
        const container = canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight || 600;
        
        let width = Math.min(containerWidth, 400);
        let height = width * 1.5;
        
        if (height > containerHeight && containerHeight > 0) {
            height = containerHeight;
            width = height / 1.5;
        }
        
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = 400;
        canvas.height = 600;
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('load', () => {
        setTimeout(resizeCanvas, 100);
    });

    // ============================================================
    // 3. AUDIO SYSTEM
    // ============================================================
    let soundEnabled = true;
    let audioCtx = null;

    function playSound(type) {
        if (!soundEnabled) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'sine';
            gain.gain.value = 0.1;

            switch (type) {
                case 'jump':
                    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.1);
                    break;
                case 'score':
                    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.15);
                    break;
                case 'gameover':
                    osc.frequency.setValueAtTime(500, audioCtx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.3);
                    break;
                default:
                    break;
            }
        } catch (e) {
            console.log('Audio error:', e);
        }
    }

    soundBtn.addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        soundBtn.textContent = soundEnabled ? '🔊 Sonido' : '🔇 Silencio';
    });

    // ============================================================
    // 4. COLOR SELECTOR
    // ============================================================
    let selectedColor = 'yellow';
    const colorOptions = document.querySelectorAll('.color-option');

    const COLOR_PALETTES = {
        yellow: { body: '#f7d44a', wing: '#e8b82a', dark: '#d4a02a' },
        red: { body: '#ff6b6b', wing: '#e55a5a', dark: '#c0392b' },
        teal: { body: '#4ecdc4', wing: '#3dbdb5', dark: '#2ea89e' },
        purple: { body: '#a29bfe', wing: '#8b84e8', dark: '#6c5ce7' },
        pink: { body: '#fd79a8', wing: '#e86893', dark: '#d6336c' }
    };

    let birdColors = { ...COLOR_PALETTES.yellow };

    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            colorOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            selectedColor = this.dataset.color;
            birdColors = { ...COLOR_PALETTES[selectedColor] };
        });
    });

    // ============================================================
    // 5. GAME CONSTANTS
    // ============================================================
    const GRAVITY = 0.22;
    const JUMP_FORCE = -4.9;
    const PIPE_WIDTH = 52;
    const PIPE_GAP = 148;
    const PIPE_SPEED = 2.5;
    const PIPE_SPAWN_INTERVAL = 80;
    const BIRD_RADIUS = 16;
    const GROUND_Y = 545;

    // ============================================================
    // 6. GAME STATE
    // ============================================================
    let bird = { x: 70, y: 280, vy: 0 };
    let pipes = [];
    let score = 0;
    let frameCount = 0;
    let gameActive = false;
    let gameOver = false;
    let playerName = 'Aviador';
    let scoreBeforeDeath = 0;
    let bgOffset = 0;
    let gameInitialized = false;

    // Visual elements
    let particles = [];
    let clouds = [];
    let stars = [];
    let reviveChallenge = null;

    // ============================================================
    // 7. INITIALIZATION (Stars & Clouds)
    // ============================================================
    function initStars() {
        stars = [];
        for (let i = 0; i < 50; i++) {
            stars.push({
                x: Math.random() * 400,
                y: Math.random() * 600,
                size: 0.5 + Math.random() * 1.5,
                opacity: 0.3 + Math.random() * 0.7,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }

    function initClouds() {
        clouds = [];
        for (let i = 0; i < 8; i++) {
            clouds.push({
                x: Math.random() * 400,
                y: Math.random() * 250,
                w: 40 + Math.random() * 60,
                speed: 0.2 + Math.random() * 0.3,
                opacity: 0.4 + Math.random() * 0.3
            });
        }
    }

    initStars();
    initClouds();

    // ============================================================
    // 8. HIGH SCORE SYSTEM
    // ============================================================
    let highScores = [];

    function loadHighScores() {
        try {
            const stored = localStorage.getItem('flappyHighScores');
            highScores = stored ? JSON.parse(stored) : [];
            if (!Array.isArray(highScores)) highScores = [];
        } catch {
            highScores = [];
        }
        highScores.sort((a, b) => b.score - a.score);
        if (highScores.length > 10) highScores = highScores.slice(0, 10);
        renderHighScores();
    }

    function saveHighScores() {
        highScores.sort((a, b) => b.score - a.score);
        if (highScores.length > 10) highScores = highScores.slice(0, 10);
        localStorage.setItem('flappyHighScores', JSON.stringify(highScores));
        renderHighScores();
    }

    function renderHighScores() {
        if (!highScoreList) return;
        if (highScores.length === 0) {
            highScoreList.innerHTML =
                `<div class="hs-item" style="justify-content:center; color:#6d8fa3;">— sin récords —</div>`;
            return;
        }
        let html = '';
        highScores.forEach((item, index) => {
            const name = item.name || 'Anónimo';
            const sc = item.score || 0;
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '▪️';
            html += `<div class="hs-item"><span>${medal} ${name}</span><span>${sc}</span></div>`;
        });
        highScoreList.innerHTML = html;
    }

    function addHighScore(name, scoreValue) {
        if (scoreValue <= 0) return false;
        if (highScores.length < 10) {
            highScores.push({ name, score: scoreValue });
            saveHighScores();
            return true;
        } else {
            const lowest = highScores[highScores.length - 1];
            if (scoreValue > lowest.score) {
                highScores.pop();
                highScores.push({ name, score: scoreValue });
                saveHighScores();
                return true;
            }
        }
        return false;
    }

    // ============================================================
    // 9. REVIVE SYSTEM
    // ============================================================
    function generateReviveChallenge() {
        const a = Math.floor(Math.random() * 9) + 2;
        const b = Math.floor(Math.random() * 9) + 2;
        reviveChallenge = { a, b, answer: a * b };
        reviveEquationSpan.textContent = `${a} × ${b} = ?`;
        reviveBanner.classList.add('show');
    }

    function handleReviveAnswer() {
        if (!reviveChallenge || !gameOver || gameActive) return;
        
        const userAnswer = prompt(`¿Cuánto es ${reviveChallenge.a} × ${reviveChallenge.b}?`, '');
        if (userAnswer === null) return;
        const num = Number(userAnswer.trim());
        if (!isNaN(num) && num === reviveChallenge.answer) {
            bird.y = 280;
            bird.vy = -3;
            pipes = [];
            gameOver = false;
            gameActive = true;
            reviveBanner.classList.remove('show');
            reviveChallenge = null;
            frameCount = 0;
            gameInitialized = false;
            score = scoreBeforeDeath;
            currentScoreSpan.textContent = score;
            playSound('jump');
            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
            
            // Generar el primer tubo después de un delay
            setTimeout(() => {
                if (gameActive && !gameOver) {
                    spawnFirstPipe();
                }
            }, 500);
        } else {
            alert('❌ Respuesta incorrecta. ¡Sigue intentando!');
        }
    }

    // ============================================================
    // 10. GAME CORE FUNCTIONS
    // ============================================================
    function resetGame() {
        bird = { x: 70, y: 280, vy: 0 };
        pipes = [];
        score = 0;
        scoreBeforeDeath = 0;
        frameCount = 0;
        gameInitialized = false;
        gameOver = false;
        gameActive = true;
        reviveBanner.classList.remove('show');
        reviveChallenge = null;
        particles = [];
        currentScoreSpan.textContent = '0';
        const name = playerNameInput.value.trim() || 'Aviador';
        playerName = name;
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        
        // Limpiar cualquier timeout pendiente
        if (window._pipeTimeout) {
            clearTimeout(window._pipeTimeout);
            window._pipeTimeout = null;
        }
        
        // Generar el primer tubo después de un breve retraso
        window._pipeTimeout = setTimeout(() => {
            if (gameActive && !gameOver) {
                spawnFirstPipe();
            }
        }, 500);
    }

    function spawnFirstPipe() {
        if (!gameInitialized && gameActive && !gameOver) {
            const minH = 55, maxH = GROUND_Y - PIPE_GAP - 55;
            const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
            pipes.push({ 
                x: 400, // Cambiado de 400+150 a 400 para que aparezca justo en el borde
                topHeight: topH,
                passed: false 
            });
            gameInitialized = true;
            console.log('🎯 Primer tubo generado correctamente');
        }
    }

    function setGameOver() {
        if (gameOver) return;
        gameActive = false;
        gameOver = true;
        scoreBeforeDeath = score;
        playSound('gameover');

        // Limpiar timeout pendiente
        if (window._pipeTimeout) {
            clearTimeout(window._pipeTimeout);
            window._pipeTimeout = null;
        }

        // Create explosion particles
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            particles.push({
                x: bird.x,
                y: bird.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1,
                color: birdColors.body,
                size: 3 + Math.random() * 5
            });
        }

        if (score > 0) {
            const name = playerNameInput.value.trim() || 'Aviador';
            addHighScore(name, score);
        }
        generateReviveChallenge();
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
    }

    function checkCollisions() {
        // Ground and ceiling collision
        if (bird.y + BIRD_RADIUS > GROUND_Y || bird.y - BIRD_RADIUS < 0) {
            setGameOver();
            return;
        }

        // Pipe collision
        for (let p of pipes) {
            const topRect = { x: p.x, y: 0, w: PIPE_WIDTH, h: p.topHeight };
            const bottomRect = {
                x: p.x,
                y: p.topHeight + PIPE_GAP,
                w: PIPE_WIDTH,
                h: GROUND_Y - (p.topHeight + PIPE_GAP)
            };

            function circleRectCollision(cx, cy, cr, rect) {
                const nearX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
                const nearY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
                const dx = cx - nearX,
                    dy = cy - nearY;
                return (dx * dx + dy * dy) < (cr * cr);
            }

            if (circleRectCollision(bird.x, bird.y, BIRD_RADIUS, topRect) ||
                circleRectCollision(bird.x, bird.y, BIRD_RADIUS, bottomRect)) {
                setGameOver();
                return;
            }
        }
    }

    // ============================================================
    // 11. GAME UPDATE
    // ============================================================
    function updateGame() {
        if (!gameActive || gameOver) return;

        // Bird physics
        bird.vy += GRAVITY;
        bird.y += bird.vy;

        // Update pipes
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= PIPE_SPEED;
            if (pipes[i].x + PIPE_WIDTH < 0) pipes.splice(i, 1);
        }

        // Spawn pipes - SOLO si el juego está inicializado y hay al menos un tubo
        if (gameInitialized && pipes.length > 0) {
            frameCount++;
            if (frameCount % PIPE_SPAWN_INTERVAL === 0) {
                const minH = 55, maxH = GROUND_Y - PIPE_GAP - 55;
                const topH = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
                // Asegurar que el nuevo tubo no se superponga con el último
                const lastPipe = pipes[pipes.length - 1];
                if (lastPipe) {
                    // Si el último tubo está muy cerca, esperar un frame más
                    if (lastPipe.x > 400 - PIPE_WIDTH - 20) {
                        return;
                    }
                }
                pipes.push({ 
                    x: 400, 
                    topHeight: topH,
                    passed: false 
                });
            }
        }

        // Score update
        for (let p of pipes) {
            if (!p.passed && p.x + PIPE_WIDTH < bird.x) {
                p.passed = true;
                score++;
                playSound('score');
                currentScoreSpan.textContent = score;
            }
        }

        checkCollisions();
        bgOffset = (bgOffset + 0.6) % 800;

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.02;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // Update clouds
        for (let cloud of clouds) {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.w < -50) {
                cloud.x = 400 + 50;
                cloud.y = Math.random() * 250;
                cloud.w = 40 + Math.random() * 60;
            }
        }

        // Update stars
        for (let star of stars) {
            star.twinkle += 0.03;
        }
    }

    // ============================================================
    // 12. RENDERING / DRAWING
    // ============================================================
    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    function drawStartScreen() {
        ctx.clearRect(0, 0, 400, 600);

        // Sky Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, 600);
        grad.addColorStop(0, '#1a2a6c');
        grad.addColorStop(0.3, '#3b8db0');
        grad.addColorStop(0.6, '#70c5d0');
        grad.addColorStop(0.8, '#87d4d4');
        grad.addColorStop(1, '#a8d8d8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 600);

        // Stars
        for (let star of stars) {
            if (star.y < 250) {
                const alpha = star.opacity * (0.7 + 0.3 * Math.sin(star.twinkle));
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();
            }
        }

        // Clouds
        for (let cloud of clouds) {
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.w * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cloud.x + cloud.w * 0.25, cloud.y - cloud.w * 0.1, cloud.w * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cloud.x - cloud.w * 0.2, cloud.y + cloud.w * 0.05, cloud.w * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground
        ctx.fillStyle = '#5a9e3a';
        ctx.fillRect(0, GROUND_Y, 400, 600 - GROUND_Y);
        ctx.fillStyle = '#4a8e2a';
        ctx.fillRect(0, GROUND_Y, 400, 6);

        // Start screen text
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐦', 200, 200);
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#f7d44a';
        ctx.fillText('FLAPPY BIRD', 200, 260);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('Edición Matemática', 200, 295);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('Toca o presiona espacio', 200, 350);
        ctx.fillText('para comenzar', 200, 375);
        
        // Crédito en el canvas
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillText('✧ Hecho por Matías · 11-5 ✧', 200, 570);
        
        // Show the bird
        const x = 200;
        const y = 430;
        const r = BIRD_RADIUS;
        ctx.save();
        ctx.translate(x, y);
        
        const gradBird = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
        gradBird.addColorStop(0, lightenColor(birdColors.body, 20));
        gradBird.addColorStop(1, birdColors.body);
        ctx.fillStyle = gradBird;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = birdColors.wing;
        ctx.beginPath();
        ctx.ellipse(-6, -4, 10, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(6, -3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(8, -3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(9, -4.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f57c00';
        ctx.beginPath();
        ctx.moveTo(12, 1);
        ctx.lineTo(20, 2);
        ctx.lineTo(12, 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    function draw() {
        if (!gameActive && !gameOver) {
            drawStartScreen();
            return;
        }

        ctx.clearRect(0, 0, 400, 600);

        // ---- Sky Gradient ----
        const grad = ctx.createLinearGradient(0, 0, 0, 600);
        grad.addColorStop(0, '#1a2a6c');
        grad.addColorStop(0.3, '#3b8db0');
        grad.addColorStop(0.6, '#70c5d0');
        grad.addColorStop(0.8, '#87d4d4');
        grad.addColorStop(1, '#a8d8d8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 400, 600);

        // ---- Stars ----
        for (let star of stars) {
            if (star.y < 250) {
                const alpha = star.opacity * (0.7 + 0.3 * Math.sin(star.twinkle));
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fill();
            }
        }

        // ---- Clouds ----
        for (let cloud of clouds) {
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * 0.3})`;
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.w * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cloud.x + cloud.w * 0.25, cloud.y - cloud.w * 0.1, cloud.w * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cloud.x - cloud.w * 0.2, cloud.y + cloud.w * 0.05, cloud.w * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        // ---- Ground ----
        ctx.fillStyle = '#5a9e3a';
        ctx.fillRect(0, GROUND_Y, 400, 600 - GROUND_Y);
        ctx.fillStyle = '#4a8e2a';
        ctx.fillRect(0, GROUND_Y, 400, 6);

        // ---- Pipes ----
        for (let p of pipes) {
            const gradTop = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
            gradTop.addColorStop(0, '#2d7a2d');
            gradTop.addColorStop(0.5, '#4caf50');
            gradTop.addColorStop(1, '#2d7a2d');
            ctx.fillStyle = gradTop;
            ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
            ctx.fillRect(p.x - 8, p.topHeight - 20, PIPE_WIDTH + 16, 20);

            const gradBottom = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
            gradBottom.addColorStop(0, '#2d7a2d');
            gradBottom.addColorStop(0.5, '#4caf50');
            gradBottom.addColorStop(1, '#2d7a2d');
            ctx.fillStyle = gradBottom;
            const bottomY = p.topHeight + PIPE_GAP;
            ctx.fillRect(p.x, bottomY, PIPE_WIDTH, GROUND_Y - bottomY);
            ctx.fillRect(p.x - 8, bottomY, PIPE_WIDTH + 16, 20);
        }

        // ---- Bird ----
        const x = bird.x,
            y = bird.y,
            r = BIRD_RADIUS;
        ctx.save();
        ctx.translate(x, y);
        const angle = Math.min(0.4, Math.max(-0.3, bird.vy * 0.08));
        ctx.rotate(angle);

        const gradBird = ctx.createRadialGradient(-3, -3, 2, 0, 0, r);
        gradBird.addColorStop(0, lightenColor(birdColors.body, 20));
        gradBird.addColorStop(1, birdColors.body);
        ctx.fillStyle = gradBird;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = birdColors.wing;
        ctx.beginPath();
        ctx.ellipse(-6, -4, 10, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(6, -3, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(8, -3, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(9, -4.5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f57c00';
        ctx.beginPath();
        ctx.moveTo(12, 1);
        ctx.lineTo(20, 2);
        ctx.lineTo(12, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#bf360c';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // ---- Particles ----
        for (let p of particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ---- Score Overlay ----
        if (gameActive || gameOver) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(score, 200, 60);
        }

        // ---- Game Over overlay ----
        if (gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, 400, 600);
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('💀 GAME OVER', 200, 250);
            ctx.fillStyle = 'white';
            ctx.font = '20px Arial';
            ctx.fillText(`Puntaje: ${score}`, 200, 310);
            ctx.fillStyle = '#f7d44a';
            ctx.font = '16px Arial';
            ctx.fillText('Responde la ecuación para revivir', 200, 360);
            
            if (reviveChallenge) {
                ctx.fillStyle = '#f7d44a';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`${reviveChallenge.a} × ${reviveChallenge.b} = ?`, 200, 420);
            }
        }
    }

    // ============================================================
    // 13. GAME LOOP
    // ============================================================
    function gameLoop() {
        updateGame();
        draw();
        requestAnimationFrame(gameLoop);
    }

    // ============================================================
    // 14. EVENT HANDLERS
    // ============================================================
    function handleJump(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Iniciar el juego si está en pantalla de inicio
        if (!gameActive && !gameOver) {
            resetGame();
            gameActive = true;
            gameOver = false;
            startBtn.disabled = true;
            startBtn.style.opacity = '0.5';
            reviveBanner.classList.remove('show');
            return;
        }
        
        // Saltar si el juego está activo
        if (gameActive && !gameOver) {
            bird.vy = JUMP_FORCE;
            playSound('jump');
        } 
        // Revivir si está en game over
        else if (gameOver && !gameActive) {
            handleReviveAnswer();
        }
    }

    // Eventos de teclado
    document.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Space' || e.key === 'ArrowUp') {
            e.preventDefault();
            handleJump(e);
        }
    });

    // Eventos táctiles y de mouse para el canvas
    canvas.addEventListener('click', handleJump);
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        handleJump(e);
    });

    // Eventos táctiles para toda la pantalla
    document.addEventListener('touchstart', function(e) {
        const target = e.target;
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') return;
        if (target.closest('.left-panel')) return;
        
        handleJump(e);
    }, { passive: false });

    // ============================================================
    // 15. BUTTON EVENTS
    // ============================================================
    startBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetGame();
        gameActive = true;
        gameOver = false;
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        reviveBanner.classList.remove('show');
    });

    restartBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        resetGame();
        gameActive = true;
        gameOver = false;
        startBtn.disabled = true;
        startBtn.style.opacity = '0.5';
        reviveBanner.classList.remove('show');
    });

    reviveBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        handleReviveAnswer();
    });

    // ============================================================
    // 16. PREVENIR SCROLL EN MÓVIL
    // ============================================================
    document.addEventListener('touchmove', function(e) {
        if (e.target === canvas || e.target.closest('.game-wrapper')) {
            e.preventDefault();
        }
    }, { passive: false });

    // ============================================================
    // 17. INITIALIZATION
    // ============================================================
    loadHighScores();
    resetGame();
    gameActive = false;
    gameOver = false;
    startBtn.disabled = false;
    startBtn.style.opacity = '1';

    // Start the game loop
    gameLoop();

    setTimeout(resizeCanvas, 200);

    console.log('🎮 Flappy Bird - Edición Matemática cargado correctamente');
    console.log('📱 Soporte para móvil activado');
    console.log('🟢 Toca la pantalla o presiona espacio para jugar');
})();