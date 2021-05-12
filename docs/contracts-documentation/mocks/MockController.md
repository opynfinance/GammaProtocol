# `MockController`

Upgradeable Controller that can mock minting and burning calls from controller.

## Functions:

- `initialize(address _addressBook, address _owner) (external)`

- `testMintOtoken(address _otoken, address _account, uint256 _amount) (external)`

- `testBurnOtoken(address _otoken, address _account, uint256 _amount) (external)`

- `test0xCallee(address _callee, bytes _data) (external)`

### Function `initialize(address _addressBook, address _owner) external`

this function is invoked by the proxy contract when this contract is added to the

AddressBook.

#### Parameters:

- `_addressBook`: the address of the AddressBook*

### Function `testMintOtoken(address _otoken, address _account, uint256 _amount) external`

this function is used to test if controller can mint otokens

### Function `testBurnOtoken(address _otoken, address _account, uint256 _amount) external`

this function is used to test if controller can burn otokens

### Function `test0xCallee(address _callee, bytes _data) external`

this function is used to test if controller can be the only msg.sender to the 0xcallee
