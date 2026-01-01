
/**
 * Core Game Logic for Dots and Boxes
 */
class GameState {
    constructor(gridSize = 4) { // Default 4x4 dots (3x3 squares)
        this.gridSize = gridSize; // N dots
        this.players = ['P1', 'P2']; // Player 1, Player 2
        this.currentPlayerIndex = 0;
        
        // Matrices to track placed lines.
        // Horizontal lines: N rows, N-1 columns
        this.horizontalLines = Array(gridSize).fill(null).map(() => Array(gridSize - 1).fill(false));
        
        // Vertical lines: N-1 rows, N columns
        this.verticalLines = Array(gridSize - 1).fill(null).map(() => Array(gridSize).fill(false));
        
        // Squares: N-1 rows, N-1 columns
        // Stores 'P1', 'P2', or null
        this.squares = Array(gridSize - 1).fill(null).map(() => Array(gridSize - 1).fill(null));
        
        this.scores = { 'P1': 0, 'P2': 0 };
        this.totalSquares = (gridSize - 1) * (gridSize - 1);
        this.occupiedSquares = 0;
        this.gameOver = false;
        this.winner = null;
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Attempt to place a line
    // type: 'h' (horizontal) or 'v' (vertical)
    // r, c: coordinates in the respective line matrix
    placeLine(type, r, c) {
        if (this.gameOver) return { success: false, message: 'Game over' };

        // Validate coordinates
        if (type === 'h') {
            if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize - 1) {
                return { success: false, message: 'Invalid coordinates' };
            }
            if (this.horizontalLines[r][c]) {
                return { success: false, message: 'Line already placed' };
            }
            this.horizontalLines[r][c] = true;
        } else if (type === 'v') {
            if (r < 0 || r >= this.gridSize - 1 || c < 0 || c >= this.gridSize) {
                return { success: false, message: 'Invalid coordinates' };
            }
            if (this.verticalLines[r][c]) {
                return { success: false, message: 'Line already placed' };
            }
            this.verticalLines[r][c] = true;
        } else {
            return { success: false, message: 'Invalid line type' };
        }

        // Check if any square was completed by this move
        const completedSquares = this.checkForCompletedSquares(type, r, c);
        
        if (completedSquares.length > 0) {
            // Player gets another turn, squares are marked
            completedSquares.forEach(sq => {
                this.squares[sq.r][sq.c] = this.getCurrentPlayer();
                this.scores[this.getCurrentPlayer()]++;
                this.occupiedSquares++;
            });
            
            if (this.occupiedSquares === this.totalSquares) {
                this.endGame();
            }
            
            return { success: true, extraTurn: true, newSquares: completedSquares };
        } else {
            // Pass turn
            this.switchTurn();
            return { success: true, extraTurn: false, newSquares: [] };
        }
    }

    checkForCompletedSquares(type, r, c) {
        const completed = [];
        const player = this.getCurrentPlayer();

        // A horizontal line at (r, c) could complete the square ABOVE it (r-1, c) or BELOW it (r, c)
        if (type === 'h') {
            // Square Above: Top-left at (r-1, c)
            // Needs: V(r-1, c), V(r-1, c+1), H(r-1, c), and calculate H(r, c) just placed
            if (r > 0) {
                if (this.isSquareComplete(r - 1, c)) {
                    completed.push({ r: r - 1, c: c });
                }
            }
            // Square Below: Top-left at (r, c)
            // Needs: V(r, c), V(r, c+1), H(r+1, c), and calculate H(r, c) just placed
            if (r < this.gridSize - 1) {
                if (this.isSquareComplete(r, c)) {
                    completed.push({ r: r, c: c });
                }
            }
        }
        
        // A vertical line at (r, c) could complete the square to the LEFT (r, c-1) or RIGHT (r, c)
        if (type === 'v') {
            // Square Left: Top-left at (r, c-1)
            // Needs: H(r, c-1), H(r+1, c-1), V(r, c-1), and calculate V(r, c) just placed
            if (c > 0) {
                if (this.isSquareComplete(r, c - 1)) {
                    completed.push({ r: r, c: c - 1 });
                }
            }
            // Square Right: Top-left at (r, c)
            // Needs: H(r, c), H(r+1, c), V(r, c+1), and calculate V(r, c) just placed
            if (c < this.gridSize - 1) {
                if (this.isSquareComplete(r, c)) {
                    completed.push({ r: r, c: c });
                }
            }
        }
        return completed;
    }

    isSquareComplete(r, c) {
        // Square at (r, c) is bounded by:
        // Top: H(r, c)
        // Bottom: H(r+1, c)
        // Left: V(r, c)
        // Right: V(r, c+1)
        
        // Check bounds just in case
        if (r < 0 || c < 0 || r >= this.gridSize - 1 || c >= this.gridSize - 1) return false;
        
        return (
            this.horizontalLines[r][c] &&
            this.horizontalLines[r+1][c] &&
            this.verticalLines[r][c] &&
            this.verticalLines[r][c+1]
        );
    }

    switchTurn() {
        this.currentPlayerIndex = 1 - this.currentPlayerIndex;
    }

    endGame() {
        this.gameOver = true;
        if (this.scores['P1'] > this.scores['P2']) {
            this.winner = 'P1';
        } else if (this.scores['P2'] > this.scores['P1']) {
            this.winner = 'P2';
        } else {
            this.winner = 'Draw';
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameState;
}
