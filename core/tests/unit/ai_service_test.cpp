#include <gtest/gtest.h>
#include "dotdot/domain/service/ai_service.h"
#include "dotdot/domain/model/game.h"

namespace dotdot {
namespace {

TEST(AIServiceTest, FindsScoringMove) {
  Game game(3, 3);
  AIService ai("greedy");
  
  // Setup: Square (0,0) needs one line 'v' at (0,1)
  game.PlayMove('h', 0, 0);
  game.PlayMove('h', 1, 0);
  game.PlayMove('v', 0, 0);
  // Now it's P2 (AI) turn
  
  Move move = ai.CalculateMove(game);
  
  // AI should find the winning move
  EXPECT_EQ(move.type, 'v');
  EXPECT_EQ(move.r, 0);
  EXPECT_EQ(move.c, 1);
}

TEST(AIServiceTest, AvoidsGivingAwaySquare) {
  Game game(3, 3);
  AIService ai("strategic");
  
  // Setup: Square (0,0) has 2 lines. Adding 3rd is "unsafe" (giveaway).
  // h(0,0), h(1,0). 
  // v(0,0) or v(0,1) would make it 3 lines.
  // We want to verify AI prefers a safe move elsewhere if possible.
  
  game.PlayMove('h', 0, 0);
  game.PlayMove('h', 1, 0); 
  // (0,0) has Top and Bottom.
  
  // AI Turn.
  Move move = ai.CalculateMove(game);
  
  // Check if chosen move is one of the dangerous ones
  bool bad_move = (move.type == 'v' && (move.c == 0 || move.c == 1) && move.r == 0);
  
  // It should NOT make a bad move unless forced.
  // There are plenty other moves in 3x3 grid.
  EXPECT_FALSE(bad_move);
}

}  // namespace
}  // namespace dotdot
