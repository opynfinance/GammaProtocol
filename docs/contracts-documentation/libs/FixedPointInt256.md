## `FixedPointInt256`

### `fromUnscaledInt(int256 a) → struct FixedPointInt256.FixedPointInt` (internal)

Constructs an `FixedPointInt` from an unscaled int, e.g., `b=5` gets stored internally as `5**18`.

### `add(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

return the sum of two signed integer

### `sub(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

return the difference of two signed integer

### `mul(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

multiply two signed integer

rounds to zero if a*b < SCALING_FACTOR / 2

### `div(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

divide two FixedPoint

rounds to zero if a*b < SCALING_FACTOR / 2

### `min(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

the minimum between a and b

### `max(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

the maximum between a and b

### `isEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is equal to `b`.

### `isGreaterThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is greater than `b`.

### `isGreaterThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is greater than or equal to `b`.

### `isLessThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is less than `b`.

### `isLessThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is less than or equal to `b`.
