import {
  MockOtokenInstance,
  PermitCalleeInstance,
  AddressBookInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'

import BigNumber from 'bignumber.js'
import { createTokenAmount } from '../utils'

const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers')
const { fromRpcSig } = require('ethereumjs-util')
const ethSigUtil = require('eth-sig-util')
const Wallet = require('ethereumjs-wallet').default

const { EIP712Domain, domainSeparator } = require('../eip712')

const AddressBook = artifacts.require('AddressBook.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const PermitCallee = artifacts.require('PermitCallee.sol')

const Permit = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
]

contract('PermitCallee', ([controllerProxy, spender]) => {
  // ERC20 mock
  let usdc: MockERC20Instance
  let weth: MockERC20Instance
  // addressbook module mock
  let addressBook: AddressBookInstance
  // permit callee instance
  let permitCallee: PermitCalleeInstance
  // otoken mock
  let otoken: MockOtokenInstance

  const usdcDecimals = 6
  const wethDecimals = 18
  const name = 'ETHUSDC/1597511955/200P/USDC'
  const version = '1'

  before('Deployment', async () => {
    const expiryTime = new BigNumber(60 * 60 * 24) // after 1 day

    // ERC20 deployment
    usdc = await MockERC20.new('USDC', 'USDC', usdcDecimals)
    weth = await MockERC20.new('WETH', 'WETH', wethDecimals)

    addressBook = await AddressBook.new()
    permitCallee = await PermitCallee.new()
    otoken = await MockOtoken.new()

    await otoken.init(
      addressBook.address,
      weth.address,
      usdc.address,
      usdc.address,
      createTokenAmount(200),
      new BigNumber(await time.latest()).plus(expiryTime),
      true,
    )
  })

  describe('Permit callFunction', async () => {
    it('Should increase allowance through callFunction', async () => {
      const wallet = Wallet.generate()

      const owner = wallet.getAddressString()
      const value = new BN(42)
      const nonce = 0
      // const maxDeadline = MAX_UINT256;
      const maxDeadline = new BigNumber(await time.latest()).plus(60 * 60 * 24).toString()

      const buildData = (chainId: number, verifyingContract: string, deadline = maxDeadline) => ({
        primaryType: 'Permit',
        types: { EIP712Domain, Permit },
        domain: { name, version, chainId, verifyingContract },
        message: { owner, spender, value, nonce, deadline },
      })

      const data = buildData((await otoken.getChainId()).toNumber(), otoken.address)
      const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), { data })
      const { v, r, s } = fromRpcSig(signature)

      const spenderAllowanceBefore = new BigNumber(await otoken.allowance(owner, spender))

      const callData = web3.eth.abi.encodeParameters(
        ['address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes32', 'bytes32'],
        [otoken.address, owner, spender, value.toString(), maxDeadline, v, r, s],
      )

      await permitCallee.callFunction(owner, callData, { from: controllerProxy })

      const spenderAllowanceAfter = new BigNumber(await otoken.allowance(owner, spender))

      assert.equal(
        spenderAllowanceAfter.minus(spenderAllowanceBefore).toString(),
        new BigNumber(value).toString(),
        'Permitted amount mismatch',
      )
    })
  })
})
