#include <gtest/gtest.h>
#include "dotdot/domain/model/board.h"

namespace dotdot {
namespace {

TEST(BoardTest, Initialization) {
  Board board(3, 3);
  EXPECT_EQ(board.rows(), 3);
  EXPECT_EQ(board.cols(), 3);
  EXPECT_EQ(board.total_squares(), 4);
}

TEST(BoardTest, PlaceHorizontalLine) {
  Board board(3, 3);
  // Valid placement
  EXPECT_TRUE(board.PlaceHorizontalLine(0, 0));
  EXPECT_TRUE(board.HasHorizontalLine(0, 0));
  
  // Duplicate placement
  EXPECT_FALSE(board.PlaceHorizontalLine(0, 0));
  
  // Out of bounds
  EXPECT_FALSE(board.PlaceHorizontalLine(3, 0));
  EXPECT_FALSE(board.PlaceHorizontalLine(0, 2)); // cols-1 is limit
}

TEST(BoardTest, PlaceVerticalLine) {
  Board board(3, 3);
  // Valid placement
  EXPECT_TRUE(board.PlaceVerticalLine(0, 0));
  EXPECT_TRUE(board.HasVerticalLine(0, 0));
  
  // Duplicate placement
  EXPECT_FALSE(board.PlaceVerticalLine(0, 0));
  
  // Out of bounds
  EXPECT_FALSE(board.PlaceVerticalLine(0, 3));
  EXPECT_FALSE(board.PlaceVerticalLine(2, 0)); // rows-1 is limit
}

TEST(BoardTest, SquareCompletion) {
  Board board(3, 3);
  
  // Top-left square (0,0)
  board.PlaceHorizontalLine(0, 0);
  board.PlaceHorizontalLine(1, 0);
  board.PlaceVerticalLine(0, 0);
  
  EXPECT_FALSE(board.IsSquareComplete(0, 0));
  
  board.PlaceVerticalLine(0, 1);
  EXPECT_TRUE(board.IsSquareComplete(0, 0));
}

TEST(BoardTest, ClaimSquare) {
  Board board(3, 3);
  // Helper to complete (0,0)
  board.PlaceHorizontalLine(0, 0); board.PlaceHorizontalLine(1, 0);
  board.PlaceVerticalLine(0, 0);   board.PlaceVerticalLine(0, 1);
  
  EXPECT_TRUE(board.ClaimSquareIfComplete(0, 0, "P1"));
  
  // Cannot claim again
  EXPECT_FALSE(board.ClaimSquareIfComplete(0, 0, "P2"));
}

}  // namespace
}  // namespace dotdot
