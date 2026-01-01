
/**
 * DotDot AI - Heuristic Opponent
 * 
 * Levels:
 * - illegal: (Not implemented, AI doesn't cheat)
 * - greedy: Prioritizes completing squares. Avoids giving away squares. Random otherwise.
 * - strategic: Same as greedy but tries to avoid opening long chains (simplistic double-cross avoidance).
 */

class DotDotAI {
    constructor(difficulty = 'greedy') {
        this.difficulty = difficulty; // 'greedy', 'strategic'
    }

    getMove(gameState) {
        // 1. Check for scoring moves (Greedy for both levels)
        const scoringMoves = this.findScoringMoves(gameState);
        if (scoringMoves.length > 0) {
            // Take any scoring move.
            // Improvement: In strategic mode, if there are multiple, maybe pick one that continues a chain?
            // For now, just take the first one.
            return scoringMoves[0];
        }

        // 2. If no scoring move, find "Safe" moves
        // A safe move is one that does NOT add the 3rd line to any square (giving it away).
        const safeMoves = this.findSafeMoves(gameState);

        if (safeMoves.length > 0) {
            if (this.difficulty === 'strategic') {
                // Strategic: Try to pick the "safest" of safe moves.
                // e.g. prefer moves that leave 0 or 1 lines total, rather than 2 lines (which is still safe immediatey but closer to danger)
                // Also, random selection among the best safe moves to feel natural.
                return this.pickBestSafeMove(gameState, safeMoves);
            } else {
                // Greedy: Just pick random safe move
                return safeMoves[Math.floor(Math.random() * safeMoves.length)];
            }
        }

        // 3. No safe moves? Must Sacrifice.
        // We have to open a chain.
        if (this.difficulty === 'strategic') {
            // Strategic: Try to open the SMALLEST chain possible to minimize damage.
            return this.pickLeastBadSacrifice(gameState);
        } else {
            // Greedy: Random available move (inevitable doom)
            const allMoves = this.getAllAvailableMoves(gameState);
            return allMoves[Math.floor(Math.random() * allMoves.length)];
        }
    }

    getAllAvailableMoves(gameState) {
        const moves = [];
        // Horizontal
        for (let r = 0; r < gameState.rows; r++) {
            for (let c = 0; c < gameState.cols - 1; c++) {
                if (!gameState.horizontalLines[r][c]) {
                    moves.push({ type: 'h', r, c });
                }
            }
        }
        // Vertical
        for (let r = 0; r < gameState.rows - 1; r++) {
            for (let c = 0; c < gameState.cols; c++) {
                if (!gameState.verticalLines[r][c]) {
                    moves.push({ type: 'v', r, c });
                }
            }
        }
        return moves;
    }

    findScoringMoves(gameState) {
        const moves = this.getAllAvailableMoves(gameState);
        const scoring = [];

        for (const move of moves) {
            if (this.doesMoveCompleteSquare(gameState, move)) {
                scoring.push(move);
            }
        }
        return scoring;
    }

    findSafeMoves(gameState) {
        const moves = this.getAllAvailableMoves(gameState);
        const safe = [];

        for (const move of moves) {
            if (!this.doesMoveGiveAwaySquare(gameState, move)) {
                safe.push(move);
            }
        }
        return safe;
    }

    doesMoveCompleteSquare(gameState, move) {
        // Hypothethically place line and check checkForCompletedSquares result logic
        // We can reuse GameState logic but we don't want to mutate actual state.
        // We can implement a lightweight check.

        const { type, r, c } = move;

        // Check relevant squares
        if (type === 'h') {
            // Check Above (r-1, c) and Below (r, c)
            if (r > 0 && this.countLinesAroundSquare(gameState, r - 1, c) === 3) return true;
            if (r < gameState.rows - 1 && this.countLinesAroundSquare(gameState, r, c) === 3) return true;
        } else {
            // Check Left (r, c-1) and Right (r, c)
            if (c > 0 && this.countLinesAroundSquare(gameState, r, c - 1) === 3) return true;
            if (c < gameState.cols - 1 && this.countLinesAroundSquare(gameState, r, c) === 3) return true;
        }
        return false;
    }

    doesMoveGiveAwaySquare(gameState, move) {
        // A move gives away a square if it makes a square have 3 lines (which enables opponent to take it).
        // BUT, check if WE complete it first. If we complete it, it's not a giveaway, it's a score.
        // This function assumes doesMoveCompleteSquare returned false (we are looking for non-scoring moves).

        const { type, r, c } = move;

        // If we place this line, will any neighbor square have 3 lines?
        // Current lines must be 2.

        if (type === 'h') {
            // Check Above
            if (r > 0 && this.countLinesAroundSquare(gameState, r - 1, c) === 2) return true;
            // Check Below
            if (r < gameState.rows - 1 && this.countLinesAroundSquare(gameState, r, c) === 2) return true;
        } else {
            // Check Left
            if (c > 0 && this.countLinesAroundSquare(gameState, r, c - 1) === 2) return true;
            // Check Right
            if (c < gameState.cols - 1 && this.countLinesAroundSquare(gameState, r, c) === 2) return true;
        }
        return false;
    }

    countLinesAroundSquare(gameState, r, c) {
        // Count existing lines for square at r, c
        let count = 0;
        if (gameState.horizontalLines[r][c]) count++;       // Top
        if (gameState.horizontalLines[r + 1][c]) count++;     // Bottom
        if (gameState.verticalLines[r][c]) count++;         // Left
        if (gameState.verticalLines[r][c + 1]) count++;       // Right
        return count;
    }

    pickBestSafeMove(gameState, safeMoves) {
        // Heuristic: Prefer moves that leave square with 0 or 1 lines (very safe)
        // over moves that leave square with 2 lines (safe for now, but dangerous).
        // Wait, if I leave it with 2 lines, opponent adds 3rd (giveaway) -> I take.
        // So leaving with 2 is actually BAD for opponent to touch, but fine for me to create?
        // No, if I create a state of 2 lines, opponent adds 3rd, I take. 
        // Opponent will avoid adding 3rd.

        // Actually, simplest heuristic:
        // Avoid placing lines on squares that already have 0 or 1 lines?
        // No, we want to fill up the board.

        // Let's randomize for variety, but simple heuristic:
        // Try not to place lines next to already-2-line squares (which would make them 3 and giveaway).
        // But this is handled by `doesMoveGiveAwaySquare`.

        // Strategic addition: Double Cross / Chain management is hard without full graph.
        // Simple Strategic: Pick random.
        return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    pickLeastBadSacrifice(gameState) {
        // We have to give something away.
        // Find the move that opens the shortest chain?
        // Determining chain length is costly (DFS).
        // Approximation: Pick move that gives away only 1 square if possible?
        // Or pick move near edge?

        const moves = this.getAllAvailableMoves(gameState);

        // Sort by "how many squares does it give away immediately?"
        // We can simulate and check greedy opponent response?
        // Too slow for JS on Main Thread maybe?

        // fallback: random
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DotDotAI;
}
