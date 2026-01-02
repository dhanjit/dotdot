#include <gtest/gtest.h>
#include "dotdot/domain/model/game.h"
#include "dotdot/domain/service/ai_service.h"

namespace dotdot {
namespace {

TEST(GameSimulationTest, FullGameAiVsAi) {
  // 3x3 grid = 2x2 squares = 4 squares total.
  Game game(3, 3);
  AIService ai1("greedy");
  AIService ai2("strategic");
  
  int moves = 0;
  while (!game.IsGameOver()) {
    std::string player = game.GetCurrentPlayer();
    Move move;
    if (player == "P1") {
      move = ai1.CalculateMove(game);
    } else {
      move = ai2.CalculateMove(game);
    }
    
    auto result = game.PlayMove(move.type, move.r, move.c);
    ASSERT_TRUE(result.success) << "AI generated invalid move";
    
    moves++;
    if (moves > 100) FAIL() << "Game simulation took too many moves";
  }
  
  // Verify invariants
  int p1_score = game.GetScores().at("P1");
  int p2_score = game.GetScores().at("P2");
  int total_squares = game.GetBoard().total_squares();
  
  EXPECT_EQ(p1_score + p2_score, total_squares);
  EXPECT_NE(game.GetWinner(), "");
}

}  // namespace
}  // namespace dotdot
