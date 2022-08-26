// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20Upgradeable} from "../packages/oz/upgradeability/ERC20Upgradeable.sol";

contract MockRETHToken is ERC20Upgradeable {
    uint256 public ethPerToken;

    constructor(string memory _name, string memory _symbol) public {
        __ERC20_init_unchained(_name, _symbol);
        _setupDecimals(18);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function setEthPerToken(uint256 _ethPerToken) external {
        ethPerToken = _ethPerToken;
    }

    function getExchangeRate() external returns (uint256) {
        return ethPerToken;
    }
}
