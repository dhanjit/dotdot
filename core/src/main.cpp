#include <iostream>
#include <cstdlib>
#include <ctime>

#include "dotdot/domain/model/game.h"
#include "dotdot/domain/service/ai_service.h"

int main() {
  std::srand(std::time(nullptr));
  std::cout << "DotDot Core Engine (DDD + C++23)" << std::endl;

  // Create a 3x3 grid (2x2 squares)
  dotdot::Game game(3, 3);
  
  dotdot::AIService ai1("greedy");
  dotdot::AIService ai2("strategic");

  std::cout << "Starting AI vs AI game (3x3 grid)..." << std::endl;

  int moves = 0;
  while (!game.IsGameOver()) {
    std::string player = game.GetCurrentPlayer();
    dotdot::Move move;
    
    // AI Service calculates move based on Game state
    if (player == "P1") {
      move = ai1.CalculateMove(game);
    } else {
      move = ai2.CalculateMove(game);
    }

    dotdot::GameResult result = game.PlayMove(move.type, move.r, move.c);

    std::cout << "Move " << ++moves << ": " << player << " placed " << move.type
              << " at (" << move.r << "," << move.c << ")";

    if (result.success) {
      if (result.extra_turn) {
        std::cout << " [SCORED! Extra Turn]";
      }
    } else {
      std::cout << " [FAILED: " << result.message << "]" << std::endl;
      break;
    }
    std::cout << std::endl;

    if (moves > 100) {
      std::cout << "Force break: too many moves" << std::endl;
      break;
    }
  }

  std::cout << "-----------------------------------" << std::endl;
  std::cout << "Game Over! Winner: " << game.GetWinner() << std::endl;
  std::cout << "Scores:" << std::endl;
  auto scores = game.GetScores();
  std::cout << "P1: " << scores.at("P1") << std::endl;
  std::cout << "P2: " << scores.at("P2") << std::endl;

  return 0;
}
