pragma solidity =0.6.0;

import "./lib/Spawner.sol";
import "./Otoken.sol";

/**
 * @title A factory for opyn tokens
 * @author Anton Cheng
 * @notice Create new otokens and keep track of all created tokens.
 * @dev Calculate contract address before each creation with CREATE2
 * and deploy eip-1167 minimal proxies for otoken logic contract.
 */
contract OtokenFactory is Spawner {
    // Implementation address of the otoken contract
    Otoken public logic;

    // A mapping that return true if oToken is valid
    mapping(address => bool) public isOtoken;

    address[] private _otokens;

    mapping(bytes32 => address) private _tokenAddresses;

    constructor(Otoken _otokenImpl) public {
        logic = _otokenImpl;
    }

    event OtokenCreated(
        address tokenAddress,
        address creator,
        address strike,
        address underlying,
        address collateral,
        uint256 strikePrice,
        uint256 expiry,
        bool isPut
    );

    /**
     * @notice create new oTokens
     * @dev deploy an eip-1167 minimal proxy with CREATE2 and register it to the whitelist module.
     * @param _strikeAsset strike asset
     * @param _underlyingAsset underlying asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price in __
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
     */
    function createOtoken(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external returns (address newOtoken) {
        bytes32 id = _getOptionId(_strikeAsset, _underlyingAsset, _collateralAsset, _strikePrice, _expiry, _isPut);
        require(_tokenAddresses[id] == address(0), "OptionFactory: Option created");

        /**
         * Todo: Check whitelist module
         */

        bytes memory initializationCalldata = abi.encodeWithSelector(
            logic.init.selector,
            _strikeAsset,
            _underlyingAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );

        newOtoken = _spawn(address(logic), initializationCalldata);

        _otokens.push(newOtoken);
        _tokenAddresses[id] = newOtoken;
        isOtoken[newOtoken] = true;
        /**
         * Todo: register to whitelist module
         */
        emit OtokenCreated(
            newOtoken,
            msg.sender,
            _strikeAsset,
            _underlyingAsset,
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
     * @param _strikeAsset strike asset
     * @param _underlyingAsset underlying asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price in __
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
     */
    function getOtoken(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external view returns (address otoken) {
        bytes32 id = _getOptionId(_strikeAsset, _underlyingAsset, _collateralAsset, _strikePrice, _expiry, _isPut);
        return _tokenAddresses[id];
    }

    /**
     * @notice get the address otoken if call createOtoken with these paramters.
     * @dev return the exact address that will be deployed at with _computeAddress
     * @param _strikeAsset strike asset
     * @param _underlyingAsset underlying asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price in __
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
     */
    function getTargetOtokenAddress(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) external view returns (address targetAddress) {
        bytes32 id = _getOptionId(_strikeAsset, _underlyingAsset, _collateralAsset, _strikePrice, _expiry, _isPut);
        require(_tokenAddresses[id] == address(0), "OptionFactory: Option created");
        bytes memory initializationCalldata = abi.encodeWithSelector(
            logic.init.selector,
            _strikeAsset,
            _underlyingAsset,
            _collateralAsset,
            _strikePrice,
            _expiry,
            _isPut
        );
        targetAddress = _computeAddress(address(logic), initializationCalldata);
    }

    /**
     * @notice internal function to hash paramters and get option id.
     * @param _strikeAsset strike asset
     * @param _underlyingAsset underlying asset
     * @param _collateralAsset collateral asset
     * @param _strikePrice strike price in __
     * @param _expiry expiration timestamp in second
     * @param _isPut is this a put option or not
     */
    function _getOptionId(
        address _strikeAsset,
        address _underlyingAsset,
        address _collateralAsset,
        uint256 _strikePrice,
        uint256 _expiry,
        bool _isPut
    ) internal pure returns (bytes32 id) {
        id = keccak256(
            abi.encodePacked(_strikeAsset, _underlyingAsset, _collateralAsset, _strikePrice, _expiry, _isPut)
        );
    }
}
