#ifndef DOTDOT_DOMAIN_MODEL_GAME_H_
#define DOTDOT_DOMAIN_MODEL_GAME_H_

#include <map>
#include <string>
#include <vector>

#include "dotdot/domain/model/board.h"
#include "dotdot/domain/model/value_objects.h"

namespace dotdot {

struct GameResult {
  bool success;
  std::string message;
  bool extra_turn;
  std::vector<Coordinate> new_squares;
};

class Game {
 public:
  Game(int rows = 10, int cols = 10);

  [[nodiscard]] std::string GetCurrentPlayer() const;
  GameResult PlayMove(char type, int r, int c);
  
  [[nodiscard]] bool IsGameOver() const;
  [[nodiscard]] std::string GetWinner() const;
  
  [[nodiscard]] const Board& GetBoard() const { return board_; }
  [[nodiscard]] const std::map<std::string, int>& GetScores() const { return scores_; }
  [[nodiscard]] const Move& GetLastMove() const { return last_move_; }
  [[nodiscard]] bool HasLastMove() const { return has_last_move_; }

 private:
  Board board_;
  std::vector<std::string> players_;
  int current_player_index_;
  std::map<std::string, int> scores_;
  
  bool game_over_;
  std::string winner_;
  Move last_move_;
  bool has_last_move_;
  
  std::vector<Coordinate> CheckForCompletedSquares(char type, int r, int c);
  void SwitchTurn();
  void CheckGameOver();
};

}  // namespace dotdot

#endif  // DOTDOT_DOMAIN_MODEL_GAME_H_
