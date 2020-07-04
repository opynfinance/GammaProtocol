pragma solidity =0.6.0;

import "./lib/Spawner.sol";
import "./Otoken.sol";

contract OtokenFactory is Spawner {
    Otoken public logic;

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

        // add new token to mapping
        _tokenAddresses[id] = newOtoken;
        isOtoken[newOtoken] = true;
        /**
         * Todo: register to whitelist module
         */

        emit OtokenCreated(newOtoken, msg.sender, _strikeAsset, _underlyingAsset, _strikePrice);
    }

    /**
     * @dev return the otoken address if the otoken with same paramter has been deployed.
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
     * @dev return the address of undeployed otoken
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
        targetAddress = _computeNextAddress(address(logic), initializationCalldata);
    }

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
