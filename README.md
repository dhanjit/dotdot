# DotDot

A classic two-player strategy game (Dots and Boxes) where players take turns connecting dots to form squares.

## Game Rules
- **Grid**: Starts with an NxN matrix of dots.
- **Turn**: Connect two adjacent dots with a horizontal or vertical line.
- **Scoring**: If a line completes a square, the player captures it (marked with initials) and gets another turn.
- **Winning**: The game ends when all squares are captured. The player with the most squares wins.

## Development
This project follows the structure of `paperballs`.
- `web/`: Contains the game source code.
- `tests/`: Contains automated tests.

## Running Locally
Just open `web/index.html` in your browser.

## Testing
Run `npm install` then `npm test`.
