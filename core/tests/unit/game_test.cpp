#include <gtest/gtest.h>
#include "dotdot/domain/model/game.h"

namespace dotdot {
namespace {

TEST(GameTest, TurnSwitching) {
  Game game(3, 3);
  EXPECT_EQ(game.GetCurrentPlayer(), "P1");
  
  // Make a non-scoring move
  auto result = game.PlayMove('h', 0, 0);
  EXPECT_TRUE(result.success);
  EXPECT_FALSE(result.extra_turn);
  EXPECT_EQ(game.GetCurrentPlayer(), "P2");
  
  // P2 move
  result = game.PlayMove('h', 1, 0);
  EXPECT_EQ(game.GetCurrentPlayer(), "P1");
}

TEST(GameTest, ScoringAndExtraTurn) {
  Game game(3, 3);
  // Setup square (0,0) almost complete
  game.PlayMove('h', 0, 0); // P1
  game.PlayMove('h', 1, 0); // P2
  game.PlayMove('v', 0, 0); // P1
  
  // P2 completes it
  auto result = game.PlayMove('v', 0, 1); // P2
  
  EXPECT_TRUE(result.success);
  EXPECT_TRUE(result.extra_turn);
  // Should still be P2's turn
  EXPECT_EQ(game.GetCurrentPlayer(), "P2");
  
  // Score update
  EXPECT_EQ(game.GetScores().at("P2"), 1);
  EXPECT_EQ(game.GetScores().at("P1"), 0);
}

TEST(GameTest, InvalidMoves) {
  Game game(3, 3);
  auto result = game.PlayMove('x', 0, 0);
  EXPECT_FALSE(result.success);
  EXPECT_EQ(result.message, "Invalid line type");
  
  game.PlayMove('h', 0, 0);
  result = game.PlayMove('h', 0, 0);
  EXPECT_FALSE(result.success);
  EXPECT_EQ(result.message, "Invalid move or line already placed");
}

TEST(GameTest, GameOver) {
  // 2x2 grid = 1 square.
  Game game(2, 2);
  
  game.PlayMove('h', 0, 0);
  game.PlayMove('h', 1, 0);
  game.PlayMove('v', 0, 0);
  game.PlayMove('v', 0, 1);
  
  EXPECT_TRUE(game.IsGameOver());
  EXPECT_NE(game.GetWinner(), "");
}

}  // namespace
}  // namespace dotdot
