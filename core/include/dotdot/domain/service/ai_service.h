#ifndef DOTDOT_DOMAIN_SERVICE_AI_SERVICE_H_
#define DOTDOT_DOMAIN_SERVICE_AI_SERVICE_H_

#include <string>
#include <vector>
#include "dotdot/domain/model/game.h"
#include "dotdot/domain/model/board.h"

namespace dotdot {

class AIService {
 public:
  explicit AIService(std::string difficulty = "greedy");

  Move CalculateMove(const Game& game);

 private:
  std::string difficulty_;

  std::vector<Move> GetAllAvailableMoves(const Board& board);
  std::vector<Move> FindScoringMoves(const Board& board);
  std::vector<Move> FindSafeMoves(const Board& board);
  
  int CountLines(const Board& board, int r, int c);
  
  // Logic migrated to helper functions
  Move PickBestSafeMove(const Board& board, const Game& game, const std::vector<Move>& safe_moves);
  Move PickLeastBadSacrifice(const Board& board, const Game& game);
  Move PickMoveNearLast(const Game& game, const std::vector<Move>& moves);
};

}  // namespace dotdot

#endif  // DOTDOT_DOMAIN_SERVICE_AI_SERVICE_H_
