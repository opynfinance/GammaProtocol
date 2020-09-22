Contract module which provides a basic access control mechanism, where

there is an account (an owner) that can be granted exclusive access to

specific functions.

By default, the owner account will be the one that deploys the contract. This

can later be changed with {transferOwnership}.

This module is used through inheritance. It will make available the modifier

`onlyOwner`, which can be applied to your functions to restrict their use to

the owner.

# Functions:

- [`owner()`]

- [`renounceOwnership()`]

- [`transferOwnership(address newOwner)`]

# Events:

- [`OwnershipTransferred(address previousOwner, address newOwner)`]

# Function `owner() → address`

Returns the address of the current owner.

# Function `renounceOwnership()`

Leaves the contract without owner. It will not be possible to call

`onlyOwner` functions anymore. Can only be called by the current owner.

NOTE: Renouncing ownership will leave the contract without an owner,

thereby removing any functionality that is only available to the owner.

# Function `transferOwnership(address newOwner)`

Transfers ownership of the contract to a new account (`newOwner`).

Can only be called by the current owner.

# Event `OwnershipTransferred(address previousOwner, address newOwner)`

No description
