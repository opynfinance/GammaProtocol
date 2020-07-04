pragma solidity =0.6.0;

import "./lib/Spawner.sol";
import "./OToken.sol";

contract OTokenFactory is Spawner {
    OToken public logic;

    constructor(OToken _oTokenImpl) public {
        logic = _oTokenImpl;
    }

    event OTokenCreated(address tokenAddress, address creator, address strike, address underlying, uint256 strikePrice);

    function createOToken(
        address _strikeAsset,
        address _underlyingAsset,
        uint256 _strikePrice
    ) external returns (address newOToken) {
        bytes memory initializationCalldata = abi.encodeWithSelector(
            logic.init.selector,
            _strikeAsset,
            _underlyingAsset,
            _strikePrice
        );
        newOToken = _spawn(address(logic), initializationCalldata);
        emit OTokenCreated(newOToken, msg.sender, _strikeAsset, _underlyingAsset, _strikePrice);
    }

    function getUndeployedOTokenAddress(
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
        nextAddress = _computeNextAddress(address(logic), initializationCalldata);
    }
}
