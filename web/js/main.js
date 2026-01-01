
/**
 * Main Entry Point
 */

// We need to wait for the DOM to be ready, but since it's at the end of body, it's fine.
// We also need to wait for GameState and UI classes to be defined.

document.addEventListener('DOMContentLoaded', () => {
    // Check if GameState is loaded
    if (typeof GameState === 'undefined') {
        console.error("GameState class not loaded!");
        return;
    }

    let gridSize = 4;
    let game = new GameState(gridSize);
    let ui = new UI(game);

    const restartBtn = document.getElementById('restart-btn');
    const gridSizeSelect = document.getElementById('grid-size');

    restartBtn.addEventListener('click', () => {
        gridSize = parseInt(gridSizeSelect.value);
        startNewGame(gridSize);
    });

    gridSizeSelect.addEventListener('change', (e) => {
        gridSize = parseInt(e.target.value);
        startNewGame(gridSize);
    });

    function startNewGame(size) {
        game = new GameState(size);
        ui = new UI(game);
        console.log(`New game started with grid size ${size}`);
    }

    console.log("Dots and Boxes initialized!");
});
