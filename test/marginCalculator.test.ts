import {
  MockERC20Instance,
  MarginCalculatorInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
} from '../build/types/truffle-types'
import {createVault, createScaledNumber} from './utils'
import {assert} from 'chai'

const {expectRevert, time} = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('MarginCalculator.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
contract('MarginCalculator', () => {
  let expiry: number

  let calculator: MarginCalculatorInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let eth300Put: MockOtokenInstance
  let eth250Put: MockOtokenInstance
  let eth200Put: MockOtokenInstance
  let eth100Put: MockOtokenInstance
  let eth300Call: MockOtokenInstance
  let eth250Call: MockOtokenInstance
  let eth200Call: MockOtokenInstance
  let eth100Call: MockOtokenInstance
  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup calculator
    calculator = await MarginCalculator.new()
    await calculator.init(addressBook.address)
    // setup oracle
    oracle = await MockOracle.new()
    await addressBook.setOracle(oracle.address)
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', 6)
    dai = await MockERC20.new('DAI', 'DAI', 18)
    weth = await MockERC20.new('WETH', 'WETH', 18)
    // setup put tokens
    eth300Put = await MockOtoken.new()
    eth250Put = await MockOtoken.new()
    eth200Put = await MockOtoken.new()
    eth100Put = await MockOtoken.new()
    await eth300Put.init(
      addressBook.address,
      weth.address,
      usdc.address,
      usdc.address,
      createScaledNumber(300),
      expiry,
      true,
    )
    await eth250Put.init(
      addressBook.address,
      weth.address,
      usdc.address,
      usdc.address,
      createScaledNumber(250),
      expiry,
      true,
    )
    await eth200Put.init(
      addressBook.address,
      weth.address,
      usdc.address,
      usdc.address,
      createScaledNumber(200),
      expiry,
      true,
    )
    await eth100Put.init(
      addressBook.address,
      weth.address,
      usdc.address,
      usdc.address,
      createScaledNumber(100),
      expiry,
      true,
    )
    // setup call tokens
    eth300Call = await MockOtoken.new()
    eth250Call = await MockOtoken.new()
    eth200Call = await MockOtoken.new()
    eth100Call = await MockOtoken.new()
    await eth300Call.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledNumber(300),
      expiry,
      false,
    )
    await eth250Call.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledNumber(250),
      expiry,
      false,
    )
    await eth200Call.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledNumber(200),
      expiry,
      false,
    )
    await eth100Call.init(
      addressBook.address,
      weth.address,
      usdc.address,
      weth.address,
      createScaledNumber(100),
      expiry,
      false,
    )
  })

  describe('Get cash value tests', () => {
    let closeExpiry: number
    let put: MockOtokenInstance
    let call: MockOtokenInstance
    before('create calls and puts for getExpiredCashValue test', async () => {
      const now = (await time.latest()).toNumber()
      closeExpiry = now + time.duration.days(1).toNumber()
      put = await MockOtoken.new()
      call = await MockOtoken.new()
      await put.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createScaledNumber(250),
        closeExpiry,
        true,
      )
      await call.init(
        addressBook.address,
        weth.address,
        usdc.address,
        usdc.address,
        createScaledNumber(250),
        closeExpiry,
        false,
      )
      await oracle.setIsFinalized(weth.address, closeExpiry, true)
    })

    it('Should revert when entering address(0)', async () => {
      await expectRevert(calculator.getExpiredCashValue(ZERO_ADDR), 'MarginCalculator: Invalid token address.')
    })
    it('Should revert if option is not expired yet.', async () => {
      await expectRevert(calculator.getExpiredCashValue(put.address), 'MarginCalculator: Otoken not expired yet')
      // let the otoken expire!
      await time.increaseTo(closeExpiry + 2)
    })
    it('Should return cash value for put as strike price - eth price when strike > eth price', async () => {
      const ethPirce = createScaledNumber(200)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const cashedValue = await calculator.getExpiredCashValue(put.address)
      assert.equal(cashedValue.toString(), createScaledNumber(50))
    })
    it('Should return cash value for call as 0 when strike price when strike > eth price', async () => {
      const ethPirce = createScaledNumber(150)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const cashedValue = await calculator.getExpiredCashValue(call.address)
      assert.equal(cashedValue.toString(), '0')
    })
    it('Should return cash value for put as 0 when strike  < eth price', async () => {
      const ethPirce = createScaledNumber(300)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const cashedValue = await calculator.getExpiredCashValue(put.address)
      assert.equal(cashedValue.toString(), '0')
    })
    it('Should return cash value for call as underlying - strike when strike < eth price', async () => {
      const ethPirce = createScaledNumber(300)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const cashedValue = await calculator.getExpiredCashValue(call.address)
      assert.equal(cashedValue.toString(), createScaledNumber(50))
    })
    it('Should revert if price is not finalized.', async () => {
      const ethPirce = createScaledNumber(200)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      await oracle.setIsFinalized(weth.address, closeExpiry, false)
      await expectRevert(
        calculator.getExpiredCashValue(call.address),
        'MarginCalculator: Oracle price not finalized yet.',
      )
    })
  })

  describe('Get excess margin tests', () => {
    describe('Vault prerequisites checks.', () => {
      it('Should revert when vault contain more than 1 short', async () => {
        const vault = {
          shortOtokens: [eth250Call.address, eth250Put.address],
          longOtokens: [],
          collateralAssets: [],
          shortAmounts: [],
          longAmounts: [],
          collateralAmounts: [],
        }
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: Too many short otokens in the vault.',
        )
      })
      it('Should revert when vault contain more than 1 long asset', async () => {
        const vault = {
          shortOtokens: [],
          longOtokens: [eth250Call.address, eth250Put.address],
          collateralAssets: [],
          shortAmounts: [],
          longAmounts: [],
          collateralAmounts: [],
        }
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: Too many long otokens in the vault.',
        )
      })
      it('Should revert when vault contain more than 1 collateral asset', async () => {
        const vault = {
          shortOtokens: [],
          longOtokens: [],
          collateralAssets: [usdc.address, dai.address],
          shortAmounts: [],
          longAmounts: [],
          collateralAmounts: [],
        }
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: Too many collateral assets in the vault.',
        )
      })
      // Check amount and asset arrays length mismatch
      it('Should revert when short assets and amounts have differenct length', async () => {
        const vault = createVault(eth250Put.address, undefined, undefined, undefined, undefined, undefined)
        await expectRevert(calculator.getExcessCollateral(vault), 'MarginCalculator: Short asset and amount mismatch')
      })
      it('Should revert when long assets and amounts have differenct length', async () => {
        const vault = createVault(undefined, eth250Put.address, undefined, undefined, undefined, undefined)
        await expectRevert(calculator.getExcessCollateral(vault), 'MarginCalculator: Long asset and amount mismatch')
      })
      it('Should revert when collateral assets and amounts have differenct length', async () => {
        const vault = createVault(undefined, undefined, usdc.address, undefined, undefined, undefined)
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: Collateral asset and amount mismatch',
        )
      })

      it("Should return collateral amount if there's no short.", async () => {
        const collateralAmount = createScaledNumber(100)
        const vault = createVault(undefined, undefined, usdc.address, undefined, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(netValue.toString(), collateralAmount)
        assert.isTrue(isExcess)
      })

      // it('Should revert if denominated token is different from short.collateral.', async () => {
      //   const shortAmount = createScaledNumber(1)
      //   const collateralAmount = createScaledNumber(250)
      //   const vault = createVault(eth250Put.address, undefined, usdc.address, shortAmount, undefined, collateralAmount)
      //   await expectRevert(
      //     calculator. getExcessCollateral(vault, dai.address),
      //     "MarginCalculator: Denomintated token should be the short otoken's collateral",
      //   )
      // })

      it('Should revert if long token has differet underlying as short.', async () => {
        const otokenWrongUnderlying = await MockOtoken.new()
        await otokenWrongUnderlying.init(
          addressBook.address,
          dai.address,
          usdc.address,
          usdc.address,
          '0',
          expiry,
          true,
        )
        const vault = createVault(
          eth250Put.address,
          otokenWrongUnderlying.address,
          undefined,
          createScaledNumber(1),
          createScaledNumber(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: long asset not marginable for short asset',
        )
      })

      it('Should revert if long token has differet strike as short.', async () => {
        const otokenWrongStrike = await MockOtoken.new()
        await otokenWrongStrike.init(addressBook.address, weth.address, dai.address, usdc.address, '0', expiry, true)
        const vault = createVault(
          eth250Put.address,
          otokenWrongStrike.address,
          undefined,
          createScaledNumber(1),
          createScaledNumber(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: long asset not marginable for short asset',
        )
      })

      it('Should revert if long token has differet collateral as short.', async () => {
        const otokenWrongCollateral = await MockOtoken.new()
        await otokenWrongCollateral.init(
          addressBook.address,
          weth.address,
          usdc.address,
          dai.address,
          '0',
          expiry,
          true,
        )
        const vault = createVault(
          eth250Put.address,
          otokenWrongCollateral.address,
          undefined,
          createScaledNumber(1),
          createScaledNumber(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: long asset not marginable for short asset',
        )
      })

      it('Should revert if long token has differet expiry as short.', async () => {
        const otokenWrongExpiry = await MockOtoken.new()
        await otokenWrongExpiry.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          '0',
          expiry + 1,
          true,
        )
        const vault = createVault(
          eth250Put.address,
          otokenWrongExpiry.address,
          undefined,
          createScaledNumber(1),
          createScaledNumber(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault),
          'MarginCalculator: long asset not marginable for short asset',
        )
      })
    })

    describe('Put vault check before expiry', () => {
      const amountOne = createScaledNumber(1)

      it('(1) Short: 1 250 put => need 250 collateral', async () => {
        const collateralNeeded = createScaledNumber(250)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded)
      })

      it('(2) Short: 1 250 put, collateral: 250 USDC => excess: 0', async () => {
        const collateralAmount = createScaledNumber(250)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(3) Short: 1 250 put, collateral: 300 USDC => excess: 50', async () => {
        const collateralAmount = createScaledNumber(300)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(50))
      })

      it('(4) Short: 1 250 put, collateral: 100 USDC => need 150 collateral', async () => {
        const collateralAmount = createScaledNumber(100)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(150))
      })

      it('(5) Short: 1 250 put, long 1 200 put => need 50 collatearl', async () => {
        const vaultWithoutCollateral = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithoutCollateral)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(50))
      })

      it('(6) Short: 1 250 put, long 1 200 put, collateral: 10 USDC => need 40 collatearl', async () => {
        const vaultWithoutCollateral = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(10),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithoutCollateral)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(40))
      })

      it('(7) Short: 1 250 put, long: 1 200 put, collateral: 50 usdc => excess: 0', async () => {
        const vaultWithCollateral = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(8) Short: 1 200 put, long: 1 250 put => excess: 0', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(9) Short: 1 200 put, long: 1 250 put, collateral 50 => excess: 50', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(50))
      })

      it('(10) Short: 1 200 put, long: 2 100 put => need 100 collateral', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth100Put.address,
          usdc.address,
          amountOne,
          createScaledNumber(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(100))
      })

      it('(11) Short: 1 200 put, long: 2 250 put => excess 0', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          createScaledNumber(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(12) Short: 2 200 put, long: 1 250 put => need 150 collateral', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          createScaledNumber(2),
          createScaledNumber(1),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(150))
      })

      it('(13) Short: 3 200 put, long: 2 250 put => need 100 collateral', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          createScaledNumber(3),
          createScaledNumber(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(100))
      })

      it('(14) Short: 3 200 put, long: 2 250 put, 300 collateral => excess: 200 USDC.', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          createScaledNumber(3),
          createScaledNumber(2),
          createScaledNumber(300),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(200))
      })

      it('(15) Short: 30000 200 put, long: 20000 250 put, 3000000 collateral => excess: 2000000 USDC.', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          createScaledNumber(30000),
          createScaledNumber(20000),
          createScaledNumber(3000000),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(2000000))
      })
    })

    describe('Call vault check before expiry', () => {
      const amountOne = createScaledNumber(1)
      it('(1) Short: 1 200 call => need 1 weth collateral ', async () => {
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), amountOne)
      })

      it('(2) Short: 1 200 call, collateral: 1 weth, => excess: 0 ', async () => {
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, amountOne)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(3) Short: 1 200 call, collateral: 2 weth, => excess: 1 ', async () => {
        const vault = createVault(
          eth200Call.address,
          undefined,
          weth.address,
          amountOne,
          undefined,
          createScaledNumber(2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(1))
      })

      it('(4) Short: 1 200 call, long: 1 250 call => need 0.2 eth ', async () => {
        const vault = createVault(eth200Call.address, eth250Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(0.2))
      })

      it('(5) Short: 1 200 call, long: 1 250 call, collateral: 0.2 weth => excess: 0 ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(6) Short: 1 200 call, long: 2 250 call, collateral 0.2 eth => excess: 0 ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          createScaledNumber(2),
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(7) Short: 1 250 call, long: 1 200 call => excess: 0 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(8) Short: 1 250 call, long: 3 200 call => excess: 0 ', async () => {
        const vault = createVault(
          eth250Call.address,
          eth200Call.address,
          weth.address,
          amountOne,
          createScaledNumber(3),
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(9) Short: 3 250 call, long: 1 200 call => need 2 weth ', async () => {
        const vault = createVault(
          eth250Call.address,
          eth200Call.address,
          weth.address,
          createScaledNumber(3),
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(2))
      })

      it('(10) Short: 1 200 call, long: 1 200 call => need 0.5 weth ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth200Call.address,
          weth.address,
          createScaledNumber(1),
          createScaledNumber(1),
          createScaledNumber(0.5),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(0.5))
      })

      it('(11) Short: 4 100 call, long: 1 300 call => need 3 weth ', async () => {
        const vault = createVault(
          eth100Call.address,
          eth300Call.address,
          weth.address,
          createScaledNumber(4),
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(3))
      })

      it('(12) Short: 2 200 call, long: 1 250 call => need 1 weth ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          createScaledNumber(2),
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(1))
      })

      it('(13) Short: 3 200 call, long: 1 250 call => need 2 weth ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          createScaledNumber(3),
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(2))
      })

      it('(14) Short: 3 250 call, long: 1 200 call => need 1 weth ', async () => {
        const vault = createVault(
          eth100Call.address,
          eth200Call.address,
          weth.address,
          createScaledNumber(2),
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), createScaledNumber(1))
      })
    })

    describe('Put vault check after expiry, ETH price = 150 USD (ITM)', () => {
      const amountOne = createScaledNumber(1)

      before(async () => {
        // let the optinos expire
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setIsFinalized(weth.address, expiry, true)
        await oracle.setExpiryPrice(weth.address, expiry, createScaledNumber(150))
      })

      it('(1) Short: 1 250 put, collateral: 250 USDC => can take out 150 USD', async () => {
        const vault = createVault(
          eth250Put.address,
          undefined,
          usdc.address,
          amountOne,
          undefined,
          createScaledNumber(250),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(150))
      })

      it('(2) Short: 1 250 put, collateral: 300 USDC => can take out 200 USD', async () => {
        const vault = createVault(
          eth250Put.address,
          undefined,
          usdc.address,
          amountOne,
          undefined,
          createScaledNumber(300),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(200))
      })

      it('(3) Short: 1 250 put, long: 200 put, collateral: 50 USDC => excess: 0', async () => {
        const vault = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(4) Short: 1 200 put, long: 250 put => excess: 50 USDC', async () => {
        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(50))
      })

      it('(5) Short: 1 200 put, long: 250 put, collateral: 50 USD => excess: 100 USDC', async () => {
        const vault = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(100))
      })

      it('(6) Short: 1 200 put, long: 2 250 put => excess: 50 USDC', async () => {
        const vault = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          createScaledNumber(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(150))
      })
    })

    describe('Put vault check after expiry, ETH price = 300 USD (OTM)', () => {
      const amountOne = createScaledNumber(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, createScaledNumber(300))
      })

      it('(1) Short: 1 250 put, collateral: 250 USDC => can take out 250 USD', async () => {
        const vault = createVault(
          eth250Put.address,
          undefined,
          usdc.address,
          amountOne,
          undefined,
          createScaledNumber(250),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(250))
      })

      it('(2) Short: 1 250 put, collateral: 300 USDC => can take out 300 USD', async () => {
        const vault = createVault(
          eth250Put.address,
          undefined,
          usdc.address,
          amountOne,
          undefined,
          createScaledNumber(300),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(300))
      })

      it('(3) Short: 1 250 put, long: 200 put, collateral: 50 USDC => excess: 50', async () => {
        const vault = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(50))
      })

      it('(4) Short: 1 200 put, long: 250 put => excess: 0 USDC', async () => {
        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(5) Short: 1 200 put, long: 250 put, collateral: 50 USD => excess: 50 USDC', async () => {
        const vault = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(50))
      })

      it('(6) Short: 1 200 put, long: 2 250 put => excess: 0', async () => {
        const vault = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          createScaledNumber(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })
    })

    describe('Put vault check after expiry, ETH price = 210 USD', () => {
      const amountOne = createScaledNumber(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, createScaledNumber(210))
      })

      it('(1) Short: 1 200 put, long 1 250 put => Net value', async () => {
        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(40))
      })

      it('(2) Short: 1 250 put, long 1 200 put, collateral 50 USDC => Net value', async () => {
        const vault = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createScaledNumber(50),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(10))
      })
    })

    describe('Call vault check after expiry, ETH price = 150 (OTM)', () => {
      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, createScaledNumber(150))
      })

      const amountOne = createScaledNumber(1)
      it('(1) Short: 1 200 call, collateral: 1 weth, => excess: 1 ', async () => {
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, amountOne)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(1))
        // net = 1
      })

      it('(2) Short: 1 200 call, collateral: 2 weth, => excess: 2 ', async () => {
        const vault = createVault(
          eth200Call.address,
          undefined,
          weth.address,
          amountOne,
          undefined,
          createScaledNumber(2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(2))
      })

      it('(3) Short: 1 200 call, long: 1 250 call, collateral: 0.2 weth => excess: 0.2 ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(0.2))
      })

      it('(4) Short: 1 200 call, long: 2 250 call, collateral 0.2 eth => excess: 0.2 ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          createScaledNumber(2),
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(0.2))
      })

      it('(5) Short: 1 250 call, long: 1 200 call => excess: 0 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(6) Short: 1 250 call, long: 3 200 call => excess: 0 ', async () => {
        const vault = createVault(
          eth250Call.address,
          eth200Call.address,
          weth.address,
          amountOne,
          createScaledNumber(3),
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })
    })

    describe('Call vault check after expiry, ETH price = 300 (ITM)', () => {
      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, createScaledNumber(300))
      })

      const amountOne = createScaledNumber(1)
      it('(1) Short: 1 200 call, collateral: 1 weth, => excess: 0.666 ', async () => {
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, amountOne)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '666666666666666667')
      })

      it('(2) Short: 1 200 call, collateral: 2 weth, => excess: 1.6667 ', async () => {
        const vault = createVault(
          eth200Call.address,
          undefined,
          weth.address,
          amountOne,
          undefined,
          createScaledNumber(2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '1666666666666666667')
      })

      it('(3) Short: 1 200 call, long: 1 250 call, collateral: 0.2 weth => excess: 0.033 ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '33333333333333333')
      })

      it('(4) Short: 1 200 call, long: 2 250 call, collateral 0.2 eth => excess: 0.2 ', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          createScaledNumber(2),
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), createScaledNumber(0.2))
      })

      it('(5) Short: 1 250 call, long: 1 200 call => excess: 0.1666 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '166666666666666666')
      })

      it('(6) Short: 1 250 call, long: 3 200 call => excess: 0.8333 ', async () => {
        const vault = createVault(
          eth250Call.address,
          eth200Call.address,
          weth.address,
          amountOne,
          createScaledNumber(3),
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '833333333333333332')
      })
    })

    describe('Call vault check after expiry, ETH price = 210 USD', () => {
      const amountOne = createScaledNumber(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, createScaledNumber(210))
      })

      it('(1) Short: 1 250 call, long 1 200 call, collateral 0 USDC => Net value', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '47619047619047618') // 0.47619047619047618
      })

      it('(2) Short: 1 200 put, long 1 250 put, collateral 0.2 weth => Net value', async () => {
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          createScaledNumber(0.2),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '152380952380952381') // 0.152380952380952381
      })
    })
  })
})
