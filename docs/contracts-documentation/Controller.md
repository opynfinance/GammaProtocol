# `Controller`

Contract that controls the Gamma Protocol and the interaction of all sub contracts

## Modifiers:

- `notPartiallyPaused()`

- `notFullyPaused()`

- `onlyFullPauser()`

- `onlyPartialPauser()`

- `onlyAuthorized(address _sender, address _accountOwner)`

- `onlyWhitelistedCallee(address _callee)`

## Functions:

- `_isNotPartiallyPaused() (internal)`

- `_isNotFullyPaused() (internal)`

- `_isAuthorized(address _sender, address _accountOwner) (internal)`

- `initialize(address _addressBook, address _owner) (external)`

- `setSystemPartiallyPaused(bool _partiallyPaused) (external)`

- `setSystemFullyPaused(bool _fullyPaused) (external)`

- `setFullPauser(address _fullPauser) (external)`

- `setPartialPauser(address _partialPauser) (external)`

- `setCallRestriction(bool _isRestricted) (external)`

- `setOperator(address _operator, bool _isOperator) (external)`

- `refreshConfiguration() (external)`

- `operate(struct Actions.ActionArgs[] _actions) (external)`

- `isOperator(address _owner, address _operator) (external)`

- `getConfiguration() (external)`

- `getProceed(address _owner, uint256 _vaultId) (external)`

- `getPayout(address _otoken, uint256 _amount) (public)`

- `isSettlementAllowed(address _otoken) (public)`

- `getAccountVaultCounter(address _accountOwner) (external)`

- `hasExpired(address _otoken) (external)`

- `getVault(address _owner, uint256 _vaultId) (public)`

- `_runActions(struct Actions.ActionArgs[] _actions) (internal)`

- `_verifyFinalState(address _owner, uint256 _vaultId) (internal)`

- `_openVault(struct Actions.OpenVaultArgs _args) (internal)`

- `_depositLong(struct Actions.DepositArgs _args) (internal)`

- `_withdrawLong(struct Actions.WithdrawArgs _args) (internal)`

- `_depositCollateral(struct Actions.DepositArgs _args) (internal)`

- `_withdrawCollateral(struct Actions.WithdrawArgs _args) (internal)`

- `_mintOtoken(struct Actions.MintArgs _args) (internal)`

- `_burnOtoken(struct Actions.BurnArgs _args) (internal)`

- `_redeem(struct Actions.RedeemArgs _args) (internal)`

- `_settleVault(struct Actions.SettleVaultArgs _args) (internal)`

- `_call(struct Actions.CallArgs _args, uint256 _ethLeft) (internal)`

- `_checkVaultId(address _accountOwner, uint256 _vaultId) (internal)`

- `_isNotEmpty(address[] _array) (internal)`

- `_isCalleeWhitelisted(address _callee) (internal)`

- `_refreshConfigInternal() (internal)`

## Events:

- `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`

- `VaultOpened(address accountOwner, uint256 vaultId)`

- `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`

- `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

- `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`

- `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

