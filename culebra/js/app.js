/**
 * Juego de la Culebra (Snake Game)
 * Desarrollado para Tarea N.° 1 - Liceo UNESCO 2026
 */

document.addEventListener('DOMContentLoaded', () => {
    // Referencias del DOM
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const currentScoreEl = document.getElementById('current-score');
    const highScoreEl = document.getElementById('high-score');
    const currentLevelEl = document.getElementById('current-level');
    
    const overlay = document.getElementById('game-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMessage = document.getElementById('overlay-message');
    
    const btnStart = document.getElementById('btn-start');
    const btnRestart = document.getElementById('btn-restart');
    const btnPause = document.getElementById('btn-pause');
    
    // Botones D-Pad
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    // Variables de Configuración
    const gridSize = 20; 
    const tileCount = canvas.width / gridSize;
    
    let snake = [];
    let food = { x: 0, y: 0 };
    let dx = gridSize;
    let dy = 0;
    let nextDx = gridSize;
    let nextDy = 0;
    
    let score = 0;
    let highScore = localStorage.getItem('snake_high_score') || 0;
    let level = 1;
    let speed = 130;
    
    let gameLoop = null;
    let isPlaying = false;
    let isPaused = false;

    // Inicialización del Récord
    highScoreEl.textContent = highScore;

    // ==========================================================================
    // LÓGICA Y FUNCIONALIDAD DEL JUEGO
    // ==========================================================================

    function initGame() {
        snake = [
            { x: 10 * gridSize, y: 10 * gridSize },
            { x: 9 * gridSize, y: 10 * gridSize },
            { x: 8 * gridSize, y: 10 * gridSize }
        ];
        
        dx = gridSize;
        dy = 0;
        nextDx = gridSize;
        nextDy = 0;
        
        score = 0;
        level = 1;
        speed = 130;
        
        updateScoreboard();
        generateFood();
    }

    function startGame() {
        initGame();
        isPlaying = true;
        isPaused = false;
        overlay.classList.remove('active');
        btnPause.disabled = false;
        btnPause.textContent = '⏸ Pausa';
        
        if (gameLoop) clearInterval(gameLoop);
        gameLoop = setInterval(gameStep, speed);
    }

    function gameStep() {
        if (isPaused) return;

        // Actualizar dirección
        dx = nextDx;
        dy = nextDy;

        // Nueva cabeza
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Colisión con Paredes
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            gameOver("¡Te estrellaste contra la pared! 💥");
            return;
        }

        // Colisión Consigo Misma
        for (let i = 0; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                gameOver("¡Te mordiste la cola! 🐍💥");
                return;
            }
        }

        snake.unshift(head);

        // Comer Manzana
        if (head.x === food.x && head.y === food.y) {
            score += 10;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snake_high_score', highScore);
            }
            
            // Subir nivel cada 50 puntos y aumentar velocidad
            level = Math.floor(score / 50) + 1;
            speed = Math.max(60, 130 - (level - 1) * 12); 
            
            clearInterval(gameLoop);
            gameLoop = setInterval(gameStep, speed);

            updateScoreboard();
            generateFood();
        } else {
            snake.pop(); // Si no comió, se quita el último segmento
        }

        draw();
    }

    function generateFood() {
        let validPosition = false;
        while (!validPosition) {
            food.x = Math.floor(Math.random() * tileCount) * gridSize;
            food.y = Math.floor(Math.random() * tileCount) * gridSize;

            validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
        }
    }

    // ==========================================================================
    // RENDERIZADO VISUAL (CANVAS)
    // ==========================================================================

    function draw() {
        // Tablero en Cuadrícula
        for (let r = 0; r < tileCount; r++) {
            for (let c = 0; c < tileCount; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? '#1a2332' : '#141c2b';
                ctx.fillRect(c * gridSize, r * gridSize, gridSize, gridSize);
            }
        }

        // Dibujar Manzana con Brillo
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(
            food.x + gridSize / 2, 
            food.y + gridSize / 2, 
            gridSize / 2 - 2, 
            0, 
            Math.PI * 2
        );
        ctx.fill();
        ctx.shadowBlur = 0; 

        // Dibujar Culebra Dinámica
        snake.forEach((segment, index) => {
            if (index === 0) {
                ctx.fillStyle = '#10b981'; // Cabeza
                ctx.shadowColor = '#10b981';
                ctx.shadowBlur = 8;
            } else {
                ctx.fillStyle = '#059669'; // Cuerpo
                ctx.shadowBlur = 0;
            }

            ctx.fillRect(
                segment.x + 1, 
                segment.y + 1, 
                gridSize - 2, 
                gridSize - 2
            );

            // Ojos en la Cabeza
            if (index === 0) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(segment.x + 6, segment.y + 6, 2, 0, Math.PI * 2);
                ctx.arc(segment.x + 14, segment.y + 6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.shadowBlur = 0;
    }

    function updateScoreboard() {
        currentScoreEl.textContent = score;
        highScoreEl.textContent = highScore;
        currentLevelEl.textContent = level;
    }

    function togglePause() {
        if (!isPlaying) return;
        isPaused = !isPaused;
        if (isPaused) {
            btnPause.textContent = '▶ Continuar';
            overlayTitle.textContent = '⏸ Juego En Pausa';
            overlayMessage.textContent = 'Presiona Continuar para retomar tu partida.';
            overlay.classList.add('active');
        } else {
            btnPause.textContent = '⏸ Pausa';
            overlay.classList.remove('active');
        }
    }

    function gameOver(message) {
        isPlaying = false;
        clearInterval(gameLoop);
        btnPause.disabled = true;

        overlayTitle.textContent = '💀 ¡Game Over!';
        overlayMessage.textContent = `${message} Consiguiste ${score} puntos.`;
        btnStart.textContent = '🔄 Jugar de Nuevo';
        overlay.classList.add('active');
    }

    // ==========================================================================
    // MANEJO DE EVENTOS
    // ==========================================================================

    function changeDirection(newDx, newDy) {
        if (newDx === -dx && newDx !== 0) return;
        if (newDy === -dy && newDy !== 0) return;

        nextDx = newDx;
        nextDy = newDy;
    }

    // Teclado PC (Flechas y WASD)
    document.addEventListener('keydown', (e) => {
        if (!isPlaying || isPaused) return;

        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W':
                changeDirection(0, -gridSize);
                break;
            case 'ArrowDown': case 's': case 'S':
                changeDirection(0, gridSize);
                break;
            case 'ArrowLeft': case 'a': case 'A':
                changeDirection(-gridSize, 0);
                break;
            case 'ArrowRight': case 'd': case 'D':
                changeDirection(gridSize, 0);
                break;
        }
    });

    // Eventos de Botones
    btnStart.addEventListener('click', () => {
        if (isPaused) {
            togglePause();
        } else {
            startGame();
        }
    });

    btnRestart.addEventListener('click', () => {
        startGame();
    });

    btnPause.addEventListener('click', togglePause);

    // Controles Táctiles D-Pad
    btnUp.addEventListener('click', () => changeDirection(0, -gridSize));
    btnDown.addEventListener('click', () => changeDirection(0, gridSize));
    btnLeft.addEventListener('click', () => changeDirection(-gridSize, 0));
    btnRight.addEventListener('click', () => changeDirection(gridSize, 0));

    // Render Inicial
    initGame();
    draw();
});