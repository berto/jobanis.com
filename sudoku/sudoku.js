/**
 * Sudoku game logic
 */

// Type definitions
/**
 * @typedef {Object} SudokuCell
 * @property {number|null} value - The value of the cell (1-9 or null if empty)
 * @property {boolean} isGiven - Whether this cell was part of the initial puzzle
 * @property {number[]} notes - Array of pencil marks/notes added by the player
 */

/**
 * @typedef {SudokuCell[][]} SudokuGrid
 */

/**
 * @typedef {'easy' | 'medium' | 'hard'} Difficulty
 */

/**
 * @typedef {4 | 9} GridSize
 */

/**
 * @typedef {Object} HighlightSettings
 * @property {boolean} highlightRowColumn - Whether to highlight the current row and column
 * @property {boolean} highlightBox - Whether to highlight the current box/region
 * @property {boolean} highlightSameNumbers - Whether to highlight cells with the same number
 */

/**
 * @typedef {Object} GameSettings
 * @property {GridSize} gridSize - The size of the grid (4x4 or 9x9)
 * @property {Difficulty} difficulty - The difficulty level of the puzzle
 * @property {HighlightSettings} highlightSettings - Settings for cell highlighting
 */

/**
 * Creates an empty Sudoku grid
 * 
 * @param {GridSize} size - The size of the grid (4 or 9)
 * @returns {SudokuGrid} An empty Sudoku grid
 */
function createEmptyGrid(size) {
  const grid = [];
  for (let row = 0; row < size; row++) {
    const currentRow = [];
    for (let col = 0; col < size; col++) {
      currentRow.push({
        value: null,
        isGiven: false,
        notes: []
      });
    }
    grid.push(currentRow);
  }
  return grid;
}

/**
 * Checks if a value is valid in a specific cell
 * 
 * @param {SudokuGrid} grid - The current state of the Sudoku grid
 * @param {number} row - The row index
 * @param {number} col - The column index
 * @param {number} value - The value to check
 * @param {GridSize} size - The size of the grid
 * @returns {boolean} True if the value is valid in the given position
 */
function isValidValue(grid, row, col, value, size) {
  // Check row
  for (let c = 0; c < size; c++) {
    if (c !== col && grid[row][c].value === value) {
      return false;
    }
  }
  
  // Check column
  for (let r = 0; r < size; r++) {
    if (r !== row && grid[r][col].value === value) {
      return false;
    }
  }
  
  // Check box
  const boxSize = size === 9 ? 3 : 2;
  const boxStartRow = Math.floor(row / boxSize) * boxSize;
  const boxStartCol = Math.floor(col / boxSize) * boxSize;
  
  for (let r = boxStartRow; r < boxStartRow + boxSize; r++) {
    for (let c = boxStartCol; c < boxStartCol + boxSize; c++) {
      if (r !== row || c !== col) {
        if (grid[r][c].value === value) {
          return false;
        }
      }
    }
  }
  
  return true;
}

/**
 * Generates a solved Sudoku grid
 * 
 * @param {GridSize} size - The size of the grid
 * @returns {number[][]} A completely filled valid Sudoku grid
 */
function generateSolution(size) {
  const solution = Array(size).fill().map(() => Array(size).fill(0));
  const boxSize = size === 9 ? 3 : 2;
  
  // Helper function to solve the grid using backtracking
  function solve(row, col) {
    if (row === size) {
      return true; // We've filled the entire grid
    }
    
    // Move to the next cell
    if (col === size) {
      return solve(row + 1, 0);
    }
    
    // Create a shuffled array of possible values
    const values = Array.from({length: size}, (_, i) => i + 1);
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    
    // Try each value
    for (const value of values) {
      // Check if this value works in this position
      let isValid = true;
      
      // Check row
      for (let c = 0; c < col; c++) {
        if (solution[row][c] === value) {
          isValid = false;
          break;
        }
      }
      
      if (!isValid) continue;
      
      // Check column
      for (let r = 0; r < row; r++) {
        if (solution[r][col] === value) {
          isValid = false;
          break;
        }
      }
      
      if (!isValid) continue;
      
      // Check box
      const boxStartRow = Math.floor(row / boxSize) * boxSize;
      const boxStartCol = Math.floor(col / boxSize) * boxSize;
      
      for (let r = boxStartRow; r < row; r++) {
        for (let c = boxStartCol; c < boxSize + boxStartCol; c++) {
          if (c < size && solution[r][c] === value) {
            isValid = false;
            break;
          }
        }
        if (!isValid) break;
      }
      
      if (!isValid) continue;
      
      // This value works, place it and move on
      solution[row][col] = value;
      
      if (solve(row, col + 1)) {
        return true;
      }
      
      // If we get here, we need to backtrack
      solution[row][col] = 0;
    }
    
    return false; // No solution found
  }
  
  solve(0, 0);
  return solution;
}

