import {
  MockOtokenInstance,
  PermitCalleeInstance,
  AddressBookInstance,
  MockERC20Instance,
} from '../../build/types/truffle-types'

import BigNumber from 'bignumber.js'
import {ecsign} from 'ethereumjs-util'
import {createTokenAmount, getApprovalDigest} from '../utils'

const {time} = require('@openzeppelin/test-helpers')
const Wallet = require('ethereumjs-wallet').default

const AddressBook = artifacts.require('AddressBook.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const PermitCallee = artifacts.require('PermitCallee.sol')

contract('PermitCallee', ([caller, spender]) => {
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
  const otokenName = 'ETHUSDC/1597511955/200P/USDC'

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
      const value = new BigNumber(42).multipliedBy(new BigNumber(10).pow(18))
      const nonce = new BigNumber(await otoken.nonces(owner))
      const deadline = new BigNumber(await time.latest()).plus(60 * 60 * 24)

      // give free options
      await otoken.mintOtoken(owner, new BigNumber('100'))

      const digest = await getApprovalDigest(
        {name: otokenName, address: otoken.address},
        {owner: owner, spender: spender, value: value.toString()},
        nonce.toString(),
        deadline.toString(),
      )
      const {v, r, s} = ecsign(Buffer.from(digest.slice(2), 'hex'), wallet.getPrivateKey())
      const callData = web3.eth.abi.encodeParameters(
        ['address', 'address', 'address', 'uint256', 'uint256', 'uint8', 'bytes', 'bytes'],
        [otoken.address, owner, spender, value.toString(), deadline.toString(), v, r, s],
      )

      const spenderAllowanceBefore = await otoken.allowance(owner, spender)
      console.log(spenderAllowanceBefore.toString())

      await permitCallee.callFunction(owner, callData, {from: caller})

      const spenderAllowanceAfter = await otoken.allowance(owner, spender)
      console.log(spenderAllowanceAfter.toString())
    })
  })
})