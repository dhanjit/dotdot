#include "dotdot/domain/model/board.h"

namespace dotdot {

Board::Board(int rows, int cols)
    : rows_(rows),
      cols_(cols),
      total_squares_((rows - 1) * (cols - 1)) {
  horizontal_lines_.resize(rows, std::vector<bool>(cols - 1, false));
  vertical_lines_.resize(rows - 1, std::vector<bool>(cols, false));
  squares_.resize(rows - 1, std::vector<std::string>(cols - 1, ""));
}

bool Board::PlaceHorizontalLine(int r, int c) {
  if (r < 0 || r >= rows_ || c < 0 || c >= cols_ - 1) return false;
  if (horizontal_lines_[r][c]) return false;
  horizontal_lines_[r][c] = true;
  return true;
}

bool Board::PlaceVerticalLine(int r, int c) {
  if (r < 0 || r >= rows_ - 1 || c < 0 || c >= cols_) return false;
  if (vertical_lines_[r][c]) return false;
  vertical_lines_[r][c] = true;
  return true;
}

bool Board::HasHorizontalLine(int r, int c) const {
  if (r < 0 || r >= rows_ || c < 0 || c >= cols_ - 1) return false;
  return horizontal_lines_[r][c];
}

bool Board::HasVerticalLine(int r, int c) const {
  if (r < 0 || r >= rows_ - 1 || c < 0 || c >= cols_) return false;
  return vertical_lines_[r][c];
}

bool Board::IsSquareComplete(int r, int c) const {
  if (r < 0 || c < 0 || r >= rows_ - 1 || c >= cols_ - 1) return false;
  return horizontal_lines_[r][c] && horizontal_lines_[r + 1][c] &&
         vertical_lines_[r][c] && vertical_lines_[r][c + 1];
}

bool Board::ClaimSquareIfComplete(int r, int c, const std::string& owner) {
  if (!IsSquareComplete(r, c)) return false;
  if (!squares_[r][c].empty()) return false; // Already claimed
  
  squares_[r][c] = owner;
  return true;
}

}  // namespace dotdot
