# `Ownable`

Contract module which provides a basic access control mechanism, where

there is an account (an owner) that can be granted exclusive access to

specific functions.

By default, the owner account will be the one that deploys the contract. This

can later be changed with {transferOwnership}.

This module is used through inheritance. It will make available the modifier

`onlyOwner`, which can be applied to your functions to restrict their use to

the owner.

## Modifiers:

- `onlyOwner()`

## Functions:

- `constructor() (internal)`

- `owner() (public)`

- `renounceOwnership() (public)`

- `transferOwnership(address newOwner) (public)`

## Events:

- `OwnershipTransferred(address previousOwner, address newOwner)`

### Modifier `onlyOwner()`

Throws if called by any account other than the owner.

### Function `constructor() internal`

Initializes the contract setting the deployer as the initial owner.

### Function `owner() → address public`

Returns the address of the current owner.

### Function `renounceOwnership() public`

Leaves the contract without owner. It will not be possible to call

`onlyOwner` functions anymore. Can only be called by the current owner.

NOTE: Renouncing ownership will leave the contract without an owner,

thereby removing any functionality that is only available to the owner.

### Function `transferOwnership(address newOwner) public`

Transfers ownership of the contract to a new account (`newOwner`).

Can only be called by the current owner.

### Event `OwnershipTransferred(address previousOwner, address newOwner)`
