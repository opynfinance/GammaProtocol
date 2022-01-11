/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  FixedPointInt256Tester,
  FixedPointInt256TesterInterface,
} from "../FixedPointInt256Tester";

const _abi = [
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testAdd",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testDiv",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "a",
        type: "int256",
      },
    ],
    name: "testFromUnscaledInt",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testIsEqual",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testIsGreaterThan",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testIsGreaterThanOrEqual",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testIsLessThan",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testIsLessThanOrEqual",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testMax",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testMin",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testMul",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "a",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "b",
        type: "tuple",
      },
    ],
    name: "testSub",
    outputs: [
      {
        components: [
          {
            internalType: "int256",
            name: "value",
            type: "int256",
          },
        ],
        internalType: "struct FixedPointInt256.FixedPointInt",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506106d5806100206000396000f3fe608060405234801561001057600080fd5b50600436106100b45760003560e01c80639e66c670116100715780639e66c6701461014e578063aec27bb714610161578063c325f86614610174578063d493105314610187578063d6ff0a9f1461019a578063eab39de7146101ad576100b4565b80631c604bd6146100b95780632284f80c146100e25780634a3b852514610102578063746398161461011557806385f547ff146101285780638cd1332a1461013b575b600080fd5b6100cc6100c736600461058a565b6101c0565b6040516100d991906105be565b60405180910390f35b6100f56100f036600461058a565b6101db565b6040516100d99190610695565b6100cc61011036600461058a565b6101f3565b6100f561012336600461058a565b610205565b6100f561013636600461058a565b61021d565b6100cc61014936600461058a565b610235565b6100cc61015c36600461058a565b610247565b6100cc61016f36600461058a565b610259565b6100f561018236600461058a565b61026b565b6100f5610195366004610572565b610283565b6100f56101a836600461058a565b610294565b6100f56101bb36600461058a565b6102a6565b60006101d2838363ffffffff6102b816565b90505b92915050565b6101e3610522565b6101d2838363ffffffff6102c016565b60006101d2838363ffffffff6102f216565b61020d610522565b6101d2838363ffffffff6102fa16565b610225610522565b6101d2838363ffffffff61034116565b60006101d2838363ffffffff61037716565b60006101d2838363ffffffff61037e16565b60006101d2838363ffffffff61038516565b610273610522565b6101d2838363ffffffff61038c16565b61028b610522565b6101d5826103b5565b61029c610522565b6101d283836103ed565b6102ae610522565b6101d2838361040b565b519051121590565b6102c8610522565b60408051602081019091528251845182916102e9919063ffffffff61042216565b90529392505050565b519051131590565b610302610522565b604080516020810190915282518451829190610330906b033b2e3c9fd0803ce800000063ffffffff61047116565b8161033757fe5b0590529392505050565b610349610522565b60408051602081019091528251845182916b033b2e3c9fd0803ce8000000916103309163ffffffff61047116565b5190511390565b5190511290565b5190511490565b610394610522565b60408051602081019091528251845182916102e9919063ffffffff6104dc16565b6103bd610522565b6040805160208101909152806103e5846b033b2e3c9fd0803ce800000063ffffffff61047116565b905292915050565b6103f5610522565b815183511361040457816101d2565b5090919050565b610413610522565b815183511261040457816101d2565b60008282018183128015906104375750838112155b8061044c575060008312801561044c57508381125b6101d25760405162461bcd60e51b8152600401610468906105c9565b60405180910390fd5b600082610480575060006101d5565b826000191480156104945750600160ff1b82145b156104b15760405162461bcd60e51b81526004016104689061060a565b828202828482816104be57fe5b05146101d25760405162461bcd60e51b81526004016104689061060a565b60008183038183128015906104f15750838113155b80610506575060008312801561050657508381135b6101d25760405162461bcd60e51b815260040161046890610651565b6040518060200160405280600081525090565b600060208284031215610546578081fd5b6040516020810181811067ffffffffffffffff82111715610565578283fd5b6040529135825250919050565b600060208284031215610583578081fd5b5035919050565b6000806040838503121561059c578081fd5b6105a68484610535565b91506105b58460208501610535565b90509250929050565b901515815260200190565b60208082526021908201527f5369676e6564536166654d6174683a206164646974696f6e206f766572666c6f6040820152607760f81b606082015260800190565b60208082526027908201527f5369676e6564536166654d6174683a206d756c7469706c69636174696f6e206f604082015266766572666c6f7760c81b606082015260800190565b60208082526024908201527f5369676e6564536166654d6174683a207375627472616374696f6e206f766572604082015263666c6f7760e01b606082015260800190565b905181526020019056fea2646970667358221220579cde6e35f38282c19b222095c4afa3df6bfc354e3f495b43c3f80e325e320b64736f6c634300060a0033";

type FixedPointInt256TesterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: FixedPointInt256TesterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class FixedPointInt256Tester__factory extends ContractFactory {
  constructor(...args: FixedPointInt256TesterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "FixedPointInt256Tester";
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<FixedPointInt256Tester> {
    return super.deploy(overrides || {}) as Promise<FixedPointInt256Tester>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): FixedPointInt256Tester {
    return super.attach(address) as FixedPointInt256Tester;
  }
  connect(signer: Signer): FixedPointInt256Tester__factory {
    return super.connect(signer) as FixedPointInt256Tester__factory;
  }
  static readonly contractName: "FixedPointInt256Tester";
  public readonly contractName: "FixedPointInt256Tester";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): FixedPointInt256TesterInterface {
    return new utils.Interface(_abi) as FixedPointInt256TesterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FixedPointInt256Tester {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as FixedPointInt256Tester;
  }
}
