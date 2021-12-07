# `FixedPointInt256`

FixedPoint library

## Functions:

- `fromUnscaledInt(int256 a) (internal)`

- `fromScaledUint(uint256 _a, uint256 _decimals) (internal)`

- `toScaledUint(struct FixedPointInt256.FixedPointInt _a, uint256 _decimals, bool _roundDown) (internal)`

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

### Function `fromUnscaledInt(int256 a) → struct FixedPointInt256.FixedPointInt internal`

constructs an `FixedPointInt` from an unscaled int, e.g., `b=5` gets stored internally as `5**27`.

#### Parameters:

- `a`: int to convert into a FixedPoint.

#### Return Values:

- the converted FixedPoint.

### Function `fromScaledUint(uint256 _a, uint256 _decimals) → struct FixedPointInt256.FixedPointInt internal`

constructs an FixedPointInt from an scaled uint with {_decimals} decimals

Examples:

(1)  USDC    decimals = 6

Input:  5 * 1e6 USDC  =>    Output: 5 * 1e27 (FixedPoint 5.0 USDC)

(2)  cUSDC   decimals = 8

Input:  5 * 1e6 cUSDC =>    Output: 5 * 1e25 (FixedPoint 0.05 cUSDC)

#### Parameters:

- `_a`: uint256 to convert into a FixedPoint.

- `_decimals`:  original decimals _a has

#### Return Values:

- the converted FixedPoint, with 27 decimals.

### Function `toScaledUint(struct FixedPointInt256.FixedPointInt _a, uint256 _decimals, bool _roundDown) → uint256 internal`

convert a FixedPointInt number to an uint256 with a specific number of decimals

#### Parameters:

- `_a`: FixedPointInt to convert

- `_decimals`: number of decimals that the uint256 should be scaled to

- `_roundDown`: True to round down the result, False to round up

#### Return Values:

- the converted uint256

### Function `add(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt internal`

add two signed integers, a + b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- sum of the two signed integers

### Function `sub(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt internal`

subtract two signed integers, a-b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- difference of two signed integers

### Function `mul(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt internal`

multiply two signed integers, a by b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- mul of two signed integers

### Function `div(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt internal`

divide two signed integers, a by b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- div of two signed integers

### Function `min(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt internal`

minimum between two signed integers, a and b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- min of two signed integers

### Function `max(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → struct FixedPointInt256.FixedPointInt internal`

maximum between two signed integers, a and b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- max of two signed integers

### Function `isEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool internal`

is a is equal to b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- True if equal, False if not

### Function `isGreaterThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool internal`

is a greater than b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- True if a > b, False if not

### Function `isGreaterThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool internal`

is a greater than or equal to b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- True if a >= b, False if not

### Function `isLessThan(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool internal`

is a is less than b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- True if a < b, False if not

### Function `isLessThanOrEqual(struct FixedPointInt256.FixedPointInt a, struct FixedPointInt256.FixedPointInt b) → bool internal`

is a less than or equal to b

#### Parameters:

- `a`: FixedPointInt

- `b`: FixedPointInt

#### Return Values:

- True if a <= b, False if not
