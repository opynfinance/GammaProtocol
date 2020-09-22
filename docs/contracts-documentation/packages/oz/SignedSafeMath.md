## `SignedSafeMath`

Signed math operations with safety checks that revert on error.

### `mul(int256 a, int256 b) → int256` (internal)

Returns the multiplication of two signed integers, reverting on

overflow.

Counterpart to Solidity's `*` operator.

Requirements:

- Multiplication cannot overflow.

### `div(int256 a, int256 b) → int256` (internal)

Returns the integer division of two signed integers. Reverts on

division by zero. The result is rounded towards zero.

Counterpart to Solidity's `/` operator. Note: this function uses a

`revert` opcode (which leaves remaining gas untouched) while Solidity

uses an invalid opcode to revert (consuming all remaining gas).

Requirements:

- The divisor cannot be zero.

### `sub(int256 a, int256 b) → int256` (internal)

Returns the subtraction of two signed integers, reverting on

overflow.

Counterpart to Solidity's `-` operator.

Requirements:

- Subtraction cannot overflow.

### `add(int256 a, int256 b) → int256` (internal)

Returns the addition of two signed integers, reverting on

overflow.

Counterpart to Solidity's `+` operator.

Requirements:

- Addition cannot overflow.
