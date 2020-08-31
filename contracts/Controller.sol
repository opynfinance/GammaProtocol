/**
 * SPDX-License-Identifier: UNLICENSED
 */
pragma solidity =0.6.10;

pragma experimental ABIEncoderV2;

import {Ownable} from "./packages/oz/Ownable.sol";
import {SafeMath} from "./packages/oz/SafeMath.sol";
import {ReentrancyGuard} from "./packages/oz/ReentrancyGuard.sol";
import {MarginAccount} from "./libs/MarginAccount.sol";
import {Actions} from "./libs/Actions.sol";
import {AddressBookInterface} from "./interfaces/AddressBookInterface.sol";
import {OtokenInterface} from "./interfaces/OtokenInterface.sol";
import {MarginCalculatorInterface} from "./interfaces/MarginCalculatorInterface.sol";
import {OracleInterface} from "./interfaces/OracleInterface.sol";
import {WhitelistInterface} from "./interfaces/WhitelistInterface.sol";
import {MarginPoolInterface} from "./interfaces/MarginPoolInterface.sol";

/**
 * @author Opyn Team
 * @title Controller
 * @notice contract that
 */
contract Controller is ReentrancyGuard, Ownable {
    using MarginAccount for MarginAccount.Vault;
    using SafeMath for uint256;

    /// @notice the protocol state, if true, then all protocol functionality are paused.
    bool public systemPaused;

    /// @dev AddressBook module
    address internal addressBook;

    /// @dev mapping between owner address and account structure
    mapping(address => uint256) internal accountVaultCounter;
    /// @dev mapping between owner address and specific vault using vaultId
    mapping(address => mapping(uint256 => MarginAccount.Vault)) internal vaults;
    /// @dev mapping between account owner and account operator
    mapping(address => mapping(address => bool)) internal operators;

    /**
     * @notice contructor
     * @param _addressBook adressbook module
     */
    constructor(address _addressBook) public {
        require(_addressBook != address(0), "Controller: Invalid address book");

        addressBook = _addressBook;
    }

    /// @notice emits an event when a account operator updated for a specific account owner
    event AccountOperatorUpdated(address indexed accountOwner, address indexed operator, bool isSet);

    /**
     * @notice modifier check if protocol is not paused
     */
    modifier isNotPaused {
        require(!systemPaused, "Controller: system is paused");

        _;
    }

    /**
     * @notice modifier to check if sender is an account owner or an authorized account operator
     * @param _sender sender address
     * @param _accountOwner account owner address
     */
    modifier isAuthorized(address _sender, address _accountOwner) {
        require(
            (_sender == _accountOwner) || (operators[_accountOwner][_sender]),
            "Controller: msg.sender is not authorized to run action"
        );

        _;
    }

    /**
     * @notice modifier to check the validity of a specific vault id
     * @param _accountOwner account owner address
     * @param _vaultId vault id
     */
    modifier isValidVaultId(address _accountOwner, uint256 _vaultId) {
        require((_vaultId > 0) && (_vaultId <= accountVaultCounter[_accountOwner]), "Controller: invalid vault id");

        _;
    }

    /**
     * @notice allows admin to toggle pause / emergency shutdown
     * @param _paused The new boolean value to set systemPaused to.
     */
    function setSystemPaused(bool _paused) external onlyOwner {
        systemPaused = _paused;
    }

    /**
     * @notice allows a user to set and unset an operate which can act on their behalf on their vaults. Only the vault owner can update the operator privileges.
     * @param _operator The operator that sender wants to give privileges to or revoke them from.
     * @param _isOperator The new boolean value that expresses if sender is giving or revoking privileges from _operator.
     */
    function setOperator(address _operator, bool _isOperator) external {
        operators[msg.sender][_operator] = _isOperator;

        emit AccountOperatorUpdated(msg.sender, _operator, _isOperator);
    }

    /**
     * @notice execute a different number of actions on a specific vaults
     * @dev can only be called when system is not paused
     * @param _actions array of actions arguments
     */
    function operate(Actions.ActionArgs[] memory _actions) external isNotPaused nonReentrant {
        MarginAccount.Vault memory vault = _runActions(_actions);
        _verifyFinalState(vault);
    }

    /**
     * @notice Iterate through a collateral array of the vault and payout collateral assets
     * @dev can only be called when system is not paused and from an authorized address
     * @param _owner The owner of the vault we will clear
     * @param _vaultId The vaultId for the vault we will clear, within the user's MarginAccount.Account struct
     */
    //function redeemForEmergency(address _owner, uint256 _vaultId) external isNotPaused isAuthorized(args.owner) {
    //}

    /**
     * @notice set batch underlying asset price
     * @param _otoken otoken address
     * @param _roundsBack chainlink round number relative to specific timestamp
     */
    // function setBatchUnderlyingPrice(address _otoken, uint256 _roundsBack) external {
    // }

    /**
     * @notice check if a specific address is an operator for an owner account
     * @param _owner account owner address
     * @param _operator account operator address
     * @return true if operator, else false
     */
    function isOperator(address _owner, address _operator) external view returns (bool) {
        return operators[_owner][_operator];
    }

    /**
     * @notice Return a vault's balances. If the vault doesn't have a short option or the short option has not expired, then the vault's collateral balances are returned. If the short option has expired, the collateral balance the vault has is dependent on if the option expired ITM or OTM.
     * @dev if vault has no short option or the issued option is not expired yet, return the vault, else call get excess margin and return it as collateral amount inside Vault struct.
     * @param _owner account owner.
     * @param _vaultId vault.
     * @return Vault struct
     */
    function getVaultBalances(address _owner, uint256 _vaultId) external view returns (MarginAccount.Vault memory) {
        MarginAccount.Vault memory vault = getVault(_owner, _vaultId);

        // if there is no minted short option or the short option has not expired yet
        if ((vault.shortOtokens.length == 0) || (!isExpired(vault.shortOtokens[0]))) return vault;

        // if there is a short option and it has expired
        address calculatorModule = AddressBookInterface(addressBook).getMarginCalculator();
        MarginCalculatorInterface calculator = MarginCalculatorInterface(calculatorModule);

        (uint256 netValue, ) = calculator.getExcessMargin(vault);
        vault.collateralAmounts[0] = netValue;
        return vault;
    }

    /**
     * @dev return if an expired oToken contract’s price has been finalized. Returns true if the contract has expired AND the oraclePrice at the expiry timestamp has been finalized.
     * @param _otoken The address of the relevant oToken.
     * @return A boolean which is true if and only if the price is finalized.
     */
    function isPriceFinalized(address _otoken) external view returns (bool) {
        address oracleModule = AddressBookInterface(addressBook).getOracle();
        OracleInterface oracle = OracleInterface(oracleModule);

        OtokenInterface otoken = OtokenInterface(_otoken);

        address underlying = otoken.underlyingAsset();
        uint256 expiry = otoken.expiryTimestamp();

        (, bool isFinalized) = oracle.getExpiryPrice(underlying, expiry);
        return isFinalized;
    }

    /**
     * @notice get number of vaults in a specific account
     * @param _accountOwner account owner address
     * @return number of vaults
     */
    function getAccountVaultCounter(address _accountOwner) external view returns (uint256) {
        return accountVaultCounter[_accountOwner];
    }

    /**
     * @notice function to check if otoken is expired
     * @param _otoken otoken address
     * @return true if otoken is expired, else return false
     */
    function isExpired(address _otoken) public view returns (bool) {
        uint256 otokenExpiryTimestamp = OtokenInterface(_otoken).expiryTimestamp();

        return now > otokenExpiryTimestamp;
    }

    /**
     * @notice Return a specific vault.
     * @param _owner account owner.
     * @param _vaultId vault.
     * @return Vault struct
     */
    function getVault(address _owner, uint256 _vaultId) public view returns (MarginAccount.Vault memory) {
        return vaults[_owner][_vaultId];
    }

    /**
     * @notice Execute actions on a certain vault
     * @dev For each action in the action Array, run the corresponding action
     * @param _actions An array of type Actions.ActionArgs[] which expresses which actions the user want to execute.
     */
    function _runActions(Actions.ActionArgs[] memory _actions) internal returns (MarginAccount.Vault memory) {
        MarginAccount.Vault memory vault;

        uint256 prevActionVaultId;
        bool isActionVaultStored;

        for (uint256 i = 0; i < _actions.length; i++) {
            Actions.ActionArgs memory action = _actions[i];
            Actions.ActionType actionType = action.actionType;

            if (
                (actionType != Actions.ActionType.SettleVault) ||
                (actionType != Actions.ActionType.Exercise) ||
                (actionType != Actions.ActionType.Call)
            ) {
                // check if this action is manipulating the same vault as all other actions, other than SettleVault
                (prevActionVaultId, isActionVaultStored) = _checkActionsVaults(
                    prevActionVaultId,
                    action.vaultId,
                    isActionVaultStored
                );
            }

            if (actionType == Actions.ActionType.OpenVault) {
                _openVault(Actions._parseOpenVaultArgs(action));
            } else if (actionType == Actions.ActionType.DepositLongOption) {
                vault = _depositLong(Actions._parseDepositArgs(action));
            } else if (actionType == Actions.ActionType.WithdrawLongOption) {
                vault = _withdrawLong(Actions._parseWithdrawArgs(action));
            }
        }

        return vault;
    }

    /**
     * @notice verify vault final state after executing all actions
     * @param _vault final vault state
     */
    function _verifyFinalState(MarginAccount.Vault memory _vault) internal view {
        address calculatorModule = AddressBookInterface(addressBook).getMarginCalculator();
        MarginCalculatorInterface calculator = MarginCalculatorInterface(calculatorModule);

        (, bool isValidVault) = calculator.getExcessMargin(_vault);

        require(isValidVault, "Controller: invalid final vault state");
    }

    /**
     * @dev check that prev vault id is equal to current vault id
     * @param _prevActionVaultId previous vault id
     * @param _currActionVaultId current vault id
     * @param _isActionVaultStored a bool to indicate if a first check is done or not
     * @return current vault id and true as first check is done
     */
    function _checkActionsVaults(
        uint256 _prevActionVaultId,
        uint256 _currActionVaultId,
        bool _isActionVaultStored
    ) internal pure returns (uint256, bool) {
        if (_isActionVaultStored) {
            require(_prevActionVaultId == _currActionVaultId, "Controller: can not run actions on different vaults");
        }

        return (_currActionVaultId, true);
    }

    /**
     * @notice open new vault inside an account
     * @dev Only account owner or operator can open a vault
     * @param _args OpenVaultArgs structure
     */
    function _openVault(Actions.OpenVaultArgs memory _args) internal isAuthorized(msg.sender, _args.owner) {
        accountVaultCounter[_args.owner] = accountVaultCounter[_args.owner].add(1);

        require(
            _args.vaultId == accountVaultCounter[_args.owner],
            "Controller: can not run actions on inexistent vault"
        );
    }

    /**
     * @notice deposit long option into vault
     * @param _args DepositArgs structure
     */
    function _depositLong(Actions.DepositArgs memory _args)
        internal
        isValidVaultId(_args.owner, _args.vaultId)
        returns (MarginAccount.Vault memory)
    {
        require(_args.from == msg.sender, "Controller: depositor address and msg.sender address mismatch");

        address whitelistModule = AddressBookInterface(addressBook).getWhitelist();
        WhitelistInterface whitelist = WhitelistInterface(whitelistModule);

        require(
            whitelist.isWhitelistedOtoken(_args.asset),
            "Controller: otoken is not whitelisted to be used as collateral"
        );

        OtokenInterface otoken = OtokenInterface(_args.asset);

        require(now <= otoken.expiryTimestamp(), "Controller: otoken used as collateral is already expired");

        vaults[_args.owner][_args.vaultId]._addLong(address(otoken), _args.amount, _args.index);

        address marginPoolModule = AddressBookInterface(addressBook).getMarginPool();
        MarginPoolInterface marginPool = MarginPoolInterface(marginPoolModule);

        marginPool.transferToPool(address(otoken), _args.from, _args.amount);

        return vaults[_args.owner][_args.vaultId];
    }

    /**
     * @notice withdraw long option from vault
     * @dev Only account owner or operator can withdraw long option from vault
     * @param _args WithdrawArgs structure
     */
    function _withdrawLong(Actions.WithdrawArgs memory _args)
        internal
        isAuthorized(msg.sender, _args.owner)
        isValidVaultId(_args.owner, _args.vaultId)
        returns (MarginAccount.Vault memory)
    {
        OtokenInterface otoken = OtokenInterface(_args.asset);

        require(now <= otoken.expiryTimestamp(), "Controller: can not withdraw an expired otoken");

        vaults[_args.owner][_args.vaultId]._removeLong(address(otoken), _args.amount, _args.index);

        address marginPoolModule = AddressBookInterface(addressBook).getMarginPool();
        MarginPoolInterface marginPool = MarginPoolInterface(marginPoolModule);

        marginPool.transferToUser(address(otoken), _args.to, _args.amount);

        return vaults[_args.owner][_args.vaultId];
    }

    /**
     * @notice deposit collateral asset into vault
     * @param _args DepositArgs structure
     */
    // function _depositCollateral(Actions.DepositArgs memory _args) internal {}

    /**
     * @notice withdraw collateral asset from vault
     * @dev only account owner or operator can withdraw long option from vault
     * @param _args WithdrawArgs structure
     */
    // function _withdrawCollateral(Actions.WithdrawArgs memory _args) internal isAuthorized(_args.owner) {}

    /**
     * @notice mint option into vault
     * @dev only account owner or operator can withdraw long option from vault
     * @param _args MintArgs structure
     */
    // function _mintOtoken(Actions.MintArgs memory _args) internal isAuthorized(_args.owner) {}

    /**
     * @notice burn option
     * @dev only account owner or operator can withdraw long option from vault
     * @param _args MintArgs structure
     */
    // function _burnOtoken(Actions.BurnArgs memory _args) internal {}

    /**
     * @notice exercise option
     * @param _args ExerciseArgs structure
     */
    // function _exercise(Actions.ExerciseArgs memory _args) internal {}

    /**
     * @notice settle vault option
     * @param _args SettleVaultArgs structure
     */
    // function _settleVault(Actions.SettleVaultArgs memory _args) internal {}

    //High Level: call arbitrary smart contract
    //function _call(Actions.CallArgs args) internal {
    //    //Check whitelistModule.isWhitelistCallDestination(args.address)
    //    //Call args.address with args.data
    //}
}
