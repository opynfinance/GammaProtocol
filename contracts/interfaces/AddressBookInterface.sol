// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

interface AddressBookInterface {
    /* Getters */

    function getOtokenImpl() external view returns (address);

    function getOtokenFactory() external view returns (address);

    function getWhitelist() external view returns (address);

    function getController() external view returns (address);

    function getMarginPool() external view returns (address);

    function getMarginCalculator() external view returns (address);

    function getLiquidationManager() external view returns (address);

    function getAddress(bytes32 _id) external view returns (address);

    /* Setters */

    function setOtokenImpl() external;

    function setOtokenFactory() external;

    function setWhitelist() external;

    function setController() external;

    function setMarginPool() external;

    function setMarginCalculator() external;

    function setLiquidationManager() external;

    function setAddress(bytes32 _id, address _newImpl) external;
}
