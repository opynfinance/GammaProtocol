pragma solidity =0.6.0;

import "./lib/Spawner.sol";
import "./Otoken.sol";

contract OtokenFactory is Spawner {
    Otoken public logic;

    address[] public otokens;
    uint256 public otokensCreated;

    mapping(address => bool) public isOtoken;

    mapping(bytes32 => address) private _tokenAddresses;

    constructor(Otoken _otokenImpl) public {
        logic = _otokenImpl;
    }

    event OtokenCreated(address tokenAddress, address creator, address strike, address underlying, uint256 strikePrice);

    /**
     * @dev create a new Otoken
     * The address of the newly deployed token can be predicted by calling getTargetOtokenAddress
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

        // record new otoken
        otokensCreated += 1;
        otokens.push(newOtoken);
        _tokenAddresses[id] = newOtoken;
        isOtoken[newOtoken] = true;
        /**
         * Todo: register to whitelist module
         */

        emit OtokenCreated(newOtoken, msg.sender, _strikeAsset, _underlyingAsset, _strikePrice);
    }

    /**
     * @dev get the otoken address with the set of paramters.
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
     * @dev get the address of undeployed otoken.
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
     * @dev internal function to hash paramters and get option id.
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
