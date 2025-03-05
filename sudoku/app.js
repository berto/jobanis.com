/**
 * Sudoku Game Application
 * Client-side only version for GitHub Pages hosting
 */

// Game state
/** @type {SudokuGrid} */
let grid = [];
/** @type {number[][]} */
let solution = [];
/** @type {number|null} */
let selectedRow = null;
/** @type {number|null} */
let selectedCol = null;
/** @type {number} */
let startTime = Date.now();
/** @type {number} */
let elapsedTime = 0;
/** @type {boolean} */
let isPaused = false;
/** @type {boolean} */
let isComplete = false;
/** @type {boolean} */
let showSeconds = false;
/** @type {GameSettings} */
let gameSettings = {
  gridSize: 9,
  difficulty: 'easy',
  highlightSettings: {
    highlightRowColumn: true,
    highlightBox: true,
    highlightSameNumbers: true
  }
};

// DOM References
const gridContainer = document.getElementById('sudoku-grid');
const numberPad = document.getElementById('number-pad');
const timer = document.getElementById('timer');
const difficultyDisplay = document.getElementById('difficulty-display');
const settingsModal = document.getElementById('settings-modal');
const hintModal = document.getElementById('hint-modal');
const completionModal = document.getElementById('completion-modal');
const incorrectModal = document.getElementById('incorrect-modal');
const hintContent = document.getElementById('hint-content');

// Background circles
/** @type {{x: number, y: number, size: number, color: string}[]} */
const backgroundCircles = [];

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
  // Set up event listeners
  document.getElementById('settings-btn').addEventListener('click', openSettings);
  document.getElementById('close-settings').addEventListener('click', closeSettings);
  document.getElementById('apply-settings').addEventListener('click', applySettings);
  document.getElementById('new-game-btn').addEventListener('click', startNewGame);
  document.getElementById('show-hint').addEventListener('click', showHint);
  document.getElementById('close-hint').addEventListener('click', closeHint);
  document.getElementById('apply-hint').addEventListener('click', applyHint);
  document.getElementById('close-completion').addEventListener('click', closeCompletionModal);
  document.getElementById('new-game-incorrect').addEventListener('click', startNewGame);
  document.getElementById('keep-trying').addEventListener('click', closeIncorrectModal);
  timer.addEventListener('click', toggleSecondsDisplay);
  
  // Settings inputs
  document.getElementById('grid-size-4').addEventListener('click', () => selectGridSize(4));
  document.getElementById('grid-size-9').addEventListener('click', () => selectGridSize(9));
  document.getElementById('difficulty-easy').addEventListener('click', () => selectDifficulty('easy'));
  document.getElementById('difficulty-medium').addEventListener('click', () => selectDifficulty('medium'));
  document.getElementById('difficulty-hard').addEventListener('click', () => selectDifficulty('hard'));
  
  document.getElementById('highlight-row-column').addEventListener('change', updateHighlightSettings);
  document.getElementById('highlight-box').addEventListener('change', updateHighlightSettings);
  document.getElementById('highlight-same-numbers').addEventListener('change', updateHighlightSettings);
  
  // Keyboard events - add to both document and sudoku grid for better compatibility
  document.addEventListener('keydown', handleKeyPress);
  gridContainer.addEventListener('keydown', handleKeyPress);
  
  // Focus trap for keyboard navigation
  document.addEventListener('click', function(event) {
    // When clicking anywhere, focus back on the document to keep keyboard navigation working
    if (event.target.closest('#sudoku-grid')) {
      document.body.focus();
    }
  });
  
  // Create background circles
  createBackgroundCircles();
  
  // Start the game
  startNewGame();
  
  // Start timer
  setInterval(updateTimer, 1000);
});

/**
 * Starts a new Sudoku game
 */
function startNewGame() {
  // Generate new game
  const sudoku = generateSudoku(gameSettings.gridSize, gameSettings.difficulty);
  grid = sudoku.grid;
  solution = sudoku.solution;
  
  // Reset game state
  selectedRow = null;
  selectedCol = null;
  startTime = Date.now();
  elapsedTime = 0;
  isPaused = false;
  isComplete = false;
  
  // Update UI
  renderGrid();
  renderNumberPad();
  difficultyDisplay.textContent = capitalizeFirstLetter(gameSettings.difficulty);
  
  // Immediately update timer to show 00:00 or 00m
  updateTimer();
  
  // Close any open modals
  closeSettings();
  closeHint();
  closeCompletionModal();
  closeIncorrectModal();
}

