## `Controller`

contract that controls the gamma protocol and interaction with all sub contracts

### `notPaused()`

modifier to check if the system is not paused

### `notShutdown()`

modifier to check if the system is not in an emergency shutdown state

### `onlyTerminator()`

modifier to check if sender is the terminator address

### `onlyPauser()`

modifier to check if the sender is the pauser address

### `onlyAuthorized(address _sender, address _accountOwner)`

modifier to check if the sender is an account owner or an approved account operator

### `onlyWhitelistedCallee(address _callee)`

modifier to check if the called address is a whitelisted callee address

### `_isNotPaused()` (internal)

check if the system is not paused

### `_isNotShutdown()` (internal)

check if the system is not in an emergency shutdown state

### `_isAuthorized(address _sender, address _accountOwner)` (internal)

check if the sender is an authorized operator

### `initialize(address _addressBook, address _owner)` (external)

initalize the deployed contract

### `setSystemPaused(bool _paused)` (external)

allows the pauser to toggle the pause variable and pause or unpause the system

can only be called by the pauser

### `setEmergencyShutdown(bool _shutdown)` (external)

allows the terminator to toggle the emergency shutdown variable and put the system in an emergency shutdown state or return to a non-emergency shutdown state

can only be called by the terminator

### `setTerminator(address _terminator)` (external)

allows the owner to set the terminator address

can only be called by the owner

### `setPauser(address _pauser)` (external)

allows the owner to set the pauser address

can only be called by the owner

### `setCallRestriction(bool _isRestricted)` (external)

allows the owner to toggle the restriction on whitelisted call actions and only allow whitelisted call addresses or allow any arbitrary call addresses

can only be called by the owner

### `setOperator(address _operator, bool _isOperator)` (external)

allows a user to give or revoke privileges to an operator which can act on their behalf on their vaults

can only be updated by the vault owner

### `refreshConfiguration()` (external)

updates the configuration of the controller. can only be called by the owner

### `operate(struct Actions.ActionArgs[] _actions)` (external)

execute a number of actions on specific vaults

can only be called when the system is not shutdown

### `isOperator(address _owner, address _operator) → bool` (external)

check if a specific address is an operator for an owner account

### `getConfiguration() → address, address, address, address` (external)

returns the current controller configuration

### `getVaultBalances(address _owner, uint256 _vaultId) → struct MarginAccount.Vault` (external)

before expiry or if there is no short oToken in a vault, return a the vault, if the short oToken has expired, adjust the vault collateral balances by the net option proceeds

if vault has no short oToken or the issued oToken is not expired yet, return the vault, else call getExcessCollateral and return it as collateral amount inside Vault struct.

### `isPriceFinalized(address _otoken) → bool` (public)

return if an expired oToken contract’s settlement price has been finalized

### `getAccountVaultCounter(address _accountOwner) → uint256` (external)

get the number of current vaults for a specified account owner

### `isExpired(address _otoken) → bool` (public)

check if an oToken has expired

### `getVault(address _owner, uint256 _vaultId) → struct MarginAccount.Vault` (public)

return a specific vault

### `_runActions(struct Actions.ActionArgs[] _actions) → bool, address, uint256` (internal)

execute a variety of actions

for each action in the action array, execute the corresponding action, only one vault can be modified for all actions except SettleVault, Exercise, and Call

### `_verifyFinalState(address _owner, uint256 _vaultId)` (internal)

verify the vault final state after executing all actions

### `_openVault(struct Actions.OpenVaultArgs _args)` (internal)

open a new vault inside an account

only the account owner or operator can open a vault, cannot be called when system is paused or shutdown

### `_depositLong(struct Actions.DepositArgs _args)` (internal)

deposit a long oToken into a vault

cannot be called when system is paused or shutdown

### `_withdrawLong(struct Actions.WithdrawArgs _args)` (internal)

withdraw a long oToken from a vault

only the account owner or operator can withdraw a long oToken from a vault, cannot be called when system is paused or shutdown

### `_depositCollateral(struct Actions.DepositArgs _args)` (internal)

deposit a collateral asset into a vault

cannot be called when the system is paused or shutdown

### `_withdrawCollateral(struct Actions.WithdrawArgs _args)` (internal)

withdraw a collateral asset from a vault

only the account owner or operator can withdraw a collateral from a vault, cannot be called when system is paused or shutdown

### `_mintOtoken(struct Actions.MintArgs _args)` (internal)

mint short oTokens from a vault which creates an obligation recorded in a vault

only the account owner or operator can mint short oTokens from a vault, cannot be called when system is paused or shutdown

### `_burnOtoken(struct Actions.BurnArgs _args)` (internal)

burn oTokens to reduce or remove minted oToken obligation recorded in a vault

only the account owner or operator can burn oTokens for a vault, cannot be called when system is paused or shutdown

### `_exercise(struct Actions.ExerciseArgs _args)` (internal)

exercise an oToken after expiry, receiving the payout of the oToken in the collateral asset

cannot be called when system is paused

### `_settleVault(struct Actions.SettleVaultArgs _args)` (internal)

settle a vault after expiry, removing the remaining collateral in a vault after both long and short oToken payouts have been removed

deletes a vault of vaultId after remaining collateral is removed, cannot be called when system is paused

### `_call(struct Actions.CallArgs _args)` (internal)

execute arbitrary calls

cannot be called when system is paused or shutdown

### `_checkVaultId(address _accountOwner, uint256 _vaultId) → bool` (internal)

check if a vault id is valid

### `_isNotEmpty(address[] _array) → bool` (internal)

### `_getPayout(address _otoken, uint256 _amount) → uint256` (internal)

get the oToken's payout after expiry, in the collateral asset

### `_isCalleeWhitelisted(address _callee) → bool` (internal)

return if a callee address is whitelisted or not

### `_refreshConfigInternal()` (internal)

updates the internal configuration of the controller

### `AccountOperatorUpdated(address accountOwner, address operator, bool isSet)`

emits an event when an account operator is updated for a specific account owner

### `VaultOpened(address accountOwner, uint256 vaultId)`

emits an event when a new vault is opened

### `LongOtokenDeposited(address otoken, address accountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a long oToken is deposited into a vault

### `LongOtokenWithdrawed(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a long oToken is withdrawn from a vault

### `CollateralAssetDeposited(address asset, address accountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a collateral asset is deposited into a vault

### `CollateralAssetWithdrawed(address asset, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a collateral asset is withdrawn from a vault

### `ShortOtokenMinted(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 amount)`

emits an event when a short oToken is minted from a vault

### `ShortOtokenBurned(address otoken, address AccountOwner, address from, uint256 vaultId, uint256 amount)`

emits an event when a short oToken is burned

### `Exercise(address otoken, address exerciser, address receiver, address collateralAsset, uint256 otokenBurned, uint256 payout)`

emits an event when an oToken is exercised

### `VaultSettled(address otoken, address AccountOwner, address to, uint256 vaultId, uint256 payout)`

emits an event when a vault is settled

### `CallExecuted(address from, address to, address vaultOwner, uint256 vaultId, bytes data)`

emits an event when a call action is executed

### `TerminatorUpdated(address oldTerminator, address newTerminator)`

emits an event when the terminator address changes

### `PauserUpdated(address oldPauser, address newPauser)`

emits an event when the pauser address changes

### `SystemPaused(bool isActive)`

emits an event when the system paused status changes

### `EmergencyShutdown(bool isActive)`

emits an event when the system emergency shutdown status changes

### `CallRestricted(bool isRestricted)`

emits an event when the call action restriction changes
