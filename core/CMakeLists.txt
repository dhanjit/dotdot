cmake_minimum_required(VERSION 3.20)
project(dotdot_core)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED True)
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# Include directory for headers
include_directories(include)

# GoogleTest FetchContent
include(FetchContent)
FetchContent_Declare(
  googletest
  URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
)
# For Windows: Prevent overriding the parent project's compiler/linker settings
set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

# --- Core Library ---
file(GLOB_RECURSE SRC_FILES "src/domain/*.cpp")
add_library(dotdot_lib ${SRC_FILES})
# Add include directory to the library's public interface
target_include_directories(dotdot_lib PUBLIC include)

# --- Main CLI ---
add_executable(dotdot_cli src/main.cpp)
target_link_libraries(dotdot_cli PRIVATE dotdot_lib)

# --- Testing ---
enable_testing()

# Unit Tests
file(GLOB_RECURSE TEST_FILES "tests/*.cpp")

add_executable(dotdot_tests ${TEST_FILES})
target_link_libraries(dotdot_tests PRIVATE dotdot_lib GTest::gtest_main GTest::gmock)

include(GoogleTest)
gtest_discover_tests(dotdot_tests)