/**
 * Renders the Sudoku grid
 */
function renderGrid() {
  gridContainer.innerHTML = '';
  gridContainer.className = `grid grid-cols-${gameSettings.gridSize} gap-0 relative overflow-hidden`;
  
  // Get highlighted cells based on selected cell
  const highlights = selectedRow !== null && selectedCol !== null
    ? getHighlightedCells({
        row: selectedRow,
        col: selectedCol,
        grid,
        size: gameSettings.gridSize,
        highlightSettings: gameSettings.highlightSettings
      })
    : Array(gameSettings.gridSize).fill().map(() => Array(gameSettings.gridSize).fill(''));
  
  const boxSize = gameSettings.gridSize === 9 ? 3 : 2;
  
  for (let row = 0; row < gameSettings.gridSize; row++) {
    for (let col = 0; col < gameSettings.gridSize; col++) {
      const cell = document.createElement('div');
      cell.className = 'sudoku-cell';
      
      // Add borders for box separation
      if ((col + 1) % boxSize === 0 && col < gameSettings.gridSize - 1) {
        cell.classList.add('box-border-right');
      }
      if ((row + 1) % boxSize === 0 && row < gameSettings.gridSize - 1) {
        cell.classList.add('box-border-bottom');
      }
      
      // Add value or notes
      const cellData = grid[row][col];
      if (cellData.value !== null) {
        cell.textContent = cellData.value;
        if (cellData.isGiven) {
          cell.classList.add('given');
        }
      } else if (cellData.notes.length > 0) {
        const notesContainer = document.createElement('div');
        notesContainer.className = 'cell-notes';
        
        // Create grid of notes
        for (let i = 1; i <= gameSettings.gridSize; i++) {
          const note = document.createElement('div');
          note.className = 'note';
          if (cellData.notes.includes(i)) {
            note.textContent = i;
          }
          notesContainer.appendChild(note);
        }
        
        cell.appendChild(notesContainer);
      }
      
      // Add highlighting
      if (row === selectedRow && col === selectedCol) {
        cell.classList.add('selected');
      } else if (highlights[row][col]) {
        highlights[row][col].split(' ').filter(c => c).forEach(className => {
          cell.classList.add(className);
        });
      }
      
      // Add click event - make ALL cells selectable, including given cells
      cell.addEventListener('click', () => selectCell(row, col));
      
      // Make sure the cell is navigable with keyboard (tab navigation)
      cell.setAttribute('tabindex', '0');
      
      // Add keyboard event directly to cell for extra accessibility
      cell.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          // Select this cell when Enter or Space is pressed
          selectCell(row, col);
          event.preventDefault();
        }
      });
      
      gridContainer.appendChild(cell);
    }
  }
}

/**
 * Renders the number pad
 */
