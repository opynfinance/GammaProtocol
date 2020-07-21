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

    function setOtokenImpl(address _newImpl) external;

    function setOtokenFactory(address _newImpl) external;

    function setWhitelist(address _newImpl) external;

    function setController(address _newImpl) external;

    function setMarginPool(address _newImpl) external;

    function setMarginCalculator(address _newImpl) external;

    function setLiquidationManager(address _newImpl) external;

    function setAddress(bytes32 _id, address _newImpl) external;
}
