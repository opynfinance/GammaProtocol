/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {Ownable} from "./packages/oz/Ownable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {MarginAccount} from "./libs/MarginAccount.sol";
import {Actions} from "./libs/Actions.sol";

/**
 * @author Opyn Team
 * @title Controller
 * @notice contract that
 */
contract Controller is Ownable {
    using SafeMath for uint256;

    address internal addressBook;

    bool internal systemPaused;

    mapping(address => MarginAccount.Account) internal accounts;
    mapping(address => mapping(uint256 => MarginAccount.Vault)) internal vaults;
    mapping(address => mapping(address => bool)) internal operators;

    constructor(address _addressBook) public {
        addressBook = _addressBook;
    }

    modifier isPaused {
        _;
    }

    modifier isExpired(address _otoken) {
        _;
    }

    modifier isAuthorized(address _owner) {
        _;
    }

    event NewOperatorSet(address newOperator);

    /**
     * @dev allows admin to toggle pause / emergency shutdown
     * @param _paused The new boolean value to set systemPaused to.
     */
    function setSystemPaused(bool _paused) external onlyOwner {
        systemPaused = _paused;
    }

    /**
     * @dev allows a user to set and unset an operate which can act on their behalf on their vaults. Could be used for rollovers, and more. Only the vault owner can update the operator privileges.
     * @param _operator The operator that msg.sender wants to give privileges to or revoke them from.
     * @param _isOperator The new boolean value that expresses if msg.sender is giving or revoking privileges from _operator.
     */
    function setOperator(address _operator, bool _isOperator) external {
        operators[msg.sender][_operator] = _isOperator;
        emit NewOperatorSet(_operator);
    }

    /**
     * @dev Iterate through a collateral array of the vault and payout collateral assets.
     * @param _owner The owner of the vault we will clear.
     * @param _vaultId The vaultId for the vault we will clear, within the user's MarginAccount.Account struct.
     */
    //function redeemForEmergency(address _owner, uint256 _vaultId) external isPaused isAuthorized(args.owner) {
    //}

    /**
     * @dev Return a specific vault from memory.
     * @param _owner The owner of the relevant vault.
     * @param _vaultId The vaultId for the relevant vault, within the user's MarginAccount.Account struct.
     * @return the desired vault
     */
    function getVault(address _owner, uint256 _vaultId) internal view returns (MarginAccount.Vault memory) {}

    /**
     * @dev Return a specific vault from memory.?? this is the same as above what?
     * @param _owner The owner of the relevant vault.
     * @param _vaultId The vaultId for the relevant vault, within the user's MarginAccount.Account struct.
     * @return the desired vault
     */
    function getVaultBalances(address _owner, uint256 _vaultId) external view returns (MarginAccount.Vault memory) {}

    function operate(Actions.ActionArgs[] memory _actions) external isPaused {
        //        Call vault = _runActions (actions) and get the vault
        //        Call Calculator.isValidState(vault)
    }

    /**
     * @dev return if an expired oToken contract’s price has been finalized. Returns true if the contract has expired AND the oraclePrice at the expiry timestamp has been finalized.
     * @param _otoken The address of the relevant oToken.
     * @return A boolean which is true if and only if the price is finalized.
     */
    function isPriceFinalized(address _otoken) external view returns (bool) {
        //Returns true if the contract has expired AND the oraclePrice at the expiry timestamp has been finalized.
        //Calls the Oracle to know if the price has been finalized
    }

    /**
     * @dev For each action in the action Array, run the corresponding action
     * @param _actions An array of type Actions.ActionArgs[] which expresses which actions the user wishes to take.
     * @return vault The new vault that has been modified (or null vault if no action affected any vault)
     */
    function _runActions(Actions.ActionArgs[] memory _actions) internal returns (MarginAccount.Vault memory vault) {}

    //    High Level: Only vault operator / user should be able to open a new vault
    function _openVault(Actions.OpenVaultArgs memory args) internal isAuthorized(args.owner) {}

    //    High Level: Anyone should be able to deposit a valid option into a vault
    //    Example Input for amounts:
    //    uint256 amount 1000000000000000000;  // 1 * 10^18
    function _depositLong(Actions.DepositArgs memory args) internal {}

    //High Level: Only vault operator / user should be able to withdraw long
    function _withdrawLong(Actions.WithdrawArgs memory args) internal isAuthorized(args.owner) {}

    //    High Level: Anyone should be able to deposit collateral into a vault
    function _depositCollateral(Actions.DepositArgs memory args) internal {}

    //High Level: Only vault operator / user  should be able to withdraw collateral into a vault
    function _withdrawCollateral(Actions.WithdrawArgs memory args) internal isAuthorized(args.owner) {}

    //High Level: Only vault operator / user  should be able to mint a new oToken. Add token balance to the vault account, also call Otoken.mint
    //Check that not minting 0 tokens
    //Ensure that the oToken has not expired
    //Example Input for amounts:
    //uint256 amount 1000000000000000000;  // 1 * 10^18
    //call updateOnMintShort(vault, args.asset, args.amount, args.index)
    //amount: 1000000000000000000 (no need to scale)
    //Call Otoken(args.asset).mint(args.from, args.amount)
    //amount: 1000000000000000000 (no need to scale)
    function _mintOtoken(Actions.MintArgs memory args) internal isAuthorized(args.owner) {}

    //High Level: anyone should be able to burn oTokens
    //Check args.from == msg.sender for this version
    //Check that not burning 0 tokens
    //Check that updateOnBurnShort(vault, args.asset, args.amount, args.index) has no error, if not fail and return an error
    //Call Otoken(args.asset).burn(msg.sender, args.amount)
    function _burnOtoken(Actions.BurnArgs memory args) internal {}

    //High Level: Otoken holders can withdraw cash value with their oToken
    function _exercise(Actions.ExerciseArgs memory args) internal {}

    //High Level: Clean up a vault and get back collateral after expiry.
    function _settleVault(Actions.SettleVaultArgs memory args) internal {}

    //High Level: call arbitrary smart contract
    //function _call(Actions.CallArgs args) internal {
    //    //Check whitelistModule.isWhitelistCallDestination(args.address)
    //    //Call args.address with args.data
    //}

    /**
     * @dev High Level: Checks if the transaction sender is the operator of the owner’s vault
     * @param _owner The owner of the relevant vault.
     * @param _sender DO WE NEED THIS?
     * @return A boolean which is true if and only if the sender is the operator of the owner's vault.
     */
    function isOperator(address _owner, address _sender) public view returns (bool) {}

    /**
     * @dev the oracle sets the price of the underlying of an otoken.
     */
    function setProductUnderlyingPrice(address _otoken, uint256 _roundsBack) external {}
}
