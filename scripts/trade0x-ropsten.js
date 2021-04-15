/**
 * Ropsten tests for TradeCallee.sol
 * To run: truffle exec scripts/trade0x-ropsten.js --network ropsten --makerPrivateKey 0xaa...
 * Need to have ETH in Taker account to mint Call option and pay for transaction and 0x fees
 * Need to have USDC in Maker account to make 0x order and see USDC for Otoken (1USDC for 1 Call)
 */
const yargs = require('yargs')

const {createTokenAmount, createOrder, signOrder} = require('./../test/utils')
const BigNumber = require('bignumber.js')

const ethers = require('ethers')

const ERC20 = artifacts.require('IERC20')
const WETH9 = artifacts.require('WETH9')
const Otoken = artifacts.require('Otoken.sol')
const OtokenFactory = artifacts.require('OtokenFactory.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const PayableProxyController = artifacts.require('PayableProxyController.sol')
const TradeCallee = artifacts.require('Trade0x')

/**
 * Ropsten addresses
 */
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const EXCHANGE_ADDR = '0xdef1c0ded9bec7f1a1670819833240f027b25eff'
const trade0xAddress = '0x6e1d4B973A059eB2D961a4fd112c47704dA5d18B'
const otokenFactoryAddress = '0x8d6994b701f480c27757c5fe2bd93d5352160081'
const payableProxyAddress = '0x0da6280d0837292b7a1f27fc602c7e0bd3ce0b66'
const controllerProxyAddress = '0x7e9beaccdccee88558aaa2dc121e52ec6226864e'
const marginPoolAddress = '0x3C325EeBB64495665F5376930d30151C1075bFD8'
const usdcAddress = '0x8be3a2a5c37b16c6eaa2be6a3fa1cf1e465f8691'
const wethAddress = '0xc778417e063141139fce010982780140aa0cd5ab'

const ActionType = Object.freeze({
  OpenVault: 0,
  MintShortOption: 1,
  BurnShortOption: 2,
  DepositLongOption: 3,
  WithdrawLongOption: 4,
  DepositCollateral: 5,
  WithdrawCollateral: 6,
  SettleVault: 7,
  Redeem: 8,
  Call: 9,
})

const expiryTime = new BigNumber(60 * 60 * 24) // 1 day
const wethDecimals = 18

const cmd = yargs.option('makerPrivateKey', {
  describe: '0x Maker Private Key, wallet account[1]',
  type: 'string',
  demandOption: true,
}).argv

// create signer etherJS Object
const makerEtherJS = new ethers.Wallet(cmd.makerPrivateKey)

async function runExport() {
  console.log('🔥🔥🔥 STARTING 0x TRADING SCRIPT 🔥🔥🔥')
  console.log('0x order signer address: 🖋️ ', makerEtherJS.address)

  const tradeCallee = await TradeCallee.at(trade0xAddress)
  const otokenFactory = await OtokenFactory.at(otokenFactoryAddress)
  const payableProxyController = await PayableProxyController.at(payableProxyAddress)
  const controllerProxy = await Controller.at(controllerProxyAddress)
  const marginPool = await MarginPool.at(marginPoolAddress)
  const usdc = await ERC20.at(usdcAddress)
  const weth = await WETH9.at(wethAddress)

  const account = await web3.eth.getAccounts()
  const taker = account[0]
  const maker = account[1]

  console.log('Taker address: ', taker)

  if (makerEtherJS.address != maker) {
    console.log('0x Maker address does not correspond to private key 🔴')
    return
  }

  const latestBlock = new BigNumber((await web3.eth.getBlock('latest')).timestamp)
  let expiry = new BigNumber(latestBlock).plus(expiryTime)
  const expiryDate = new Date(expiry.toNumber() * 1000)
  expiryDate.setUTCHours(8)
  expiryDate.setUTCMinutes(0)
  expiryDate.setUTCSeconds(0)
  expiry = new BigNumber(Math.floor(expiryDate.getTime() / 1000))

  let callOption1
  const otokenAddress = await otokenFactory.getOtoken(
    weth.address,
    usdc.address,
    weth.address,
    createTokenAmount(640),
    expiry,
    false,
  )

  if (otokenAddress == ZERO_ADDR) {
    console.log('Otoken not found, creating one now! ⚡')
    // deploy call option
    await otokenFactory.createOtoken(weth.address, usdc.address, weth.address, createTokenAmount(640), expiry, false)
    callOption1 = await Otoken.at(
      await otokenFactory.getOtoken(weth.address, usdc.address, weth.address, createTokenAmount(640), expiry, false),
    )
  } else {
    callOption1 = await Otoken.at(otokenAddress)
  }

  console.log(`Trading ${(await callOption1.name()) + ' ' + callOption1.address} with USDC`)

  const vaultCounter = new BigNumber(await controllerProxy.getAccountVaultCounter(taker)).plus(1)
  const optionsToMint = createTokenAmount(1, 8)
  const collateralToDeposit = createTokenAmount(1, wethDecimals)
  const chainId = 3

  // create 0x order
  // buy 1
  const order = createOrder(
    makerEtherJS.address,
    usdc.address,
    callOption1.address,
    new BigNumber(createTokenAmount(1, 6)),
    new BigNumber(optionsToMint),
    chainId,
  )
  const signedOrder = await signOrder(makerEtherJS, order, cmd.makerPrivateKey)
  await usdc.approve(EXCHANGE_ADDR, createTokenAmount(1, 6), {from: makerEtherJS.address})

  console.log('Signed 0x order with signature: 🖋️ ', signedOrder.signature)

  if (!(await controllerProxy.isOperator(taker, payableProxyController.address))) {
    console.log('Setting Operator...')
    await controllerProxy.setOperator(payableProxyController.address, true, {from: taker})
  }

  const tradeCallData = web3.eth.abi.encodeParameters(
    [
      'address',
      {
        'LimitOrder[]': {
          makerToken: 'address',
          takerToken: 'address',
          makerAmount: 'uint128',
          takerAmount: 'uint128',
          takerTokenFeeAmount: 'uint128',
          maker: 'address',
          taker: 'address',
          sender: 'address',
          feeRecipient: 'address',
          pool: 'bytes32',
          expiry: 'uint64',
          salt: 'uint256',
        },
      },
      {
        'Signature[]': {
          signatureType: 'uint8',
          v: 'uint8',
          r: 'bytes32',
          s: 'bytes32',
        },
      },
      'uint128[]',
      'bool',
    ],
    [taker, [signedOrder], [signedOrder.signature], [optionsToMint], false],
  )

  const actionArgs = [
    {
      actionType: ActionType.OpenVault,
      owner: taker,
      secondAddress: ZERO_ADDR,
      asset: ZERO_ADDR,
      vaultId: vaultCounter.toString(),
      amount: '0',
      index: '0',
      data: ZERO_ADDR,
    },
    {
      actionType: ActionType.MintShortOption,
      owner: taker,
      secondAddress: taker,
      asset: callOption1.address,
      vaultId: vaultCounter.toString(),
      amount: optionsToMint,
      index: '0',
      data: ZERO_ADDR,
    },
    {
      actionType: ActionType.Call,
      owner: taker,
      secondAddress: tradeCallee.address,
      asset: ZERO_ADDR,
      vaultId: vaultCounter.toString(),
      amount: '0',
      index: '0',
      data: tradeCallData,
    },
    {
      actionType: ActionType.DepositCollateral,
      owner: taker,
      secondAddress: payableProxyController.address,
      asset: weth.address,
      vaultId: vaultCounter.toString(),
      amount: collateralToDeposit,
      index: '0',
      data: ZERO_ADDR,
    },
  ]

  // pay protocol fee in ETH.
  const gasPriceGWei = '50'
  const gasPriceWei = web3.utils.toWei(gasPriceGWei, 'gwei')
  // protocol require 70000 * gas price per fill
  const feeAmount = new BigNumber(gasPriceWei).times(70000)
  const operateValue = feeAmount.plus(new BigNumber(collateralToDeposit))

  console.log('ETH needed: 💰 ', operateValue.toString())

  const user1UsdcBalanceBefore = new BigNumber(await usdc.balanceOf(taker))
  const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
  const user1Call1BalanceBefore = new BigNumber(await callOption1.balanceOf(taker))
  const oTokenSupplyBefore = new BigNumber(await callOption1.totalSupply())
  const makerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(maker))
  const makerCall1BalanceBefore = new BigNumber(await callOption1.balanceOf(maker))

  console.log('MarginPool WETH balance before: 📊', marginPoolWethBalanceBefore.toString())
  console.log('Maker USDC balance before: 📊', makerUsdcBalanceBefore.toString())
  console.log('Maker Otoken balance before: 📊', makerCall1BalanceBefore.toString())
  console.log('Taker USDC balance before: 📊', user1UsdcBalanceBefore.toString())
  console.log('Taker Otoken balance before: 📊', user1Call1BalanceBefore.toString())
  console.log('Otoken total supply before: 📊', oTokenSupplyBefore.toString())

  console.log('Approving 0x Callee and calling Operate 🚀')

  await callOption1.approve(tradeCallee.address, optionsToMint, {from: taker})
  await payableProxyController.operate(actionArgs, taker, {
    from: taker,
    gasPrice: gasPriceWei,
    value: operateValue,
  })

  const user1UsdcBalanceAfter = new BigNumber(await usdc.balanceOf(taker))
  const marginPoolWethBalanceAfter = new BigNumber(await weth.balanceOf(marginPool.address))
  const user1Call1BalanceAfter = new BigNumber(await callOption1.balanceOf(taker))
  const oTokenSupplyAfter = new BigNumber(await callOption1.totalSupply())
  const makerUsdcBalanceAfter = new BigNumber(await usdc.balanceOf(maker))
  const makerCall1BalanceAfter = new BigNumber(await callOption1.balanceOf(taker))

  console.log('MarginPool WETH balance after: 📈', marginPoolWethBalanceAfter.toString())
  console.log('Maker USDC balance after: 📉', makerUsdcBalanceAfter.toString())
  console.log('Maker Otoken balance after: 📈 ', makerCall1BalanceAfter.toString())
  console.log('Taker USDC balance after: 📈', user1UsdcBalanceAfter.toString())
  console.log('Taker Otoken balance after: 📊', user1Call1BalanceAfter.toString())
  console.log('Otoken total supply after: 📈', oTokenSupplyAfter.toString())
}

run = async function(callback) {
  try {
    await runExport()
  } catch (err) {
    console.error(err)
  }
  callback()
}
// Attach this function to the exported function
// in order to allow the script to be executed through both truffle and a test runner.
run.runExport = runExport
module.exports = run
