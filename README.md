# Gamma Protocol [![CircleCI](https://circleci.com/gh/opynfinance/GammaProtocol.svg?style=svg)](https://circleci.com/gh/opynfinance/GammaProtocol/tree/master) [![Coverage Status](https://coveralls.io/repos/github/opynfinance/GammaProtocol/badge.svg?branch=master)](https://coveralls.io/github/opynfinance/GammaProtocol?branch=master)

Gamma is a decentralized capital efficient option protocol that enables sellers to create spreads. 
Gamma protocol enables any user to create arbitrary option tokens, that represent the right to buy or sell a certain asset in a predefined price (strike price) at or before expiry. 
As the option seller in Gamma, you can reduce the amount of capital locked in the system by creating spreads. (e.g Instead of putting down 100 USDC and mint 1 ETH-USDC-100 Put, you can buy a ETH-USDC-50 Put, and only deposit 50 USDC as collateral)
The oTokens created by Gamma are cash settled European option, means all the options will automatically be exercised at expiry. A holder can redeem the proceeds by sending the oTokens back, the system will pay the holder the cash value based on strike price and underlying spot price at expiry, instead of actually exchanging the underlying asset and the strike asset.

## Documentation

Our docs site is [here](https://opyn.gitbook.io/opyn/getting-started/introduction). It contains tutorials, explainers, and smart contract documentation. If you'd like to view these docs on github instead, check out [the docs folder](/docs) in the docs repo:

- [Smart contracts documentation](SUMMARY.md)
- [UML diagrams](/docs/uml)
- [Control flow diagrams](/docs/control-flow)

## Local Development Setup

For local development it is recommended to use ganache to run a local development chain. Using the ganache simulator no full Ethereum node is required.

As a pre-requisite, you need:

- Node.js (v10.18.0)
- NPM

Clone the project and install all dependencies:

```sh
$ git clone https://github.com/opynfinance/GammaProtocol.git
$ cd GammaProtocol

# install project dependencies
$ npm i
```

Compile all contracts:

```sh
$ npm run build
```

In a new terminal, launch an Ethereum RPC client, we use the default ganache-cli command to configure and run a local development ganache:

```sh
$ npm run ganache
```

Switch back to your other terminal and deploy the contracts, and make sure to:
- Add your infura key in `.infuraKey` file
- Add your wallet mnemonic in `.secret` file
- Setup the deployments parameters in `./migrations/deployment-config.json` file

```sh
# Local deployment
$ npm run deploy:development

# Mainnet deployment
$ npm run deploy:mainnet
```

## Running Tests

Run all unit tests:

```sh
$ npm run test:unit
```

Run all integration tests:

```sh
$ npm run test:integration
```

## Linting

Clean code is the best code, so we've provided tools to automatically lint your projects.

Lint all smart contracts:

```sh
$ npm run lint:sol
```

Lint all tests files:

```sh
$ npm run lint:tests
```

### Automatically Fixing Linting Issues

We've also provided tools to make it possible to automatically fix any linting issues. It's much easier than trying to fix issues manually.

Fix all smart contracts:

```sh
$ npm run lint:sol:prettier:fix
```

Fix all tests files:

```sh
$ npm run lint:tests:prettier:fix
```

## Coverage

We use the [solidity-coverage](https://github.com/sc-forks/solidity-coverage) package to generate our coverage reports. You can find the coverage report at [coveralls](https://coveralls.io/github/opynfinance/GammaProtocol?branch=master). Otherwise, you can generate it locally by running:

```sh
$ npm run coverage
```

The full report can be viewed by opening the `coverage/index.html` file in a browser.

## Security And Bug Bounty Program

The security of the Opyn protocol is our highest priority. Our team has created a protocol that we believe is safe and dependable, and has been audited by OpenZeppelin. All smart contract code is publicly verifiable and we have a bug bounty for undiscovered vulnerabilities. 
We encourage our users to be mindful of risk and only use funds they can afford to lose. Options are complex instruments that when understood correctly can be powerful hedges. Smart contracts are still new and experimental technology. We want to remind our users to be optimistic about innovation while remaining cautious about where they put their money. 

Please see [here](https://opyn.gitbook.io/opyn/security) for details on our security audit and bug bounty program.
