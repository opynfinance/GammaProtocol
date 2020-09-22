## `MockMarginCalculator`

### `constructor(address _addressBook)` (public)

### `getExpiredCashValue(address _otoken) → uint256` (public)

### `getExcessCollateral(struct MarginAccount.Vault _vault) → uint256, bool` (public)

### `_getMarginRequired(struct MarginAccount.Vault _vault) → struct FixedPointInt256.FixedPointInt marginRequired` (internal)

### `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt` (internal)

### `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt` (internal)

### `_getExpiredPutSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) → struct FixedPointInt256.FixedPointInt` (internal)

### `_getExpiredCallSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue, struct FixedPointInt256.FixedPointInt _underlyingPriceInt) → struct FixedPointInt256.FixedPointInt` (internal)

### `_checkIsValidSpread(struct MarginAccount.Vault _vault)` (internal)

### `_isMarginableLong(struct MarginAccount.Vault _vault) → bool` (internal)

### `_isMarginableCollateral(struct MarginAccount.Vault _vault) → bool` (internal)

### `_getUnderlyingPrice(address _otoken) → uint256, bool` (internal)

### `_uint256ToFixedPointInt(uint256 _num) → struct FixedPointInt256.FixedPointInt` (internal)

### `_isEmptyAssetArray(address[] _assets) → bool` (internal)
