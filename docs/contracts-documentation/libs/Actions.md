# `Actions`

A library that provides a ActionArgs struct, sub types of Action structs, and functions to parse ActionArgs into specific Actions.

## Functions:

- `_parseOpenVaultArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseMintArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseBurnArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseDepositArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseWithdrawArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseRedeemArgs(struct Actions.ActionArgs _args) (internal)`

- `_parseSettleVaultArgs(struct Actions.ActionArgs _args) (internal)`

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

### Function `_parseCallArgs(struct Actions.ActionArgs _args) → struct Actions.CallArgs internal`

parses the passed in action arguments to get the arguments for a call action

#### Parameters:

- `_args`: general action arguments structure

#### Return Values:

- arguments for a call action
