#include "dotdot/domain/service/ai_service.h"
#include <algorithm>
#include <cmath>
#include <cstdlib>

namespace dotdot {

AIService::AIService(std::string difficulty) : difficulty_(std::move(difficulty)) {}

Move AIService::CalculateMove(const Game& game) {
  const Board& board = game.GetBoard();
  
  // 1. Scoring
  auto scoring = FindScoringMoves(board);
  if (!scoring.empty()) return scoring[0];

  // 2. Safe
  auto safe = FindSafeMoves(board);
  if (!safe.empty()) {
    if (difficulty_ == "strategic") return PickBestSafeMove(board, game, safe);
    else return PickMoveNearLast(game, safe);
  }

  // 3. Sacrifice
  if (difficulty_ == "strategic") return PickLeastBadSacrifice(board, game);
  return PickMoveNearLast(game, GetAllAvailableMoves(board));
}

std::vector<Move> AIService::GetAllAvailableMoves(const Board& board) {
  std::vector<Move> moves;
  for (int r = 0; r < board.rows(); ++r) {
    for (int c = 0; c < board.cols() - 1; ++c) {
      if (!board.HasHorizontalLine(r, c)) moves.push_back({'h', r, c});
    }
  }
  for (int r = 0; r < board.rows() - 1; ++r) {
    for (int c = 0; c < board.cols(); ++c) {
      if (!board.HasVerticalLine(r, c)) moves.push_back({'v', r, c});
    }
  }
  return moves;
}

int AIService::CountLines(const Board& board, int r, int c) {
  int count = 0;
  if (board.HasHorizontalLine(r, c)) count++;
  if (board.HasHorizontalLine(r + 1, c)) count++;
  if (board.HasVerticalLine(r, c)) count++;
  if (board.HasVerticalLine(r, c + 1)) count++;
  return count;
}

std::vector<Move> AIService::FindScoringMoves(const Board& board) {
  auto moves = GetAllAvailableMoves(board);
  std::vector<Move> result;
  for (const auto& m : moves) {
    bool scoring = false;
    // Check if adding this line completes a square (makes line count 4 -> currently 3)
    if (m.type == 'h') {
        if (m.r > 0 && CountLines(board, m.r - 1, m.c) == 3) scoring = true;
        if (m.r < board.rows() - 1 && CountLines(board, m.r, m.c) == 3) scoring = true;
    } else {
        if (m.c > 0 && CountLines(board, m.r, m.c - 1) == 3) scoring = true;
        if (m.c < board.cols() - 1 && CountLines(board, m.r, m.c) == 3) scoring = true;
    }
    if (scoring) result.push_back(m);
  }
  return result;
}

std::vector<Move> AIService::FindSafeMoves(const Board& board) {
  auto moves = GetAllAvailableMoves(board);
  std::vector<Move> result;
  for (const auto& m : moves) {
    bool unsafe = false;
    // Unsafe if it makes a square have 3 lines (giveaway)
    if (m.type == 'h') {
        if (m.r > 0 && CountLines(board, m.r - 1, m.c) == 2) unsafe = true;
        if (m.r < board.rows() - 1 && CountLines(board, m.r, m.c) == 2) unsafe = true;
    } else {
        if (m.c > 0 && CountLines(board, m.r, m.c - 1) == 2) unsafe = true;
        if (m.c < board.cols() - 1 && CountLines(board, m.r, m.c) == 2) unsafe = true;
    }
    if (!unsafe) result.push_back(m);
  }
  return result;
}

Move AIService::PickMoveNearLast(const Game& game, const std::vector<Move>& moves) {
  if (!game.HasLastMove() || moves.size() <= 1) return moves[rand() % moves.size()];
  
  auto last = game.GetLastMove();
  auto best = moves[0];
  int best_dist = 10000;
  
  std::vector<Move> candidates;
  
  for (const auto& m : moves) {
    int dist = std::abs(m.r - last.r) + std::abs(m.c - last.c);
    if (dist < best_dist) {
        best_dist = dist;
        candidates.clear();
        candidates.push_back(m);
    } else if (dist == best_dist) {
        candidates.push_back(m);
    }
  }
  
  return candidates[rand() % candidates.size()];
}

Move AIService::PickBestSafeMove(const Board& board, const Game& game, const std::vector<Move>& safe_moves) {
    // Simplification: just random safe move near last for now, implementing logic similar to JS version requires 'GetAffectedSquares' logic repetition
    return PickMoveNearLast(game, safe_moves);
}

Move AIService::PickLeastBadSacrifice(const Board& board, const Game& game) {
    auto moves = GetAllAvailableMoves(board);
    // Simplification: random for now
    return PickMoveNearLast(game, moves);
}

}  // namespace dotdot
