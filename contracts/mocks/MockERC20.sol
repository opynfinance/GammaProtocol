// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20Initializable} from "../packages/oz/upgradeability/ERC20Initializable.sol";

contract MockERC20 is ERC20Initializable {
    constructor(string memory _name, string memory _symbol) public {
        __ERC20_init_unchained(_name, _symbol);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
