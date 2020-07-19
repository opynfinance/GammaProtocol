pragma solidity =0.6.10;

import {Spawner} from "./packages/Spawner.sol";
import {IAddressBook} from "./interfaces/IAddressBook.sol";
import {IOtoken} from "./interfaces/IOtoken.sol";
import {IWhitelistModule} from "./interfaces/IWhitelistModule.sol";

/**
 * SPDX-License-Identifier: UNLICENSED
 * @title A factory for opyn tokens
 * @author Opyn
 * @notice Create new otokens and keep track of all created tokens.
 * @dev Calculate contract address before each creation with CREATE2
 * and deploy eip-1167 minimal proxies for otoken logic contract.
 */
contract OtokenFactory is Spawner {
    // The Opyn AddressBook contract that records addresses of whitelist module and oToken impl contract.
    address public addressBook;

    address[] private _otokens;

    mapping(bytes32 => address) private _tokenAddresses;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    event OtokenCreated(
        address tokenAddress,
        address creator,
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
        require(_tokenAddresses[id] == address(0), "OptionFactory: Option created");

        address whitelist = IAddressBook(addressBook).getWhitelist();
        require(
            IWhitelistModule(whitelist).isSupportedProduct(_underlyingAsset, _strikeAsset, _collateralAsset),
            "OptionFactory: Unsupported Product"
        );

        address otokenImpl = IAddressBook(addressBook).getOtokenImpl();

        bytes memory initializationCalldata = abi.encodeWithSelector(
            IOtoken(otokenImpl).init.selector,
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );

        newOtoken = _spawn(IAddressBook(addressBook).getOtokenImpl(), initializationCalldata);

        _otokens.push(newOtoken);
        _tokenAddresses[id] = newOtoken;
        IWhitelistModule(whitelist).registerOtoken(newOtoken);

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
        return _tokenAddresses[id];
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
        address otokenImpl = IAddressBook(addressBook).getOtokenImpl();
        bytes memory initializationCalldata = abi.encodeWithSelector(
            IOtoken(otokenImpl).init.selector,
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );
        targetAddress = _computeAddress(IAddressBook(addressBook).getOtokenImpl(), initializationCalldata);
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
