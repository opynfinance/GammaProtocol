## `MockController`

Upgradeable Controller that can mock minting and burning calls from controller.

### `initialize(address _addressBook, address _owner)` (external)

this function is invoked by the proxy contract when this contract is added to the

AddressBook.

### `testMintOtoken(address _otoken, address _account, uint256 _amount)` (external)

this function is used to test if controller can mint otokens

### `testBurnOtoken(address _otoken, address _account, uint256 _amount)` (external)

this function is used to test if controller can burn otokens
