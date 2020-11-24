import {
  MockERC20Instance,
  Trade0xInstance,
  Mock0xExchangeInstance,
  WETH9Instance,
} from '../../build/types/truffle-types'
import {createTokenAmount} from '../utils'
import BigNumber from 'bignumber.js'

const WETH9 = artifacts.require('WETH9.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const Mock0xExchange = artifacts.require('Mock0xExchange')
const Trade0x = artifacts.require('Trade0x.sol')

contract('Trade0xCallee', ([maker, payableProxy, controller, taker, staking]) => {
  // ERC20 mocks
  let weth: WETH9Instance
  // addressbook instance
  let callee: Trade0xInstance
  let mockExchange: Mock0xExchangeInstance
  let proxyAddr: string
  let data: string
  let makerToken: MockERC20Instance
  let takerToken: MockERC20Instance

  const fillAmount = new BigNumber('1000000')
  const signature =
    '0x1c698be1f76b87c5a7f8aed7836374fdacca342416862f8c393565037fa506a43e0b71f8b8f45b359bb534ef7074cc24bdb863a633751fefeadb5c22e24425ba6802'

  before('Deployment', async () => {
    makerToken = await MockERC20.new('MToken', 'MToken', 8)
    await makerToken.mint(maker, createTokenAmount(100000, 8))

    takerToken = await MockERC20.new('TToken', 'TToken', 8)
    await takerToken.mint(taker, createTokenAmount(100000, 8))
    // taker needs to approve callee

    // deploy WETH token
    weth = await WETH9.new()

    mockExchange = await Mock0xExchange.new()
    proxyAddr = await mockExchange.proxy()
    // deploy AddressBook token
    callee = await Trade0x.new(mockExchange.address, proxyAddr, weth.address, staking)

    const order1 = {
      expirationTimeSeconds: '1764547200',
      feeRecipientAddress: '0x1000000000000000000000000000000000000011',
      makerAddress: maker,
      makerAssetAmount: '100000000',
      makerAssetData: `0xf47261b0000000000000000000000000${makerToken.address.slice(2)}`,
      makerFee: '0',
      makerFeeAssetData: '0x',
      salt: '24930773035730352667',
      senderAddress: '0x0000000000000000000000000000000000000000',
      takerAddress: '0x0000000000000000000000000000000000000000',
      takerAssetAmount: '1000000',
      takerAssetData: `0xf47261b0000000000000000000000000${takerToken.address.slice(2)}`,
      takerFee: '0',
      takerFeeAssetData: '0x',
    }
    data = web3.eth.abi.encodeParameters(
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
      [order1, fillAmount.toString(), signature, payableProxy], // pay weth from payable proxy
    )
  })

  describe('Run Trade0xCallee directly', () => {
    it('should take maker asset from maker', async () => {
      // taker needs to approve callee
      await takerToken.approve(callee.address, createTokenAmount(10000, 8), {from: taker})

      // deposit some weth in payable proxy
      const amountEth = createTokenAmount(1, 18)
      await weth.deposit({value: amountEth, from: taker})
      await weth.transfer(payableProxy, amountEth, {from: taker})
      // payable proxy will approve callee to use the weth
      await weth.approve(callee.address, amountEth, {from: payableProxy})
      // call action from the controller
      await callee.callFunction(taker, data, {from: controller})

      // check the data feed into 0x exchange is correct
      const parsedSignature = await mockExchange.signature()
      const parsedTakerAmount = await mockExchange.takerAmount()
      const parsedMakerAmount = await mockExchange.makerAmount()
      assert.equal(parsedSignature, signature)
      assert.equal(parsedTakerAmount.toString(), fillAmount.toString())
      assert.equal(parsedMakerAmount.toString(), '100000000')
    })
  })
})
