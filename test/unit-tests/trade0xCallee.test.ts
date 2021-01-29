import {
  MockERC20Instance,
  Trade0xInstance,
  Mock0xExchangeInstance,
  WETH9Instance,
  MockControllerInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount, createOrder, signOrder} from '../utils'
import BigNumber from 'bignumber.js'
const {expectRevert} = require('@openzeppelin/test-helpers')
const WETH9 = artifacts.require('WETH9.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('Otoken.sol')
const Mock0xExchange = artifacts.require('Mock0xExchange')
const Trade0x = artifacts.require('Trade0x.sol')
const MockController = artifacts.require('MockController.sol')
const ethers = require('ethers')

contract('Trade0xCallee', ([payableProxy, taker, staking, random]) => {
  // ERC20 mocks
  let weth: WETH9Instance
  // addressbook instance
  let callee: Trade0xInstance
  let mockExchange: Mock0xExchangeInstance
  let proxyAddr: string
  let data: string
  let token1: MockERC20Instance
  let token2: MockERC20Instance
  let order: any
  let controller: MockControllerInstance
  const fillAmount = new BigNumber('1000000')
  let token1Amount: string
  const makerPrivateKey = '0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773'
  const maker = new ethers.Wallet(makerPrivateKey)

  const LARGE_NUMBER = createTokenAmount(10, 20)

  before('Deployment', async () => {
    token1 = await MockERC20.new('MToken', 'MToken', 8)
    await token1.mint(maker.address, createTokenAmount(100000, 8))
    token1Amount = createTokenAmount(1, 8)

    // taker needs to approve callee
    token2 = await MockERC20.new('TToken', 'TToken', 8)
    await token2.mint(taker, createTokenAmount(100000, 8))

    // deploy a new mock controller
    controller = await MockController.new()

    // deploy WETH token
    weth = await WETH9.new()

    mockExchange = await Mock0xExchange.new()
    proxyAddr = await mockExchange.proxy()
    // deploy AddressBook token
    callee = await Trade0x.new(mockExchange.address, proxyAddr, weth.address, staking, controller.address)

    // create an order
    order = createOrder(
      mockExchange.address,
      maker.address,
      token1.address,
      token2.address,
      new BigNumber(token1Amount),
      new BigNumber(createTokenAmount(100, 8)),
    )
    const signedOrder = await signOrder(maker, order)

    data = web3.eth.abi.encodeParameters(
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
      [taker, [signedOrder], [fillAmount.toString()], [signedOrder.signature]], // pay weth from payable proxy
    )
  })

  describe('Run Trade0xCallee directly', () => {
    it('should fail if the msg.sender is not the controller', async () => {
      await expectRevert(callee.callFunction(taker, data, {from: taker}), 'Trade0x: sender not controller')
    })

    it('should fail if the tx.origin is not the trader', async () => {
      await expectRevert(
        controller.test0xCallee(callee.address, data, {from: random}),
        'Trade0x: funds can only be transferred in from the person sending the transaction',
      )
    })
  })
})
