// ==========================================================================
// LÓGICA Y FUNCIONAMIENTO DEL JUEGO: SOPA DE LETRAS VETERINARIA
// Soporta marcado de líneas completas y mejor UX táctil (Drag & Tap)
// ==========================================================================

const WORDS_DATABASE = [
    "PERRO", "GATO", "VACUNA", "CLINICA", 
    "FAUNA", "CIRUGIA", "JARABE", "ADOPCION"
];

const GRID_SIZE = 10;
let grid = [];
let wordLocations = []; 
let foundWords = [];
let startCell = null;
let currentLineCells = [];
let isDragging = false;

// Variables del Estado del Juego
let score = 0;
let timer = null;
let timeLeft = 180;
let gameActive = false;

// Elementos del DOM
const boardElement = document.getElementById("word-search-board");
const wordListElement = document.getElementById("word-list");
const scoreDisplay = document.getElementById("score-display");
const timerDisplay = document.getElementById("timer-display");
const progressDisplay = document.getElementById("progress-display");

const btnStart = document.getElementById("btn-start");
const btnRestart = document.getElementById("btn-restart");
const modalResult = document.getElementById("modal-result");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const modalScore = document.getElementById("modal-score");
const btnModalRestart = document.getElementById("btn-modal-restart");

// Event Listeners
btnStart.addEventListener("click", startGame);
btnRestart.addEventListener("click", restartGame);
btnModalRestart.addEventListener("click", () => {
    modalResult.classList.add("hidden");
    restartGame();
});

btnRestart.disabled = true;

/**
 * Inicia el juego.
 */
function startGame() {
    if (gameActive) return;

    gameActive = true;
    score = 0;
    timeLeft = 180;
    foundWords = [];
    resetSelection();

    btnStart.disabled = true;
    btnRestart.disabled = false;

    updateUI();
    generateBoard();
    renderWordList();
    startTimer();
}

/**
 * Reinicia la partida.
 */
function restartGame() {
    clearInterval(timer);
    gameActive = false;
    btnStart.disabled = false;
    btnRestart.disabled = true;
    boardElement.innerHTML = '<p class="start-message">Presiona "Iniciar Juego" para comenzar.</p>';
    wordListElement.innerHTML = '';
    score = 0;
    timeLeft = 180;
    resetSelection();
    updateUI();
}

/**
 * Control del temporizador.
 */
function startTimer() {
    clearInterval(timer);
    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timer);
            endGame(false);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateUI() {
    scoreDisplay.textContent = `${score} pts`;
    progressDisplay.textContent = `${foundWords.length} / ${WORDS_DATABASE.length}`;
    updateTimerDisplay();
}

/**
 * Genera el tablero y registra listeners táctiles / de ratón para trazo continuo.
 */
function generateBoard() {
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(''));
    wordLocations = [];

    WORDS_DATABASE.forEach(word => {
        placeWordInGrid(word);
    });

    const alphabet = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
            }
        }
    }

    boardElement.innerHTML = '';
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement("div");
            cell.classList.add("grid-cell");
            cell.textContent = grid[r][c];
            cell.dataset.row = r;
            cell.dataset.col = c;
            boardElement.appendChild(cell);
        }
    }

    // Handlers para Interacción (Mouse y Touch)
    setupInteractionEvents();
}

function setupInteractionEvents() {
    // Eventos Mouse
    boardElement.addEventListener("mousedown", handleStart);
    boardElement.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    // Eventos Touch (Móvil)
    boardElement.addEventListener("touchstart", handleStart, { passive: false });
    boardElement.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
}

function getCellFromEvent(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const target = document.elementFromPoint(clientX, clientY);
    if (target && target.classList.contains("grid-cell")) {
        return {
            row: parseInt(target.dataset.row),
            col: parseInt(target.dataset.col),
            element: target
        };
    }
    return null;
}

function handleStart(e) {
    if (!gameActive) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (e.type === 'touchstart') e.preventDefault();

    // Si ya hay una celda inicial y se toca otra celda (Modo Tap-Tap)
    if (startCell && (startCell.row !== cell.row || startCell.col !== cell.col)) {
        updateLineSelection(startCell, cell);
        validateSelection();
        return;
    }

    isDragging = true;
    startCell = cell;
    updateLineSelection(startCell, cell);
}

function handleMove(e) {
    if (!gameActive || !isDragging || !startCell) return;
    if (e.type === 'touchmove') e.preventDefault();

    const cell = getCellFromEvent(e);
    if (cell) {
        updateLineSelection(startCell, cell);
    }
}

function handleEnd(e) {
    if (!gameActive || !isDragging) return;
    isDragging = false;
    validateSelection();
}

/**
 * Calcula la línea recta (horizontal, vertical o diagonal) entre inicio y fin, y marca las celdas intermedias.
 */
