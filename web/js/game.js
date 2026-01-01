
/**
 * Core Game Logic for Dots and Boxes
 */
class GameState {
    constructor(rows = 10, cols = 10) { // Default 10x10 dots
        this.rows = rows;
        this.cols = cols;
        this.players = ['P1', 'P2'];
        this.currentPlayerIndex = 0;

        // Matrices to track placed lines.
        // Horizontal lines: rows x (cols-1)
        this.horizontalLines = Array(rows).fill(null).map(() => Array(cols - 1).fill(false));

        // Vertical lines: (rows-1) x cols
        this.verticalLines = Array(rows - 1).fill(null).map(() => Array(cols).fill(false));

        // Squares: (rows-1) x (cols-1)
        this.squares = Array(rows - 1).fill(null).map(() => Array(cols - 1).fill(null));

        this.scores = { 'P1': 0, 'P2': 0 };
        this.totalSquares = (rows - 1) * (cols - 1);
        this.occupiedSquares = 0;
        this.gameOver = false;
        this.winner = null;
        this.lastMove = null; // Track the last move made
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Attempt to place a line
    placeLine(type, r, c) {
        if (this.gameOver) return { success: false, message: 'Game over' };

        // Validate coordinates
        if (type === 'h') {
            if (r < 0 || r >= this.rows || c < 0 || c >= this.cols - 1) {
                return { success: false, message: 'Invalid coordinates' };
            }
            if (this.horizontalLines[r][c]) {
                return { success: false, message: 'Line already placed' };
            }
            this.horizontalLines[r][c] = true;
        } else if (type === 'v') {
            if (r < 0 || r >= this.rows - 1 || c < 0 || c >= this.cols) {
                return { success: false, message: 'Invalid coordinates' };
            }
            if (this.verticalLines[r][c]) {
                return { success: false, message: 'Line already placed' };
            }
            this.verticalLines[r][c] = true;
        } else {
            return { success: false, message: 'Invalid line type' };
        }

        // Track the last move
        this.lastMove = { type, r, c };

        // Check if any square was completed by this move
        const completedSquares = this.checkForCompletedSquares(type, r, c);

        if (completedSquares.length > 0) {
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
            this.switchTurn();
            return { success: true, extraTurn: false, newSquares: [] };
        }
    }

    checkForCompletedSquares(type, r, c) {
        const completed = [];

        if (type === 'h') {
            // Square Above: Top-left at (r-1, c)
            if (r > 0) {
                if (this.isSquareComplete(r - 1, c)) {
                    completed.push({ r: r - 1, c: c });
                }
            }
            // Square Below: Top-left at (r, c)
            if (r < this.rows - 1) {
                if (this.isSquareComplete(r, c)) {
                    completed.push({ r: r, c: c });
                }
            }
        }

        if (type === 'v') {
            // Square Left: Top-left at (r, c-1)
            if (c > 0) {
                if (this.isSquareComplete(r, c - 1)) {
                    completed.push({ r: r, c: c - 1 });
                }
            }
            // Square Right: Top-left at (r, c)
            if (c < this.cols - 1) {
                if (this.isSquareComplete(r, c)) {
                    completed.push({ r: r, c: c });
                }
            }
        }
        return completed;
    }

    isSquareComplete(r, c) {
        // Square at (r, c) bounds logic remains same relative to its top-left, 
        // but we must check bounds against grid size.
        if (r < 0 || c < 0 || r >= this.rows - 1 || c >= this.cols - 1) return false;

        return (
            this.horizontalLines[r][c] &&
            this.horizontalLines[r + 1][c] &&
            this.verticalLines[r][c] &&
            this.verticalLines[r][c + 1]
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
