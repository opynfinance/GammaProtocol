# Scripts

## Payable Proxy Contract Deployment

To deploy a new `PayableProxyController.sol`, it is recommended to use the `deployPayableProxyController` truffle script inside the `scripts` folder.

**Input**

```sh
truffle exec scripts/deployPayableProxyController.js --network mainnet --controller 0x7d78c401c69c56cb21f4bf80c53afd92be0BBBBB --pool 0xc02aaa39b223fe8d0a0e5c4f27ead9083c7AAaaa --weth 0x5f4eC3Df9cbd43714FE2740f5E3616155cAGAGAG --gasPrice 50000000000
```

**Output**

```sh
Deploying payable proxy contract on mainnet 🍕
Payable proxy contract deployed! 🎉
Transaction hash: 0xebf12fc6603ee857bcabe1c0c6194XX82639a9888776f7ff6e83a409XXXXXXXX
Deployed contract address: 0x669cC97687c792fc5369d7bdd38cXXXXXXXXXX
```

## Chainlink Pricer Deployment

To deploy a new `ChainlinkPricer.sol`, it is recommended to use the `deployChainlinkPricer` truffle script inside the `scripts` folder.

**Input**

```sh
truffle exec scripts/deployChainlinkPricer.js --network mainnet --controller 0x7d78c401c69c56cb21f4bf80c53afd92be0BBBBB --pool 0xc02aaa39b223fe8d0a0e5c4f27ead9083c7AAaaa --weth 0x5f4eC3Df9cbd43714FE2740f5E3616155cAGAGAG --oracle 0xef196aA0e3Cb8EA6d5720557C3B611Eff6OOOOOO --gasPrice 50000000000
```

**Output**

```sh
Deploying chainlink pricer contract on mainnet 🍕
Chainlink pricer deployed! 🎉
Transaction hash: 0xebf12fc6603ee857bcabe1c0c6194XX82639a9888776f7ff6e83a409XXXXXXXX
Deployed contract address: 0x669cC97687c792fc5369d7bdd38cXXXXXXXXXX
```

## Permit Callee Deployment

The `PermitCallee.sol` contract allow user to call `permit()` function through the Controller Call action.
To deploy a new `PermitCallee.sol`, it is recommended to use the `deployPermitCallee` truffle script inside the `scripts` folder.

**Input**

```sh
truffle exec scripts/deployPermitCallee.js --network kovan --gasPrice 50000000000
```

## Stakedao Pricer Deployment

To deploy a new `StakedaoPricer.sol`, it is recommended to use the `deployStakedaoPricer` truffle script inside the `scripts` folder.

**Input**

```sh
truffle exec scripts/deployStakedaoPricer.js --network mainnet --lpToken 0x5af15DA84A4a6EDf2d9FA6720De921E1026E37b7 --underlying 0x853d955aCEf822Db058eb8505911ED77F175b99e --oracle 0x789cD7AB3742e23Ce0952F6Bc3Eb3A73A0E08833 --curve 0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B --gasPrice 160000000000
```

**Output**

```sh
Deploying Stakedao pricer contract to mainnet 🍕
Stakedao pricer deployed! 🎉
Transaction hash: 0xebf12fc6603ee857bcabe1c0c6194XX82639a9888776f7ff6e83a409XXXXXXXX
Deployed contract address: 0x669cC97687c792fc5369d7bdd38cXXXXXXXXXX
```

## Yearn Pricer Deployment

To deploy a new `YearnPricer.sol`, it is recommended to use the `deployYearnPricer` truffle script inside the `scripts` folder.

**Input**

```sh
truffle exec scripts/deployYearnPricer.js --network mainnet --yToken 0x7d78c401c69c56cb21f4bf80c53afd92be0BBBBB --underlying 0xc02aaa39b223fe8d0a0e5c4f27ead9083c7AAaaa --oracle 0xef196aA0e3Cb8EA6d5720557C3B611Eff6OOOOOO --gasPrice 50000000000
```

**Output**

```sh
Deploying yearn pricer contract on mainnet 🍕
Yearn pricer deployed! 🎉
Transaction hash: 0xebf12fc6603ee857bcabe1c0c6194XX82639a9888776f7ff6e83a409XXXXXXXX
Deployed contract address: 0x669cC97687c792fc5369d7bdd38cXXXXXXXXXX
```

## Mock Pricer Deployment

To deploy a new `MockPricer.sol`, it is recommended to use the `deployMockPricer` truffle script inside the `scripts` folder.

**Input**

```sh
truffle exec scripts/deployMockPricer.js --network mainnet --asset 0x7d78c401c69c56cb21f4bf80c53afd92be0BBBBB --oracle 0xc02aaa39b223fe8d0a0e5c4f27ead9083c7AAaaa --gasPrice 50000000000
```

**Output**

```sh
Deploying mock pricer contract on mainnet 🍕
Mock pricer deployed! 🎉
Transaction hash: 0xebf12fc6603ee857bcabe1c0c6194XX82639a9888776f7ff6e83a409XXXXXXXX
Deployed contract address: 0x669cC97687c792fc5369d7bdd38cXXXXXXXXXX
```


## Verification 

Run a script similar to the following. Remember to change the contract name and address

```sh
truffle run verify ContractName@0xb4cbBd4b1f8B9C4AbF3ab1E144afD1d2151b39c3 --network mainnet
```