/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  CalleeAllowanceTester,
  CalleeAllowanceTesterInterface,
} from "../CalleeAllowanceTester";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_weth",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "callFunction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "weth",
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
];

const _bytecode =
  "0x608060405234801561001057600080fd5b506040516105a33803806105a383398101604081905261002f91610054565b600080546001600160a01b0319166001600160a01b0392909216919091179055610082565b600060208284031215610065578081fd5b81516001600160a01b038116811461007b578182fd5b9392505050565b610512806100916000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80633fc8cef31461003b5780639c23da5014610059575b600080fd5b61004361006e565b60405161005091906103d0565b60405180910390f35b61006c61006736600461028e565b61007d565b005b6000546001600160a01b031681565b60008082806020019051810190610094919061033c565b60005491935091506100b7906001600160a01b031683308463ffffffff6100bd16565b50505050565b6100b7846323b872dd60e01b8585856040516024016100de939291906103ac565b60408051601f198184030181529190526020810180516001600160e01b03166001600160e01b0319909316929092179091526060610165826040518060400160405280602081526020017f5361666545524332303a206c6f772d6c6576656c2063616c6c206661696c6564815250856001600160a01b03166101ad9092919063ffffffff16565b8051909150156101a857808060200190518101906101839190610369565b6101a85760405162461bcd60e51b815260040161019f9061044e565b60405180910390fd5b505050565b60606101bc84846000856101c4565b949350505050565b60606101cf85610288565b6101eb5760405162461bcd60e51b815260040161019f90610417565b60006060866001600160a01b031685876040516102089190610390565b60006040518083038185875af1925050503d8060008114610245576040519150601f19603f3d011682016040523d82523d6000602084013e61024a565b606091505b5091509150811561025e5791506101bc9050565b80511561026e5780518082602001fd5b8360405162461bcd60e51b815260040161019f91906103e4565b3b151590565b600080604083850312156102a0578182fd5b82356102ab816104c4565b915060208381013567ffffffffffffffff808211156102c8578384fd5b81860187601f8201126102d9578485fd5b80359250818311156102e9578485fd5b604051601f8401601f1916810185018381118282101715610308578687fd5b604052838152818401850189101561031e578586fd5b83858301868301378585858301015280955050505050509250929050565b6000806040838503121561034e578182fd5b8251610359816104c4565b6020939093015192949293505050565b60006020828403121561037a578081fd5b81518015158114610389578182fd5b9392505050565b600082516103a2818460208701610498565b9190910192915050565b6001600160a01b039384168152919092166020820152604081019190915260600190565b6001600160a01b0391909116815260200190565b6000602082528251806020840152610403816040850160208701610498565b601f01601f19169190910160400192915050565b6020808252601d908201527f416464726573733a2063616c6c20746f206e6f6e2d636f6e7472616374000000604082015260600190565b6020808252602a908201527f5361666545524332303a204552433230206f7065726174696f6e20646964206e6040820152691bdd081cdd58d8d9595960b21b606082015260800190565b60005b838110156104b357818101518382015260200161049b565b838111156100b75750506000910152565b6001600160a01b03811681146104d957600080fd5b5056fea2646970667358221220e0816b29056f082f00b1bc5e52e7ef660d9ac5007049a44582ac8a6d2f32543564736f6c634300060a0033";

type CalleeAllowanceTesterConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: CalleeAllowanceTesterConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class CalleeAllowanceTester__factory extends ContractFactory {
  constructor(...args: CalleeAllowanceTesterConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
    this.contractName = "CalleeAllowanceTester";
  }

  deploy(
    _weth: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<CalleeAllowanceTester> {
    return super.deploy(
      _weth,
      overrides || {}
    ) as Promise<CalleeAllowanceTester>;
  }
  getDeployTransaction(
    _weth: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_weth, overrides || {});
  }
  attach(address: string): CalleeAllowanceTester {
    return super.attach(address) as CalleeAllowanceTester;
  }
  connect(signer: Signer): CalleeAllowanceTester__factory {
    return super.connect(signer) as CalleeAllowanceTester__factory;
  }
  static readonly contractName: "CalleeAllowanceTester";
  public readonly contractName: "CalleeAllowanceTester";
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): CalleeAllowanceTesterInterface {
    return new utils.Interface(_abi) as CalleeAllowanceTesterInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): CalleeAllowanceTester {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as CalleeAllowanceTester;
  }
}
