# `MockMarginCalculator`

## Functions:

- `constructor(address _addressBook) (public)`

- `getExpiredCashValue(address _otoken) (public)`

- `getExcessCollateral(struct MarginAccount.Vault _vault) (public)`

- `_getMarginRequired(struct MarginAccount.Vault _vault) (internal)`

- `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) (internal)`

- `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) (internal)`

- `_getExpiredPutSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) (internal)`

- `_getExpiredCallSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue, struct FixedPointInt256.FixedPointInt _underlyingPriceInt) (internal)`

- `_checkIsValidSpread(struct MarginAccount.Vault _vault) (internal)`

- `_isMarginableLong(struct MarginAccount.Vault _vault) (internal)`

- `_isMarginableCollateral(struct MarginAccount.Vault _vault) (internal)`

- `_getUnderlyingPrice(address _otoken) (internal)`

- `_uint256ToFixedPointInt(uint256 _num) (internal)`

- `_isEmptyAssetArray(address[] _assets) (internal)`

### Function `constructor(address _addressBook) public`

### Function `getExpiredCashValue(address _otoken) → uint256 public`

### Function `getExcessCollateral(struct MarginAccount.Vault _vault) → uint256, bool public`

### Function `_getMarginRequired(struct MarginAccount.Vault _vault) → struct FixedPointInt256.FixedPointInt marginRequired internal`

### Function `_getPutSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt internal`

### Function `_getCallSpreadMarginRequired(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortStrike, struct FixedPointInt256.FixedPointInt _longStrike) → struct FixedPointInt256.FixedPointInt internal`

### Function `_getExpiredPutSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue) → struct FixedPointInt256.FixedPointInt internal`

### Function `_getExpiredCallSpreadCashValue(struct FixedPointInt256.FixedPointInt _shortAmount, struct FixedPointInt256.FixedPointInt _longAmount, struct FixedPointInt256.FixedPointInt _shortCashValue, struct FixedPointInt256.FixedPointInt _longCashValue, struct FixedPointInt256.FixedPointInt _underlyingPriceInt) → struct FixedPointInt256.FixedPointInt internal`

### Function `_checkIsValidSpread(struct MarginAccount.Vault _vault) internal`

### Function `_isMarginableLong(struct MarginAccount.Vault _vault) → bool internal`

### Function `_isMarginableCollateral(struct MarginAccount.Vault _vault) → bool internal`

### Function `_getUnderlyingPrice(address _otoken) → uint256, bool internal`

### Function `_uint256ToFixedPointInt(uint256 _num) → struct FixedPointInt256.FixedPointInt internal`

### Function `_isEmptyAssetArray(address[] _assets) → bool internal`
