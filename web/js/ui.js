
/**
 * UI Controller for Dots and Boxes
 */
class UI {
    constructor(game, playerNames = { P1: 'P1', P2: 'P2' }) {
        this.game = game;
        this.playerNames = playerNames;
        this.dotSpacing = 60;
        this.margin = 30;
        this.container = document.getElementById('game-board');
        this.messageEl = document.getElementById('game-message');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.p1ScoreEl = document.getElementById('p1-score');
        this.p2ScoreEl = document.getElementById('p2-score');

        this.initBoard();
        this.updateStatus();
    }

    initBoard() {
        this.container.innerHTML = '';
        const rows = this.game.rows;
        const cols = this.game.cols;

        // Calculate dynamic dot spacing
        // Available width in the container (max 500px usually by CSS, but let's be flexible)
        // We want some margin.
        const containerWidth = this.container.clientWidth || 500; // Fallback
        const margin = 20;
        const availableWidth = containerWidth - (2 * margin);

        // size-1 squares, but size dots.
        // We need (cols-1) * spacing = availableWidth
        // So spacing = availableWidth / (cols - 1)
        // But let's cap the maximum spacing so small grids don't look huge.
        const maxSpacing = 60;
        let spacing = availableWidth / (cols - 1);
        if (spacing > maxSpacing) spacing = maxSpacing;

        // Re-calculate effective width and height
        const width = (cols - 1) * spacing + 2 * margin;
        const height = (rows - 1) * spacing + 2 * margin;

        this.dotSpacing = spacing;
        this.margin = margin;

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        // We set viewBox to match the calculated dimensions
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        // We can let CSS check width, but setting it here ensures SVG scaling matches coordinate system
        svg.setAttribute("width", "100%");
        // Height might vary, let's allow it to grow but setting 100% usually works if container adapts
        // or we can set it explicitly in px if we want exact fit? 
        // Let's stick to 100% width and auto height via viewBox aspect ratio

        this.svg = svg;

        // Group for squares (z-index bottom)
        this.squaresGroup = document.createElementNS(ns, "g");
        svg.appendChild(this.squaresGroup);

        // Group for vertical lines
        this.vLinesGroup = document.createElementNS(ns, "g");
        svg.appendChild(this.vLinesGroup);

        // Group for horizontal lines
        this.hLinesGroup = document.createElementNS(ns, "g");
        svg.appendChild(this.hLinesGroup);

        // Group for dots
        this.dotsGroup = document.createElementNS(ns, "g");
        svg.appendChild(this.dotsGroup);

        this.renderGrid(rows, cols, ns);
        this.container.appendChild(svg);
    }

