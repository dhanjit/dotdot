
const GameState = require('../web/js/game.js');

describe('Dots and Boxes Game Logic', () => {
    let game;

    beforeEach(() => {
        game = new GameState(3); // 3x3 dots = 2x2 squares
    });

    test('initializes correctly', () => {
        expect(game.gridSize).toBe(3);
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
        // 2x2 squares = 4 squares total
        // We will just simulate filling squares
        game.squares[0][0] = 'P1';
        game.squares[0][1] = 'P1';
        game.squares[1][0] = 'P2';
        game.occupiedSquares = 3;

        // Last move fills the last square
        // We need to setup lines for 1,1
        // H(1,1), H(2,1), V(1,1), V(1,2)
        game.horizontalLines[1][1] = true;
        game.horizontalLines[2][1] = true;
        game.verticalLines[1][1] = true;
        // Place last line
        game.placeLine('v', 1, 2);

        expect(game.gameOver).toBe(true);
        expect(game.winner).toBe('P1'); // 3 vs 1
    });

    test('prevents invalid moves', () => {
        game.placeLine('h', 0, 0);
        const duplicate = game.placeLine('h', 0, 0);
        expect(duplicate.success).toBe(false);
        expect(duplicate.message).toBe('Line already placed');

        const outOfBounds = game.placeLine('h', 9, 9);
        expect(outOfBounds.success).toBe(false);
    });
});
