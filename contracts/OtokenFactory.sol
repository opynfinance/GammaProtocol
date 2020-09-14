pragma solidity =0.6.10;

import {OtokenSpawner} from "./OtokenSpawner.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
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
    using SafeMath for uint256;
    /// @notice The Opyn AddressBook contract that records addresses of whitelist module and otoken impl address. */
    address public addressBook;

    /// @notice An array of all created otokens */
    address[] public otokens;

    /// @dev A mapping from parameters hash to its deployed address
    mapping(bytes32 => address) private idToAddress;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    /// @notice emitted when factory create a new Option
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
        require(_expiry > now, "OtokenFactory: Can't create expired option.");
        require(_expiry < 11865398400, "OtokenFactory: Can't create option with expiry > 2345/12/31.");
        require(_expiry.sub(28800).mod(86400) == 0, "OtokenFactory: Option has to expire 08:00 UTC.");
        bytes32 id = _getOptionId(_underlyingAsset, _strikeAsset, _collateralAsset, _strikePrice, _expiry, _isPut);
        require(idToAddress[id] == address(0), "OtokenFactory: Option already created");

        address whitelist = AddressBookInterface(addressBook).getWhitelist();
        require(
            WhitelistInterface(whitelist).isWhitelistedProduct(
                _underlyingAsset,
                _strikeAsset,
                _collateralAsset,
                _isPut
            ),
            "OtokenFactory: Unsupported Product"
        );

        address otokenImpl = AddressBookInterface(addressBook).getOtokenImpl();

        bytes memory initializationCalldata = abi.encodeWithSelector(
            OtokenInterface(otokenImpl).init.selector,
            addressBook,
            _underlyingAsset,
            _strikeAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );

        newOtoken = _spawn(otokenImpl, initializationCalldata);

        otokens.push(newOtoken);
        idToAddress[id] = newOtoken;
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
     * @notice Get the total otokens created by the factory.
     * @return length of the otokens array.
     */
    function getOtokensLength() external view returns (uint256) {
        return otokens.length;
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
        return idToAddress[id];
    }

    /**
     * @notice get the address at which a new otoken with these paramters will be deployed
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
            addressBook,
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
     * @dev internal function to hash paramters and get option id. Each option has a unique id.
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
