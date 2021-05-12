# `MockOtoken`

SPDX-License-Identifier: UNLICENSED

The Otoken inherits ERC20PermitUpgradeable because we need to use the init instead of constructor.

## Functions:

- `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut) (external)`

- `getOtokenDetails() (external)`

- `mintOtoken(address _to, uint256 _amount) (external)`

- `burnOtoken(address account, uint256 amount) (external)`

- `getChainId() (external)`

### Function `init(address _addressBook, address _underlyingAsset, address _strikeAsset, address _collateralAsset, uint256 _strikePrice, uint256 _expiryTimestamp, bool _isPut) external`

### Function `getOtokenDetails() → address, address, address, uint256, uint256, bool external`

### Function `mintOtoken(address _to, uint256 _amount) external`

### Function `burnOtoken(address account, uint256 amount) external`

### Function `getChainId() → uint256 chainId external`
