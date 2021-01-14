// mainnet fork
// ganache-cli --fork https://mainnet.infura.io/v3/c4747046220e411c9e4d171fee3958f9@11649814 --unlock 0xbe0eb53f46cd790cd13851d5eff43d12404d33e8 --unlock 0x638E5DA0EEbbA58c67567bcEb4Ab2dc8D34853FB

import BigNumber from 'bignumber.js'
import {
  Trade0xInstance,
  MockERC20Instance,
  WETH9Instance,
  IZeroXExchangeInstance,
  ControllerInstance,
  PayableProxyControllerInstance,
} from '../../build/types/truffle-types'

import {createTokenAmount} from '../utils'

const TradeCallee = artifacts.require('Trade0x')
const ERC20 = artifacts.require('MockERC20')
const WETH9 = artifacts.require('WETH9')
const Exchange = artifacts.require('IZeroXExchange')
const Controller = artifacts.require('Controller.sol')
const PayableProxyController = artifacts.require('PayableProxyController.sol')

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

// unlock this address to get its USDC
const usdcWhale = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'

/**
 * Mainnet Addresses
 */
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const EXCHANGE_ADDR = '0x61935cbdd02287b511119ddb11aeb42f1593b7ef'
const ERC20PROXY_ADDR = '0x95e6f48254609a6ee006f7d493c8e5fb97094cef'
const STAKING_ADDR = '0xa26e80e7Dea86279c6d778D702Cc413E6CFfA777'
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
// const oTokenAddress = '0x60ad22806B89DD17B2ecfe220c3712A2c86dfFFE'
const put1Address = '0x75fA51D3a52C07bFe7c3f4f47C5c4991622268f2'
const controllerProxyAddress = '0x4ccc2339F87F6c59c6893E1A678c2266cA58dC72'
const marginPoolAddress = '0x5934807cC0654d46755eBd2848840b616256C6Ef'
const payableProxyAddress = '0x8f7Dd610c457FC7Cb26B0f9Db4e77581f94F70aC'
// the market maker bot's address
const maker = '0x75ea4d5a32370f974d40b404e4ce0e00c1554979'

/**
 * 0x Orders
 */

const callBid = {
  expirationTimeSeconds: '1610328818',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '65362615559',
  makerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '268628525297533568',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '12624420833',
  takerAssetData: '0xf47261b000000000000000000000000060ad22806b89dd17b2ecfe220c3712a2c86dfffe',
  takerFee: '0',
  takerFeeAssetData: '0x',
}

const putBid = {
  expirationTimeSeconds: '1610581731',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '3744657668',
  makerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '963956568136189056',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '12600000005',
  takerAssetData: '0xf47261b000000000000000000000000075fa51d3a52c07bfe7c3f4f47c5c4991622268f2',
  takerFee: '0',
  takerFeeAssetData: '0x',
}

const putBidSignature =
  '0x1c27e317a34185e1b996a357c4911969af471df38c257e5afba922518077019506080a44a75a2d6ca1fd8546cd7a3d03539bc66e089586eed75b93a7f79b54e39502'
const callBidSignature =
  '0x1bc1a9c3cbfbbf8ab419571ca7971916b71522c28ecae135fdf1fc5c0a6d8cda1b446aa6fbdf1604e05a9eec9c7cb6d12002f40519bebd8a1507b9236d6be764a402'

const callAsk = {
  expirationTimeSeconds: '1610328818',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '1605579167',
  makerAssetData: '0xf47261b000000000000000000000000060ad22806b89dd17b2ecfe220c3712a2c86dfffe',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '50689277836939880',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '12694017956',
  takerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  takerFee: '0',
  takerFeeAssetData: '0x',
}

const callAskSignature =
  '0x1ba69c5427de7cd10a68abbd8c01677d5a2d5c0e0e60deff810a062625efb17bf65a3bb3ddbfe3d0591ae3e5b5c33de12c52d3de641f68be00f17a8610b8cb3f4902'

