import {
  MockERC20Instance,
  Trade0xInstance,
  Mock0xExchangeInstance,
  WETH9Instance,
  MockControllerInstance,
} from '../../build/types/truffle-types'
import {createTokenAmount} from '../utils'
import BigNumber from 'bignumber.js'
const {expectRevert} = require('@openzeppelin/test-helpers')
const WETH9 = artifacts.require('WETH9.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const Mock0xExchange = artifacts.require('Mock0xExchange')
const Trade0x = artifacts.require('Trade0x.sol')
const MockController = artifacts.require('MockController.sol')

const OrderStruct = {
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
}

contract('Trade0xCallee', ([maker, payableProxy, taker, staking]) => {
  // ERC20 mocks
  let weth: WETH9Instance
  // addressbook instance
  let callee: Trade0xInstance
  let mockExchange: Mock0xExchangeInstance
  let proxyAddr: string
  let data: string
  let makerToken: MockERC20Instance
  let takerToken: MockERC20Instance
  let order: any
  let controller: MockControllerInstance
  const fillAmount = new BigNumber('1000000')
  const signature =
    '0x1c698be1f76b87c5a7f8aed7836374fdacca342416862f8c393565037fa506a43e0b71f8b8f45b359bb534ef7074cc24bdb863a633751fefeadb5c22e24425ba6802'

  before('Deployment', async () => {
    makerToken = await MockERC20.new('MToken', 'MToken', 8)
    await makerToken.mint(maker, createTokenAmount(100000, 8))

    // taker needs to approve callee
    takerToken = await MockERC20.new('TToken', 'TToken', 8)
    await takerToken.mint(taker, createTokenAmount(100000, 8))

    // deploy a new mock controller
    controller = await MockController.new()

    // deploy WETH token
    weth = await WETH9.new()

    mockExchange = await Mock0xExchange.new()
    proxyAddr = await mockExchange.proxy()
    // deploy AddressBook token
    callee = await Trade0x.new(mockExchange.address, proxyAddr, weth.address, staking, controller.address)

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
        'uint256[]',
        'uint8[]',
        'bytes32[]',
        'bytes32[]',
      ],
      [taker, [order], [fillAmount.toString()], [signature], [order.expirationTimeSeconds], ['0x0'], ['0x0'], ['0x0']], // pay weth from payable proxy
    )
  })

  describe('Run Trade0xCallee directly', () => {
    it('should fail if the msg.sender is not the controoler', async () => {
      await expectRevert(callee.callFunction(taker, data, {from: taker}), 'Trade0x: sender not controller')
    })

    it('should fail if the msg.sender is not the controoler', async () => {
      await expectRevert(
        controller.test0xCallee(callee.address, data, {from: maker}),
        'Trade0x: funds can only be transferred in from the person sending the transaction',
      )
    })
  })
})
