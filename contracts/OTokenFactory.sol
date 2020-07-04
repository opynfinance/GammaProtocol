pragma solidity =0.6.0;

import "./lib/Spawner.sol";
import "./oToken.sol";

contract OTokenFactory is Spawner {
    address addressBook;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }
}
