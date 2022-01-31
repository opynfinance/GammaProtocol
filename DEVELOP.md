# Deploy to Polygon

## Status

All contracts listed below are deployed to Polygon Mainnet and verified on PolygonScan. Contract ownership is transferred to 0x9e68B67660c223B3E0634D851F5DF821E0E17D84.

## Deployed Contract Address

- [AddressBook](https://polygonscan.com/address/0xa87ECDaEA486bB0baEeB77FF0630364772A6bbFE#contracts)
- [Whitelist](https://polygonscan.com/address/0x9E435A5Cb48aeE2C156a8E541ee645e1c171d012#contracts)
- [Oracle](https://polygonscan.com/address/0x3D561c832706E6e0B485A7a78958982e782E8E91#contracts)
- [MarginPool](https://polygonscan.com/address/0x30aE5DEBc9EdF60a23cD19494492b1ef37afA56d#contracts)
- [MarginCalculator](https://polygonscan.com/address/0x5C16b2fae97ab59814F34632202D7DE69c45c057#contracts)
- [MarginVault](https://polygonscan.com/address/0xF00ad49Cf7006000eE6E1bA58Ae47aE6A6872956#contracts)
- [OToken](https://polygonscan.com/address/0x4B119a1198915612ff568f283f1931349297EeF6#contracts)
- [OtokenFactory](https://polygonscan.com/address/0xedD70E045903D34fBA7302B5094D37EAceb1397c#contracts)
- [Controller](https://polygonscan.com/address/0x00a79BaD2b3F06c70053C3a99F5Be9B8f2e8b558#contracts)
- [PayableProxyController](https://polygonscan.com/address/0xb03036798511912359EDfff10c54E29db718f658#contracts)
- [PermitCallee](https://polygonscan.com/address/0xC7A02eF0AFb8B5D57A3f2EBeF7560320539B8Fa3#contracts)
- [OwnedUpgradeabilityProxy](https://polygonscan.com/address/0x7a23c712bddde52b22d8ff52e4cdadb1bcb0b203#code) (Controller proxy)

## Steps to Reproduce

1. Setup the two files `.infuraKey` and `.secret` and run the following commands

```
npm run deploy:polygon
```

2. Deploy other contracts

```
truffle exec scripts/deployPayableProxyController.js --network polygon --controller 0x00a79BaD2b3F06c70053C3a99F5Be9B8f2e8b558 --pool 0x30aE5DEBc9EdF60a23cD19494492b1ef37afA56d --weth 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619 --gasPrice 32000000000
truffle exec scripts/deployPermitCallee.js --network polygon --gasPrice 32000000000
```

4. Create a `.env` file with `POLYGONSCAN_API=<your_API_key>` and verify contracts after deployment

```
truffle run verify AddressBook Otoken OtokenFactory Whitelist Oracle MarginPool MarginCalculator MarginVault Controller PayableProxyController PermitCallee --network polygon
```

5. Verify contracts using hardhat

```
npx hardhat verify --network polygon 0xb03036798511912359EDfff10c54E29db718f658 0x00a79BaD2b3F06c70053C3a99F5Be9B8f2e8b558 0x30aE5DEBc9EdF60a23cD19494492b1ef37afA56d 0x7ceb23fd6bc0add59e62ac25578270cff1b9f619
```

6. Manually verify the contracts that failed to be verified through scripts

7. Transfer ownership by modifying `scripts/deploy-address.json`:

```
{
  "newOwner": "0x9e68B67660c223B3E0634D851F5DF821E0E17D84",
  "AddressBook": "0xa87ECDaEA486bB0baEeB77FF0630364772A6bbFE",
  "Whitelist": "0x9E435A5Cb48aeE2C156a8E541ee645e1c171d012",
  "Oracle": "0x3D561c832706E6e0B485A7a78958982e782E8E91",
  "MarginPool": "0x30aE5DEBc9EdF60a23cD19494492b1ef37afA56d",
  "MarginCalculator": "0x5C16b2fae97ab59814F34632202D7DE69c45c057",
  "MarginVault": "0xF00ad49Cf7006000eE6E1bA58Ae47aE6A6872956",
  "OToken": "0x4B119a1198915612ff568f283f1931349297EeF6",
  "OtokenFactory": "0xedD70E045903D34fBA7302B5094D37EAceb1397c",
  "Controller": "0x00a79BaD2b3F06c70053C3a99F5Be9B8f2e8b558",
  "PayableProxyController": "0xb03036798511912359EDfff10c54E29db718f658",
  "PermitCallee": "0xC7A02eF0AFb8B5D57A3f2EBeF7560320539B8Fa3",
  "OwnedUpgradeabilityProxy": "0x7a23c712bddde52b22d8ff52e4cdadb1bcb0b203"
}
```

7. Execute the ownership transfer script

```
truffle exec scripts/transferOwner.js --network polygon
```

## Contact

The Polygon integration is developed by The Z Institute.
consulting@zinstitute.net
