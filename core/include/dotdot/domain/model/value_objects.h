#ifndef DOTDOT_DOMAIN_MODEL_VALUE_OBJECTS_H_
#define DOTDOT_DOMAIN_MODEL_VALUE_OBJECTS_H_

namespace dotdot {

struct Coordinate {
  int r;
  int c;

  auto operator<=>(const Coordinate&) const = default;
};

struct Move {
  char type;  // 'h' or 'v'
  int r;
  int c;
};

}  // namespace dotdot

#endif  // DOTDOT_DOMAIN_MODEL_VALUE_OBJECTS_H_
