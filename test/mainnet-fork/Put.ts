// mainnet fork
import {
  Trade0xInstance,
  MockERC20Instance,
  OtokenInstance,
  WETH9Instance,
  IZeroXExchangeInstance,
  ControllerInstance,
  PayableProxyControllerInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount, createOrder, signOrder} from '../utils'
import BigNumber from 'bignumber.js'

const {fromRpcSig} = require('ethereumjs-util')
const ethSigUtil = require('eth-sig-util')
const Wallet = require('ethereumjs-wallet').default
const {BN, time, ADDRESS_ZERO} = require('@openzeppelin/test-helpers')

const {EIP712Domain, domainSeparator} = require('../eip712')

const TradeCallee = artifacts.require('Trade0x')
const ERC20 = artifacts.require('MockERC20')
const WETH9 = artifacts.require('WETH9')
const Exchange = artifacts.require('IZeroXExchange')
const Controller = artifacts.require('Controller.sol')
const PayableProxyController = artifacts.require('PayableProxyController.sol')
const Otoken = artifacts.require('Otoken.sol')

/**
 * Mainnet Addresses
 */
// unlock this address to get its USDC
const usdcWhale = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const EXCHANGE_ADDR = '0x61935cbdd02287b511119ddb11aeb42f1593b7ef'
const ERC20PROXY_ADDR = '0x95e6f48254609a6ee006f7d493c8e5fb97094cef'
const STAKING_ADDR = '0xa26e80e7Dea86279c6d778D702Cc413E6CFfA777'
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
// const oTokenAddress = '0x60ad22806B89DD17B2ecfe220c3712A2c86dfFFE'
const put1Address = '0x75fA51D3a52C07bFe7c3f4f47C5c4991622268f2'
const put2Address = '0x969b7Ee06D6Fa13FdD5da22c2b75Adf861D9fC34'
const controllerProxyAddress = '0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72'
const marginPoolAddress = '0x5934807cC0654d46755eBd2848840b616256C6Ef'
const payableProxyAddress = '0x8f7Dd610c457FC7Cb26B0f9Db4e77581f94F70aC'
// the market maker bot's address
const maker = '0x75ea4d5a32370f974d40b404e4ce0e00c1554979'

enum ActionType {
  OpenVault,
  MintShortOption,
  BurnShortOption,
  DepositLongOption,
  WithdrawLongOption,
  DepositCollateral,
  WithdrawCollateral,
  SettleVault,
  Redeem,
  Call,
}

const Permit = [
  {name: 'owner', type: 'address'},
  {name: 'spender', type: 'address'},
  {name: 'value', type: 'uint256'},
  {name: 'nonce', type: 'uint256'},
  {name: 'deadline', type: 'uint256'},
]

/**
 * 0x Orders
 */
// 640 put
const putBid1 = {
  expirationTimeSeconds: '1610658291',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '3210593742',
  makerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '233289606123443968',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '12642000006',
  takerAssetData: '0xf47261b000000000000000000000000075fa51d3a52c07bfe7c3f4f47c5c4991622268f2',
  takerFee: '0',
  takerFeeAssetData: '0x',
}
// 800 put
const putBid2 = {
  expirationTimeSeconds: '1610658227',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '104024199',
  makerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '536827603043271232',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '177000000',
  takerAssetData: '0xf47261b0000000000000000000000000969b7ee06d6fa13fdd5da22c2b75adf861d9fc34',
  takerFee: '0',
  takerFeeAssetData: '0x',
}
const putAsk1 = {
  expirationTimeSeconds: '1610658291',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '4157999994',
  makerAssetData: '0xf47261b000000000000000000000000075fa51d3a52c07bfe7c3f4f47c5c4991622268f2',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '510961721111102400',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '1326578973',
  takerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  takerFee: '0',
  takerFeeAssetData: '0x',
}

const putBid1Signature =
  '0x1c20cd96c3de1751c7af158c396c4c8b4359c862e5c64116c0665c36149f7d92cc77789770b6e943429fa51e5217e17e178e921b7b5d9a7301a9f200982370863302'
