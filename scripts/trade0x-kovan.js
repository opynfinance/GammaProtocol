/**
 * Kovan tests for Trade0x.sol
 * To run: truffle exec scripts/trade0x-kovan.js --network kovan --makerPrivateKey 0xaa...
 * Need to have ETH in Taker account to mint Call option and pay for transaction and 0x fees
 * Need to have USDC in Maker account to make 0x order and see USDC for Otoken (1USDC for 1 Call)
 */
const yargs = require("yargs");

const {createTokenAmount, createOrder, signOrder} = require('./../test/utils')
const BigNumber = require('bignumber.js')

const ethers = require('ethers')
const ethSigUtil = require('eth-sig-util')
const Wallet = require('ethereumjs-wallet').default
const {fromRpcSig} = require('ethereumjs-util')
const {BN, time} = require('@openzeppelin/test-helpers')

const {EIP712Domain, domainSeparator} = require('../test/eip712')

const ERC20 = artifacts.require('IERC20')
const WETH9 = artifacts.require('WETH9')
const Otoken = artifacts.require('Otoken.sol')
const OtokenFactory = artifacts.require('OtokenFactory.sol')
const MarginPool = artifacts.require('MarginPool.sol')
const Controller = artifacts.require('Controller.sol')
const PayableProxyController = artifacts.require('PayableProxyController.sol')
const Trade0x = artifacts.require('Trade0x')
const PermitCallee = artifacts.require('PermitCallee')

/**
 * Kovan addresses
 */
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const EXCHANGE_ADDR = '0xf1ec7d0ba42f15fb5c9e3adbe86431973e44764c'
const ERC20PROXY_ADDR = '0xaa460127562482faa5df42f2c39a025cd4a1cc0a'
const trade0xAddress = '0xF36e7676FaAaa07Ab92C6E4B6007cB65838F18d6'
const otokenFactoryAddress = '0xb9D17Ab06e27f63d0FD75099d5874a194eE623e2'
const payableProxyAddress = '0x5957A413f5Ac4Bcf2ba7c5c461a944b548ADB1A5'
const controllerProxyAddress = '0xdEE7D0f8CcC0f7AC7e45Af454e5e7ec1552E8e4e'
const marginPoolAddress = '0x8c7C60d766951c5C570bBb7065C993070061b795'
const usdcAddress = '0xb7a4F3E9097C08dA09517b5aB877F7a917224ede'
const wethAddress = '0xd0A1E359811322d97991E03f863a0C30C2cF029C'

const ActionType = Object.freeze({
  OpenVault: 0,
  MintShortOption: 1,
  BurnShortOption: 2,
  DepositLongOption: 3,
  WithdrawLongOption: 4,
  DepositCollateral: 5,
  WithdrawCollateral: 6,
  SettleVault:7 ,
  Redeem: 8,
  Call: 9,
})

const Permit = [
  {name: 'owner', type: 'address'},
  {name: 'spender', type: 'address'},
  {name: 'value', type: 'uint256'},
  {name: 'nonce', type: 'uint256'},
  {name: 'deadline', type: 'uint256'},
]

const expiryTime = new BigNumber(60 * 60 * 24)            // 1 day
const usdcDecimals = 6
const wethDecimals = 18

const cmd = yargs
  .option("makerPrivateKey", { describe: "0x Maker Private Key, wallet account[1]", type: "string", demandOption: true })
  .argv;

// create signer etherJS Object
const makerEtherJS = new ethers.Wallet(cmd.makerPrivateKey)

