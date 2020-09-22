## `MockOtoken`

SPDX-License-Identifier: UNLICENSED

The Otoken inherits ERC20Initializable because we need to use the init instead of constructor.

### `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut)` (external)

### `mintOtoken(address _to, uint256 _amount)` (external)

### `burnOtoken(address account, uint256 amount)` (external)
