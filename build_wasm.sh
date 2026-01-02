#!/bin/bash
set -e

# Output directory
mkdir -p web/js

# Compile to WebAssembly
# Requires Emscripten (emcc) to be in PATH
echo "Compiling C++ to WebAssembly..."

emcc -std=c++20 \
    -Icore/include \
    core/src/domain/model/board.cpp \
    core/src/domain/model/game.cpp \
    core/src/domain/service/ai_service.cpp \
    core/src/bindings/wasm_bindings.cpp \
    -lembind \
    -o web/js/dotdot_core.js

echo "Build complete. Output: web/js/dotdot_core.js and web/js/dotdot_core.wasm"
