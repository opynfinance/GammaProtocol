## `AggregatorInterface`

Interface of the Chainlink aggregator

### `latestAnswer() → int256` (external)

### `latestTimestamp() → uint256` (external)

### `latestRound() → uint256` (external)

### `getAnswer(uint256 roundId) → int256` (external)

### `getTimestamp(uint256 roundId) → uint256` (external)

### `AnswerUpdated(int256 current, uint256 roundId, uint256 timestamp)`

### `NewRound(uint256 roundId, address startedBy, uint256 startedAt)`
