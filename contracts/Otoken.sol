/*
 * Otoken contract. Copyright © 2020 by Opyn.co .
 * Author: Opyn
 */
pragma solidity 0.6.10;

/**
 * @title Otoken
 * @dev TODO
 */

contract Otoken {
    /** TODO: */
    address public underlying;

    /** TODO: */
    address public strike;

    /** TODO: */
    address public collateral;

    /** TODO: */
    address public addressBook;

    /** TODO: */
    uint256 public strikePrice;

    /** TODO: */
    uint256 public expiryTimestamp;

    /** TODO: */
    bool public isPut;

    constructor() internal {
        /** TODO: */
    }

    modifier onlyFactory() {
        /** TODO: */
        _;
    }

    modifier onlyController() {
        /** TODO: */
        _;
    }

    /**
     * @notice TODO
     * @dev TODO:
     * @param underlyingAsset TODO:
     * @param strikeAsset TODO:
     * @param collateralAsset TODO:
     * @param isPut TODO:
     * @param expiryTimestamp TODO:
     * @param strikePrice TODO:
     */
    function init(
        address underlyingAsset,
        address strikeAsset,
        address collateralAsset,
        bool isPut,
        uint256 expiryTimestamp,
        uint256 strikePrice
    ) external onlyFactory {
        /** TODO: */
    }
}
