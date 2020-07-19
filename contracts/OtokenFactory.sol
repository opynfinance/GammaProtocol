pragma solidity =0.6.10;

import {Spawner} from "./packages/Spawner.sol";
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
contract OtokenFactory is Spawner {
    /* The Opyn AddressBook contract that records addresses of whitelist module and oToken impl address. */
    address public addressBook;

    /* An array of all created otokens */
    address[] private _otokens;

    /* A mapping from parameters hash to its deployed address */
    mapping(bytes32 => address) private _idToAddress;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

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
     * @notice create new oTokens
     * @dev deploy an eip-1167 minimal proxy with CREATE2 and register it to the whitelist module.
     * @param _underlyingAsset underlying asset
     * @param _strikeAsset strike asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
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
        require(_idToAddress[id] == address(0), "OptionFactory: Option created");

        address whitelist = AddressBookInterface(addressBook).getWhitelist();
        require(
            WhitelistInterface(whitelist).isSupportedProduct(_underlyingAsset, _strikeAsset, _collateralAsset),
            "OptionFactory: Unsupported Product"
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
        WhitelistInterface(whitelist).registerOtoken(newOtoken);

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
     * @param _underlyingAsset underlying asset
     * @param _strikeAsset strike asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
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
     * @param _underlyingAsset underlying asset
     * @param _strikeAsset strike asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
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
     * @notice internal function to hash paramters and get option id.
     * @param _underlyingAsset underlying asset
     * @param _strikeAsset strike asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price with decimals = 18
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
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
