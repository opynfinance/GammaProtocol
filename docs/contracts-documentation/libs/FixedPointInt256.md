# Functions:

- `fromUnscaledInt(int256 a) (internal)`

- `add(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `sub(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `mul(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `div(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `min(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `max(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `isEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `isGreaterThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `isGreaterThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `isLessThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

- `isLessThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) (internal)`

# Function `fromUnscaledInt(int256 a) → struct FixedPointInt256.FixedPointInt` (internal)

Constructs an `FixedPointInt` from an unscaled int, e.g., `b=5` gets stored internally as `5**18`.

## Parameters:

- `a`: int to convert into a FixedPoint.

## Return Values:

- the converted FixedPoint.

# Function `add(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

return the sum of two signed integer

## Parameters:

- `a`: FixedPoint

- `b`: FixedPoint

## Return Values:

- sum of two signed integer

# Function `sub(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

return the difference of two signed integer

## Parameters:

- `a`: FixedPoint

- `b`: FixedPoint

## Return Values:

- difference of two fixed point

# Function `mul(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

multiply two signed integer

rounds to zero if a*b < SCALING_FACTOR / 2

## Parameters:

- `a`: FixedPoint

- `b`: FixedPoint

## Return Values:

- mul of two fixed point

# Function `div(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

divide two FixedPoint

rounds to zero if a*b < SCALING_FACTOR / 2

## Parameters:

- `a`: FixedPoint

- `b`: FixedPoint

## Return Values:

- div of two signed integer

# Function `min(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

the minimum between a and b

## Parameters:

- `a`: signed integer

- `b`: signed integer

## Return Values:

- min of two signed integer

# Function `max(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt` (internal)

the maximum between a and b

## Parameters:

- `a`: signed integer

- `b`: signed integer

## Return Values:

- max of two signed integer

# Function `isEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is equal to `b`.

## Parameters:

- `a`: a signed integer

- `b`: a signed integer

## Return Values:

- True if equal, or False.

# Function `isGreaterThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is greater than `b`.

## Parameters:

- `a`: a signed integer

- `b`: a signed integer

## Return Values:

- True if `a > b`, or False.

# Function `isGreaterThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is greater than or equal to `b`.

## Parameters:

- `a`: a signed integer

- `b`: a signed integer

## Return Values:

- True if `a >= b`, or False.

# Function `isLessThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is less than `b`.

## Parameters:

- `a`: a signed integer

- `b`: a signed integer

## Return Values:

- True if `a < b`, or False.

# Function `isLessThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool` (internal)

Whether `a` is less than or equal to `b`.

## Parameters:

- `a`: a Fixed

- `b`: a signed integer

## Return Values:

- True if `a <= b`, or False.