function updateLineSelection(start, end) {
    // Limpiar selección previa
    clearCurrentSelection();

    const dr = end.row - start.row;
    const dc = end.col - start.col;

    // Verificar si es horizontal, vertical o diagonal perfecta (45°)
    const isHorizontal = dr === 0;
    const isVertical = dc === 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc);

    if (!isHorizontal && !isVertical && !isDiagonal) {
        // Si no es una línea válida, solo marcar la celda inicial
        currentLineCells = [start];
    } else {
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
        const steps = Math.max(Math.abs(dr), Math.abs(dc));

        currentLineCells = [];
        for (let i = 0; i <= steps; i++) {
            const r = start.row + i * stepR;
            const c = start.col + i * stepC;
            const elem = boardElement.querySelector(`[data-row="${r}"][data-col="${c}"]`);
            if (elem) {
                currentLineCells.push({ row: r, col: c, element: elem });
            }
        }
    }

    // Aplicar clase .selected
    currentLineCells.forEach(c => c.element.classList.add("selected"));
}

function clearCurrentSelection() {
    currentLineCells.forEach(c => c.element.classList.remove("selected"));
    currentLineCells = [];
}

function resetSelection() {
    clearCurrentSelection();
    startCell = null;
    isDragging = false;
}

/**
 * Valida si la línea seleccionada corresponde a una palabra.
 */
function validateSelection() {
    if (currentLineCells.length < 2) {
        return;
    }

    let wordMatched = null;

    for (const item of wordLocations) {
        if (foundWords.includes(item.word)) continue;

        if (checkMatch(item.cells, currentLineCells)) {
            wordMatched = item.word;
            break;
        }
    }

    if (wordMatched) {
        // ¡Palabra Encontrada!
        foundWords.push(wordMatched);
        score += 100;

        currentLineCells.forEach(c => {
            c.element.classList.remove("selected");
            c.element.classList.add("found");
        });

        const listElem = document.getElementById(`word-${wordMatched}`);
        if (listElem) listElem.classList.add("completed");

        resetSelection();
        updateUI();

        if (foundWords.length === WORDS_DATABASE.length) {
            endGame(true);
        }
    } else {
        // Selección incorrecta: Desmarcar
        resetSelection();
    }
}

function checkMatch(wordCells, selected) {
    if (wordCells.length !== selected.length) return false;

    const matchForward = wordCells.every((wc, idx) => 
        wc.row === selected[idx].row && wc.col === selected[idx].col
    );

    const matchReverse = wordCells.every((wc, idx) => {
        const revIdx = selected.length - 1 - idx;
        return wc.row === selected[revIdx].row && wc.col === selected[revIdx].col;
    });

    return matchForward || matchReverse;
}

function placeWordInGrid(word) {
    const directions = [
        [0, 1],   // Horizontal
        [1, 0],   // Vertical
        [1, 1],   // Diagonal Abajo-Derecha
        [-1, 1]   // Diagonal Arriba-Derecha
    ];

    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
        attempts++;
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const startRow = Math.floor(Math.random() * GRID_SIZE);
        const startCol = Math.floor(Math.random() * GRID_SIZE);

        if (canPlaceWord(word, startRow, startCol, dir)) {
            let cells = [];
            for (let i = 0; i < word.length; i++) {
                const r = startRow + i * dir[0];
                const c = startCol + i * dir[1];
                grid[r][c] = word[i];
                cells.push({ row: r, col: c });
            }
            wordLocations.push({ word, cells });
            placed = true;
        }
    }
}

function canPlaceWord(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
        const r = row + i * dir[0];
        const c = col + i * dir[1];

        if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) return false;
        if (grid[r][c] !== '' && grid[r][c] !== word[i]) return false;
    }
    return true;
}

function renderWordList() {
    wordListElement.innerHTML = '';
    WORDS_DATABASE.forEach(word => {
        const li = document.createElement("li");
        li.classList.add("word-item");
        li.id = `word-${word}`;
        li.textContent = word;
        wordListElement.appendChild(li);
    });
}

function endGame(isWin) {
    clearInterval(timer);
    gameActive = false;

    if (isWin) {
        const timeBonus = timeLeft * 2;
        score += timeBonus;
        modalTitle.textContent = "🎉 ¡Felicidades! ¡Ganaste!";
        modalMessage.textContent = "Has encontrado todas las palabras sobre veterinaria y animales.";
    } else {
        modalTitle.textContent = "⏰ ¡Tiempo Agotado!";
        modalMessage.textContent = "Se agotó el tiempo. ¡Inténtalo de nuevo!";
    }

    modalScore.textContent = `Puntaje Final: ${score} pts`;
    modalResult.classList.remove("hidden");
}