pragma solidity =0.6.10;

import {OtokenSpawner} from "./OtokenSpawner.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {OtokenInterface} from "./interfaces/OtokenInterface.sol";
import {WhitelistInterface} from "./interfaces/WhitelistInterface.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @title A factory for opyn tokens
 * @author Opyn
 * @notice Create new otokens and keep track of all created tokens.
 * @dev Calculate contract address before each creation with CREATE2
 * and deploy eip-1167 minimal proxies for otoken logic contract.
 */
contract OtokenFactory is OtokenSpawner {
    /// @notice The Opyn AddressBook contract that records addresses of whitelist module and otoken impl address. */
    address public addressBook;

    /// @dev An array of all created otokens */
    address[] private _otokens;

    /// @dev A mapping from parameters hash to its deployed address
    mapping(bytes32 => address) private _idToAddress;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    /* Event: OtokenCreated - Emitted when factory create a new Option. */
    event OtokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        address underlying,
        address strike,
        address collateral,
        uint256 strikePrice,
        uint256 expiry,
        bool isPut
    );

    /**
     * @notice create new otokens
     * @dev deploy an eip-1167 minimal proxy with CREATE2 and register it to the whitelist module.
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option, if not it is a call
     * @return newOtoken address of the newly created option
     */
    function createOtoken(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external returns (address newOtoken) {
        bytes32 id = _getOptionId(_underlyingAsset, _strikeAsset, _collateralAsset, _strikePrice, _expiry, _isPut);
        require(_idToAddress[id] == address(0), "OtokenFactory: Option created");

        address whitelist = AddressBookInterface(addressBook).getWhitelist();
        require(
            WhitelistInterface(whitelist).isWhitelistedProduct(_underlyingAsset, _strikeAsset, _collateralAsset),
            "OtokenFactory: Unsupported Product"
        );

        address otokenImpl = AddressBookInterface(addressBook).getOtokenImpl();

        bytes memory initializationCalldata = abi.encodeWithSelector(
            OtokenInterface(otokenImpl).init.selector,
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );

        newOtoken = _spawn(AddressBookInterface(addressBook).getOtokenImpl(), initializationCalldata);

        _otokens.push(newOtoken);
        _idToAddress[id] = newOtoken;
        WhitelistInterface(whitelist).whitelistOtoken(newOtoken);

        emit OtokenCreated(
            newOtoken,
            msg.sender,
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );
    }

    /**
     * @notice get all otokens created by this factory.
     * @return array of otoken addresses.
     */
    function getOtokens() external view returns (address[] memory) {
        return _otokens;
    }

    /**
     * @notice get the otoken address. If no token has been created with these parameters, will return address(0).
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option, if not it is a call
     * @return otoken the address of target otoken.
     */
    function getOtoken(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external view returns (address otoken) {
        bytes32 id = _getOptionId(_underlyingAsset, _strikeAsset, _collateralAsset, _strikePrice, _expiry, _isPut);
        return _idToAddress[id];
    }

    /**
     * @notice get the address otoken if call createOtoken with these paramters.
     * @dev return the exact address that will be deployed at with _computeAddress
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option, if not it is a call
     * @return targetAddress the address this otoken will be deployed at.
     */
    function getTargetOtokenAddress(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external view returns (address targetAddress) {
        address otokenImpl = AddressBookInterface(addressBook).getOtokenImpl();
        bytes memory initializationCalldata = abi.encodeWithSelector(
            OtokenInterface(otokenImpl).init.selector,
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );
        targetAddress = _computeAddress(AddressBookInterface(addressBook).getOtokenImpl(), initializationCalldata);
    }

    /**
     * @dev internal function to hash paramters and get option id.
     * @param _underlyingAsset asset that the option references
     * @param _strikeAsset asset that the strike price is denominated in
     * @param _collateralAsset asset that is held as collateral against short/written options
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option, if not it is a call
     * @return id the id of an otoken
     */
    function _getOptionId(
        address _underlyingAsset,
        address _strikeAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) internal pure returns (bytes32 id) {
        id = keccak256(
            abi.encodePacked(_underlyingAsset, _strikeAsset, _collateralAsset, _strikePrice, _expiry, _isPut)
        );
    }
}
