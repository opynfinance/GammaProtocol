# `Actions`

A library that provides a ActionArgs struct, sub types of Action structs, and functions to parse ActionArgs into specific Actions.

errorCode

A1 can only parse arguments for open vault actions

A2 cannot open vault for an invalid account

A3 cannot open vault with an invalid type

A4 can only parse arguments for mint actions

A5 cannot mint from an invalid account

A6 can only parse arguments for burn actions

A7 cannot burn from an invalid account

A8 can only parse arguments for deposit actions

A9 cannot deposit to an invalid account

A10 can only parse arguments for withdraw actions

A11 cannot withdraw from an invalid account

A12 cannot withdraw to an invalid account

A13 can only parse arguments for redeem actions

A14 cannot redeem to an invalid account

A15 can only parse arguments for settle vault actions

A16 cannot settle vault for an invalid account

A17 cannot withdraw payout to an invalid account

A18 can only parse arguments for liquidate action

A19 cannot liquidate vault for an invalid account owner

A20 cannot send collateral to an invalid account

A21 cannot parse liquidate action with no round id

A22 can only parse arguments for call actions

A23 target address cannot be address(0)

## Functions:

- `_parseOpenVaultArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseMintArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseBurnArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseDepositArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseWithdrawArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseRedeemArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseSettleVaultArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseLiquidateArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseCallArgs(struct Actions.ActionArgs _args) (internal)`

### Function `_parseOpenVaultArgs(struct Actions.ActionArgs _args) → struct Actions.OpenVaultArgs internal`

parses the passed in action arguments to get the arguments for an open vault action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a open vault action

### Function `_parseMintArgs(struct Actions.ActionArgs _args) → struct Actions.MintArgs internal`

parses the passed in action arguments to get the arguments for a mint action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a mint action

### Function `_parseBurnArgs(struct Actions.ActionArgs _args) → struct Actions.BurnArgs internal`

parses the passed in action arguments to get the arguments for a burn action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a burn action

### Function `_parseDepositArgs(struct Actions.ActionArgs _args) → struct Actions.DepositArgs internal`

parses the passed in action arguments to get the arguments for a deposit action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a deposit action

### Function `_parseWithdrawArgs(struct Actions.ActionArgs _args) → struct Actions.WithdrawArgs internal`

parses the passed in action arguments to get the arguments for a withdraw action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a withdraw action

### Function `_parseRedeemArgs(struct Actions.ActionArgs _args) → struct Actions.RedeemArgs internal`

parses the passed in action arguments to get the arguments for an redeem action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a redeem action

### Function `_parseSettleVaultArgs(struct Actions.ActionArgs _args) → struct Actions.SettleVaultArgs internal`

parses the passed in action arguments to get the arguments for a settle vault action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a settle vault action

### Function `_parseLiquidateArgs(struct Actions.ActionArgs _args) → struct Actions.LiquidateArgs internal`

### Function `_parseCallArgs(struct Actions.ActionArgs _args) → struct Actions.CallArgs internal`

parses the passed in action arguments to get the arguments for a call action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a call action
