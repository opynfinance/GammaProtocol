/*
 * Author: Opyn
 */
pragma solidity 0.6.0;

// import {SafeMath} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title SafeUnsignedFloatMath
 * @dev unsigned math operations with safety checks that revert on error.
 */

interface IOtoken {
    function burn(address _user, uint256 _amount) external;

    function mint(address _user, uint256 _amount) external;
}
