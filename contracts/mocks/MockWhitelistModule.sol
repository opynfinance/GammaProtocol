// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.10;

contract MockWhitelistModule {
    mapping(address => bool) public _isWhitelistedOtoken;
    mapping(bytes32 => bool) private _isWhitelistedProduct;
    mapping(address => bool) private whitelistedCollateral;
    mapping(address => bool) private whitelistedCallee;
    /// @dev mapping to mapping to track whitelisted collateral for covered calls or puts
    mapping(bytes32 => bool) internal coveredWhitelistedCollateral;
    /// @dev mapping to mapping to track whitelisted collateral for naked calls or puts
    mapping(bytes32 => bool) internal nakedWhitelistedCollateral;

    function whitelistProduct(
        address _underlying,
        address _strike,
        address _collateral,
        bool _isPut
    ) external returns (bytes32 id) {
        id = keccak256(abi.encodePacked(_underlying, _strike, _collateral, _isPut));

        _isWhitelistedProduct[id] = true;
    }

    /**
     * @notice allows the owner to whitelist a collateral address for vault type 0
     * @dev can only be called from the owner address. This function is used to whitelist any asset other than Otoken as collateral.
     * @param _collateral collateral asset address
     * @param _underlying underlying asset address
     * @param _isPut bool for whether the collateral is suitable for puts or calls
     */
    function whitelistCoveredCollateral(
        address _collateral,
        address _underlying,
        bool _isPut
    ) external {
        bytes32 productHash = keccak256(abi.encode(_collateral, _underlying, _isPut));
        coveredWhitelistedCollateral[productHash] = true;
    }

    /**
     * @notice allows the owner to whitelist a collateral address for vault type 1
     * @dev can only be called from the owner address. This function is used to whitelist any asset other than Otoken as collateral.
     * @param _collateral collateral asset address
     * @param _underlying underlying asset address
     * @param _isPut bool for whether the collateral is suitable for puts or calls
     */
    function whitelistNakedCollateral(
        address _collateral,
        address _underlying,
        bool _isPut
    ) external {
        bytes32 productHash = keccak256(abi.encode(_collateral, _underlying, _isPut));
        nakedWhitelistedCollateral[productHash] = true;
    }

    function isWhitelistedProduct(
        address _underlying,
        address _strike,
        address _collateral,
        bool _isPut
    ) external view returns (bool isValid) {
        bytes32 id = keccak256(abi.encodePacked(_underlying, _strike, _collateral, _isPut));
        return _isWhitelistedProduct[id];
    }

    /**
     * @notice check if a collateral asset is whitelisted for vault type 0
     * @param _collateral asset that is held as collateral against short/written options
     * @param _underlying asset that is used as the underlying asset for the written options
     * @param _isPut bool for whether the collateral is to be checked for suitability on a call or put
     * @return boolean, True if the collateral is whitelisted for vault type 0
     */
    function isCoveredWhitelistedCollateral(
        address _collateral,
        address _underlying,
        bool _isPut
    ) external view returns (bool) {
        bytes32 productHash = keccak256(abi.encode(_collateral, _underlying, _isPut));
        return coveredWhitelistedCollateral[productHash];
    }

    /**
     * @notice check if a collateral asset is whitelisted for vault type 1
     * @param _collateral asset that is held as collateral against short/written options
     * @param _underlying asset that is used as the underlying asset for the written options
     * @param _isPut bool for whether the collateral is to be checked for suitability on a call or put
     * @return boolean, True if the collateral is whitelisted for vault type 1
     */
    function isNakedWhitelistedCollateral(
        address _collateral,
        address _underlying,
        bool _isPut
    ) external view returns (bool) {
        bytes32 productHash = keccak256(abi.encode(_collateral, _underlying, _isPut));
        return nakedWhitelistedCollateral[productHash];
    }

    function whitelistOtoken(address _otoken) external {
        _isWhitelistedOtoken[_otoken] = true;
    }

    function isWhitelistedOtoken(address _otoken) external view returns (bool) {
        return _isWhitelistedOtoken[_otoken];
    }

    function isWhitelistedCollateral(address _collateral) external view returns (bool) {
        return whitelistedCollateral[_collateral];
    }

    function whitelistCollateral(address _collateral) external {
        require(!whitelistedCollateral[_collateral], "Whitelist: Collateral already whitelisted");

        whitelistedCollateral[_collateral] = true;
    }

    function isWhitelistedCallee(address _callee) external view returns (bool) {
        return whitelistedCallee[_callee];
    }

    function whitelistCallee(address _callee) external {
        whitelistedCallee[_callee] = true;
    }

    function blacklistCallee(address _callee) external {
        whitelistedCallee[_callee] = false;
    }
}
