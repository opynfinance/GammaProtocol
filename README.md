# Gamma Protocol [![CircleCI](https://circleci.com/gh/opynfinance/GammaProtocol.svg?style=svg)](https://circleci.com/gh/opynfinance/GammaProtocol/tree/master) [![Coverage Status](https://coveralls.io/repos/github/opynfinance/GammaProtocol/badge.svg?branch=master)](https://coveralls.io/github/opynfinance/GammaProtocol?branch=master) [![Crytic Status](https://crytic.io/api/repositories/4uRxP_ItTzK-RmpaNiU6PA/badge.svg?token=95ac29ba-8408-48bc-a798-9faf7eaf83c8)](https://crytic.io/opynfinance/GammaProtocol)

Gamma is a decentralized capital efficient option protocol that enables sellers to create spreads. 
Gamma protocol enables any user to create arbitrary option tokens, that represent the right to buy or sell a certain asset in a predefined price (strike price) at or before expiry. 
As the option seller in Gamma, you can reduce the amount of capital locked in the system by creating spreads. (e.g Instead of putting down 100 USDC and mint 1 ETH-USDC-100 Put, you can buy a ETH-USDC-50 Put, and only deposit 50 USDC as collateral)
The oTokens created by Gamma are cash settled European option, means that holder cannot exercise before expiry, and when the holder exercises an option, he or she only need to send the oTokens back, the system will pay the holder the cash value base on strike price and underlying spot price at expiry, instead of actually exchange the underlying asset and the strike asset.

## Documentation

## Local Development Setup

For local development it is recommended to use ganache to run a local development chain. Using the ganache simulator no full Ethereum node is required.

As a pre-requisite, you need:

- Node.js
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

Switch back to your other terminal and deploy the contracts, and make sure to to setup the deployments parameters in `./migrations/deployment-config.json` file:

```sh
$ npm run deploy:development
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

## Security
Security is a top priority for us at Opyn. As an insurance platform, we care most about furthering the trust users have in DeFi. This code is still in development and has not been finalized, hence we anticipate there will be issues. We would love to learn about them while we are still in the development phases of the project! 

We care about building out a safe and secure DeFi. You can help us further this mission, by letting us know if you find a vulnerability by emailing security@opyn.co.