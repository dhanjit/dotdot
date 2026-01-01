
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
                // Greedy: Pick safe move near the last move for better engagement
                return this.pickMoveNearLast(gameState, safeMoves);
            }
        }

        // 3. No safe moves? Must Sacrifice.
        // We have to open a chain.
        if (this.difficulty === 'strategic') {
            // Strategic: Try to open the SMALLEST chain possible to minimize damage.
            return this.pickLeastBadSacrifice(gameState);
        } else {
            // Greedy: Pick move near last move when forced to sacrifice
            const allMoves = this.getAllAvailableMoves(gameState);
            return this.pickMoveNearLast(gameState, allMoves);
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

    getAffectedSquares(gameState, move) {
        // Returns array of squares that would be affected by this move
        const { type, r, c } = move;
        const affected = [];

        if (type === 'h') {
            // Horizontal line affects square above and below
            if (r > 0 && r - 1 < gameState.rows - 1 && c < gameState.cols - 1) {
                affected.push({ r: r - 1, c: c }); // Square above
            }
            if (r < gameState.rows - 1 && c < gameState.cols - 1) {
                affected.push({ r: r, c: c }); // Square below
            }
        } else if (type === 'v') {
            // Vertical line affects square left and right
            if (c > 0 && r < gameState.rows - 1 && c - 1 < gameState.cols - 1) {
                affected.push({ r: r, c: c - 1 }); // Square left
            }
            if (c < gameState.cols - 1 && r < gameState.rows - 1) {
                affected.push({ r: r, c: c }); // Square right
            }
        }

        return affected;
    }

    pickBestSafeMove(gameState, safeMoves) {
        // Strategic heuristic: Among safe moves, prefer those that create fewer 2-line squares
        // Creating a 2-line square sets up potential future danger

        const moveScores = safeMoves.map(move => {
            let twoLineSquaresCreated = 0;

            // Check which squares this move affects
            const affectedSquares = this.getAffectedSquares(gameState, move);

            for (const sq of affectedSquares) {
                const currentLines = this.countLinesAroundSquare(gameState, sq.r, sq.c);
                // If this square currently has 1 line, adding this move makes it 2 lines
                if (currentLines === 1) {
                    twoLineSquaresCreated++;
                }
            }

            return { move, score: twoLineSquaresCreated };
        });

        // Sort by score (fewer 2-line squares is better)
        moveScores.sort((a, b) => a.score - b.score);

        // Among the best moves, prefer those near the last move
        const bestScore = moveScores[0].score;
        const bestMoves = moveScores.filter(m => m.score === bestScore);

        return this.pickMoveNearLast(gameState, bestMoves.map(m => m.move));
    }

    pickLeastBadSacrifice(gameState) {
        // We have to give something away - pick the move that creates the fewest 3-line squares
        // This minimizes how many squares the opponent can immediately capture

        const moves = this.getAllAvailableMoves(gameState);

        const moveScores = moves.map(move => {
            let threeLineSquaresCreated = 0;

            // Check which squares this move affects
            const affectedSquares = this.getAffectedSquares(gameState, move);

            for (const sq of affectedSquares) {
                const currentLines = this.countLinesAroundSquare(gameState, sq.r, sq.c);
                // If this square currently has 2 lines, adding this move makes it 3 lines (giveaway)
                if (currentLines === 2) {
                    threeLineSquaresCreated++;
                }
            }

            return { move, score: threeLineSquaresCreated };
        });

        // Sort by score (fewer 3-line squares is better)
        moveScores.sort((a, b) => a.score - b.score);

        // Among the least bad moves, prefer those near the last move
        const bestScore = moveScores[0].score;
        const leastBadMoves = moveScores.filter(m => m.score === bestScore);

        return this.pickMoveNearLast(gameState, leastBadMoves.map(m => m.move));
    }

    pickMoveNearLast(gameState, moves) {
        // If no last move or only one option, pick random
        if (!gameState.lastMove || moves.length === 1) {
            return moves[Math.floor(Math.random() * moves.length)];
        }

        // Calculate distance from last move for each candidate
        const movesWithDistance = moves.map(move => {
            const dist = this.getMoveDistance(gameState.lastMove, move);
            return { move, dist };
        });

        // Sort by distance (closer is better)
        movesWithDistance.sort((a, b) => a.dist - b.dist);

        // Pick randomly among the closest moves
        const minDist = movesWithDistance[0].dist;
        const closestMoves = movesWithDistance.filter(m => m.dist === minDist);

        return closestMoves[Math.floor(Math.random() * closestMoves.length)].move;
    }

    getMoveDistance(move1, move2) {
        // Calculate Manhattan distance between two moves
        // Consider both the position and type of move
        return Math.abs(move1.r - move2.r) + Math.abs(move1.c - move2.c);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DotDotAI;
}