function renderNumberPad() {
  numberPad.innerHTML = '';
  
  // Create buttons for each number
  for (let i = 1; i <= gameSettings.gridSize; i++) {
    const button = document.createElement('button');
    button.className = 'number-button';
    button.textContent = i;
    button.addEventListener('click', () => enterNumber(i));
    numberPad.appendChild(button);
  }
  
  // Add delete button
  const deleteButton = document.createElement('button');
  deleteButton.className = 'number-button delete';
  deleteButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
      <line x1="18" y1="9" x2="12" y2="15"></line>
      <line x1="12" y1="9" x2="18" y2="15"></line>
    </svg>
  `;
  deleteButton.addEventListener('click', eraseCell);
  numberPad.appendChild(deleteButton);
}

/**
 * Select a cell in the grid
 * 
 * @param {number} row - Row index
 * @param {number} col - Column index
 */
function selectCell(row, col) {
  selectedRow = row;
  selectedCol = col;
  renderGrid();
}

/**
 * Enter a number in the selected cell
 * 
 * @param {number} number - The number to enter
 */
function enterNumber(number) {
  if (selectedRow === null || selectedCol === null || isComplete) {
    return;
  }
  
  const cell = grid[selectedRow][selectedCol];
  
  // Don't modify given cells - this is the important change for keyboard navigation
  if (cell.isGiven) {
    // For given cells, just move to the next cell in the direction of entry
    // Try to find a non-given cell in the next row or column
    let newRow = selectedRow;
    let newCol = selectedCol + 1; // Move right by default
    
    if (newCol >= gameSettings.gridSize) {
      newCol = 0;
      newRow++;
      if (newRow >= gameSettings.gridSize) {
        newRow = 0; // Wrap around to the beginning
      }
    }
    
    selectCell(newRow, newCol);
    return;
  }
  
  // Toggle notes mode with right click (handled in event listener)
  const notesMode = false;
  
  if (notesMode) {
    // Toggle note
    const noteIndex = cell.notes.indexOf(number);
    if (noteIndex === -1) {
      cell.notes.push(number);
      cell.notes.sort((a, b) => a - b);
    } else {
      cell.notes.splice(noteIndex, 1);
    }
    cell.value = null;
  } else {
    // Set value directly
    cell.value = number;
    cell.notes = [];
    
    // Check if the puzzle is complete
    if (isGridFilled(grid)) {
      if (isSudokuComplete(grid, gameSettings.gridSize)) {
        isComplete = true;
        showCompletionModal();
      } else {
        showIncorrectModal();
      }
    }
  }
  
  renderGrid();
}

/**
 * Erase the value or notes in the selected cell
 */
function eraseCell() {
  if (selectedRow === null || selectedCol === null || isComplete) {
    return;
  }
  
  const cell = grid[selectedRow][selectedCol];
  
  // Don't modify given cells - but move to next cell
  if (cell.isGiven) {
    // For given cells, just move to the next cell in the direction of entry
    let newRow = selectedRow;
    let newCol = selectedCol + 1; // Move right by default
    
    if (newCol >= gameSettings.gridSize) {
      newCol = 0;
      newRow++;
      if (newRow >= gameSettings.gridSize) {
        newRow = 0; // Wrap around to the beginning
      }
    }
    
    selectCell(newRow, newCol);
    return;
  }
  
  cell.value = null;
  cell.notes = [];
  
  renderGrid();
}

/**
 * Handle keyboard input
 * 
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyPress(event) {
  // Don't handle keys if modals are open
  if (settingsModal.style.display === 'flex' ||
      hintModal.style.display === 'flex' ||
      completionModal.style.display === 'flex' ||
      incorrectModal.style.display === 'flex') {
    return;
  }
  
  // Keyboard shortcut for auto-solving: Alt+S or Ctrl+S
  if ((event.altKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    console.log('Solve shortcut (Alt+S or Ctrl+S) detected!');
    event.preventDefault(); // Prevent saving the page with Ctrl+S
    solvePuzzle();
    return;
  }
  
  // Arrow keys for navigation
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
      event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    
    if (selectedRow === null || selectedCol === null) {
      selectCell(0, 0);
      return;
    }
    
    let newRow = selectedRow;
    let newCol = selectedCol;
    
    switch (event.key) {
      case 'ArrowUp':
        newRow = Math.max(0, selectedRow - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(gameSettings.gridSize - 1, selectedRow + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, selectedCol - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(gameSettings.gridSize - 1, selectedCol + 1);
        break;
    }
    
    // Allow selection of any cell, including given cells
    selectCell(newRow, newCol);
    return;
  }
  
  // Number keys for input
  if (/^[1-9]$/.test(event.key) && parseInt(event.key) <= gameSettings.gridSize) {
    enterNumber(parseInt(event.key));
    return;
  }
  
  // Backspace or Delete to erase
  if (event.key === 'Backspace' || event.key === 'Delete') {
    eraseCell();
    return;
  }
}

/**
 * Update the timer display
 */
function updateTimer() {
  // When game is complete, we still want to display the final time
  // but we don't want to keep updating the elapsed time
  if (isPaused && !isComplete) {
    return;
  }
  
  // Only update elapsed time if the game is still active
  if (!isComplete) {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  }
  
  // Update timer display
  timer.textContent = formatTime(elapsedTime, showSeconds);
}

/**
 * Toggle between showing minutes:seconds and minutes only
 */
function toggleSecondsDisplay() {
  showSeconds = !showSeconds;
  updateTimer();
}

/**
 * Format time as MM:SS or MM
 * 
 * @param {number} seconds - Time in seconds
 * @param {boolean} showSeconds - Whether to include seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds, showSeconds = false) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (showSeconds) {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}m`;
  }
}

