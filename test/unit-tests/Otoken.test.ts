import {OtokenInstance, MockERC20Instance} from '../../build/types/truffle-types'
import {createTokenAmount} from '../utils'

const {expectRevert} = require('@openzeppelin/test-helpers')

const Otoken = artifacts.require('Otoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MockAddressBook = artifacts.require('MockAddressBook')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
const ETH_ADDR = ZERO_ADDR

contract('Otoken', ([deployer, controller, user1, user2, random]) => {
  let otoken: OtokenInstance
  let usdc: MockERC20Instance
  let addressBookAddr: string

  // let expiry: number;
  const strikePrice = createTokenAmount(200)
  const expiry = 1601020800 // 2020/09/25 0800 UTC
  const isPut = true

  before('Deployment', async () => {
    // Need another mock contract for addressbook when we add ERC20 operations.
    const addressBook = await MockAddressBook.new()
    addressBookAddr = addressBook.address
    await addressBook.setController(controller)

    // deploy oToken with addressbook
    otoken = await Otoken.new()

    usdc = await MockERC20.new('USDC', 'USDC', 6)
  })

  describe('Otoken Initialization', () => {
    it('should be able to initialize with put parameter correctly', async () => {
      await otoken.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: deployer,
      })
      assert.equal(await otoken.underlyingAsset(), ETH_ADDR)
      assert.equal(await otoken.strikeAsset(), usdc.address)
      assert.equal(await otoken.collateralAsset(), usdc.address)
      assert.equal((await otoken.strikePrice()).toString(), strikePrice.toString())
      assert.equal(await otoken.isPut(), isPut)
      assert.equal((await otoken.expiryTimestamp()).toNumber(), expiry)
    })

    it('should initilized the put option with valid name / symbol', async () => {
      assert.equal(await otoken.name(), `ETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-25SEP20-200P`)
      assert.equal((await otoken.decimals()).toNumber(), 8)
    })

    it('should revert when init is called again with the same parameters', async () => {
      await expectRevert(
        otoken.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, isPut),
        'Contract instance has already been initialized',
      )
    })

    it('should revert when init is called again with different parameters', async () => {
      await expectRevert(
        otoken.init(addressBookAddr, usdc.address, ETH_ADDR, ETH_ADDR, strikePrice, expiry, false),
        'Contract instance has already been initialized',
      )
    })

    it('should set the right name for calls', async () => {
      const callOption = await Otoken.new()
      await callOption.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, false, {
        from: deployer,
      })
      assert.equal(await callOption.name(), `ETHUSDC 25-September-2020 200Call USDC Collateral`)
      assert.equal(await callOption.symbol(), `oETHUSDC-25SEP20-200C`)
    })

    it('should set the right name for non-eth options', async () => {
      const weth = await MockERC20.new('WETH', 'WETH', 18)
      const putOption = await Otoken.new()
      await putOption.init(addressBookAddr, weth.address, usdc.address, usdc.address, strikePrice, expiry, isPut, {
        from: deployer,
      })
      assert.equal(await putOption.name(), `WETHUSDC 25-September-2020 200Put USDC Collateral`)
      assert.equal(await putOption.symbol(), `oWETHUSDC-25SEP20-200P`)
    })

    it('should revert when init asset with non-erc20 address', async () => {
      /* This behavior should've been banned by factory) */
      const put = await Otoken.new()
      await expectRevert(
        put.init(addressBookAddr, random, usdc.address, usdc.address, strikePrice, expiry, isPut, {from: deployer}),
        'revert',
      )
    })

    it('should set the right name for options with 0 expiry (should be banned by factory)', async () => {
      /* This behavior should've been banned by factory) */
      const otoken = await Otoken.new()
      await otoken.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 0, isPut, {from: deployer})
      assert.equal(await otoken.name(), `ETHUSDC 01-January-1970 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-01JAN70-200P`)
    })

    it('should set the right name for options expiry on 2345/12/31', async () => {
      /** This is the largest timestamp that the factoy will allow (the largest bokkypoobah covers) **/
      const otoken = await Otoken.new()
      const _expiry = '11865394800' // Mon, 31 Dec 2345
      await otoken.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, _expiry, isPut, {
        from: deployer,
      })
      assert.equal(await otoken.name(), `ETHUSDC 31-December-2345 200Put USDC Collateral`)
      assert.equal(await otoken.symbol(), `oETHUSDC-31DEC45-200P`)
    })

    it('should set the right symbol for year 220x ', async () => {
      const expiry = 7560230400 // 2209-07-29
      const otoken = await Otoken.new()
      await otoken.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, expiry, true, {
        from: deployer,
      })
      assert.equal(await otoken.symbol(), 'oETHUSDC-29JUL09-200P')
      assert.equal(await otoken.name(), 'ETHUSDC 29-July-2209 200Put USDC Collateral')
    })

    it('should set the right name and symbol for expiry on each month', async () => {
      // We need to go through all decision branches in _getMonth() to make a 100% test coverage.
      const January = await Otoken.new()
      await January.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1893456000, isPut, {
        from: deployer,
      })
      assert.equal(await January.name(), 'ETHUSDC 01-January-2030 200Put USDC Collateral')
      assert.equal(await January.symbol(), 'oETHUSDC-01JAN30-200P')

      const February = await Otoken.new()
      await February.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1896134400, isPut, {
        from: deployer,
      })
      assert.equal(await February.name(), 'ETHUSDC 01-February-2030 200Put USDC Collateral')
      assert.equal(await February.symbol(), 'oETHUSDC-01FEB30-200P')

      const March = await Otoken.new()
      await March.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1898553600, isPut, {
        from: deployer,
      })
      assert.equal(await March.name(), 'ETHUSDC 01-March-2030 200Put USDC Collateral')
      assert.equal(await March.symbol(), 'oETHUSDC-01MAR30-200P')

      const April = await Otoken.new()
      await April.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1901232000, isPut, {
        from: deployer,
      })
      assert.equal(await April.name(), 'ETHUSDC 01-April-2030 200Put USDC Collateral')
      assert.equal(await April.symbol(), 'oETHUSDC-01APR30-200P')

      const May = await Otoken.new()
      await May.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1903824000, isPut, {
        from: deployer,
      })
      assert.equal(await May.name(), 'ETHUSDC 01-May-2030 200Put USDC Collateral')
      assert.equal(await May.symbol(), 'oETHUSDC-01MAY30-200P')

      const June = await Otoken.new()
      await June.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1906502400, isPut, {
        from: deployer,
      })
      assert.equal(await June.name(), 'ETHUSDC 01-June-2030 200Put USDC Collateral')
      assert.equal(await June.symbol(), 'oETHUSDC-01JUN30-200P')

      const July = await Otoken.new()
      await July.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1909094400, isPut, {
        from: deployer,
      })
      assert.equal(await July.name(), 'ETHUSDC 01-July-2030 200Put USDC Collateral')
      assert.equal(await July.symbol(), 'oETHUSDC-01JUL30-200P')

      const August = await Otoken.new()
      await August.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1911772800, isPut, {
        from: deployer,
      })
      assert.equal(await August.name(), 'ETHUSDC 01-August-2030 200Put USDC Collateral')
      assert.equal(await August.symbol(), 'oETHUSDC-01AUG30-200P')

      const September = await Otoken.new()
      await September.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1914451200, isPut, {
        from: deployer,
      })
      assert.equal(await September.name(), 'ETHUSDC 01-September-2030 200Put USDC Collateral')
      assert.equal(await September.symbol(), 'oETHUSDC-01SEP30-200P')

      const October = await Otoken.new()
      await October.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1917043200, isPut, {
        from: deployer,
      })
      assert.equal(await October.name(), 'ETHUSDC 01-October-2030 200Put USDC Collateral')
      assert.equal(await October.symbol(), 'oETHUSDC-01OCT30-200P')

      const November = await Otoken.new()
      await November.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1919721600, isPut, {
        from: deployer,
      })
      assert.equal(await November.name(), 'ETHUSDC 01-November-2030 200Put USDC Collateral')
      assert.equal(await November.symbol(), 'oETHUSDC-01NOV30-200P')

      const December = await Otoken.new()
      await December.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, strikePrice, 1922313600, isPut, {
        from: deployer,
      })
      assert.equal(await December.name(), 'ETHUSDC 01-December-2030 200Put USDC Collateral')
      assert.equal(await December.symbol(), 'oETHUSDC-01DEC30-200P')
    })

    it('should display strikePrice as $0 in name and symbol when strikePrice < 10^18', async () => {
      const testOtoken = await Otoken.new()
      await testOtoken.init(addressBookAddr, ETH_ADDR, usdc.address, usdc.address, 0, expiry, isPut, {from: deployer})
      assert.equal(await testOtoken.name(), `ETHUSDC 25-September-2020 0Put USDC Collateral`)
      assert.equal(await testOtoken.symbol(), `oETHUSDC-25SEP20-0P`)
    })
  })

  describe('Token operations: Mint', () => {
    const amountToMint = createTokenAmount(10)
    it('should be able to mint tokens from controller address', async () => {
      await otoken.mintOtoken(user1, amountToMint, {from: controller})
      const balance = await otoken.balanceOf(user1)
      assert.equal(balance.toString(), amountToMint.toString())
    })

    it('should revert when minting from random address', async () => {
      await expectRevert(
        otoken.mintOtoken(user1, amountToMint, {from: random}),
        'Otoken: Only Controller can mint Otokens',
      )
    })

    it('should revert when someone try to mint for himself.', async () => {
      await expectRevert(
        otoken.mintOtoken(user1, amountToMint, {from: user1}),
        'Otoken: Only Controller can mint Otokens',
      )
    })
  })

  describe('Token operations: Transfer', () => {
    const amountToMint = createTokenAmount(10)
    it('should be able to transfer tokens from user 1 to user 2', async () => {
      await otoken.transfer(user2, amountToMint, {from: user1})
      const balance = await otoken.balanceOf(user2)
      assert.equal(balance.toString(), amountToMint.toString())
    })

    it('should revert when calling transferFrom with no allownace', async () => {
      await expectRevert(
        otoken.transferFrom(user2, user1, amountToMint, {from: random}),
        'ERC20: transfer amount exceeds allowance',
      )
    })

    it('should revert when controller call transferFrom with no allownace', async () => {
      await expectRevert(
        otoken.transferFrom(user2, user1, amountToMint, {from: controller}),
        'ERC20: transfer amount exceeds allowance',
      )
    })

    it('should be able to use transferFrom to transfer token from user2 to user1.', async () => {
      await otoken.approve(random, amountToMint, {from: user2})
      await otoken.transferFrom(user2, user1, amountToMint, {from: random})
      const user2Remaining = await otoken.balanceOf(user2)
      assert.equal(user2Remaining.toString(), '0')
    })
  })

  describe('Token operations: Burn', () => {
    const amountToMint = createTokenAmount(10)
    it('should revert when burning from random address', async () => {
      await expectRevert(
        otoken.burnOtoken(user1, amountToMint, {from: random}),
        'Otoken: Only Controller can burn Otokens',
      )
    })

    it('should revert when someone trys to burn for himeself', async () => {
      await expectRevert(
        otoken.burnOtoken(user1, amountToMint, {from: user1}),
        'Otoken: Only Controller can burn Otokens',
      )
    })

    it('should be able to burn tokens from controller address', async () => {
      await otoken.burnOtoken(user1, amountToMint, {from: controller})
      const balance = await otoken.balanceOf(user1)
      assert.equal(balance.toString(), '0')
    })
  })
})
