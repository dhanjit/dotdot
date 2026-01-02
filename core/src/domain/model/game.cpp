#include "dotdot/domain/model/game.h"

namespace dotdot {

Game::Game(int rows, int cols)
    : board_(rows, cols),
      players_({"P1", "P2"}),
      current_player_index_(0),
      game_over_(false),
      has_last_move_(false) {
  scores_["P1"] = 0;
  scores_["P2"] = 0;
}

std::string Game::GetCurrentPlayer() const {
  return players_[current_player_index_];
}

GameResult Game::PlayMove(char type, int r, int c) {
  GameResult result;
  result.success = false;
  result.extra_turn = false;

  if (game_over_) {
    result.message = "Game over";
    return result;
  }

  bool placed = false;
  if (type == 'h') {
    placed = board_.PlaceHorizontalLine(r, c);
  } else if (type == 'v') {
    placed = board_.PlaceVerticalLine(r, c);
  } else {
    result.message = "Invalid line type";
    return result;
  }

  if (!placed) {
    result.message = "Invalid move or line already placed";
    return result;
  }

  last_move_ = {type, r, c};
  has_last_move_ = true;

  std::vector<Coordinate> completed = CheckForCompletedSquares(type, r, c);
  
  if (!completed.empty()) {
    std::string player = GetCurrentPlayer();
    for (const auto& sq : completed) {
      if (board_.ClaimSquareIfComplete(sq.r, sq.c, player)) {
          scores_[player]++;
          result.new_squares.push_back(sq);
      }
    }
    
    CheckGameOver();
    
    result.success = true;
    result.extra_turn = true;
  } else {
    SwitchTurn();
    result.success = true;
    result.extra_turn = false;
  }
  
  return result;
}

std::vector<Coordinate> Game::CheckForCompletedSquares(char type, int r, int c) {
  std::vector<Coordinate> completed;
  
  if (type == 'h') {
    if (r > 0 && board_.IsSquareComplete(r - 1, c)) completed.push_back({r - 1, c});
    if (r < board_.rows() - 1 && board_.IsSquareComplete(r, c)) completed.push_back({r, c});
  } else {
    if (c > 0 && board_.IsSquareComplete(r, c - 1)) completed.push_back({r, c - 1});
    if (c < board_.cols() - 1 && board_.IsSquareComplete(r, c)) completed.push_back({r, c});
  }
  
  return completed;
}

void Game::SwitchTurn() {
  current_player_index_ = 1 - current_player_index_;
}

void Game::CheckGameOver() {
  int occupied = scores_["P1"] + scores_["P2"];
  if (occupied == board_.total_squares()) {
    game_over_ = true;
    if (scores_["P1"] > scores_["P2"]) winner_ = "P1";
    else if (scores_["P2"] > scores_["P1"]) winner_ = "P2";
    else winner_ = "Draw";
  }
}

bool Game::IsGameOver() const { return game_over_; }
std::string Game::GetWinner() const { return winner_; }

}  // namespace dotdot
