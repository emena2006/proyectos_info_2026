// ============================================================
//  LABERINTO A CIEGAS - EL CAMINO DE BALDOSAS AMARILLAS
//  Created by Andrea 11-5 ✨
//  Inspirado en El Mago de Oz 🌈
// ============================================================

(function() {
    'use strict';
    
    console.log('✨ Created by Andrea 11-5 ✨');
    console.log('🎮 Laberinto a Ciegas - El Camino de Baldosas Amarillas');

    // ============ CONFIGURACIÓN ============
    var CONFIG = {
        levels: [
            { size: 7 },
            { size: 9 },
            { size: 11 },
            { size: 13 },
            { size: 15 }
        ],
        maxLives: 3,
        visionRadius: 3
    };

    // ============ ESTADO ============
    var state = {
        level: 0,
        lives: 3,
        character: 'otter',
        playerName: 'Aventurero',
        maze: [],
        playerX: 0,
        playerY: 0,
        exitX: 0,
        exitY: 0,
        gameOver: false,
        levelComplete: false,
        isMoving: false,
        gameStarted: false
    };

    // ============ PERSONAJES ============
    var CHARACTERS = {
        otter: '🦦',
        cat: '🐱',
        unicorn: '🦄'
    };

    // ============ DOM REFERENCIAS ============
    var menu = document.getElementById('menu');
    var game = document.getElementById('game');
    var startBtn = document.getElementById('startBtn');
    var menuBtn = document.getElementById('menuBtn');
    var playerNameInput = document.getElementById('playerName');
    var playerInfo = document.getElementById('playerInfo');
    var levelNum = document.getElementById('levelNum');
    var livesNum = document.getElementById('livesNum');
    var canvas = document.getElementById('mazeCanvas');
    var ctx = canvas.getContext('2d');
    var messageOverlay = document.getElementById('messageOverlay');
    var charBtns = document.querySelectorAll('.char-btn');

    // ============ VERIFICAR QUE TODO EXISTA ============
    if (!startBtn || !menuBtn) {
        console.error('❌ Error: Botones no encontrados');
        return;
    }

    // ============ FUNCIONES ============
    function setupCanvas() {
        var container = document.getElementById('canvas-container');
        if (!container) return false;
        var rect = container.getBoundingClientRect();
        var size = Math.floor(rect.width);
        if (size > 0) {
            canvas.width = size;
            canvas.height = size;
            return true;
        }
        return false;
    }

    function shuffle(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }

    function generateMaze(size) {
        var maze = [];
        for (var i = 0; i < size; i++) {
            maze[i] = [];
            for (var j = 0; j < size; j++) {
                maze[i][j] = 1;
            }
        }
        
        function carve(x, y) {
            maze[y][x] = 0;
            var dirs = shuffle([
                [0, -1], [0, 1], [-1, 0], [1, 0]
            ]);
            for (var i = 0; i < dirs.length; i++) {
                var dx = dirs[i][0];
                var dy = dirs[i][1];
                var nx = x + dx * 2;
                var ny = y + dy * 2;
                if (nx >= 0 && nx < size && ny >= 0 && ny < size && maze[ny][nx] === 1) {
                    maze[y + dy][x + dx] = 0;
                    carve(nx, ny);
                }
            }
        }
        
        carve(0, 0);
        maze[size-1][size-1] = 0;
        if (size > 2) maze[size-2][size-1] = 0;
        
        return maze;
    }

    function updateLives() {
        var hearts = '';
        for (var i = 0; i < CONFIG.maxLives; i++) {
            hearts += i < state.lives ? '❤️' : '🖤';
        }
        livesNum.textContent = hearts;
    }

    function showMessage(text) {
        messageOverlay.textContent = text;
        messageOverlay.style.display = 'flex';
    }

    function hideMessage() {
        messageOverlay.style.display = 'none';
    }

    function drawMaze() {
        var size = state.maze.length;
        if (size === 0 || canvas.width === 0 || canvas.height === 0) {
            return;
        }
        
        var cellSize = canvas.width / size;
        var radius = CONFIG.visionRadius;
        var px = state.playerX;
        var py = state.playerY;
        
        // Fondo completamente oscuro
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar SOLO el área visible alrededor del jugador
        for (var y = Math.max(0, py - radius); y < Math.min(size, py + radius + 1); y++) {
            for (var x = Math.max(0, px - radius); x < Math.min(size, px + radius + 1); x++) {
                var dist = Math.abs(x - px) + Math.abs(y - py);
                
                if (dist <= radius) {
                    var isWall = state.maze[y][x] === 1;
                    var isPlayer = (x === px && y === py);
                    var isExit = (x === state.exitX && y === state.exitY);
                    
                    var opacity = 1;
                    if (dist > 1) {
                        opacity = 1 - (dist - 1) / radius * 0.4;
                    }
                    
                    if (isWall) {
                        // PAREDES VERDES como en El Mago de Oz
                        var greenBrightness = Math.floor(80 + (1 - dist / radius) * 40);
                        ctx.fillStyle = 'rgba(' + 0 + ', ' + greenBrightness + ', ' + 0 + ', ' + opacity + ')';
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        
                        // Brillo en las paredes verdes
                        ctx.fillStyle = 'rgba(' + 50 + ', ' + (greenBrightness + 30) + ', ' + 50 + ', ' + (opacity * 0.3) + ')';
                        ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                    } else {
                        // CAMINO DE BALDOSAS AMARILLAS - Color amarillo brillante
                        var yellowBrightness = Math.floor(180 + (1 - dist / radius) * 75);
                        ctx.fillStyle = 'rgba(' + yellowBrightness + ', ' + (yellowBrightness - 20) + ', ' + 0 + ', ' + opacity + ')';
                        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        
                        // Patrón de baldosa para el camino
                        if ((x + y) % 2 === 0) {
                            ctx.fillStyle = 'rgba(' + (yellowBrightness + 30) + ', ' + (yellowBrightness + 10) + ', ' + 20 + ', ' + (opacity * 0.3) + ')';
                            ctx.fillRect(x * cellSize + 2, y * cellSize + 2, cellSize - 4, cellSize - 4);
                        }
                    }
                    
                    // Borde de celda
                    ctx.strokeStyle = 'rgba(42, 42, 42, ' + (opacity * 0.5) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    
                    // Dibujar salida (estrella dorada brillante)
                    if (isExit && !state.levelComplete && !state.gameOver) {
                        // Resplandor dorado
                        var glow = ctx.createRadialGradient(
                            x * cellSize + cellSize/2, y * cellSize + cellSize/2, 0,
                            x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize
                        );
                        glow.addColorStop(0, 'rgba(255, 215, 0, ' + (0.8 * opacity) + ')');
                        glow.addColorStop(0.5, 'rgba(255, 200, 0, ' + (0.4 * opacity) + ')');
                        glow.addColorStop(1, 'rgba(255, 180, 0, 0)');
                        ctx.fillStyle = glow;
                        ctx.beginPath();
                        ctx.arc(x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Estrella
                        ctx.fillStyle = 'rgba(255, 215, 0, ' + (0.9 * opacity) + ')';
                        ctx.font = (cellSize * 0.5) + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                        ctx.shadowBlur = 20;
                        ctx.fillText('⭐', x * cellSize + cellSize/2, y * cellSize + cellSize/2);
                        ctx.shadowBlur = 0;
                    }
                    
                    // Dibujar jugador
                    if (isPlayer && !state.gameOver) {
                        var char = CHARACTERS[state.character] || '🦦';
                        
                        // Luz alrededor del jugador (color dorado)
                        var playerGlow = ctx.createRadialGradient(
                            x * cellSize + cellSize/2, y * cellSize + cellSize/2, 0,
                            x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize * 2
                        );
                        playerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
                        playerGlow.addColorStop(0.5, 'rgba(255, 200, 0, 0.1)');
                        playerGlow.addColorStop(1, 'rgba(255, 180, 0, 0)');
                        ctx.fillStyle = playerGlow;
                        ctx.beginPath();
                        ctx.arc(x * cellSize + cellSize/2, y * cellSize + cellSize/2, cellSize * 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Personaje con resplandor
                        ctx.font = (cellSize * 0.7) + 'px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
                        ctx.shadowBlur = 30;
                        ctx.fillText(char, x * cellSize + cellSize/2, y * cellSize + cellSize/2);
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
        
        // Efecto de oscuridad alrededor (vignette dorada)
        var gradient = ctx.createRadialGradient(
            px * cellSize + cellSize/2, py * cellSize + cellSize/2, cellSize * radius * 0.4,
            px * cellSize + cellSize/2, py * cellSize + cellSize/2, cellSize * radius * 1.2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function hitWall() {
        if (state.gameOver) return;
        
        state.lives--;
        updateLives();
        
        if (state.lives <= 0) {
            state.gameOver = true;
            showMessage('💀 ¡Game Over! 💀');
            setTimeout(function() {
                returnToMenu();
            }, 3000);
        } else {
            state.playerX = 0;
            state.playerY = 0;
            showMessage('💥 ¡Cuidado con las paredes verdes!');
            setTimeout(function() {
                hideMessage();
                drawMaze();
            }, 500);
        }
    }

    function movePlayer(dx, dy) {
        if (!state.gameStarted || state.gameOver || state.levelComplete || state.isMoving) {
            return;
        }
        
        state.isMoving = true;
        
        var newX = state.playerX + dx;
        var newY = state.playerY + dy;
        var size = state.maze.length;
        
        if (newX < 0 || newX >= size || newY < 0 || newY >= size) {
            hitWall();
            state.isMoving = false;
            return;
        }
        
        if (state.maze[newY][newX] === 1) {
            hitWall();
            state.isMoving = false;
            return;
        }
        
        state.playerX = newX;
        state.playerY = newY;
        state.isMoving = false;
        
        if (newX === state.exitX && newY === state.exitY) {
            state.levelComplete = true;
            showMessage('🌟 ¡Nivel completado! ¡Sigue el camino amarillo! 🌟');
            setTimeout(function() {
                state.level++;
                loadLevel();
            }, 1500);
            drawMaze();
            return;
        }
        
        drawMaze();
    }

    function loadLevel() {
        console.log('📊 Cargando nivel:', state.level + 1);
        
        if (state.level >= CONFIG.levels.length) {
            showMessage('🎉 ¡Felicidades! Has llegado al final del camino amarillo! 🎉');
            setTimeout(function() {
                returnToMenu();
            }, 4000);
            return;
        }
        
        var size = CONFIG.levels[state.level].size;
        state.maze = generateMaze(size);
        state.playerX = 0;
        state.playerY = 0;
        state.exitX = size - 1;
        state.exitY = size - 1;
        state.levelComplete = false;
        state.gameOver = false;
        state.isMoving = false;
        
        levelNum.textContent = state.level + 1;
        updateLives();
        hideMessage();
        
        setupCanvas();
        drawMaze();
        
        console.log('✅ Nivel', state.level + 1, 'cargado - Sigue el camino amarillo!');
    }

    function startGame() {
        console.log('🎮 Iniciando partida...');
        
        state.playerName = playerNameInput.value.trim() || 'Aventurero';
        state.level = 0;
        state.lives = CONFIG.maxLives;
        state.gameOver = false;
        state.gameStarted = true;
        
        menu.style.display = 'none';
        game.style.display = 'block';
        
        playerInfo.textContent = '👤 ' + state.playerName + ' ' + CHARACTERS[state.character];
        
        setTimeout(function() {
            setupCanvas();
            loadLevel();
        }, 50);
    }

    function returnToMenu() {
        state.gameStarted = false;
        game.style.display = 'none';
        menu.style.display = 'block';
        hideMessage();
        state.gameOver = false;
        state.levelComplete = false;
        state.isMoving = false;
        console.log('🏠 Volviendo al menú');
    }

    // ============ CONFIGURAR EVENTOS ============
    function setupEvents() {
        console.log('🔧 Configurando eventos...');
        
        // Eventos de personajes
        for (var i = 0; i < charBtns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function(e) {
                    for (var j = 0; j < charBtns.length; j++) {
                        charBtns[j].classList.remove('active');
                    }
                    this.classList.add('active');
                    state.character = this.getAttribute('data-char');
                    console.log('Personaje seleccionado:', state.character);
                });
            })(charBtns[i]);
        }
        
        // Botón de inicio
        startBtn.addEventListener('click', function(e) {
            console.log('🎮 Click en JUGAR');
            startGame();
        });
        
        // Botón de menú
        menuBtn.addEventListener('click', function(e) {
            console.log('🏠 Click en Menú');
            returnToMenu();
        });
        
        // Teclado
        document.addEventListener('keydown', function(e) {
            var key = e.key;
            if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
                e.preventDefault();
                var moves = {
                    'ArrowUp': [0, -1],
                    'ArrowDown': [0, 1],
                    'ArrowLeft': [-1, 0],
                    'ArrowRight': [1, 0]
                };
                movePlayer(moves[key][0], moves[key][1]);
            }
        });
        
        // Controles táctiles
        var upBtn = document.getElementById('upBtn');
        var downBtn = document.getElementById('downBtn');
        var leftBtn = document.getElementById('leftBtn');
        var rightBtn = document.getElementById('rightBtn');
        
        if (upBtn) upBtn.addEventListener('click', function() { movePlayer(0, -1); });
        if (downBtn) downBtn.addEventListener('click', function() { movePlayer(0, 1); });
        if (leftBtn) leftBtn.addEventListener('click', function() { movePlayer(-1, 0); });
        if (rightBtn) rightBtn.addEventListener('click', function() { movePlayer(1, 0); });
        
        // Redimensionar
        window.addEventListener('resize', function() {
            if (state.gameStarted && state.maze.length > 0) {
                setupCanvas();
                drawMaze();
            }
        });
        
        console.log('✅ Eventos configurados correctamente');
    }

    // ============ INICIALIZAR ============
    console.log('🚀 Inicializando juego...');
    console.log('🌈 ¡Sigue el camino de baldosas amarillas!');
    console.log('🌿 Las paredes son verdes como en El Mago de Oz');
    setupEvents();
    console.log('✅ Juego listo! Haz clic en JUGAR');
    
})();