/**
 * Create decorative background circles
 */
function createBackgroundCircles() {
  const numCircles = 15; // Increased from 5 to 15 for more vibrant look
  
  for (let i = 0; i < numCircles; i++) {
    const circle = {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 300 + 100,
      color: generateRandomPastelColor()
    };
    
    backgroundCircles.push(circle);
    
    const circleElement = document.createElement('div');
    circleElement.className = 'background-circle';
    circleElement.style.width = `${circle.size}px`;
    circleElement.style.height = `${circle.size}px`;
    circleElement.style.left = `${circle.x}px`;
    circleElement.style.top = `${circle.y}px`;
    circleElement.style.backgroundColor = circle.color;
    
    document.body.appendChild(circleElement);
  }
}

/**
 * Generate a random pastel color
 * 
 * @returns {string} CSS color string
 */
function generateRandomPastelColor() {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 80%, 0.3)`;
}

/**
 * Open the settings modal
 */
function openSettings() {
  settingsModal.style.display = 'flex';
  isPaused = true;
  
  // Update settings UI to match current settings
  document.getElementById('grid-size-4').className = 
    gameSettings.gridSize === 4 ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  document.getElementById('grid-size-9').className = 
    gameSettings.gridSize === 9 ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  
  document.getElementById('difficulty-easy').className = 
    gameSettings.difficulty === 'easy' ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  document.getElementById('difficulty-medium').className = 
    gameSettings.difficulty === 'medium' ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  document.getElementById('difficulty-hard').className = 
    gameSettings.difficulty === 'hard' ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  
  document.getElementById('highlight-row-column').checked = gameSettings.highlightSettings.highlightRowColumn;
  document.getElementById('highlight-box').checked = gameSettings.highlightSettings.highlightBox;
  document.getElementById('highlight-same-numbers').checked = gameSettings.highlightSettings.highlightSameNumbers;
}

/**
 * Close the settings modal
 */
function closeSettings() {
  settingsModal.style.display = 'none';
  isPaused = false;
}

/**
 * Apply the selected settings and start a new game
 */
function applySettings() {
  closeSettings();
  startNewGame();
}

/**
 * Select grid size in settings
 * 
 * @param {4|9} size - Grid size
 */
function selectGridSize(size) {
  gameSettings.gridSize = size;
  
  document.getElementById('grid-size-4').className = 
    size === 4 ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  document.getElementById('grid-size-9').className = 
    size === 9 ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
}

/**
 * Select difficulty in settings
 * 
 * @param {'easy'|'medium'|'hard'} difficulty - Difficulty level
 */
function selectDifficulty(difficulty) {
  gameSettings.difficulty = difficulty;
  
  document.getElementById('difficulty-easy').className = 
    difficulty === 'easy' ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  document.getElementById('difficulty-medium').className = 
    difficulty === 'medium' ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
  document.getElementById('difficulty-hard').className = 
    difficulty === 'hard' ? 'border border-indigo-500 bg-indigo-50 text-indigo-700 font-medium rounded-md py-2' : 'border border-gray-300 rounded-md py-2';
}

/**
 * Update highlight settings
 */
function updateHighlightSettings() {
  gameSettings.highlightSettings = {
    highlightRowColumn: document.getElementById('highlight-row-column').checked,
    highlightBox: document.getElementById('highlight-box').checked,
    highlightSameNumbers: document.getElementById('highlight-same-numbers').checked
  };
  
  // Refresh grid to show updated highlighting
  renderGrid();
}

/**
 * Show a hint to help the player
 */
function showHint() {
  const hint = findHint(grid, solution, gameSettings.gridSize);
  
  if (hint) {
    hintContent.innerHTML = `
      <p class="mb-2">Try placing <strong>${hint.value}</strong> in row ${hint.row + 1}, column ${hint.col + 1}.</p>
      <p>${hint.reason}</p>
    `;
    
    hintModal.style.display = 'flex';
    
    // Remember the hint for later application
    hintModal.dataset.row = hint.row;
    hintModal.dataset.col = hint.col;
    hintModal.dataset.value = hint.value;
  }
}

/**
 * Close the hint modal
 */
function closeHint() {
  hintModal.style.display = 'none';
}

/**
 * Apply the suggested hint
 */
function applyHint() {
  const row = parseInt(hintModal.dataset.row);
  const col = parseInt(hintModal.dataset.col);
  const value = parseInt(hintModal.dataset.value);
  
  // Update the grid
  grid[row][col].value = value;
  grid[row][col].notes = [];
  
  // Select the cell
  selectedRow = row;
  selectedCol = col;
  
  // Close the modal
  closeHint();
  
  // Check if the puzzle is complete
  if (isGridFilled(grid)) {
    if (isSudokuComplete(grid, gameSettings.gridSize)) {
      isComplete = true;
      showCompletionModal();
    } else {
      showIncorrectModal();
    }
  }
  
  // Render the updated grid
  renderGrid();
}

/**
 * Show the completion modal when the puzzle is solved
 */
function showCompletionModal() {
  completionModal.style.display = 'flex';
  
  // Stop the timer by marking the game as complete
  isComplete = true;
  
  // Always display seconds in the timer when completed
  showSeconds = true;
  updateTimer();
  
  // Show confetti animation
  createConfetti();
  
  // Update completion message
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  document.getElementById('completion-message').textContent = 
    `You've completed the ${gameSettings.difficulty} ${gameSettings.gridSize}×${gameSettings.gridSize} puzzle in ${minutes}m ${seconds}s!`;
  
  // Force the timer to display seconds
  timer.textContent = formatTime(elapsedTime, true);
}

