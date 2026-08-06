(function() {
    console.log('🎮 Nannysland - Iniciando...');

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const livesSpan = document.getElementById('livesDisplay');
    const levelSpan = document.getElementById('levelDisplay');
    const scoreSpan = document.getElementById('scoreDisplay');
    const startScreen = document.getElementById('startScreen');
    const playBtn = document.getElementById('playBtn');
    const resetBtn = document.getElementById('resetBtn');

    // ===== SISTEMA DE SONIDO =====
    let audioCtx = null;

    function playDeathSound() {
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const now = audioCtx.currentTime;
            
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(400, now);
            osc1.frequency.exponentialRampToValueAtTime(150, now + 0.3);
            gain1.gain.setValueAtTime(0.3, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.start(now);
            osc1.stop(now + 0.3);

            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(800, now);
            osc2.frequency.exponentialRampToValueAtTime(200, now + 0.2);
            gain2.gain.setValueAtTime(0.15, now);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.start(now + 0.05);
            osc2.stop(now + 0.25);

            const bufferSize = audioCtx.sampleRate * 0.15;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = audioCtx.createBufferSource();
            noise.buffer = buffer;
            const gain3 = audioCtx.createGain();
            gain3.gain.setValueAtTime(0.2, now);
            gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            noise.connect(gain3);
            gain3.connect(audioCtx.destination);
            noise.start(now + 0.02);
            noise.stop(now + 0.17);

        } catch (e) {
            console.log('⚠️ Error reproduciendo sonido:', e);
        }
    }

    // ===== CONSTANTES =====
    const GRAVITY = 0.5;
    const JUMP_FORCE = -12;
    const MOVE_SPEED = 4.5;
    const GROUND_Y = 380;
    const PLAYER_W = 30;
    const PLAYER_H = 35;
    const MAX_LIVES = 5;

    // ===== ESTADO DEL JUEGO =====
    let gameState = {
        player: { x: 50, y: GROUND_Y - PLAYER_H, w: PLAYER_W, h: PLAYER_H, vx: 0, vy: 0, onGround: false, facing: 1 },
        lives: MAX_LIVES,
        level: 1,
        score: 0,
        active: false,
        gameOver: false,
        victory: false,
        levelComplete: false
    };

    let platforms = [];
    let enemies = [];
    let obstacles = [];
    let particles = [];
    let decorations = [];
    let floatingParticles = [];
    let stars = [];
    let portal = { x: 700, y: GROUND_Y - 60, w: 40, h: 50 };
    let keys = { left: false, right: false, space: false };
    let animFrame = null;
    let deathCooldown = false;
    let time = 0;

    // ===== GENERAR ESTRELLAS DE FONDO =====
    function generateStars() {
        stars = [];
        for (let i = 0; i < 80; i++) {
            stars.push({
                x: Math.random() * 800,
                y: Math.random() * GROUND_Y,
                size: 0.5 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                opacity: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 0.5 + Math.random() * 2
            });
        }
    }
    generateStars();

    // ===== CONSTRUIR NIVEL =====
    function buildLevel(level) {
        platforms = [];
        enemies = [];
        obstacles = [];
        particles = [];
        decorations = [];
        floatingParticles = [];
        gameState.levelComplete = false;

        // ===== DECORACIONES DE FONDO =====
        // Nubes
        for (let i = 0; i < 6; i++) {
            decorations.push({
                type: 'cloud',
                x: Math.random() * 750 + 20,
                y: 20 + Math.random() * 120,
                size: 30 + Math.random() * 50,
                speed: 0.1 + Math.random() * 0.2,
                opacity: 0.3 + Math.random() * 0.3
            });
        }

        // Flores en el suelo
        const flowerColors = ['#FF6B8A', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8A5C', '#9B59B6'];
        for (let i = 0; i < 30; i++) {
            decorations.push({
                type: 'flower',
                x: 10 + Math.random() * 780,
                y: GROUND_Y + 5 + Math.random() * 35,
                size: 3 + Math.random() * 5,
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                sway: Math.random() * Math.PI * 2
            });
        }

        // Mariposas
        for (let i = 0; i < 4; i++) {
            decorations.push({
                type: 'butterfly',
                x: 50 + Math.random() * 700,
                y: 50 + Math.random() * 200,
                size: 6 + Math.random() * 4,
                speed: 0.3 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                color: ['#FF6B8A', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'][Math.floor(Math.random() * 5)]
            });
        }

        // ===== PLATAFORMAS =====
        // Plataforma inicial con decoración
        platforms.push({ 
            x: 20, 
            y: GROUND_Y - 20, 
            w: 130, 
            h: 20, 
            color: '#FFB8D0',
            type: 'start',
            glow: true
        });

        // Plataformas con estilo mejorado
        const platData = [
            { x: 170, y: GROUND_Y - 85, w: 110 },
            { x: 300, y: GROUND_Y - 65, w: 110 },
            { x: 430, y: GROUND_Y - 95, w: 110 },
            { x: 560, y: GROUND_Y - 75, w: 110 },
            { x: 680, y: GROUND_Y - 85, w: 100 }
        ];

        const colors = ['#FF6B8A', '#FF8A5C', '#FFD93D', '#6BCB77', '#4D96FF'];
        const glowColors = ['#FFB8D0', '#FFD4B8', '#FFE8B8', '#B8FFD0', '#B8D4FF'];

        for (let i = 0; i < platData.length; i++) {
            const p = platData[i];
            platforms.push({
                x: p.x,
                y: p.y - Math.min(level * 3, 20),
                w: p.w,
                h: 20,
                color: colors[i % colors.length],
                glow: true,
                glowColor: glowColors[i % glowColors.length],
                type: 'float',
                bobOffset: i * 0.8,
                bobSpeed: 0.015 + (i % 2) * 0.005
            });
        }

        // Plataforma final (dorada y brillante)
        platforms.push({ 
            x: portal.x - 45, 
            y: portal.y + 25, 
            w: 120, 
            h: 20, 
            color: '#FFD700',
            type: 'end',
            glow: true,
            glowColor: '#FFE880'
        });

        // ===== ENEMIGOS (más lindos) =====
        const numEnemies = Math.min(level, 4);
        const enemyColors = ['#9B59B6', '#8E44AD', '#6C3483', '#A569BD'];
        const moves = level > 3;

        for (let i = 0; i < numEnemies; i++) {
            const plat = platforms[i + 1];
            if (plat) {
                enemies.push({
                    x: plat.x + 30,
                    y: plat.y - 28,
                    w: 28,
                    h: 28,
                    minX: plat.x + 10,
                    maxX: plat.x + plat.w - 38,
                    speed: moves ? 0.5 + level * 0.04 : 0,
                    vx: 1,
                    color: enemyColors[i % enemyColors.length],
                    moves: moves,
                    alive: true,
                    eyeAngle: 0,
                    bounceTimer: 0
                });
            }
        }

        // ===== OBSTÁCULOS (más coloridos) =====
        const obsColors = ['#FF4757', '#FF6348', '#FF6B81', '#FF4757'];
        const obsPos = [
            { x: 210, y: GROUND_Y - 20 },
            { x: 360, y: GROUND_Y - 20 },
            { x: 510, y: GROUND_Y - 20 }
        ];

        for (let i = 0; i < Math.min(level, 3); i++) {
            const pos = obsPos[i];
            if (pos) {
                obstacles.push({
                    x: pos.x,
                    y: pos.y - (i % 2 === 0 ? 0 : 10),
                    w: 24,
                    h: 24,
                    color: obsColors[i % obsColors.length],
                    rotation: 0,
                    pulse: Math.random() * Math.PI * 2,
                    glow: true
                });
            }
        }

        // ===== PARTÍCULAS FLOTANTES =====
        for (let i = 0; i < 15; i++) {
            floatingParticles.push({
                x: Math.random() * 780 + 10,
                y: Math.random() * 350 + 30,
                size: 1 + Math.random() * 3,
                speed: 0.1 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                color: `hsl(${Math.random() * 60 + 300}, 80%, 70%)`,
                opacity: 0.2 + Math.random() * 0.3
            });
        }

        // Posicionar jugador
        const firstPlat = platforms[0];
        if (firstPlat) {
            gameState.player.x = firstPlat.x + firstPlat.w / 2 - PLAYER_W / 2;
            gameState.player.y = firstPlat.y - PLAYER_H;
        }
        gameState.player.vx = 0;
        gameState.player.vy = 0;
        gameState.player.onGround = true;
        deathCooldown = false;

        updateUI();
        spawnParticles(gameState.player.x + PLAYER_W / 2, gameState.player.y + PLAYER_H / 2, '#FFD700', 15);
    }

    function spawnParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1,
                decay: 0.015 + Math.random() * 0.025,
                size: 2 + Math.random() * 5,
                color: color,
                gravity: 0.05
            });
        }
    }

    function spawnSparkles(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 40;
            particles.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2 - 1,
                life: 1,
                decay: 0.01 + Math.random() * 0.02,
                size: 1 + Math.random() * 3,
                color: `hsl(${Math.random() * 60 + 40}, 100%, 70%)`,
                gravity: 0.02,
                sparkle: true
            });
        }
    }

    function resetGame() {
        gameState.lives = MAX_LIVES;
        gameState.level = 1;
        gameState.score = 0;
        gameState.gameOver = false;
        gameState.victory = false;
        gameState.active = true;
        deathCooldown = false;
        buildLevel(gameState.level);
        updateUI();
    }

    function nextLevel() {
        if (gameState.level < 6) {
            gameState.level++;
            buildLevel(gameState.level);
            updateUI();
            spawnSparkles(portal.x + portal.w / 2, portal.y + portal.h / 2);
        } else {
            gameState.victory = true;
            gameState.active = false;
            updateUI();
            spawnSparkles(400, 200, 50);
        }
    }

    function updateUI() {
        livesSpan.textContent = gameState.lives;
        levelSpan.textContent = gameState.victory ? '🎉' : gameState.level + '/6';
        scoreSpan.textContent = gameState.score;
    }

    function rectCollide(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y;
    }

    // ===== ACTUALIZAR =====
    function update() {
        time += 0.016;
        if (!gameState.active || gameState.gameOver || gameState.victory || gameState.levelComplete) return;

        const p = gameState.player;

        // Movimiento horizontal
        if (keys.left) { p.vx = -MOVE_SPEED; p.facing = -1; }
        else if (keys.right) { p.vx = MOVE_SPEED; p.facing = 1; }
        else { p.vx *= 0.8; if (Math.abs(p.vx) < 0.1) p.vx = 0; }

        // Salto
        if (keys.space && p.onGround) {
            p.vy = JUMP_FORCE;
            p.onGround = false;
            keys.space = false;
            spawnParticles(p.x + p.w / 2, p.y + p.h, '#FFD700', 10);
        }

        // Gravedad
        p.vy += GRAVITY;
        if (p.vy > 12) p.vy = 12;

        // Mover
        p.x += p.vx;
        p.y += p.vy;

        // Límites
        if (p.x < 0) p.x = 0;
        if (p.x + p.w > 800) p.x = 800 - p.w;

        // Suelo
        if (p.y + p.h >= GROUND_Y) {
            p.y = GROUND_Y - p.h;
            p.vy = 0;
            p.onGround = true;
        } else {
            p.onGround = false;
        }

        const playerRect = { x: p.x, y: p.y, w: p.w, h: p.h };

        // Plataformas (con movimiento de balanceo)
        for (let plat of platforms) {
            if (plat.type === 'float') {
                const bob = Math.sin(plat.bobOffset + time * plat.bobSpeed) * 4;
                plat.currentY = plat.y + bob;
            } else {
                plat.currentY = plat.y;
            }
            
            const platRect = { x: plat.x, y: plat.currentY, w: plat.w, h: plat.h };
            if (rectCollide(playerRect, platRect)) {
                if (p.vy > 0 && p.y + p.h - p.vy <= plat.currentY + 5) {
                    p.y = plat.currentY - p.h;
                    p.vy = 0;
                    p.onGround = true;
                }
            }
        }

        // Obstáculos
        for (let obs of obstacles) {
            obs.rotation += 0.03;
            obs.pulse += 0.05;
            const obsRect = { x: obs.x, y: obs.y, w: obs.w, h: obs.h };
            if (rectCollide(playerRect, obsRect) && !deathCooldown) {
                deathCooldown = true;
                gameState.lives--;
                updateUI();
                playDeathSound();
                spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#FF4757', 25);
                
                if (gameState.lives <= 0) {
                    gameState.gameOver = true;
                    gameState.active = false;
                    gameState.lives = 0;
                    updateUI();
                    return;
                } else {
                    const firstPlat = platforms[0];
                    if (firstPlat) {
                        p.x = firstPlat.x + firstPlat.w / 2 - PLAYER_W / 2;
                        p.y = firstPlat.y - PLAYER_H;
                    }
                    p.vx = 0;
                    p.vy = 0;
                    p.onGround = true;
                    setTimeout(() => { deathCooldown = false; }, 500);
                }
                break;
            }
        }

        // Enemigos
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            enemy.bounceTimer += 0.02;
            enemy.eyeAngle += 0.03;

            if (enemy.moves) {
                enemy.x += enemy.vx * enemy.speed;
                if (enemy.x <= enemy.minX || enemy.x + enemy.w >= enemy.maxX) {
                    enemy.vx *= -1;
                }
            }

            // Sincronizar enemigo con la plataforma
            if (enemy.platformRef) {
                const platY = enemy.platformRef.currentY || enemy.platformRef.y;
                enemy.y = platY - 28;
            }

            const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
            if (rectCollide(playerRect, enemyRect) && !deathCooldown) {
                deathCooldown = true;
                gameState.lives--;
                updateUI();
                playDeathSound();
                spawnParticles(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color, 25);
                
                if (gameState.lives <= 0) {
                    gameState.gameOver = true;
                    gameState.active = false;
                    gameState.lives = 0;
                    updateUI();
                    return;
                } else {
                    const firstPlat = platforms[0];
                    if (firstPlat) {
                        p.x = firstPlat.x + firstPlat.w / 2 - PLAYER_W / 2;
                        p.y = firstPlat.y - PLAYER_H;
                    }
                    p.vx = 0;
                    p.vy = 0;
                    p.onGround = true;
                    setTimeout(() => { deathCooldown = false; }, 500);
                }
                break;
            }
        }

        // Portal
        const portalRect = { x: portal.x, y: portal.y, w: portal.w, h: portal.h };
        if (rectCollide(playerRect, portalRect) && !gameState.levelComplete) {
            gameState.levelComplete = true;
            gameState.score += 10 + gameState.level * 5;
            updateUI();
            spawnSparkles(portal.x + portal.w / 2, portal.y + portal.h / 2);
            setTimeout(nextLevel, 600);
        }

        // Actualizar partículas
        for (let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            if (p.gravity) p.vy += p.gravity;
            p.life -= p.decay;
        }
        particles = particles.filter(p => p.life > 0);

        // Actualizar decoraciones
        for (let dec of decorations) {
            if (dec.type === 'cloud') {
                dec.x += dec.speed * 0.1;
                if (dec.x > 850) dec.x = -50;
            }
            if (dec.type === 'flower') {
                dec.sway += 0.02;
            }
            if (dec.type === 'butterfly') {
                dec.x += Math.sin(dec.phase + time * dec.speed) * 0.5;
                dec.y += Math.cos(dec.phase * 0.7 + time * dec.speed * 0.8) * 0.3;
            }
        }

        // Actualizar partículas flotantes
        for (let fp of floatingParticles) {
            fp.y += Math.sin(fp.phase + time * fp.speed) * 0.2;
        }
    }

    // ===== DIBUJAR =====
    function draw() {
        ctx.clearRect(0, 0, 800, 450);

        // ===== FONDO CON GRADIENTE =====
        const grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(0.3, '#302b63');
        grad.addColorStop(0.6, '#24243e');
        grad.addColorStop(0.8, '#1a1a3e');
        grad.addColorStop(1, '#2d1b4e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 450);

        // ===== ESTRELLAS (parpadeantes) =====
        for (let star of stars) {
            const twinkle = Math.sin(time * star.twinkleSpeed + star.x) * 0.5 + 0.5;
            const opacity = star.opacity * (0.5 + twinkle * 0.5);
            ctx.globalAlpha = opacity;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ===== PARTÍCULAS FLOTANTES =====
        for (let fp of floatingParticles) {
            ctx.globalAlpha = fp.opacity;
            ctx.fillStyle = fp.color;
            ctx.beginPath();
            ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ===== DECORACIONES =====
        for (let dec of decorations) {
            if (dec.type === 'cloud') {
                ctx.globalAlpha = dec.opacity;
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.arc(dec.x, dec.y, dec.size * 0.6, 0, Math.PI * 2);
                ctx.arc(dec.x + dec.size * 0.5, dec.y - dec.size * 0.2, dec.size * 0.7, 0, Math.PI * 2);
                ctx.arc(dec.x + dec.size, dec.y, dec.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
            if (dec.type === 'flower') {
                const sway = Math.sin(dec.sway) * 2;
                ctx.fillStyle = dec.color;
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2 + dec.sway * 0.3;
                    const petalX = dec.x + Math.cos(angle) * dec.size * 1.2;
                    const petalY = dec.y + Math.sin(angle) * dec.size * 1.2 + sway * 0.3;
                    ctx.beginPath();
                    ctx.arc(petalX, petalY, dec.size * 0.7, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(dec.x, dec.y + sway * 0.3, dec.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            }
            if (dec.type === 'butterfly') {
                const wingAngle = Math.sin(time * 3 + dec.phase) * 0.5;
                ctx.fillStyle = dec.color;
                ctx.globalAlpha = 0.7;
                // Ala izquierda
                ctx.beginPath();
                ctx.ellipse(dec.x - 4, dec.y, 6 + wingAngle * 3, 4 + wingAngle * 2, -0.3, 0, Math.PI * 2);
                ctx.fill();
                // Ala derecha
                ctx.beginPath();
                ctx.ellipse(dec.x + 4, dec.y, 6 - wingAngle * 3, 4 - wingAngle * 2, 0.3, 0, Math.PI * 2);
                ctx.fill();
                // Cuerpo
                ctx.fillStyle = '#2d1b4e';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(dec.x, dec.y, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        }

        // ===== SUELO CON ARCOÍRIS =====
        const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, 450);
        groundGrad.addColorStop(0, '#FF6B8A');
        groundGrad.addColorStop(0.16, '#FF8A5C');
        groundGrad.addColorStop(0.33, '#FFD93D');
        groundGrad.addColorStop(0.5, '#6BCB77');
        groundGrad.addColorStop(0.66, '#4D96FF');
        groundGrad.addColorStop(0.83, '#9B59B6');
        groundGrad.addColorStop(1, '#8E44AD');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, GROUND_Y, 800, 70);

        // Líneas decorativas del suelo (como capas de pastel)
        for (let i = 0; i < 60; i++) {
            const hue = (i * 6 + time * 20) % 360;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = `hsl(${hue}, 80%, 70%)`;
            ctx.fillRect(i * 13.5, GROUND_Y + 5, 6, 4);
            ctx.fillRect(i * 13.5 + 3, GROUND_Y + 12, 6, 4);
            ctx.fillRect(i * 13.5 + 6, GROUND_Y + 19, 6, 4);
        }
        ctx.globalAlpha = 1;

        // Brillo en el suelo
        for (let i = 0; i < 20; i++) {
            const x = (i * 40 + time * 30) % 800;
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, GROUND_Y + 35, 15 + Math.sin(time + i) * 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // ===== PLATAFORMAS =====
        for (let plat of platforms) {
            const drawY = plat.currentY !== undefined ? plat.currentY : plat.y;
            
            // Sombra
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            
            // Cuerpo de la plataforma
            const grad2 = ctx.createLinearGradient(plat.x, drawY, plat.x, drawY + plat.h);
            grad2.addColorStop(0, plat.color);
            grad2.addColorStop(0.5, lightenColor(plat.color, 20));
            grad2.addColorStop(1, darkenColor(plat.color, 20));
            ctx.fillStyle = grad2;
            ctx.beginPath();
            ctx.roundRect(plat.x, drawY, plat.w, plat.h, 10);
            ctx.fill();
            
            // Brillo
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.beginPath();
            ctx.roundRect(plat.x + 6, drawY + 3, plat.w - 12, 5, 5);
            ctx.fill();
            ctx.globalAlpha = 1;

            // Borde brillante
            if (plat.glow) {
                ctx.shadowBlur = 30;
                ctx.shadowColor = plat.glowColor || plat.color;
                ctx.strokeStyle = plat.glowColor || plat.color;
                ctx.globalAlpha = 0.2;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(plat.x, drawY, plat.w, plat.h, 10);
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
            }

            // Decoración de la plataforma
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            for (let i = 0; i < 4; i++) {
                const dotX = plat.x + 15 + i * (plat.w - 30) / 3;
                ctx.beginPath();
                ctx.arc(dotX, drawY + plat.h / 2, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ===== OBSTÁCULOS =====
        for (let obs of obstacles) {
            const scale = 1 + Math.sin(obs.pulse) * 0.05;
            const cx = obs.x + obs.w / 2;
            const cy = obs.y + obs.h / 2;
            
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(obs.rotation);
            ctx.scale(scale, scale);
            
            // Sombra
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 5;
            
            // Cuerpo
            const grad3 = ctx.createRadialGradient(-3, -3, 2, 0, 0, obs.w / 2);
            grad3.addColorStop(0, lightenColor(obs.color, 50));
            grad3.addColorStop(0.5, obs.color);
            grad3.addColorStop(1, darkenColor(obs.color, 30));
            ctx.fillStyle = grad3;
            ctx.beginPath();
            ctx.arc(0, 0, obs.w / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Brillo
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.4;
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(-3, -4, obs.w / 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Anillo brillante
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, obs.w / 2 + 3, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }

        // ===== ENEMIGOS =====
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            
            const bounce = Math.sin(enemy.bounceTimer) * 2;
            
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 25;
            ctx.shadowOffsetY = 5;
            
            // Cuerpo
            const grad4 = ctx.createRadialGradient(
                enemy.x + 4, enemy.y + 4 + bounce, 3,
                enemy.x + enemy.w / 2, enemy.y + enemy.h / 2 + bounce, enemy.w / 2
            );
            grad4.addColorStop(0, lightenColor(enemy.color, 50));
            grad4.addColorStop(0.5, enemy.color);
            grad4.addColorStop(1, darkenColor(enemy.color, 30));
            ctx.fillStyle = grad4;
            ctx.beginPath();
            ctx.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2 + bounce, enemy.w / 2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            
            // Ojos (siguen al jugador)
            const angleToPlayer = Math.atan2(
                (gameState.player.y + gameState.player.h / 2) - (enemy.y + enemy.h / 2 + bounce),
                (gameState.player.x + gameState.player.w / 2) - (enemy.x + enemy.w / 2)
            );
            const eyeX = Math.cos(angleToPlayer) * 4;
            const eyeY = Math.sin(angleToPlayer) * 4;
            
            // Ojos blancos
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(enemy.x + 8 + eyeX, enemy.y + 8 + bounce + eyeY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(enemy.x + 20 + eyeX, enemy.y + 8 + bounce + eyeY, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Pupilas
            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(enemy.x + 9 + eyeX * 1.3, enemy.y + 9 + bounce + eyeY * 1.3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(enemy.x + 21 + eyeX * 1.3, enemy.y + 9 + bounce + eyeY * 1.3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Sonrisa
            ctx.strokeStyle = '#1a1a2e';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(enemy.x + 14, enemy.y + 14 + bounce, 5, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();
            
            // Cachetes
            ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
            ctx.beginPath();
            ctx.arc(enemy.x + 5, enemy.y + 14 + bounce, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(enemy.x + 23, enemy.y + 14 + bounce, 4, 0, Math.PI * 2);
            ctx.fill();

            // Indicador de movimiento
            ctx.fillStyle = enemy.moves ? 'rgba(255,215,0,0.6)' : 'rgba(100,200,255,0.6)';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.moves ? '⚡' : '💤', enemy.x + 14, enemy.y - 6 + bounce);
        }

        // ===== PORTAL =====
        const pulse = Math.sin(time * 3) * 0.1 + 1;
        
        // Anillos del portal
        for (let i = 0; i < 4; i++) {
            const radius = (20 + i * 12) * pulse;
            ctx.globalAlpha = 0.3 - i * 0.06;
            ctx.strokeStyle = i % 2 === 0 ? '#FFD700' : '#FF8C00';
            ctx.lineWidth = 3 - i * 0.5;
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FFD700';
            ctx.beginPath();
            ctx.arc(portal.x + portal.w / 2, portal.y + portal.h / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Cuerpo del portal (efecto de vórtice)
        const portalGrad = ctx.createRadialGradient(
            portal.x + portal.w / 2, portal.y + portal.h / 2, 2,
            portal.x + portal.w / 2, portal.y + portal.h / 2, 32
        );
        portalGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        portalGrad.addColorStop(0.2, '#FFE880');
        portalGrad.addColorStop(0.5, '#FFD700');
        portalGrad.addColorStop(0.8, '#FF8C00');
        portalGrad.addColorStop(1, 'rgba(255, 140, 0, 0)');
        
        ctx.fillStyle = portalGrad;
        ctx.shadowBlur = 40;
        ctx.shadowColor = '#FFD700';
        ctx.beginPath();
        ctx.arc(portal.x + portal.w / 2, portal.y + portal.h / 2, 32 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Texto del nivel
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillText(`⭐ ${gameState.level}`, portal.x + portal.w / 2, portal.y + portal.h / 2 + 1);
        ctx.shadowBlur = 0;
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('PORTAL', portal.x + portal.w / 2, portal.y + portal.h / 2 + 22);

        // ===== JUGADOR =====
        const p = gameState.player;
        
        // Sombra del jugador
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(p.x + p.w / 2, GROUND_Y + 4, p.w / 2 + 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dibujar perro
        ctx.save();
        if (p.facing === -1) {
            ctx.translate(p.x + p.w, p.y);
            ctx.scale(-1, 1);
            drawDog(ctx, 0, 0, p.w, p.h);
        } else {
            drawDog(ctx, p.x, p.y, p.w, p.h);
        }
        ctx.restore();

        // ===== PARTÍCULAS =====
        for (let p of particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 15;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // ===== MENSAJES =====
        if (gameState.levelComplete) {
            ctx.fillStyle = `rgba(255,215,0,${0.08 + Math.sin(time * 5) * 0.04})`;
            ctx.fillRect(0, 0, 800, 450);
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 48px Comic Sans MS, cursive';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 40;
            ctx.shadowColor = '#FFD700';
            ctx.fillText('⭐ ¡NIVEL COMPLETADO! ⭐', 400, 200);
            ctx.shadowBlur = 0;
            
            // Barra de progreso
            const progress = Math.min((Date.now() - gameState.levelCompleteTime) / 600, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.roundRect(250, 240, 300, 16, 8);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.roundRect(250, 240, 300 * progress, 16, 8);
            ctx.fill();
        }

        if (gameState.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.fillRect(0, 0, 800, 450);
            ctx.fillStyle = '#FF4757';
            ctx.font = 'bold 60px Comic Sans MS, cursive';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FF4757';
            ctx.fillText('💔 GAME OVER', 400, 200);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = '24px Segoe UI, sans-serif';
            ctx.fillText('Presiona "Reiniciar" para intentarlo de nuevo', 400, 280);
        }

        if (gameState.victory) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, 800, 450);
            
            // Fuegos artificiales
            for (let i = 0; i < 30; i++) {
                const angle = i * Math.PI / 15 + time * 0.5;
                const dist = 80 + Math.sin(time * 0.5 + i) * 40;
                const x = 400 + Math.cos(angle) * dist;
                const y = 200 + Math.sin(angle * 1.5) * dist * 0.5;
                const hue = (i * 24 + time * 20) % 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${0.6 + Math.sin(time + i) * 0.3})`;
                ctx.shadowBlur = 20;
                ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.5)`;
                ctx.beginPath();
                ctx.arc(x, y, 2 + Math.sin(time * 2 + i) * 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 60px Comic Sans MS, cursive';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 30;
            ctx.shadowColor = '#FFD700';
            ctx.fillText('🎉 ¡VICTORIA! 🎉', 400, 180);
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'white';
            ctx.font = '28px Segoe UI, sans-serif';
            ctx.fillText('¡Has completado todos los niveles!', 400, 260);
            ctx.fillStyle = '#FFD700';
            ctx.font = '22px Segoe UI, sans-serif';
            ctx.fillText(`🏆 Puntuación final: ${gameState.score}`, 400, 320);
            ctx.fillStyle = '#FF6B8A';
            ctx.font = '18px Segoe UI, sans-serif';
            ctx.fillText('👏 ¡Eres un verdadero aventurero!', 400, 370);
        }

        // ===== INSTRUCCIONES EN PANTALLA =====
        if (!gameState.active && !gameState.gameOver && !gameState.victory) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, 800, 450);
            ctx.fillStyle = 'white';
            ctx.font = '32px Comic Sans MS, cursive';
            ctx.textAlign = 'center';
            ctx.shadowBlur = 0;
            ctx.fillText('🎮 Presiona PLAY para comenzar', 400, 200);
            ctx.font = '18px Segoe UI, sans-serif';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('⬅️ ➡️ Mover  |  Espacio Saltar', 400, 250);
            ctx.fillStyle = '#FF6B8A';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('⭐ Llega al portal para avanzar de nivel', 400, 290);
        }
    }

    // ===== FUNCIONES DE DIBUJO DEL PERRO =====
    function drawDog(ctx, x, y, w, h) {
        const grad = ctx.createRadialGradient(x + 8, y + 8, 4, x + 14, y + 17, 20);
        grad.addColorStop(0, '#FFB8A0');
        grad.addColorStop(0.4, '#E8967A');
        grad.addColorStop(0.8, '#C97A60');
        grad.addColorStop(1, '#A8604A');
        ctx.fillStyle = grad;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowOffsetY = 2;

        // Cuerpo
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 10, 20, 20, 8);
        ctx.fill();

        // Cabeza
        ctx.beginPath();
        ctx.arc(x + 14, y + 10, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Orejas
        ctx.fillStyle = '#B07050';
        ctx.beginPath();
        ctx.ellipse(x + 3, y + 6, 6, 9, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 25, y + 6, 6, 9, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Ojos
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(x + 10, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 18, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();

        // Brillo en los ojos
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x + 9, y + 7, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 17, y + 7, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Nariz
        ctx.fillStyle = '#4A2A1A';
        ctx.beginPath();
        ctx.arc(x + 14, y + 12, 3, 0, Math.PI * 2);
        ctx.fill();

        // Sonrisa
        ctx.strokeStyle = '#4A2A1A';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x + 14, y + 14, 5, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // Cachetes
        ctx.fillStyle = 'rgba(255, 100, 100, 0.15)';
        ctx.beginPath();
        ctx.arc(x + 6, y + 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 22, y + 14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Collar
        ctx.fillStyle = '#FF6B8A';
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + 14, y + 20, 8, 0, Math.PI);
        ctx.stroke();
        // Colgante
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + 14, y + 26, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF6B8A';
        ctx.font = '5px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', x + 14, y + 27);
    }

    // ===== UTILIDADES DE COLOR =====
    function lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    function darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
    }

    // ===== POLYFILL =====
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (r > w / 2) r = w / 2;
            if (r > h / 2) r = h / 2;
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            return this;
        };
    }

    // ===== BUCLE =====
    function gameLoop() {
        update();
        draw();
        animFrame = requestAnimationFrame(gameLoop);
    }

    // ===== EVENTOS =====
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = true; e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = true; e.preventDefault(); }
        else if (e.key === ' ' || e.key === 'Space' || e.key === 'w') { keys.space = true; e.preventDefault(); }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a') { keys.left = false; e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'd') { keys.right = false; e.preventDefault(); }
        else if (e.key === ' ' || e.key === 'Space' || e.key === 'w') { keys.space = false; e.preventDefault(); }
    });

    playBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        if (!gameState.active || gameState.gameOver || gameState.victory) {
            resetGame();
        }
        gameState.active = true;
        if (!animFrame) gameLoop();
    });

    resetBtn.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        resetGame();
        gameState.active = true;
        if (!animFrame) gameLoop();
    });

    // ===== INICIAR =====
    buildLevel(1);
    updateUI();
    draw();
    gameLoop();

    console.log('✅ Nannysland - Juego listo!');
    console.log('👩‍💻 Creado por Amanda Aguilar 11-5');
    console.log('🌟 Versión mejorada con más estilo!');
})();