    renderGrid(rows, cols, ns) {
        // Draw Squares (initially invisible)
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const rect = document.createElementNS(ns, "rect");
                rect.setAttribute("x", this.margin + c * this.dotSpacing);
                rect.setAttribute("y", this.margin + r * this.dotSpacing);
                rect.setAttribute("width", this.dotSpacing);
                rect.setAttribute("height", this.dotSpacing);
                rect.setAttribute("class", "box-fill");
                rect.setAttribute("id", `sq-${r}-${c}`);
                rect.style.fillOpacity = "0"; // Invisible start
                this.squaresGroup.appendChild(rect);

                // Text for initials
                const text = document.createElementNS(ns, "text");
                text.setAttribute("x", this.margin + c * this.dotSpacing + this.dotSpacing / 2);
                text.setAttribute("y", this.margin + r * this.dotSpacing + this.dotSpacing / 2);
                text.setAttribute("class", "box-text");
                text.setAttribute("font-size", this.dotSpacing * 0.6); // Scale font with box size
                text.setAttribute("id", `text-${r}-${c}`);
                this.squaresGroup.appendChild(text);
            }
        }

        // Draw Horizontal Lines (interaction areas)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols - 1; c++) {
                const line = document.createElementNS(ns, "line");
                line.setAttribute("x1", this.margin + c * this.dotSpacing);
                line.setAttribute("y1", this.margin + r * this.dotSpacing);
                line.setAttribute("x2", this.margin + (c + 1) * this.dotSpacing);
                line.setAttribute("y2", this.margin + r * this.dotSpacing);
                line.setAttribute("class", "interaction-line");
                line.setAttribute("id", `h-${r}-${c}`);

                line.addEventListener('click', () => this.handleLineClick('h', r, c));
                this.hLinesGroup.appendChild(line);
            }
        }

        // Draw Vertical Lines (interaction areas)
        for (let r = 0; r < rows - 1; r++) {
            for (let c = 0; c < cols; c++) {
                const line = document.createElementNS(ns, "line");
                line.setAttribute("x1", this.margin + c * this.dotSpacing);
                line.setAttribute("y1", this.margin + r * this.dotSpacing);
                line.setAttribute("x2", this.margin + c * this.dotSpacing);
                line.setAttribute("y2", this.margin + (r + 1) * this.dotSpacing);
                line.setAttribute("class", "interaction-line");
                line.setAttribute("id", `v-${r}-${c}`);

                line.addEventListener('click', () => this.handleLineClick('v', r, c));
                this.vLinesGroup.appendChild(line);
            }
        }

        // Draw Dots
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const circle = document.createElementNS(ns, "circle");
                circle.setAttribute("cx", this.margin + c * this.dotSpacing);
                circle.setAttribute("cy", this.margin + r * this.dotSpacing);
                circle.setAttribute("r", 4);
                circle.setAttribute("class", "dot");
                this.dotsGroup.appendChild(circle);
            }
        }
    }

    handleLineClick(type, r, c) {
        if (this.game.gameOver) return;

        // Track who is making the move
        const player = this.game.getCurrentPlayer();

        const result = this.game.placeLine(type, r, c);

        if (result.success) {
            this.renderMove(type, r, c, result, player);
            this.updateStatus();
        } else {
            console.log("Invalid move or line already placed");
        }
    }

    renderMove(type, r, c, result, player = null) {
        // Use provided player or infer from game state
        if (!player) {
            player = this.game.squares[result.newSquares?.[0]?.r]?.[result.newSquares?.[0]?.c] || this.game.getCurrentPlayer();
        }

        // Update the clicked line style
        const lineId = `${type}-${r}-${c}`;
        const lineEl = document.getElementById(lineId);
        if (lineEl) {
            lineEl.classList.remove('interaction-line');
            lineEl.classList.add('drawn-line');

            // Add player-specific class for line color
            lineEl.classList.add(player === 'P1' ? 'line-p1' : 'line-p2');

            // Remove manual stroke setting if it was there
            lineEl.style.stroke = "";
        }

        // Update any new squares
        if (result.newSquares && result.newSquares.length > 0) {
            result.newSquares.forEach(sq => {
                const sqEl = document.getElementById(`sq-${sq.r}-${sq.c}`);
                const textEl = document.getElementById(`text-${sq.r}-${sq.c}`);

                // The owner of the square is the CURRENT player because they just made the move and kept the turn.
                const owner = this.game.squares[sq.r][sq.c];

                if (sqEl) {
                    sqEl.classList.add(owner === 'P1' ? 'box-p1' : 'box-p2');
                    sqEl.style.fillOpacity = "0.3";
                }
                if (textEl) {
                    textEl.textContent = this.playerNames[owner]; // Custom name
                }
            });
            this.messageEl.textContent = "Square Captured! Extra Turn!";
            setTimeout(() => this.messageEl.textContent = "", 2000);
        }
    }

    updateStatus() {
        this.p1ScoreEl.textContent = `${this.playerNames['P1']}: ${this.game.scores['P1']}`;
        this.p2ScoreEl.textContent = `${this.playerNames['P2']}: ${this.game.scores['P2']}`;

        const currentPlayer = this.game.getCurrentPlayer();

        if (this.game.gameOver) {
            let winnerText = 'Draw!';
            if (this.game.winner !== 'Draw') {
                winnerText = `${this.playerNames[this.game.winner]} Wins!`;
            }
            this.turnIndicator.textContent = `Winner: ${winnerText}`;
            this.turnIndicator.className = 'turn-indicator'; // Reset colors or add gold
            this.messageEl.textContent = "Game Over!";
        } else {
            const name = this.playerNames[currentPlayer];
            // Handle special case for "YOU" to avoid "YOU's Turn"
            const turnText = name === 'YOU' ? 'Your Turn' : `${name}'s Turn`;
            this.turnIndicator.textContent = turnText;
            this.turnIndicator.className = `turn-indicator ${currentPlayer === 'P1' ? 'p1-turn' : 'p2-turn'}`;
        }
    }
}
