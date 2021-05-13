# `Mock0xExchange`

Mock 0x Exchange

## Functions:

- `fillLimitOrder(struct ZeroXExchangeInterface.LimitOrder _order, struct ZeroXExchangeInterface.Signature _signature, uint128 _takerTokenFillAmount) (public)`

- `batchFillLimitOrders(struct ZeroXExchangeInterface.LimitOrder[] _orders, struct ZeroXExchangeInterface.Signature[] _signatures, uint128[] _takerTokenFillAmounts, bool _revertIfIncomplete) (external)`

### Function `fillLimitOrder(struct ZeroXExchangeInterface.LimitOrder _order, struct ZeroXExchangeInterface.Signature _signature, uint128 _takerTokenFillAmount) → uint128 takerTokenFilledAmount, uint128 makerTokenFilledAmount public`

### Function `batchFillLimitOrders(struct ZeroXExchangeInterface.LimitOrder[] _orders, struct ZeroXExchangeInterface.Signature[] _signatures, uint128[] _takerTokenFillAmounts, bool _revertIfIncomplete) → uint128[] takerTokenFilledAmounts, uint128[] makerTokenFilledAmounts external`
