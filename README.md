# DotDot Game

A modern implementation of "Dots and Boxes" featuring a C++ Core Engine compiled to WebAssembly.

## Architecture
- **Core Engine**: C++23 (Domain Driven Design) located in `core/`.
- **Frontend**: Vanilla JS + HTML5 + CSS3 located in `web/`.
- **Integration**: Emscripten (WebAssembly) via `core/src/bindings/`.

## Running the Game (Docker)
The easiest way to run the game is using Docker Compose. This handles both Building (C++ → Wasm) and Serving.

### Prerequisites (Docker)
- Docker Desktop or Docker Engine.

### Start
```bash
docker-compose up
```
1.  **Build**: The `builder` container will compile the C++ code to `web/js/dotdot_core.wasm`.
2.  **Serve**: The `server` container will start Nginx.
3.  **Play**: Open **[http://localhost:8080](http://localhost:8080)**.

To rebuild the C++ code after making changes, simply run `docker-compose up --build` or just `docker-compose up` again (since the builder runs on startup).

---

## Local Development (Manual)
If you prefer not to use Docker:

### Prerequisites (Manual)
- **Emscripten SDK**: `brew install emscripten`
- **Python 3**: For serving.

### Build & Run
1.  **Build Wasm**:
    ```bash
    ./build_wasm.sh
    ```
2.  **Serve**:
    ```bash
    python3 -m http.server
    ```
3.  **Play**: Open `http://localhost:8000/web/`.

## Testing (C++ Core)
The project includes GoogleTest unit tests for the core engine.
```bash
./build_and_test.sh
```