- `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

- `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`

- `Redeem(address otoken, address redeemer, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`

- `VaultSettled(address AccountOwner, address to, uint256 vaultId, uint256 payout)`

- `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`

- `FullPauserUpdated(address oldFullPauser, address newFullPauser)`

- `PartialPauserUpdated(address oldPartialPauser, address newPartialPauser)`

- `SystemPartiallyPaused(bool isActive)`

- `SystemFullyPaused(bool isActive)`

- `CallRestricted(bool isRestricted)`

### Modifier `notPartiallyPaused()`

modifier to check if the system is not partially paused, where only redeem and settleVault is allowed

### Modifier `notFullyPaused()`

modifier to check if the system is not fully paused, where no functionality is allowed

### Modifier `onlyFullPauser()`

modifier to check if sender is the fullPauser address

### Modifier `onlyPartialPauser()`

modifier to check if the sender is the partialPauser address

### Modifier `onlyAuthorized(address _sender, address _accountOwner)`

modifier to check if the sender is the account owner or an approved account operator

#### Parameters:

- `_sender`: sender address

- `_accountOwner`: account owner address

### Modifier `onlyWhitelistedCallee(address _callee)`

modifier to check if the called address is a whitelisted callee address

#### Parameters:

- `_callee`: called address

### Function `_isNotPartiallyPaused() internal`

check if the system is not in a partiallyPaused state

### Function `_isNotFullyPaused() internal`

check if the system is not in an fullyPaused state

### Function `_isAuthorized(address _sender, address _accountOwner) internal`

check if the sender is an authorized operator

#### Parameters:

- `_sender`: msg.sender

- `_accountOwner`: owner of a vault

### Function `initialize(address _addressBook, address _owner) external`

initalize the deployed contract

#### Parameters:

- `_addressBook`: addressbook module

- `_owner`: account owner address

### Function `setSystemPartiallyPaused(bool _partiallyPaused) external`

allows the partialPauser to toggle the systemPartiallyPaused variable and partially pause or partially unpause the system

can only be called by the partialPauser

#### Parameters:

- `_partiallyPaused`: new boolean value to set systemPartiallyPaused to

### Function `setSystemFullyPaused(bool _fullyPaused) external`

allows the fullPauser to toggle the systemFullyPaused variable and fully pause or fully unpause the system

can only be called by the fullPauser

#### Parameters:

- `_fullyPaused`: new boolean value to set systemFullyPaused to

### Function `setFullPauser(address _fullPauser) external`

allows the owner to set the fullPauser address

can only be called by the owner

#### Parameters:

- `_fullPauser`: new fullPauser address

### Function `setPartialPauser(address _partialPauser) external`

allows the owner to set the partialPauser address

can only be called by the owner

#### Parameters:

- `_partialPauser`: new partialPauser address

### Function `setCallRestriction(bool _isRestricted) external`

allows the owner to toggle the restriction on whitelisted call actions and only allow whitelisted

call addresses or allow any arbitrary call addresses

can only be called by the owner

#### Parameters:

- `_isRestricted`: new call restriction state

### Function `setOperator(address _operator, bool _isOperator) external`

allows a user to give or revoke privileges to an operator which can act on their behalf on their vaults

can only be updated by the vault owner

#### Parameters:

- `_operator`: operator that the sender wants to give privileges to or revoke them from

- `_isOperator`: new boolean value that expresses if the sender is giving or revoking privileges for _operator

### Function `refreshConfiguration() external`

updates the configuration of the controller. can only be called by the owner

### Function `operate(struct Actions.ActionArgs[] _actions) external`

execute a number of actions on specific vaults

can only be called when the system is not fully paused

#### Parameters:

- `_actions`: array of actions arguments

### Function `isOperator(address _owner, address _operator) → bool external`

check if a specific address is an operator for an owner account

#### Parameters:

- `_owner`: account owner address

- `_operator`: account operator address

#### Return Values:

- True if the _operator is an approved operator for the _owner account

### Function `getConfiguration() → address, address, address, address external`

returns the current controller configuration

#### Return Values:

- the address of the whitelist module

- the address of the oracle module

- the address of the calculator module

- the address of the pool module

### Function `getProceed(address _owner, uint256 _vaultId) → uint256 external`

return a vault's proceeds pre or post expiry, the amount of collateral that can be removed from a vault

#### Parameters:

- `_owner`: account owner of the vault

- `_vaultId`: vaultId to return balances for

#### Return Values:

- amount of collateral that can be taken out

### Function `getPayout(address _otoken, uint256 _amount) → uint256 public`

get an oToken's payout/cash value after expiry, in the collateral asset

#### Parameters:

- `_otoken`: oToken address

- `_amount`: amount of the oToken to calculate the payout for, always represented in 1e8

#### Return Values:

- amount of collateral to pay out

### Function `isSettlementAllowed(address _otoken) → bool public`

return if an expired oToken contract’s settlement price has been finalized

#### Parameters:

- `_otoken`: address of the oToken

#### Return Values:

- True if the oToken has expired AND all oracle prices at the expiry timestamp have been finalized, False if not

### Function `getAccountVaultCounter(address _accountOwner) → uint256 external`

get the number of vaults for a specified account owner

#### Parameters:

- `_accountOwner`: account owner address

#### Return Values:

- number of vaults

### Function `hasExpired(address _otoken) → bool external`

check if an oToken has expired

#### Parameters:

- `_otoken`: oToken address

#### Return Values:

- True if the otoken has expired, False if not

### Function `getVault(address _owner, uint256 _vaultId) → struct MarginVault.Vault public`

return a specific vault

#### Parameters:

- `_owner`: account owner

- `_vaultId`: vault id of vault to return

#### Return Values:

- Vault struct that corresponds to the _vaultId of _owner

### Function `_runActions(struct Actions.ActionArgs[] _actions) → bool, address, uint256 internal`

execute a variety of actions

for each action in the action array, execute the corresponding action, only one vault can be modified

for all actions except SettleVault, Redeem, and Call

#### Parameters:

- `_actions`: array of type Actions.ActionArgs[], which expresses which actions the user wants to execute

#### Return Values:

- indicates if a vault has changed

- the vault owner if a vault has changed

- the vault Id if a vault has changed

### Function `_verifyFinalState(address _owner, uint256 _vaultId) internal`

verify the vault final state after executing all actions

#### Parameters:

- `_owner`: account owner address

- `_vaultId`: vault id of the final vault

### Function `_openVault(struct Actions.OpenVaultArgs _args) internal`

open a new vault inside an account

only the account owner or operator can open a vault, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: OpenVaultArgs structure

### Function `_depositLong(struct Actions.DepositArgs _args) internal`

deposit a long oToken into a vault

only the account owner or operator can deposit a long oToken, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: DepositArgs structure

### Function `_withdrawLong(struct Actions.WithdrawArgs _args) internal`

withdraw a long oToken from a vault

only the account owner or operator can withdraw a long oToken, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: WithdrawArgs structure

### Function `_depositCollateral(struct Actions.DepositArgs _args) internal`

deposit a collateral asset into a vault

only the account owner or operator can deposit collateral, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: DepositArgs structure

### Function `_withdrawCollateral(struct Actions.WithdrawArgs _args) internal`

withdraw a collateral asset from a vault

only the account owner or operator can withdraw collateral, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: WithdrawArgs structure

### Function `_mintOtoken(struct Actions.MintArgs _args) internal`

mint short oTokens from a vault which creates an obligation that is recorded in the vault

only the account owner or operator can mint an oToken, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: MintArgs structure

### Function `_burnOtoken(struct Actions.BurnArgs _args) internal`

burn oTokens to reduce or remove the minted oToken obligation recorded in a vault

only the account owner or operator can burn an oToken, cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: MintArgs structure

### Function `_redeem(struct Actions.RedeemArgs _args) internal`

redeem an oToken after expiry, receiving the payout of the oToken in the collateral asset

cannot be called when system is fullyPaused

#### Parameters:

- `_args`: RedeemArgs structure

### Function `_settleVault(struct Actions.SettleVaultArgs _args) internal`

settle a vault after expiry, removing the net proceeds/collateral after both long and short oToken payouts have settled

deletes a vault of vaultId after net proceeds/collateral is removed, cannot be called when system is fullyPaused

#### Parameters:

- `_args`: SettleVaultArgs structure

### Function `_call(struct Actions.CallArgs _args, uint256 _ethLeft) → uint256 internal`

execute arbitrary calls

cannot be called when system is partiallyPaused or fullyPaused

#### Parameters:

- `_args`: Call action

- `_ethLeft`: amount of eth left for this call.

### Function `_checkVaultId(address _accountOwner, uint256 _vaultId) → bool internal`

check if a vault id is valid for a given account owner address

#### Parameters:

- `_accountOwner`: account owner address

- `_vaultId`: vault id to check

#### Return Values:

- True if the _vaultId is valid, False if not

### Function `_isNotEmpty(address[] _array) → bool internal`

### Function `_isCalleeWhitelisted(address _callee) → bool internal`

return if a callee address is whitelisted or not

#### Parameters:

- `_callee`: callee address

#### Return Values:

- True if callee address is whitelisted, False if not

### Function `_refreshConfigInternal() internal`

updates the internal configuration of the controller

### Event `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`

emits an event when an account operator is updated for a specific account owner

### Event `VaultOpened(address accountOwner, uint256 vaultId)`

emits an event when a new vault is opened

### Event `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a long oToken is deposited into a vault

### Event `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a long oToken is withdrawn from a vault

### Event `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a collateral asset is deposited into a vault

### Event `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a collateral asset is withdrawn from a vault

### Event `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a short oToken is minted from a vault

### Event `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a short oToken is burned

### Event `Redeem(address otoken, address redeemer, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`

emits an event when an oToken is redeemed

### Event `VaultSettled(address AccountOwner, address to, uint256 vaultId, uint256 payout)`

emits an event when a vault is settled

### Event `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`

emits an event when a call action is executed

### Event `FullPauserUpdated(address oldFullPauser, address newFullPauser)`

emits an event when the fullPauser address changes

### Event `PartialPauserUpdated(address oldPartialPauser, address newPartialPauser)`

emits an event when the partialPauser address changes

### Event `SystemPartiallyPaused(bool isActive)`

emits an event when the system partial paused status changes

### Event `SystemFullyPaused(bool isActive)`

emits an event when the system fully paused status changes

### Event `CallRestricted(bool isRestricted)`

emits an event when the call action restriction changes