async function runExport() {
  console.log("🔥🔥🔥 STARTING 0x TRADING SCRIPT 🔥🔥🔥")
  console.log("0x order signer address: 🖋️ ", makerEtherJS.address)

  let trade0xCallee = await Trade0x.at(trade0xAddress)
  let otokenFactory = await OtokenFactory.at(otokenFactoryAddress)
  let payableProxyController = await PayableProxyController.at(payableProxyAddress);
  let controllerProxy = await Controller.at(controllerProxyAddress)
  let marginPool = await MarginPool.at(marginPoolAddress);
  let usdc = await ERC20.at(usdcAddress);
  let weth = await WETH9.at(wethAddress);

  const account = await web3.eth.getAccounts()
  const taker = account[0]
  const maker = account[1]

  console.log("Taker address: ", taker)

  if (makerEtherJS.address != maker) {
    console.log("0x Maker address does not correspond to private key 🔴")
    return;
  }

  const latestBlock = new BigNumber((await web3.eth.getBlock('latest')).timestamp);
  let expiry = new BigNumber(latestBlock).plus(expiryTime)
  let expiryDate = new Date(expiry.toNumber() * 1000)
  expiryDate.setUTCHours(8)
  expiryDate.setUTCMinutes(0)
  expiryDate.setUTCSeconds(0)
  expiry = new BigNumber(Math.floor(expiryDate.getTime() / 1000))

  let callOption1;
  let otokenAddress = await otokenFactory.getOtoken(weth.address, usdc.address, weth.address, createTokenAmount(640), expiry, false);
  
  if(otokenAddress == ZERO_ADDR) {
    console.log("Otoken not found, creating one now! ⚡")
    // deploy call option
    await otokenFactory.createOtoken(weth.address, usdc.address, weth.address, createTokenAmount(640), expiry, false)
    callOption1 = await Otoken.at(
      await otokenFactory.getOtoken(weth.address, usdc.address, weth.address, createTokenAmount(640), expiry, false)
    )
  }
  else {
    callOption1 = await Otoken.at(otokenAddress)
  }

  console.log(await callOption1.name() + " " + callOption1.address)

  const vaultCounter = new BigNumber((await controllerProxy.getAccountVaultCounter(taker))).plus(1)
  const optionsToMint = createTokenAmount(1, 8)
  const collateralToDeposit = createTokenAmount(1, wethDecimals)

  // create 0x order
  const order = createOrder(
    EXCHANGE_ADDR,
    makerEtherJS.address,
    usdc.address,
    callOption1.address,
    new BigNumber(createTokenAmount(1, 6)),
    new BigNumber(optionsToMint),
    42
  )
  const signedOrder = await signOrder(makerEtherJS, order)
  await usdc.approve(ERC20PROXY_ADDR, createTokenAmount(1, 6), {from: makerEtherJS.address})

  console.log("Signed 0x order with signature: 🖋️ ", signedOrder.signature)

  if(!(await controllerProxy.isOperator(taker, payableProxyController.address))) {
    await controllerProxy.setOperator(payableProxyController.address, true, {from: taker})
  }

  const tradeCallData = web3.eth.abi.encodeParameters(
    [
      'address',
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
    ],
    [taker, [signedOrder], [optionsToMint], [signedOrder.signature]],
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
      secondAddress: trade0xCallee.address,
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

  console.log("ETH needed: 💰 ", operateValue.toString())

  const user1UsdcBalanceBefore = new BigNumber(await usdc.balanceOf(taker))
  const marginPoolWethBalanceBefore = new BigNumber(await weth.balanceOf(marginPool.address))
  const user1Call1BalanceBefore = new BigNumber(await callOption1.balanceOf(taker))
  const oTokenSupplyBefore = new BigNumber(await callOption1.totalSupply())
  const makerUsdcBalanceBefore = new BigNumber(await usdc.balanceOf(maker))
  const makerCall1BalanceBefore = new BigNumber(await callOption1.balanceOf(maker))

  console.log("MarginPool WETH balance before: 📊", marginPoolWethBalanceBefore.toString())
  console.log("Maker USDC balance before: 📊", makerUsdcBalanceBefore.toString())
  console.log("Maker Otoken balance before: 📊", makerCall1BalanceBefore.toString())
  console.log("Taker USDC balance before: 📊", user1UsdcBalanceBefore.toString())
  console.log("Taker Otoken balance before: 📊", user1Call1BalanceBefore.toString())
  console.log("Otoken total supply before: 📊", oTokenSupplyBefore.toString())

  console.log("Approving 0x Callee and calling Operate 🚀")

  await callOption1.approve(trade0xCallee.address, optionsToMint, {from: taker})
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

  console.log("MarginPool WETH balance after: 📈", marginPoolWethBalanceAfter.toString())
  console.log("Maker USDC balance after: 📉", makerUsdcBalanceAfter.toString())
  console.log("Maker Otoken balance after: 📈 ", makerCall1BalanceAfter.toString())
  console.log("Taker USDC balance after: 📈", user1UsdcBalanceAfter.toString())
  console.log("Taker Otoken balance after: 📊", user1Call1BalanceAfter.toString())
  console.log("Otoken total supply after: 📈", oTokenSupplyAfter.toString())
}

run = async function(callback) {
    try {
      await runExport();
    } catch (err) {
      console.error(err);
    }
    callback();
};
// Attach this function to the exported function
// in order to allow the script to be executed through both truffle and a test runner.
run.runExport = runExport;
module.exports = run;