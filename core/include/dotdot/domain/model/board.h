#ifndef DOTDOT_DOMAIN_MODEL_BOARD_H_
#define DOTDOT_DOMAIN_MODEL_BOARD_H_

#include <string>
#include <vector>

#include "dotdot/domain/model/value_objects.h"

namespace dotdot {

class Board {
 public:
  Board(int rows, int cols);

  [[nodiscard]] bool PlaceHorizontalLine(int r, int c);
  [[nodiscard]] bool PlaceVerticalLine(int r, int c);

  [[nodiscard]] bool HasHorizontalLine(int r, int c) const;
  [[nodiscard]] bool HasVerticalLine(int r, int c) const;

  [[nodiscard]] bool IsSquareComplete(int r, int c) const;
  
  // Checks and sets owner if square is newly complete. Returns true if claimed.
  bool ClaimSquareIfComplete(int r, int c, const std::string& owner);
  
  [[nodiscard]] int rows() const { return rows_; }
  [[nodiscard]] int cols() const { return cols_; }
  [[nodiscard]] int total_squares() const { return total_squares_; }

 private:
  int rows_;
  int cols_;
  int total_squares_;
  
  std::vector<std::vector<bool>> horizontal_lines_;
  std::vector<std::vector<bool>> vertical_lines_;
  std::vector<std::vector<std::string>> squares_;
};

}  // namespace dotdot

#endif  // DOTDOT_DOMAIN_MODEL_BOARD_H_
