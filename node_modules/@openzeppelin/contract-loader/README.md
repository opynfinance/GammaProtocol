# OpenZeppelin Contract Loader

[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/contract-loader.svg)](https://www.npmjs.org/package/@openzeppelin/contract-loader)
[![Build Status](https://circleci.com/gh/OpenZeppelin/openzeppelin-contract-loader.svg?style=shield)](https://circleci.com/gh/OpenZeppelin/openzeppelin-contract-loader)

**Load contract objects from built artifacts or ABIs.** Includes support for both [web3-eth-contract](https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html) and [@truffle/contract](https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html) objects.

## Installation

```bash
npm install @openzeppelin/contract-loader
```

You will also need to install `web3-eth-contract` and/or `@truffle/contract`, depending on which abstractions you want to be able to load.

## Usage

### Basic setup

```javascript
const { setupLoader } = require('@openzeppelin/contract-loader');

const loader = setupLoader({
  provider,
  defaultSender, // optional
  defaultGas,    // optional - defaults to 8 million
});
````

### Loading web3 contracts

```javascript
const web3Loader = loader.web3;

// Load from artifacts built by the compiler (stored in .json files)
const ERC20 = web3Loader.fromArtifacts('ERC20');

// Or load directly from an ABI
const abi = [ ... ];
const ERC20 = web3Loader.fromABI(abi);

// Deploy token
const token = await ERC20.deploy().send();

// Query blockchain state and send transactions
const balance = await token.methods.balanceOf(sender).call();
await token.methods.transfer(receiver, balance).send({ from: sender });
```

### Loading truffle contracts

```javascript
const truffleLoader = loader.truffle;

// Load from artifacts built by the compiler (stored in .json files)
const ERC20 = truffleLoader.fromArtifacts('ERC20');

// Or load directly from an ABI
const abi = [ ... ];
const ERC20 = truffleLoader.fromABI(abi);

// Deploy token
const token = await ERC20.new();

// Query blockchain state and send transactions
const balance = await token.balanceOf(sender);
await token.transfer(receiver, balance, { from: sender });
```
