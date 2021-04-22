// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20PermitUpgradeable} from "../packages/oz/upgradeability/erc20-permit/ERC20PermitUpgradeable.sol";

contract MockPermitERC20 is ERC20PermitUpgradeable {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) public {
        __ERC20_init_unchained(_name, _symbol);
        __ERC20Permit_init(_name);
        _setupDecimals(_decimals);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }
}
