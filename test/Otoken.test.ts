/* eslint-disable */
// import {MockERC20Instance, WhitelistInstance} from '../build/types/truffle-types'

// const {expectEvent, expectRevert} = require('@openzeppelin/test-helpers')

// const Otoken = artifacts.require('Otoken.sol')
// const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

contract('Otoken', ([owner, factory, controller]) => {
  // Whitelist module
  // let whitelist: WhitelistInstance

  // const underlyingAsset = ZERO_ADDR

  before('Deployment', async () => {
    // deploy USDC token
  })

  describe('Otoken Initialization', () => {
    it('should be able to initialize the oToken and emit event', async () => {})

    it('should set the parameters correctly.', async () => {})

    it('should revert when init is called twice', async () => {})
  })

  describe('ERC20 operations', () => {
    it('should be able to transfer Otoken', async () => {})

    it('should revert if transfer is called with insufficient balance.', async () => {})

    it('should be able to approve.', async () => {})

    it('should revert if transferFrom is called with insufficient allowance.', async () => {})

    it('should mint token', async () => {})

    it('should revert if mint is not called by controller', async () => {})

    it('should burn token', async () => {})

    it('should revert if burn is not called by controller', async () => {})
  })
})
