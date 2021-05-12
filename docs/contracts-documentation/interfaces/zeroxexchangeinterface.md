# `ZeroXExchangeInterface`

ZeroX Exchange contract interface.

## Functions:

- `batchFillLimitOrders(struct ZeroXExchangeInterface.LimitOrder[] orders, struct ZeroXExchangeInterface.Signature[] signatures, uint128[] takerTokenFillAmounts, bool revertIfIncomplete) (external)`

### Function `batchFillLimitOrders(struct ZeroXExchangeInterface.LimitOrder[] orders, struct ZeroXExchangeInterface.Signature[] signatures, uint128[] takerTokenFillAmounts, bool revertIfIncomplete) → uint128[] takerTokenFilledAmounts, uint128[] makerTokenFilledAmounts external`

Executes multiple calls of fillLimitOrder.

#### Parameters:

- `orders`: Array of order specifications.

- `takerTokenFillAmounts`: Array of desired amounts of takerToken to sell in orders.

- `signatures`: Array of proofs that orders have been created by makers.

#### Return Values:

- takerTokenFilledAmounts Array of amount of takerToken(s) filled.

- makerTokenFilledAmounts Array of amount of makerToken(s) filled.