contract('Callee contract test', async ([deployer, user1]) => {
  let callee: Trade0xInstance
  let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let put1: MockERC20Instance
  let controllerProxy: ControllerInstance
  let payableProxyController: PayableProxyControllerInstance

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
    // await weth.transfer(WETHAddress, createTokenAmount(20, 18), {from: WETHAddress})

    put1 = await ERC20.at(put1Address)

    const makerAllowance = await put1.allowance(maker, ERC20PROXY_ADDR)
    assert.isTrue(makerAllowance.gte('200000000'))

    const ownerAddress = '0x638E5DA0EEbbA58c67567bcEb4Ab2dc8D34853FB'
    await web3.eth.sendTransaction({from: deployer, to: ownerAddress, value: 2000000000000000000})
    await controllerProxy.setCallRestriction(false, {from: ownerAddress})
  })

  describe('Combination positions for put options', async () => {
    it('user1 can mint + sell a 640 strike put option', async () => {
      // parameters
      const vaultCounter = 1
      const optionsToMint = createTokenAmount(1, 8)
      const collateralToMint = createTokenAmount(640, 6)
      const premium = createTokenAmount(
        new BigNumber(putBid.makerAssetAmount).div(putBid.takerAssetAmount).times(100),
        6,
      )

      // Keep track of user1, pool and mm bot balances
      const user1UsdcBalanceBefore = new BigNumber(await usdc.balanceOf(user1))
      const marginPoolUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(marginPoolAddress))
      const mmBotOtokenBalanceBefore = new BigNumber(await put1.balanceOf(maker))
      const oTokenSupplyBefore = new BigNumber(await put1.totalSupply())

      const data = web3.eth.abi.encodeParameters(
        [
          {
            'Order[]': {
              makerAddress: 'address',
              takerAddress: 'address',
              feeRecipientAddress: 'address',
              senderAddress: 'address',

              makerAssetAmount: 'uint256',
              takerAssetAmount: 'uint256',
              makerFee: 'uint256',
              takerFee: 'uint256',
              expirationTimeSeconds: 'uint256',
              salt: 'uint256',

              makerAssetData: 'bytes',
              takerAssetData: 'bytes',
              makerFeeAssetData: 'bytes',
              takerFeeAssetData: 'bytes',
            },
          },
          'uint256[]',
          'bytes[]',
          'address',
        ],
        [[putBid], [optionsToMint], [putBidSignature], user1],
      )

      // pay protocol fee in ETH.
      const gasPriceGWei = '50'
      const gasPriceWei = web3.utils.toWei(gasPriceGWei, 'gwei')
      // protocol require 70000 * gas price per fill
      const feeAmount = new BigNumber(gasPriceWei).times(70000).toString()

      const actionArgs = [
        {
          actionType: ActionType.OpenVault,
          owner: user1,
          secondAddress: user1,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.MintShortOption,
          owner: user1,
          secondAddress: user1,
          asset: put1.address,
          vaultId: vaultCounter,
          amount: optionsToMint,
          index: '0',
          data: ZERO_ADDR,
        },
        {
          actionType: ActionType.Call,
          owner: user1,
          secondAddress: callee.address,
          asset: ZERO_ADDR,
          vaultId: vaultCounter,
          amount: '0',
          index: '0',
          data: data,
        },
        {
          actionType: ActionType.DepositCollateral,
          owner: user1,
          secondAddress: user1,
          asset: usdc.address,
          vaultId: vaultCounter,
          amount: collateralToMint,
          index: '0',
          data: ZERO_ADDR,
        },
      ]
      // user need to approve callee function
      // TODO: figure this out
      await weth.deposit({from: user1, value: feeAmount})
      await weth.approve(callee.address, feeAmount, {from: user1})

      // one time approvals needed
      await controllerProxy.setOperator(payableProxyAddress, true, {from: user1})
      await usdc.approve(marginPoolAddress, collateralToMint, {from: user1})
      await put1.approve(callee.address, optionsToMint, {from: user1})

      await controllerProxy.operate(actionArgs, {from: user1, gasPrice: gasPriceWei})

      // keep track of owner and pool balances after
      const user1UsdcBalanceAfter = new BigNumber(await usdc.balanceOf(user1))
      const marginPoolUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(marginPoolAddress))

      const mmBotOtokenBalanceAfter = new BigNumber(await put1.balanceOf(maker))
      const oTokenSupplyAfter = new BigNumber(await put1.totalSupply())

      // check balances before and after changed as expected
      assert.equal(
        user1UsdcBalanceBefore
          .minus(collateralToMint)
          .plus(premium)
          .toString(),
        user1UsdcBalanceAfter.toString(),
        "Incorrect change in owner's usdc balance",
      )
      assert.equal(
        marginPoolUsdcBalanceBefore.plus(collateralToMint).toString(),
        marginPoolUsdcBalanceAfter.toString(),
        "Incorrect change in margin pool's usdc balance",
      )
      assert.equal(
        mmBotOtokenBalanceBefore.plus(optionsToMint).toString(),
        mmBotOtokenBalanceAfter.toString(),
        "Incorrect change in owner's otoken balance",
      )
      assert.equal(
        oTokenSupplyBefore.plus(optionsToMint).toString(),
        oTokenSupplyAfter.toString(),
        'Incorrect change in otoken supply',
      )
    })
  })
})