const putBid2Signature =
  '0x1b42dfbdc3a48cc52d2fcff32208c6034357836de982e1e58370bec2749050736224ffff3fb127b37b85eac189b9a3d4ff15638f9d6d7040d6661c541db358029802'
const putAsk1Signature =
  '0x1cdf7535b36320f8f7c41fd7a9b6ee36d73fb3263b20e97577e6ba96a66c855a3b6c562bfc456ddcdbd0424bcaa989d85885160aee962f4df789f857eb17dec76b02'

const LARGE_NUMBER = createTokenAmount(10, 27)

contract('Callee contract test', async ([deployer, user2]) => {
  let callee: Trade0xInstance
  let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let put1: OtokenInstance
  let put2: OtokenInstance
  let controllerProxy: ControllerInstance
  let payableProxyController: PayableProxyControllerInstance

  const wallet = Wallet.generate()
  const user1 = wallet.getAddressString()

  before('setup transfer account asset', async () => {
    // setup contracts
    exchange = await Exchange.at(EXCHANGE_ADDR)
    callee = await TradeCallee.new(EXCHANGE_ADDR, ERC20PROXY_ADDR, WETHAddress, STAKING_ADDR, controllerProxyAddress, {
      from: deployer,
    })

    const proxy = await callee.assetProxy()
    assert.equal(proxy.toLowerCase(), ERC20PROXY_ADDR.toLowerCase())

    usdc = await ERC20.at(USDCAddress)
    weth = await WETH9.at(WETHAddress)

    controllerProxy = await Controller.at(controllerProxyAddress)
    payableProxyController = await PayableProxyController.at(payableProxyAddress)

    // get money from the whale ;)
    await usdc.transfer(user1, createTokenAmount(640, 6), {from: usdcWhale})
    await usdc.transfer(user2, createTokenAmount(300, 6), {from: usdcWhale})
    // await weth.transfer(WETHAddress, createTokenAmount(20, 18), {from: WETHAddress})

    put1 = await Otoken.at(put1Address)
    put2 = await Otoken.at(put2Address)

    const makerAllowance = await put1.allowance(maker, ERC20PROXY_ADDR)
    assert.isTrue(makerAllowance.gte('200000000'))

    const ownerAddress = '0x638E5DA0EEbbA58c67567bcEb4Ab2dc8D34853FB'
    await web3.eth.sendTransaction({from: deployer, to: ownerAddress, value: 2000000000000000000})
  })

  describe('Combination positions for put options', async () => {
    it('user1 can mint + sell a 640 strike put option', async () => {
      // parameters
      const vaultCounter = 1
      const optionsToMint = createTokenAmount(1, 8)
      const collateralToMint = createTokenAmount(640, 6)
      const premium = createTokenAmount(
        new BigNumber(putBid1.makerAssetAmount).div(putBid1.takerAssetAmount).times(100),
        6,
      )

      const order = createOrder(
        exchange.address,
        user1,
        put1.address,
        ZERO_ADDR,
        new BigNumber(optionsToMint),
        new BigNumber(0),
      )
      const signedOrder = signOrder(wallet.getPrivateKey(), order)
      console.log(order)
      console.log(signedOrder)

      // const nonce = (await put1.nonces(user1)).toNumber()
      // const version = '1'
      // const chainId = 1
      // const name = await put1.name()
      // // const maxDeadline = MAX_UINT256;
      // const maxDeadline = new BigNumber(await time.latest()).plus(60 * 60 * 24).toString()

      // const buildData = (chainId: number, verifyingContract: string, owner: string, spender: string, value: BN, deadline = maxDeadline) => ({
      //   primaryType: 'Permit',
      //   types: {EIP712Domain, Permit},
      //   domain: {name, version, chainId, verifyingContract},
      //   message: {owner, spender, value, nonce, deadline},
      // })

      // console.log(chainId)
      // console.log(user1)

      // const dataToSign = buildData(chainId, put1.address, user1, callee.address, new BN(optionsToMint))

      // console.log(dataToSign)
      // const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {dataToSign})
      // console.log(signature)
      // const {v, r, s} = fromRpcSig(signature)
    })
  })
})
