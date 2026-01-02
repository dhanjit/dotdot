#!/bin/bash
set -e

# Setup directories
mkdir -p core/build/gtest
cd core/build/gtest

# Clone GoogleTest if not exists
if [ ! -d "googletest" ]; then
    git clone https://github.com/google/googletest.git
fi

# Compile GTest
cd googletest
clang++ -std=c++20 -isystem googletest/include -Igoogletest -isystem googlemock/include -Igooglemock -c googletest/src/gtest-all.cc
clang++ -std=c++20 -isystem googletest/include -Igoogletest -isystem googlemock/include -Igooglemock -c googletest/src/gtest_main.cc
clang++ -std=c++20 -isystem googletest/include -Igoogletest -isystem googlemock/include -Igooglemock -c googlemock/src/gmock-all.cc
ar -rv libgtest.a gtest-all.o gtest_main.o
ar -rv libgmock.a gmock-all.o
cd ../../../..

# Compile Application Objects
clang++ -std=c++20 -Icore/include -c core/src/domain/model/board.cpp -o core/build/board.o
clang++ -std=c++20 -Icore/include -c core/src/domain/model/game.cpp -o core/build/game.o
clang++ -std=c++20 -Icore/include -c core/src/domain/service/ai_service.cpp -o core/build/ai_service.o

# Compile and Link Tests
clang++ -std=c++20 -Icore/include -Icore/build/gtest/googletest/googletest/include -Icore/build/gtest/googletest/googlemock/include \
    core/tests/unit/*.cpp core/tests/integration/*.cpp \
    core/build/board.o core/build/game.o core/build/ai_service.o \
    core/build/gtest/googletest/libgtest.a \
    core/build/gtest/googletest/libgmock.a \
    -o core/build/run_tests -lpthread

# Run Tests
./core/build/run_tests
