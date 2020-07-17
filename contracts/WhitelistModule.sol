/*
 * WhitelistModule contract. Copyright © 2020 by Opyn.co .
 * Author: Opyn
 */
pragma solidity 0.6.10;

import {Ownable} from "./packages/oz/Ownable.sol";

/**
 * @title WhitelistModule
 * @dev TODO:
 */

contract WhitelistModule is Ownable {
    /** TODO: */
    address public addressBook;

    /** TODO: */
    mapping(bytes32 => bool) internal _isSupportedProduct;

    /** TODO: */
    mapping(address => bool) internal _isSupportedCollateral;

    /** TODO: */
    mapping(address => bool) public isValidOtoken;

    constructor() public {
        /** TODO: */
    }

    /**
     * @notice
     * @dev
     * @param underlying TODO:
     * @param strike TODO:
     * @param collateral TODO:
     */
    function isSupportedProduct(
        address underlying,
        address strike,
        address collateral
    ) external view returns (bool isValid) {
        /** TODO: */
        return true;
    }

    /**
     * @notice
     * @dev
     * @param collateral TODO:
     */
    function isSupportedCollateral(address collateral) external view returns (bool isValid) {
        /** TODO: */
        return true;
    }

    /**
     * @notice
     * @dev
     * @param underlying TODO:
     * @param strike TODO:
     * @param collateral TODO:
     */
    function whitelistProduct(
        address underlying,
        address strike,
        address collateral
    ) external onlyOwner {
        /** TODO: */
    }

    /**
     * @notice
     * @dev
     * @param collateral TODO:
     */
    function whitelistCollateral(address collateral) external onlyOwner {
        /** TODO: */
    }

    modifier onlyFactory() {
        /** TODO: */
        _;
    }

    /**
     * @notice
     * @dev
     * @param otoken TODO:
     */
    function registerOtoken(address otoken) external onlyFactory {
        /** TODO: */
    }
}