/**
 * Close the completion modal
 */
function closeCompletionModal() {
  completionModal.style.display = 'none';
}

/**
 * Show the incorrect solution modal
 */
function showIncorrectModal() {
  incorrectModal.style.display = 'flex';
}

/**
 * Close the incorrect solution modal
 */
function closeIncorrectModal() {
  incorrectModal.style.display = 'none';
}

/**
 * Create confetti animation for puzzle completion
 */
function createConfetti() {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '100';
  document.body.appendChild(container);
  
  const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];
  
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = `${Math.random() * 20}%`;
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = `${Math.random() * 2 + 1}s`;
      
      container.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }, i * 20);
  }
  
  // Remove container after all confetti are gone
  setTimeout(() => {
    container.remove();
  }, 5000);
}

/**
 * Automatically solves the puzzle by filling in all cells with correct values
 */
function solvePuzzle() {
  // Only solve if the game is not already complete
  if (isComplete) {
    return;
  }
  
  // Show a brief notification
  const notification = document.createElement('div');
  notification.textContent = '🧩 Solving puzzle...';
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = 'rgba(99, 102, 241, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '4px';
  notification.style.zIndex = '1000';
  document.body.appendChild(notification);
  
  // Animate filling in the solution
  let cellsToFill = [];
  
  // Collect all non-given cells that need to be filled
  for (let row = 0; row < gameSettings.gridSize; row++) {
    for (let col = 0; col < gameSettings.gridSize; col++) {
      if (!grid[row][col].isGiven && grid[row][col].value !== solution[row][col]) {
        cellsToFill.push({ row, col, value: solution[row][col] });
      }
    }
  }
  
  // Shuffle the cells for a more natural filling animation
  cellsToFill.sort(() => Math.random() - 0.5);
  
  // Fill cells with a slight delay between each
  const fillDelay = Math.min(50, 1000 / cellsToFill.length); // Adjust timing based on cell count
  
  cellsToFill.forEach((cell, index) => {
    setTimeout(() => {
      grid[cell.row][cell.col].value = cell.value;
      grid[cell.row][cell.col].notes = [];
      
      // Update the grid visually
      renderGrid();
      
      // Check if this was the last cell to fill
      if (index === cellsToFill.length - 1) {
        // Remove the notification
        notification.remove();
        
        // Check if the puzzle is now complete
        if (isSudokuComplete(grid, gameSettings.gridSize)) {
          isComplete = true;
          showCompletionModal();
        }
      }
    }, index * fillDelay);
  });
  
  // If there are no cells to fill, remove the notification immediately
  if (cellsToFill.length === 0) {
    notification.remove();
  }
}

/**
 * Helper function to capitalize the first letter of a string
 * 
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}