/**
 * Create a puzzle by removing numbers from a complete solution
 * 
 * @param {number[][]} solution - A completely filled valid Sudoku solution
 * @param {Difficulty} difficulty - The difficulty level
 * @param {GridSize} size - The size of the grid
 * @returns {SudokuGrid} A Sudoku puzzle with some cells removed
 */
function createPuzzle(solution, difficulty, size) {
  const grid = createEmptyGrid(size);
  
  // Fill grid with the solution
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      grid[row][col] = {
        value: solution[row][col],
        isGiven: true,
        notes: []
      };
    }
  }
  
  // Determine how many cells to remove based on difficulty and grid size
  let cellsToRemove;
  
  if (size === 4) {
    switch (difficulty) {
      case 'easy':
        cellsToRemove = 5; // Remove ~31% of cells
        break;
      case 'medium':
        cellsToRemove = 8; // Remove ~50% of cells
        break;
      case 'hard':
        cellsToRemove = 11; // Remove ~69% of cells
        break;
      default:
        cellsToRemove = 5;
    }
  } else { // 9x9 grid
    switch (difficulty) {
      case 'easy':
        cellsToRemove = 35; // Remove ~43% of cells
        break;
      case 'medium':
        cellsToRemove = 45; // Remove ~56% of cells
        break;
      case 'hard':
        cellsToRemove = 55; // Remove ~68% of cells
        break;
      default:
        cellsToRemove = 35;
    }
  }
  
  // Create a list of all cells
  const cells = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({ row, col });
    }
  }
  
  // Shuffle the cells to remove
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  
  // Use the total number of cells to calculate how many to keep
  const totalCells = size * size;
  const cellsToKeep = totalCells - cellsToRemove;
  
  // Remove cells
  for (let i = cellsToKeep; i < cells.length; i++) {
    const { row, col } = cells[i];
    grid[row][col].value = null;
    grid[row][col].isGiven = false;
  }
  
  return grid;
}

/**
 * Generate a complete Sudoku game with puzzle and solution
 * 
 * @param {GridSize} size - The size of the grid
 * @param {Difficulty} difficulty - The difficulty level
 * @returns {{grid: SudokuGrid, solution: number[][]}} The puzzle and its solution
 */
function generateSudoku(size, difficulty) {
  const solution = generateSolution(size);
  const grid = createPuzzle(solution, difficulty, size);
  return { grid, solution };
}

/**
 * Checks if the Sudoku grid is correctly solved
 * 
 * @param {SudokuGrid} grid - The current state of the Sudoku grid
 * @param {GridSize} size - The size of the grid
 * @returns {boolean} True if the grid is completely and correctly filled
 */
function isSudokuComplete(grid, size) {
  // Check if grid is filled completely
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col].value === null) {
        return false;
      }
    }
  }
  
  // Check all rows
  for (let row = 0; row < size; row++) {
    const values = new Set();
    for (let col = 0; col < size; col++) {
      values.add(grid[row][col].value);
    }
    if (values.size !== size) {
      return false;
    }
  }
  
  // Check all columns
  for (let col = 0; col < size; col++) {
    const values = new Set();
    for (let row = 0; row < size; row++) {
      values.add(grid[row][col].value);
    }
    if (values.size !== size) {
      return false;
    }
  }
  
  // Check all boxes
  const boxSize = size === 9 ? 3 : 2;
  for (let boxRow = 0; boxRow < size; boxRow += boxSize) {
    for (let boxCol = 0; boxCol < size; boxCol += boxSize) {
      const values = new Set();
      for (let r = 0; r < boxSize; r++) {
        for (let c = 0; c < boxSize; c++) {
          values.add(grid[boxRow + r][boxCol + c].value);
        }
      }
      if (values.size !== size) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Checks if the grid is completely filled with values
 * 
 * @param {SudokuGrid} grid - The current state of the Sudoku grid
 * @returns {boolean} True if all cells have values (not necessarily correct)
 */
function isGridFilled(grid) {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col].value === null) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Determines which cells should be highlighted based on settings
 * 
 * @param {Object} params - Parameters for highlighting
 * @param {number} params.row - The selected row
 * @param {number} params.col - The selected column
 * @param {SudokuGrid} params.grid - The current state of the Sudoku grid
 * @param {GridSize} params.size - The size of the grid
 * @param {HighlightSettings} params.highlightSettings - Settings for cell highlighting
 * @returns {Array<Array<string>>} Array of highlight classes for each cell
 */
function getHighlightedCells({ row, col, grid, size, highlightSettings }) {
  const highlights = Array(size).fill().map(() => Array(size).fill(''));
  const boxSize = size === 9 ? 3 : 2;
  
  if (row === null || col === null) {
    return highlights;
  }
  
  // Highlight row and column
  if (highlightSettings.highlightRowColumn) {
    for (let c = 0; c < size; c++) {
      if (c !== col) {
        highlights[row][c] += ' highlighted';
      }
    }
    
    for (let r = 0; r < size; r++) {
      if (r !== row) {
        highlights[r][col] += ' highlighted';
      }
    }
  }
  
  // Highlight box
  if (highlightSettings.highlightBox) {
    const boxStartRow = Math.floor(row / boxSize) * boxSize;
    const boxStartCol = Math.floor(col / boxSize) * boxSize;
    
    for (let r = boxStartRow; r < boxStartRow + boxSize; r++) {
      for (let c = boxStartCol; c < boxStartCol + boxSize; c++) {
        if ((r !== row || c !== col) && !highlights[r][c].includes('highlighted')) {
          highlights[r][c] += ' highlighted-box';
        }
      }
    }
  }
  
  // Highlight same numbers
  if (highlightSettings.highlightSameNumbers && grid[row][col].value !== null) {
    const value = grid[row][col].value;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r !== row || c !== col) && grid[r][c].value === value) {
          highlights[r][c] += ' highlighted-same-number';
        }
      }
    }
  }
  
  return highlights;
}

