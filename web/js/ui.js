
/**
 * UI Controller for Dots and Boxes
 */
class UI {
    constructor(game) {
        this.game = game;
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
        const size = this.game.gridSize;

        // Calculate dynamic dot spacing
        // Available width in the container (max 500px usually by CSS, but let's be flexible)
        // We want some margin.
        const containerWidth = this.container.clientWidth || 500; // Fallback
        const margin = 20;
        const availableWidth = containerWidth - (2 * margin);

        // size-1 squares, but size dots.
        // We need (size-1) * spacing = availableWidth
        // So spacing = availableWidth / (size - 1)
        // But let's cap the maximum spacing so small grids don't look huge.
        const maxSpacing = 60;
        let spacing = availableWidth / (size - 1);
        if (spacing > maxSpacing) spacing = maxSpacing;

        // Re-calculate effective width based on clamped spacing
        const width = (size - 1) * spacing + 2 * margin;
        // Height is same aspect ratio mostly, but let's stick to square for now logic-wise
        const height = (size - 1) * spacing + 2 * margin;

        this.dotSpacing = spacing;
        this.margin = margin;

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        // We set viewBox to match the calculated dimensions
        svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
        // We can let CSS check width, but setting it here ensures SVG scaling matches coordinate system
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");

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

        this.renderGrid(size, ns);
        this.container.appendChild(svg);
    }

    renderGrid(size, ns) {
        // Draw Squares (initially invisible)
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size - 1; c++) {
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
                text.setAttribute("id", `text-${r}-${c}`);
                this.squaresGroup.appendChild(text);
            }
        }

        // Draw Horizontal Lines (interaction areas)
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
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
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
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
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
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

        const result = this.game.placeLine(type, r, c);

        if (result.success) {
            // Update the clicked line style
            const lineId = `${type}-${r}-${c}`;
            const lineEl = document.getElementById(lineId);
            if (lineEl) {
                lineEl.classList.remove('interaction-line');
                lineEl.classList.add('drawn-line');
                // The color depends on who placed it, but usually standard game shows black lines or neutral, 
                // but let's color it by player who placed it for style.
                // Wait, if I place a line, it's MY line? Standard rules say lines don't belong to players, marks do.
                // But we can give it a hint color.
                // Actually, let's just make it dark (ink).
                // Or better, stick to the player color to show who made the move? 
                // Let's use ink color for all drawn lines as per paperballs aesthetic usually.
                // Re-reading CSS: .line-p1 { stroke: var(--p1-color); }
                // Let's use player color for lines to make it clear who did what, it looks nice.

                // Note: The player who placed it is the one who was current BEFORE the move.
                // But the game state might have switched turn if NO square was made.

                // We need to know who made the move.
                // If result.extraTurn is true, it's the current player (turn didn't change).
                // If result.extraTurn is false, it was the OTHER player (turn switched).

                // Let's rely on checking the previous turn owner, or easier: 
                // GameState doesn't store who owns lines, just that they exist.
                // But we can infer.

                // Simplified: use a standard color for drawn lines (black/blue ink).
                lineEl.style.stroke = "var(--ink-color)";
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
                        textEl.textContent = owner; // "P1" or "P2"
                    }
                });
                this.messageEl.textContent = "Square Captured! Extra Turn!";
                setTimeout(() => this.messageEl.textContent = "", 2000);
            }

            this.updateStatus();
        } else {
            console.log("Invalid move or line already placed");
        }
    }

    updateStatus() {
        this.p1ScoreEl.textContent = `P1: ${this.game.scores['P1']}`;
        this.p2ScoreEl.textContent = `P2: ${this.game.scores['P2']}`;

        const currentPlayer = this.game.getCurrentPlayer();

        if (this.game.gameOver) {
            this.turnIndicator.textContent = `Winner: ${this.game.winner === 'Draw' ? 'Draw!' : this.game.winner + ' Wins!'}`;
            this.turnIndicator.className = 'turn-indicator'; // Reset colors or add gold
            this.messageEl.textContent = "Game Over!";
        } else {
            this.turnIndicator.textContent = `${currentPlayer === 'P1' ? 'Player 1' : 'Player 2'}'s Turn`;
            this.turnIndicator.className = `turn-indicator ${currentPlayer === 'P1' ? 'p1-turn' : 'p2-turn'}`;
        }
    }
}
