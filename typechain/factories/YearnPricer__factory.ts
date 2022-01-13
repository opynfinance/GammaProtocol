/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { YearnPricer, YearnPricerInterface } from "../YearnPricer";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_yToken",
        type: "address",
      },
      {
        internalType: "address",
        name: "_underlying",
        type: "address",
      },
      {
        internalType: "address",
        name: "_oracle",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "uint80",
        name: "_roundId",
        type: "uint80",
      },
    ],
    name: "getHistoricalPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPrice",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "oracle",
    outputs: [
      {
        internalType: "contract OracleInterface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_expiryTimestamp",
        type: "uint256",
      },
    ],
    name: "setExpiryPriceInOracle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "underlying",
    outputs: [
      {
        internalType: "contract ERC20Interface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "yToken",
    outputs: [
      {
        internalType: "contract YearnVaultInterface",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516108893803806108898339818101604052606081101561003357600080fd5b50805160208201516040909201519091906001600160a01b0383166100895760405162461bcd60e51b815260040180806020018281038252602881526020018061080d6028913960400191505060405180910390fd5b6001600160a01b0382166100ce5760405162461bcd60e51b815260040180806020018281038252602c815260200180610835602c913960400191505060405180910390fd5b6001600160a01b0381166101135760405162461bcd60e51b81526004018080602001828103825260288152602001806108616028913960400191505060405180910390fd5b600180546001600160a01b039485166001600160a01b0319918216179091556002805493851693821693909317909255600080549190931691161790556106ae8061015f6000396000f3fe608060405234801561001057600080fd5b50600436106100625760003560e01c806349bfcca1146100675780636f307dc31461008b5780637dc0d1d014610093578063963672901461009b57806398d5fdca146100ba578063eec377c0146100d4575b600080fd5b61006f610116565b604080516001600160a01b039092168252519081900360200190f35b61006f610125565b61006f610134565b6100b8600480360360208110156100b157600080fd5b5035610143565b005b6100c2610288565b60408051918252519081900360200190f35b6100fd600480360360208110156100ea57600080fd5b503569ffffffffffffffffffff16610355565b6040805192835260208301919091528051918290030190f35b6001546001600160a01b031681565b6002546001600160a01b031681565b6000546001600160a01b031681565b60008054600254604080516301957f8160e01b81526001600160a01b03928316600482015260248101869052815192909316926301957f819260448083019392829003018186803b15801561019757600080fd5b505afa1580156101ab573d6000803e3d6000fd5b505050506040513d60408110156101c157600080fd5b50519050806102015760405162461bcd60e51b81526004018080602001828103825260298152602001806106506029913960400191505060405180910390fd5b600061020c826103a7565b600080546001546040805163ee53140960e01b81526001600160a01b0392831660048201526024810189905260448101869052905194955091169263ee5314099260648084019391929182900301818387803b15801561026b57600080fd5b505af115801561027f573d6000803e3d6000fd5b50505050505050565b60008054600254604080516341976e0960e01b81526001600160a01b0392831660048201529051849392909216916341976e0991602480820192602092909190829003018186803b1580156102dc57600080fd5b505afa1580156102f0573d6000803e3d6000fd5b505050506040513d602081101561030657600080fd5b50519050806103465760405162461bcd60e51b815260040180806020018281038252602281526020018061060d6022913960400191505060405180910390fd5b61034f816103a7565b91505090565b6040805162461bcd60e51b815260206004820152601760248201527f596561726e5072696365723a20446570726563617465640000000000000000006044820152905160009182919081900360640190fd5b600080600160009054906101000a90046001600160a01b03166001600160a01b03166399530b066040518163ffffffff1660e01b815260040160206040518083038186803b1580156103f857600080fd5b505afa15801561040c573d6000803e3d6000fd5b505050506040513d602081101561042257600080fd5b50516002546040805163313ce56760e01b815290519293506000926001600160a01b039092169163313ce56791600480820192602092909190829003018186803b15801561046f57600080fd5b505afa158015610483573d6000803e3d6000fd5b505050506040513d602081101561049957600080fd5b505190506104c360ff8216600a0a6104b7848763ffffffff6104cb16565b9063ffffffff61052d16565b949350505050565b6000826104da57506000610527565b828202828482816104e757fe5b04146105245760405162461bcd60e51b815260040180806020018281038252602181526020018061062f6021913960400191505060405180910390fd5b90505b92915050565b600061052483836040518060400160405280601a81526020017f536166654d6174683a206469766973696f6e206279207a65726f000000000000815250600081836105f65760405162461bcd60e51b81526004018080602001828103825283818151815260200191508051906020019080838360005b838110156105bb5781810151838201526020016105a3565b50505050905090810190601f1680156105e85780820380516001836020036101000a031916815260200191505b509250505060405180910390fd5b50600083858161060257fe5b049594505050505056fe596561726e5072696365723a20756e6465726c79696e672070726963652069732030536166654d6174683a206d756c7469706c69636174696f6e206f766572666c6f77596561726e5072696365723a20756e6465726c79696e67207072696365206e6f742073657420796574a26469706673582212205594dd8e075f0879eeb507203dcd800598aca917395cce355285b6117d09257f64736f6c634300060a0033596561726e5072696365723a2079546f6b656e20616464726573732063616e206e6f742062652030596561726e5072696365723a20756e6465726c79696e6720616464726573732063616e206e6f742062652030596561726e5072696365723a206f7261636c6520616464726573732063616e206e6f742062652030";

type YearnPricerConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: YearnPricerConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class YearnPricer__factory extends ContractFactory {
  constructor(...args: YearnPricerConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "YearnPricer";
  }

  deploy(
    _yToken: string,
    _underlying: string,
    _oracle: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<YearnPricer> {
    return super.deploy(
      _yToken,
      _underlying,
      _oracle,
      overrides || {}
    ) as Promise<YearnPricer>;
  }
  getDeployTransaction(
    _yToken: string,
    _underlying: string,
    _oracle: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(
      _yToken,
      _underlying,
      _oracle,
      overrides || {}
    );
  }
  attach(address: string): YearnPricer {
    return super.attach(address) as YearnPricer;
  }
  connect(signer: Signer): YearnPricer__factory {
    return super.connect(signer) as YearnPricer__factory;
  }
  static readonly contractName: "YearnPricer";
  public readonly contractName: "YearnPricer";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): YearnPricerInterface {
    return new utils.Interface(_abi) as YearnPricerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): YearnPricer {
    return new Contract(address, _abi, signerOrProvider) as YearnPricer;
  }
}
