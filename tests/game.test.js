const GameState = require('../web/js/game.js');

describe('Dots and Boxes Game Logic', () => {
    let game;

    beforeEach(() => {
        game = new GameState(3, 3); // 3x3 dots
    });

    test('initializes correctly', () => {
        expect(game.rows).toBe(3);
        expect(game.cols).toBe(3);
        expect(game.horizontalLines.length).toBe(3);
        expect(game.horizontalLines[0].length).toBe(2);
        expect(game.verticalLines.length).toBe(2);
        expect(game.verticalLines[0].length).toBe(3);
        expect(game.scores['P1']).toBe(0);
        expect(game.getCurrentPlayer()).toBe('P1');
    });

    test('places a horizontal line correctly', () => {
        const result = game.placeLine('h', 0, 0);
        expect(result.success).toBe(true);
        expect(game.horizontalLines[0][0]).toBe(true);
        expect(result.extraTurn).toBe(false); // No square completed
        expect(game.getCurrentPlayer()).toBe('P2'); // Turn switched
    });

    test('places a vertical line correctly', () => {
        const result = game.placeLine('v', 0, 0);
        expect(result.success).toBe(true);
        expect(game.verticalLines[0][0]).toBe(true);
        expect(result.extraTurn).toBe(false);
        expect(game.getCurrentPlayer()).toBe('P2');
    });

    test('detects square completion and grants extra turn', () => {
        // Complete the top-left square (0,0)
        // Needs H(0,0), H(1,0), V(0,0), V(0,1)

        game.placeLine('h', 0, 0); // P1
        game.placeLine('h', 1, 0); // P2
        game.placeLine('v', 0, 0); // P1

        // P2 places the last line
        const result = game.placeLine('v', 0, 1); // P2

        expect(result.success).toBe(true);
        expect(result.extraTurn).toBe(true);
        expect(result.newSquares.length).toBe(1);
        expect(result.newSquares[0]).toEqual({ r: 0, c: 0 });

        expect(game.squares[0][0]).toBe('P2');
        expect(game.scores['P2']).toBe(1);
        expect(game.getCurrentPlayer()).toBe('P2'); // Turn stays with P2
    });

    test('detects game over', () => {
        // Use a small 2x2 grid (1 square) for easier game over test
        game = new GameState(2, 2);
        // 1 square total

        // H(0,0), H(1,0), V(0,0), V(0,1)
        game.placeLine('h', 0, 0); // P1
        game.placeLine('h', 1, 0); // P2
        game.placeLine('v', 0, 0); // P1
        game.placeLine('v', 0, 1); // P2 (completes)

        expect(game.gameOver).toBe(true);
        expect(game.winner).toBe('P2');
    });

    test('prevents invalid moves', () => {
        game.placeLine('h', 0, 0);
        const duplicate = game.placeLine('h', 0, 0);
        expect(duplicate.success).toBe(false);
        expect(duplicate.message).toBe('Line already placed');

        const outOfBounds = game.placeLine('h', 9, 9);
        expect(outOfBounds.success).toBe(false);
    });

    test('rectangular grid support (3x2)', () => {
        // 3 rows, 2 cols (2x1 squares)
        const game = new GameState(3, 2);

        expect(game.rows).toBe(3);
        expect(game.cols).toBe(2);

        // Check grid dimensions
        // Horizontal: 3 rows, 1 col (2-1)
        expect(game.horizontalLines.length).toBe(3);
        expect(game.horizontalLines[0].length).toBe(1);

        // Vertical: 2 rows (3-1), 2 cols
        expect(game.verticalLines.length).toBe(2);
        expect(game.verticalLines[0].length).toBe(2);

        // Place valid line
        const res = game.placeLine('h', 2, 0); // Last row horizontal
        expect(res.success).toBe(true);

        // Place invalid line (col 1 is out of bounds for horizontal lines in 2-col visual grid)
        // Horizontal lines have cols-1 columns. 2-1 = 1 column (index 0). Index 1 is invalid.
        const invalid = game.placeLine('h', 0, 1);
        expect(invalid.success).toBe(false);
    });
});
