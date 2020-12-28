// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20Initializable} from "../packages/oz/upgradeability/ERC20Initializable.sol";

contract MockCToken is ERC20Initializable {
    uint256 public exchangeRateStored;

    constructor(string memory _name, string memory _symbol) public {
        __ERC20_init_unchained(_name, _symbol);
        _setupDecimals(8);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function setExchangeRate(uint256 _exchangeRateStored) external {
        exchangeRateStored = _exchangeRateStored;
    }
}
