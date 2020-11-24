// mainnet fork
import BigNumber from 'bignumber.js'
import {Trade0xInstance, MockERC20Instance, WETH9Instance} from '../../build/types/truffle-types'

import {createTokenAmount} from '../utils'

const TradeCallee = artifacts.require('Trade0x')
const ERC20 = artifacts.require('MockERC20')
const WETH9 = artifacts.require('WETH9')

// unlock this address to get its USDC
const usdcWhale = '0xbe0eb53f46cd790cd13851d5eff43d12404d33e8'

// mainnet data
const EXCHANGE_ADDR = '0x61935cbdd02287b511119ddb11aeb42f1593b7ef'
const ERC20PROXY_ADDR = '0x95e6f48254609a6ee006f7d493c8e5fb97094cef'
const STAKING_ADDR = '0xa26e80e7Dea86279c6d778D702Cc413E6CFfA777'
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const CTokenAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

// the maker's address
const maker = '0xa163e3e565d67c71778060f9dc907cf92d13ce4a'

const order1 = {
  expirationTimeSeconds: '1764547200',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '100000000',
  makerAssetData: '0xf47261b000000000000000000000000039aa39c021dfbae8fac545936693ac917d5e7563',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '24930773035730352667',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '1000000',
  takerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  takerFee: '0',
  takerFeeAssetData: '0x',
}

const signature1 =
  '0x1c698be1f76b87c5a7f8aed7836374fdacca342416862f8c393565037fa506a43e0b71f8b8f45b359bb534ef7074cc24bdb863a633751fefeadb5c22e24425ba6802'

const fillAmount1 = new BigNumber('1000000')

contract('Callee contract test', async ([deployer, user, controller, payabeProxy]) => {
  let callee: Trade0xInstance
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let cToken: MockERC20Instance

  before('setup transfer account asset', async () => {
    // setup contracts
    // exchange = await Exchange.at(EXCHANGE_ADDR)
    callee = await TradeCallee.new(EXCHANGE_ADDR, ERC20PROXY_ADDR, WETHAddress, STAKING_ADDR, {from: deployer})

    const proxy = await callee.assetProxy()
    assert.equal(proxy.toLowerCase(), ERC20PROXY_ADDR.toLowerCase())

    usdc = await ERC20.at(USDCAddress)

    weth = await WETH9.at(WETHAddress)

    // get 10000 USDC from the whale ;)
    await usdc.transfer(user, createTokenAmount(10000, 6), {from: usdcWhale})
    // user need to approve callee function
    await usdc.approve(callee.address, fillAmount1, {from: user})

    cToken = await ERC20.at(CTokenAddress)

    const makerAllowance = await cToken.allowance(maker, ERC20PROXY_ADDR)
    assert.isTrue(makerAllowance.gte('200000000'))
  })

  it("call the callee address with user's address as sender ", async () => {
    const data = web3.eth.abi.encodeParameters(
      [
        {
          Order: {
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
        'uint256',
        'bytes',
        'address',
      ],
      [order1, fillAmount1.toString(), signature1, payabeProxy],
    )

    const usdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
    const cTokenBalanceBefore = new BigNumber(await cToken.balanceOf(user))

    // pay protocol fee in ETH.
    const gasPriceGWei = '50'
    const gasPriceWei = web3.utils.toWei(gasPriceGWei, 'gwei')
    // protocol require 70000 * gas price per fill
    const feeAmount = new BigNumber(gasPriceWei).times(70000).toString()

    // payabeProxy need to approve callee to pull weth
    await weth.deposit({from: payabeProxy, value: feeAmount})
    await weth.approve(callee.address, feeAmount, {from: payabeProxy})

    await callee.callFunction(user, data, {
      from: controller,
      gasPrice: gasPriceWei,
    })

    const usdcBalanceAfter = new BigNumber(await usdc.balanceOf(user))
    assert.equal(usdcBalanceBefore.minus(usdcBalanceAfter).toString(), fillAmount1.toString())

    const cTokenBalanceAfter = new BigNumber(await cToken.balanceOf(user))
    assert.equal(cTokenBalanceAfter.minus(cTokenBalanceBefore).toString(), '100000000')
  })
})
