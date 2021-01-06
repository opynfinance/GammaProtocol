// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

import {ERC20Upgradeable} from "../packages/oz/upgradeability/ERC20Upgradeable.sol";
import {ERC20Interface} from "../interfaces/ERC20Interface.sol";
import {SafeMath} from "../packages/oz/SafeMath.sol";

contract MockCUSDC is ERC20Upgradeable {
    uint256 public exchangeRateStored;
    address public underlying;
    uint256 public scale = 1e18;

    constructor(
        string memory _name,
        string memory _symbol,
        address _underlying,
        uint256 _initExchangeRateStored
    ) public {
        __ERC20_init_unchained(_name, _symbol);
        _setupDecimals(8);

        underlying = _underlying;
        exchangeRateStored = _initExchangeRateStored;
    }

    function mint(uint256 amount) public returns (uint256) {
        uint256 numerator = scale.mul(amount);
        uint256 cTokenAmount = numerator.div(exchangeRateStored);
        _mint(msg.sender, cTokenAmount);
        ERC20Interface(underlying).transferFrom(msg.sender, address(this), amount);
        return 0;
    }

    function redeem(uint256 amount) public returns (uint256) {
        _burn(msg.sender, amount);
        uint256 underlyingAmount = amount.mul(exchangeRateStored).div(scale);
        ERC20Interface(underlying).transfer(msg.sender, underlyingAmount);
    }

    function setExchangeRate(uint256 _exchangeRateStored) external {
        exchangeRateStored = _exchangeRateStored;
    }
}
