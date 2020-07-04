pragma solidity =0.6.0;

contract OToken {
    address addressBook;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }
}
