pragma solidity =0.6.0;

import "./lib/Spawner.sol";
import "./OToken.sol";

contract OtokenFactory is Spawner {
    OToken public logic;

    mapping(address => bool) public isOtoken;

    mapping(bytes32 => address) private _tokenAddresses;

    constructor(OToken _oTokenImpl) public {
        logic = _oTokenImpl;
    }

    event OtokenCreated(address tokenAddress, address creator, address strike, address underlying, uint256 strikePrice);

    /**
     * @dev create a new Otoken
     * The address of the newly deployed token can be predicted by calling getTargetOtokenAddress
     */
    function createOtoken(
        address _strikeAsset,
        address _underlyingAsset,
        uint256 _strikePrice
    ) external returns (address newOtoken) {
        bytes memory initializationCalldata = abi.encodeWithSelector(
            logic.init.selector,
            _strikeAsset,
            _underlyingAsset,
            _strikePrice
        );
        bytes32 id = keccak256(initializationCalldata);

        require(_tokenAddresses[id] == address(0), "OptionFactory: Option created");

        newOtoken = _spawn(address(logic), initializationCalldata);

        // add new token to mapping
        _tokenAddresses[id] = newOtoken;
        isOtoken[newOtoken] = true;

        emit OtokenCreated(newOtoken, msg.sender, _strikeAsset, _underlyingAsset, _strikePrice);
    }

    /**
     * @dev return the oToken address if the oToken with same paramter has been deployed.
     */
    function getOtoken(
        address _strikeAsset,
        address _underlyingAsset,
        uint256 _strikePrice
    ) public view returns (address oToken) {
        bytes memory callData = abi.encodeWithSelector(
            logic.init.selector,
            _strikeAsset,
            _underlyingAsset,
            _strikePrice
        );
        bytes32 id = keccak256(callData);
        return _tokenAddresses[id];
    }

    /**
     * @dev return the address of undeployed oToken
     */
    function getTargetOtokenAddress(
        address _strikeAsset,
        address _underlyingAsset,
        uint256 _strikePrice
    ) external view returns (address nextAddress) {
        bytes memory initializationCalldata = abi.encodeWithSelector(
            logic.init.selector,
            _strikeAsset,
            _underlyingAsset,
            _strikePrice
        );
        bytes32 id = keccak256(initializationCalldata);
        require(_tokenAddresses[id] == address(0), "OptionFactory: Option created");
        nextAddress = _computeNextAddress(address(logic), initializationCalldata);
    }
}
