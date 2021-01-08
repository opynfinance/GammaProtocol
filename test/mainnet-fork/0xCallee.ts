// mainnet fork
// use : 11608387 block number in the ganache fork
import BigNumber from 'bignumber.js'
import {Trade0xInstance, MockERC20Instance, WETH9Instance} from '../../build/types/truffle-types'

import {createTokenAmount} from '../utils'

const TradeCallee = artifacts.require('Trade0x')
const ERC20 = artifacts.require('MockERC20')
const WETH9 = artifacts.require('WETH9')

// unlock this address to get its USDC
const usdcWhale = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8'

// mainnet data
const EXCHANGE_ADDR = '0x61935cbdd02287b511119ddb11aeb42f1593b7ef'
const ERC20PROXY_ADDR = '0x95e6f48254609a6ee006f7d493c8e5fb97094cef'
const STAKING_ADDR = '0xa26e80e7Dea86279c6d778D702Cc413E6CFfA777'
const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const CTokenAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const oTokenAddress = '0x8018AF0f74E3Eb4aBD32c523398524B404C3Ae74'

// the maker's address
const maker = '0x75ea4d5a32370f974d40b404e4ce0e00c1554979'

const fillAmount1 = new BigNumber('7561545')
const order1 = {
  expirationTimeSeconds: '1610033451',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '199324404',
  makerAssetData: '0xf47261b00000000000000000000000008018af0f74e3eb4abd32c523398524b404c3ae74',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '839123584429213056',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '7561545',
  takerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  takerFee: '0',
  takerFeeAssetData: '0x',
}
const signature1 =
  '0x1b83ae7e3dae7d335bac2e1594bc517f797d18cc0ddb67518f39cd422e0153d1ad21e8ddf039f9b04d4581fa1530e1a0b6f89eabce6f91c295ab5c46b75333ee9902'

contract('Callee contract test', async ([deployer, user, controller, payabeProxy]) => {
  let callee: Trade0xInstance
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let otoken: MockERC20Instance

  before('setup transfer account asset', async () => {
    // setup contracts
    // exchange = await Exchange.at(EXCHANGE_ADDR)
    callee = await TradeCallee.new(EXCHANGE_ADDR, ERC20PROXY_ADDR, WETHAddress, STAKING_ADDR, controller, {
      from: deployer,
    })

    const proxy = await callee.assetProxy()
    assert.equal(proxy.toLowerCase(), ERC20PROXY_ADDR.toLowerCase())

    usdc = await ERC20.at(USDCAddress)

    weth = await WETH9.at(WETHAddress)

    // get 20000 USDC from the whale ;)
    await usdc.transfer(user, createTokenAmount(20000, 6), {from: usdcWhale})
    // user need to approve callee function
    await usdc.approve(callee.address, fillAmount1, {from: user})

    otoken = await ERC20.at(oTokenAddress)

    const makerAllowance = await otoken.allowance(maker, ERC20PROXY_ADDR)
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
    const oTokenBalanceBefore = new BigNumber(await otoken.balanceOf(user))

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

    const oTokenBalanceAfter = new BigNumber(await otoken.balanceOf(user))
    assert.equal(oTokenBalanceAfter.minus(oTokenBalanceBefore).toString(), '199324404')
  })
})