/**
 * Find a valid hint for the player
 * 
 * @param {SudokuGrid} grid - The current state of the Sudoku grid
 * @param {number[][]} solution - The solution grid
 * @param {GridSize} size - The size of the grid
 * @returns {{row: number, col: number, value: number, reason: string}|null} A hint or null if none found
 */
function findHint(grid, solution, size) {
  // First try to find cells with only one possible value
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Skip cells that already have values
      if (grid[row][col].value !== null) {
        continue;
      }
      
      // Find all possible values for this cell
      const possibleValues = [];
      for (let value = 1; value <= size; value++) {
        if (isValidValue(grid, row, col, value, size)) {
          possibleValues.push(value);
        }
      }
      
      // If there's only one possible value, return it as a hint
      if (possibleValues.length === 1) {
        return {
          row,
          col,
          value: possibleValues[0],
          reason: `Cell (${row + 1}, ${col + 1}) can only contain the value ${possibleValues[0]} because all other values would conflict with existing numbers in the row, column, or box.`
        };
      }
    }
  }
  
  // Look for "naked pairs" in rows
  for (let row = 0; row < size; row++) {
    const emptyCells = [];
    for (let col = 0; col < size; col++) {
      if (grid[row][col].value === null) {
        emptyCells.push({ col, possibleValues: [] });
        for (let value = 1; value <= size; value++) {
          if (isValidValue(grid, row, col, value, size)) {
            emptyCells[emptyCells.length - 1].possibleValues.push(value);
          }
        }
      }
    }
    
    // Look for cells with exactly 2 possible values
    const nakedPairs = emptyCells.filter(cell => cell.possibleValues.length === 2);
    
    // Check if there are multiple cells with the same 2 possible values
    for (let i = 0; i < nakedPairs.length; i++) {
      for (let j = i + 1; j < nakedPairs.length; j++) {
        const pair1 = nakedPairs[i].possibleValues;
        const pair2 = nakedPairs[j].possibleValues;
        
        if (pair1.length === pair2.length && 
            pair1.every(val => pair2.includes(val))) {
          
          // Found a naked pair, look for cells in the same row that have these values as possibilities
          for (const cell of emptyCells) {
            if (cell.possibleValues.length > 2 && 
                cell.possibleValues.some(val => pair1.includes(val))) {
              
              // Find a value that can be eliminated
              const valueToEliminate = cell.possibleValues.find(val => pair1.includes(val));
              
              // Recommend this move
              return {
                row,
                col: cell.col,
                value: solution[row][cell.col],
                reason: `Using the "naked pair" technique: cells (${row + 1}, ${nakedPairs[i].col + 1}) and (${row + 1}, ${nakedPairs[j].col + 1}) can only contain the values ${pair1.join(' or ')}. This means ${valueToEliminate} cannot be in cell (${row + 1}, ${cell.col + 1}).`
              };
            }
          }
        }
      }
    }
  }
  
  // If no advanced technique found, just provide a random valid move from the solution
  const emptyCells = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col].value === null) {
        emptyCells.push({ row, col });
      }
    }
  }
  
  if (emptyCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { row, col } = emptyCells[randomIndex];
    return {
      row,
      col,
      value: solution[row][col],
      reason: `In position (${row + 1}, ${col + 1}), the number ${solution[row][col]} is the correct value according to the rules of Sudoku.`
    };
  }
  
  return null;
}

// Export functions for use in app.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createEmptyGrid,
    isValidValue,
    generateSolution,
    createPuzzle,
    generateSudoku,
    isSudokuComplete,
    isGridFilled,
    getHighlightedCells,
    findHint
  };
}