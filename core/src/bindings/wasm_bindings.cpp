#include <emscripten/bind.h>
#include "dotdot/domain/model/game.h"
#include "dotdot/domain/service/ai_service.h"

using namespace emscripten;
using namespace dotdot;

// Helper function to convert map to JS object (optional, or just expose map)
// Emscripten supports map automatically with register_map

EMSCRIPTEN_BINDINGS(dotdot_module) {
  // Value Objects
  value_object<Coordinate>("Coordinate")
    .field("r", &Coordinate::r)
    .field("c", &Coordinate::c);

  value_object<Move>("Move")
    .field("type", &Move::type)
    .field("r", &Move::r)
    .field("c", &Move::c);

  value_object<GameResult>("GameResult")
    .field("success", &GameResult::success)
    .field("message", &GameResult::message)
    .field("extra_turn", &GameResult::extra_turn)
    .field("new_squares", &GameResult::new_squares);

  // Entities
  class_<Game>("Game")
    .constructor<int, int>()
    .function("GetCurrentPlayer", &Game::GetCurrentPlayer)
    .function("PlayMove", &Game::PlayMove)
    .function("IsGameOver", &Game::IsGameOver)
    .function("GetWinner", &Game::GetWinner)
    .function("GetScores", &Game::GetScores);

  // Map Support
  register_map<std::string, int>("MapStringInt");
  register_vector<Coordinate>("VectorCoordinate");

  // Service
  class_<AIService>("AIService")
    .constructor<std::string>()
    .function("CalculateMove", &AIService::CalculateMove);
}
