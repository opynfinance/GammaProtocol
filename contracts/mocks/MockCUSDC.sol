// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20Initializable} from "../packages/oz/upgradeability/ERC20Initializable.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";

//safe math to add

contract MockCUSDC is ERC20Initializable {
    uint256 public exchangeRateStored;
    address public underlying;

    constructor(string memory _name, string memory _symbol) public {
        __ERC20_init_unchained(_name, _symbol);
        _setupDecimals(8);
    }

    function mint(uint256 amount) public {
        uint256 cTokenAmount = amount * exchangeRateStored;
        _mint(msg.sender, cTokenAmount);
        ERC20Interface(underlying).transferFrom(msg.sender, address(this), amount);
    }

    function redeem(uint256 amount) public {
        _burn(msg.sender, amount);
        uint256 underlyingAmount = amount / exchangeRateStored;
        ERC20Interface(underlying).transfer(msg.sender, underlyingAmount);
    }

    function setExchangeRate(uint256 _exchangeRateStored) external {
        exchangeRateStored = _exchangeRateStored;
    }
}
