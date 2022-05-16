import {
  MockERC20Instance,
  CalculatorTesterInstance,
  MockAddressBookInstance,
  MockOracleInstance,
  MockOtokenInstance,
  WhitelistInstance,
} from '../../build/types/truffle-types'
import { createVault, createScaledNumber as scaleNum, createTokenAmount } from '../utils'
import { assert } from 'chai'

const { expectRevert, time } = require('@openzeppelin/test-helpers')
const MockAddressBook = artifacts.require('MockAddressBook.sol')
const MockOracle = artifacts.require('MockOracle.sol')
const MockOtoken = artifacts.require('MockOtoken.sol')
const MockERC20 = artifacts.require('MockERC20.sol')
const MarginCalculator = artifacts.require('CalculatorTester.sol')
const Whitelist = artifacts.require('Whitelist.sol')
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'
contract('MarginCalculator', () => {
  let expiry: number

  let calculator: CalculatorTesterInstance
  let addressBook: MockAddressBookInstance
  let oracle: MockOracleInstance
  let whitelist: WhitelistInstance
  // eth puts
  let eth300Put: MockOtokenInstance
  let eth250Put: MockOtokenInstance
  let eth200Put: MockOtokenInstance
  let eth100Put: MockOtokenInstance
  // eth puts cUSDC collateral
  let eth300PutCUSDC: MockOtokenInstance

  // eth calls
  let eth300Call: MockOtokenInstance
  let eth250Call: MockOtokenInstance
  let eth200Call: MockOtokenInstance
  let eth100Call: MockOtokenInstance
  // eth calls cETH collateral
  let eth300CallCETH: MockOtokenInstance

  let usdc: MockERC20Instance
  let dai: MockERC20Instance
  let weth: MockERC20Instance
  let ceth: MockERC20Instance
  let cusdc: MockERC20Instance

  // assume there's a R token that has 22 decimals
  let rusd: MockERC20Instance
  let reth: MockERC20Instance
  // assume there's a T token that has 20 decimals
  let tusd: MockERC20Instance

  const usdcDecimals = 6
  const daiDecimals = 8
  const wethDecimals = 18
  const ctokenDecimals = 8
  // to test decimal conversions
  const ttokenDecimals = 27
  const rtokenDecimals = 29

  before('set up contracts', async () => {
    const now = (await time.latest()).toNumber()
    expiry = now + time.duration.days(30).toNumber()
    // initiate addressbook first.
    addressBook = await MockAddressBook.new()
    // setup oracle
    oracle = await MockOracle.new()
    await addressBook.setOracle(oracle.address)
    // setup calculator
    calculator = await MarginCalculator.new(oracle.address, addressBook.address)
    // setup usdc and weth
    usdc = await MockERC20.new('USDC', 'USDC', usdcDecimals)
    dai = await MockERC20.new('DAI', 'DAI', daiDecimals)
    weth = await MockERC20.new('WETH', 'WETH', wethDecimals)
    cusdc = await MockERC20.new('cUSDC', 'cUSDC', ctokenDecimals)
    ceth = await MockERC20.new('cETH', 'cETH', ctokenDecimals)
    // weird tokens
    rusd = await MockERC20.new('rUSD', 'rUSD', rtokenDecimals)
    reth = await MockERC20.new('rETH', 'rETH', rtokenDecimals)
    tusd = await MockERC20.new('tUSD', 'tUSD', ttokenDecimals)
    whitelist = await Whitelist.new(addressBook.address)
    // whitelist the vault type 0 collaterals
    // whitelist call collateral
    await whitelist.whitelistCoveredCollateral(weth.address, weth.address, false)
    await whitelist.whitelistCoveredCollateral(ceth.address, weth.address, false)
    await whitelist.whitelistCoveredCollateral(reth.address, weth.address, false)
    await whitelist.whitelistCoveredCollateral(reth.address, reth.address, false)
    //whitelist put collateral
    await whitelist.whitelistCoveredCollateral(usdc.address, weth.address, true)
    await whitelist.whitelistCoveredCollateral(dai.address, weth.address, true)
    await whitelist.whitelistCoveredCollateral(cusdc.address, weth.address, true)
    await whitelist.whitelistCoveredCollateral(rusd.address, weth.address, true)
    await whitelist.whitelistCoveredCollateral(tusd.address, weth.address, true)
    await addressBook.setWhitelist(whitelist.address)
    // setup put tokens
    eth300Put = await MockOtoken.new()
    eth250Put = await MockOtoken.new()
    eth200Put = await MockOtoken.new()
    eth100Put = await MockOtoken.new()
    eth300PutCUSDC = await MockOtoken.new()
    await eth300Put.init(addressBook.address, weth.address, usdc.address, usdc.address, scaleNum(300), expiry, true)
    await eth250Put.init(addressBook.address, weth.address, usdc.address, usdc.address, scaleNum(250), expiry, true)
    await eth200Put.init(addressBook.address, weth.address, usdc.address, usdc.address, scaleNum(200), expiry, true)
    await eth100Put.init(addressBook.address, weth.address, usdc.address, usdc.address, scaleNum(100), expiry, true)
    await eth300PutCUSDC.init(
      addressBook.address,
      weth.address,
      usdc.address,
      cusdc.address,
      scaleNum(300),
      expiry,
      true,
    )
    // setup call tokens
    eth300Call = await MockOtoken.new()
    eth250Call = await MockOtoken.new()
    eth200Call = await MockOtoken.new()
    eth100Call = await MockOtoken.new()
    eth300CallCETH = await MockOtoken.new()
    await eth300Call.init(addressBook.address, weth.address, usdc.address, weth.address, scaleNum(300), expiry, false)
    await eth250Call.init(addressBook.address, weth.address, usdc.address, weth.address, scaleNum(250), expiry, false)
    await eth200Call.init(addressBook.address, weth.address, usdc.address, weth.address, scaleNum(200), expiry, false)
    await eth100Call.init(addressBook.address, weth.address, usdc.address, weth.address, scaleNum(100), expiry, false)
    await eth300CallCETH.init(
      addressBook.address,
      weth.address,
      usdc.address,
      ceth.address,
      scaleNum(300),
      expiry,
      false,
    )
  })

  describe('Deployment test', () => {
    it('should revert deploying Calculator with addressbook address equal to zero', async () => {
      await expectRevert(MarginCalculator.new(ZERO_ADDR, ZERO_ADDR), 'MarginCalculator: invalid oracle address')
    })
  })

  describe('Get cash value and payout rate', () => {
    let closeExpiry: number
    let put: MockOtokenInstance
    let call: MockOtokenInstance
    before('create calls and puts for getExpiredCashValue test', async () => {
      const now = (await time.latest()).toNumber()
      closeExpiry = now + time.duration.days(1).toNumber()
      put = await MockOtoken.new()
      call = await MockOtoken.new()
      await put.init(addressBook.address, weth.address, usdc.address, usdc.address, scaleNum(250), closeExpiry, true)
      await call.init(addressBook.address, weth.address, usdc.address, usdc.address, scaleNum(250), closeExpiry, false)
      await oracle.setIsFinalized(weth.address, closeExpiry, true)
      // set USDC expiry price to 1
      await oracle.setExpiryPrice(usdc.address, closeExpiry, scaleNum(1))
      await oracle.setIsFinalized(usdc.address, closeExpiry, true)
    })

    it('Should revert when entering address(0)', async () => {
      await expectRevert(calculator.getExpiredPayoutRate(ZERO_ADDR), 'MarginCalculator: Invalid token address')
    })
    it('Should revert if option is not expired yet.', async () => {
      await expectRevert(calculator.getExpiredPayoutRate(put.address), 'MarginCalculator: Otoken not expired yet')
      await time.increaseTo(closeExpiry + 2)
    })
    it('Should return cash value for put as strike price - eth price when strike > eth price', async () => {
      const ethPirce = scaleNum(200)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const underlying = await put.underlyingAsset()
      const strike = await put.strikeAsset()
      const expiryTimestamp = await put.expiryTimestamp()
      const strikePrice = await put.strikePrice()
      const isPut = await put.isPut()
      const cashedValue = await calculator.getExpiredCashValue(underlying, strike, expiryTimestamp, strikePrice, isPut)
      assert.equal(cashedValue.toString(), scaleNum(50))
    })
    it('Should return cash value for call as 0 when strike price when strike > eth price', async () => {
      const ethPirce = scaleNum(150)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const underlying = await call.underlyingAsset()
      const strike = await call.strikeAsset()
      const expiryTimestamp = await call.expiryTimestamp()
      const strikePrice = await call.strikePrice()
      const isPut = await call.isPut()
      const cashedValue = await calculator.getExpiredCashValue(underlying, strike, expiryTimestamp, strikePrice, isPut)
      assert.equal(cashedValue.toString(), '0')
    })
    it('Should return cash value for put as 0 when strike  < eth price', async () => {
      const ethPirce = scaleNum(300)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const underlying = await put.underlyingAsset()
      const strike = await put.strikeAsset()
      const expiryTimestamp = await put.expiryTimestamp()
      const strikePrice = await put.strikePrice()
      const isPut = await put.isPut()
      const cashedValue = await calculator.getExpiredCashValue(underlying, strike, expiryTimestamp, strikePrice, isPut)
      assert.equal(cashedValue.toString(), '0')
    })
    it('Should return cash value for call as underlying - strike when strike < eth price', async () => {
      const ethPirce = scaleNum(300)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      const underlying = await call.underlyingAsset()
      const strike = await call.strikeAsset()
      const expiryTimestamp = await call.expiryTimestamp()
      const strikePrice = await call.strikePrice()
      const isPut = await call.isPut()
      const cashedValue = await calculator.getExpiredCashValue(underlying, strike, expiryTimestamp, strikePrice, isPut)
      assert.equal(cashedValue.toString(), scaleNum(50))
    })
    it('Should revert if underlying price is not finalized.', async () => {
      const ethPirce = scaleNum(200)
      await oracle.setExpiryPrice(weth.address, closeExpiry, ethPirce)
      await oracle.setIsFinalized(weth.address, closeExpiry, false)
      const underlying = await call.underlyingAsset()
      const strike = await call.strikeAsset()
      const expiryTimestamp = await call.expiryTimestamp()
      const strikePrice = await call.strikePrice()
      const isPut = await call.isPut()
      await expectRevert(
        calculator.getExpiredCashValue(underlying, strike, expiryTimestamp, strikePrice, isPut),
        'MarginCalculator: price at expiry not finalized yet',
      )
    })
    it('Should revert if strike asset price is not finalized.', async () => {
      await oracle.setIsFinalized(weth.address, closeExpiry, true)
      await oracle.setIsFinalized(usdc.address, closeExpiry, false)
      const underlying = await call.underlyingAsset()
      const strike = await call.strikeAsset()
      const expiryTimestamp = await call.expiryTimestamp()
      const strikePrice = await call.strikePrice()
      const isPut = await call.isPut()
      await expectRevert(
        calculator.getExpiredCashValue(underlying, strike, expiryTimestamp, strikePrice, isPut),
        'MarginCalculator: price at expiry not finalized yet',
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
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: Too many short otokens in the vault',
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
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: Too many long otokens in the vault',
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
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: Too many collateral assets in the vault',
        )
      })
      // Check amount and asset arrays length mismatch
      it('Should revert when short assets and amounts have differenct length', async () => {
        const vault = createVault(eth250Put.address, undefined, undefined, undefined, undefined, undefined)
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: Short asset and amount mismatch',
        )
      })
      it('Should revert when long assets and amounts have differenct length', async () => {
        const vault = createVault(undefined, eth250Put.address, undefined, undefined, undefined, undefined)
        await expectRevert(calculator.getExcessCollateral(vault, 0), 'MarginCalculator: Long asset and amount mismatch')
      })
      it('Should revert when collateral assets and amounts have differenct length', async () => {
        const vault = createVault(undefined, undefined, usdc.address, undefined, undefined, undefined)
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: Collateral asset and amount mismatch',
        )
      })

      it('Should revert when collateral assets is different from short.collateral', async () => {
        const vault = createVault(
          eth100Put.address,
          undefined,
          weth.address,
          scaleNum(1),
          undefined,
          createTokenAmount(100, wethDecimals),
        )
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: collateral asset not marginable for short asset',
        )
      })

      it("Should return collateral amount if there's no short.", async () => {
        const collateralAmount = createTokenAmount(100, usdcDecimals)
        const vault = createVault(undefined, undefined, usdc.address, undefined, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(netValue.toString(), collateralAmount.toString())
        assert.isTrue(isExcess)
      })

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
          scaleNum(1),
          scaleNum(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
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
          scaleNum(1),
          scaleNum(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
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
          scaleNum(1),
          scaleNum(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
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
          scaleNum(1),
          scaleNum(1),
          undefined,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: long asset not marginable for short asset',
        )
      })

      it('Should revert when collateral is different from collateral of short', async () => {
        const vault = createVault(eth200Put.address, undefined, weth.address, scaleNum(1), undefined, 100)
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: collateral asset not marginable for short asset',
        )
      })

      it('Should revert when vault only contain long and collateral, and collateral is different from collateral of long', async () => {
        const vault = createVault(undefined, eth200Put.address, weth.address, undefined, scaleNum(1), 100)
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: collateral asset not marginable for short asset',
        )
      })
    })

    describe('Should return invalid vault for edge cases', () => {
      let smallPut: MockOtokenInstance

      before('setup put with low strke price', async () => {
        smallPut = await MockOtoken.new()
        await smallPut.init(
          addressBook.address,
          weth.address,
          usdc.address,
          usdc.address,
          createTokenAmount(0.25),
          expiry,
          true,
        )
      })

      it('(1) Short: 1 unit of 0.25 put with 0 collateral => invalid vault, need 1 USDC unit', async () => {
        const vault = createVault(smallPut.address, undefined, usdc.address, 1, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), '1')
      })

      it('(2) Short: 1 0.25 put, collateral: 1e-6 USDC => valid vault', async () => {
        const vault = createVault(smallPut.address, undefined, usdc.address, 1, undefined, 1)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0') // excess = 0 because user can't take out that 1 USDC
      })

      it('(3) Short: 1 unit of Put with strike price = 1e-8 => invalid vault, need at least 1 UCDC unit', async () => {
        const dustPut = await MockOtoken.new()
        await dustPut.init(addressBook.address, weth.address, usdc.address, usdc.address, 1, expiry, true)

        const vault = createVault(dustPut.address, undefined, usdc.address, 1, undefined, 0)

        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), '1')
      })

      it('(4) Short: 1 unit of Put with strike price = 1.5 * 1e-6 => invalid vault, need at least 1 UCDC unit', async () => {
        const dustPut = await MockOtoken.new()
        const strikePrice = 1.5 * 1e2 //
        await dustPut.init(addressBook.address, weth.address, usdc.address, usdc.address, strikePrice, expiry, true)
        const mintAmount = createTokenAmount(1, 8)
        const vault = createVault(dustPut.address, undefined, usdc.address, mintAmount, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), '2')
      })

      it('(5) Short: 1 200 call, long 1 0 call => need 0 usdc', async () => {
        const zeroCall = await MockOtoken.new()
        await zeroCall.init(addressBook.address, weth.address, usdc.address, weth.address, 0, expiry, false)
        const vault = createVault(
          eth200Call.address,
          zeroCall.address,
          undefined,
          createTokenAmount(1),
          createTokenAmount(1),
          undefined,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })
    })

    describe('Put vault check before expiry', () => {
      const amountOne = scaleNum(1)

      it('(1) Short: 1 250 put => need 250 collateral', async () => {
        const collateralNeeded = createTokenAmount(250, usdcDecimals)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded.toString())
      })

      it('(2) Short: 1 250 put, collateral: 250 USDC => excess: 0', async () => {
        const collateralAmount = createTokenAmount(250, usdcDecimals)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(3) Short: 1 250 put, collateral: 300 USDC => excess: 50', async () => {
        const collateralAmount = createTokenAmount(300, usdcDecimals)
        const expectOutPut = createTokenAmount(50, usdcDecimals)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutPut.toString())
      })

      it('(4) Short: 1 250 put, collateral: 100 USDC => need 150 collateral', async () => {
        const collateralAmount = createTokenAmount(100, usdcDecimals)
        const expectOutPut = createTokenAmount(150, usdcDecimals)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectOutPut.toString())
      })

      it('(5) Short: 1 250 put, long 1 200 put => need 50 collatearl', async () => {
        const expectOutput = createTokenAmount(50, usdcDecimals)
        const vaultWithoutCollateral = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          0,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithoutCollateral, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectOutput.toString())
      })

      it('(6) Short: 1 250 put, long 1 200 put, collateral: 10 USDC => need 40 collatearl', async () => {
        const expectOutput = createTokenAmount(40, usdcDecimals)
        const vaultWithoutCollateral = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createTokenAmount(10, usdcDecimals),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithoutCollateral, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectOutput.toString())
      })

      it('(7) Short: 1 250 put, long: 1 200 put, collateral: 50 usdc => excess: 0', async () => {
        const vaultWithCollateral = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createTokenAmount(50, usdcDecimals),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
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
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(9) Short: 1 200 put, long: 1 250 put, collateral 50 => excess: 50', async () => {
        const expectedOutput = createTokenAmount(50, usdcDecimals)
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          createTokenAmount(50, usdcDecimals),
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })

      it('(10) Short: 1 200 put, long: 2 100 put => need 100 collateral', async () => {
        const expectedOutput = createTokenAmount(100, usdcDecimals)
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth100Put.address,
          usdc.address,
          amountOne,
          scaleNum(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })

      it('(11) Short: 1 200 put, long: 2 250 put => excess 0', async () => {
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          scaleNum(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(12) Short: 2 200 put, long: 1 250 put => need 150 collateral', async () => {
        const expectedOutput = createTokenAmount(150, usdcDecimals)
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          scaleNum(2),
          scaleNum(1),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })

      it('(13) Short: 3 200 put, long: 2 250 put => need 100 collateral', async () => {
        const expectedOutput = createTokenAmount(100, usdcDecimals)
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          scaleNum(3),
          scaleNum(2),
          '0',
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })

      it('(14) Short: 3 200 put, long: 2 250 put, 300 collateral => excess: 200 USDC.', async () => {
        const collateralAmount = createTokenAmount(300, usdcDecimals)
        const expectedOutput = createTokenAmount(200, usdcDecimals)
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          scaleNum(3),
          scaleNum(2),
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })

      it('(15) Short: 30000 200 put, long: 20000 250 put, 3000000 collateral => excess: 2000000 USDC.', async () => {
        const collateralAmount = createTokenAmount(3000000, usdcDecimals)
        const expectedOutput = createTokenAmount(2000000, usdcDecimals)
        const vaultWithCollateral = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          scaleNum(30000),
          scaleNum(20000),
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vaultWithCollateral, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })
    })

    describe('Put vault (cUSDC collateral) check before expiry', () => {
      const amountOne = scaleNum(1)

      before('set oracle price for USDC and cUSDC', async () => {
        const usdcPrice = scaleNum(1)
        const cusdcPrice = scaleNum(0.02)
        await oracle.setRealTimePrice(usdc.address, usdcPrice)
        await oracle.setRealTimePrice(cusdc.address, cusdcPrice)
      })

      it('(1) Short: 1 300 put => need 15000 cUSD collateral', async () => {
        const collateralNeeded = createTokenAmount(15000, ctokenDecimals)
        const vault = createVault(eth300PutCUSDC.address, undefined, cusdc.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded.toString())
      })
    })

    describe('Put vault check (collateral with 27 decimals) before expiry', () => {
      const amountOne = scaleNum(1)

      let put: MockOtokenInstance

      before('create put with rUSD, set oracle price for rUSD', async () => {
        // create put with rUSD as collateral + underlying
        put = await MockOtoken.new()
        await put.init(addressBook.address, weth.address, tusd.address, tusd.address, scaleNum(300), expiry, true)
        const usdcPrice = scaleNum(1)
        await oracle.setRealTimePrice(tusd.address, usdcPrice)
      })

      it('(1) Short: 1 300 put => need 300 rUSD collateral', async () => {
        const collateralNeeded = createTokenAmount(300, ttokenDecimals)
        const vault = createVault(put.address, undefined, tusd.address, amountOne, undefined, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded.toString())
      })

      it('(2) Short: 1 300 put, no collateral specified => need 300 USD collateral (default use short.collateral)', async () => {
        const collateralNeeded = createTokenAmount(300, ttokenDecimals)
        const vault = createVault(put.address, undefined, undefined, amountOne, undefined, undefined)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded.toString())
      })

      it('(3) Short: 1 300 put, collateral: 350 tUSD => excess: 50', async () => {
        const collateralAmount = createTokenAmount(350, ttokenDecimals)
        const expectOutPut = createTokenAmount(50, ttokenDecimals)
        const vault = createVault(put.address, undefined, tusd.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutPut.toString())
      })
    })

    describe('Put vault check (collateral with 29 decimals) before expiry', () => {
      const amountOne = scaleNum(1)

      let put: MockOtokenInstance

      before('create put with rUSD, set oracle price for rUSD', async () => {
        // create put with rUSD as collateral + underlying
        put = await MockOtoken.new()
        await put.init(addressBook.address, weth.address, rusd.address, rusd.address, scaleNum(300), expiry, true)
        const usdcPrice = scaleNum(1)
        await oracle.setRealTimePrice(rusd.address, usdcPrice)
      })

      it('(1) Short: 1 300 put => need 300 rUSD collateral', async () => {
        const collateralNeeded = createTokenAmount(300, rtokenDecimals)
        const vault = createVault(put.address, undefined, rusd.address, amountOne, undefined, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded.toString())
      })

      it('(2) Short: 1 300 put, no collateral specified => need 300 USD collateral (default use short.collateral)', async () => {
        const collateralNeeded = createTokenAmount(300, rtokenDecimals)
        const vault = createVault(put.address, undefined, undefined, amountOne, undefined, undefined)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded.toString())
      })

      it('(3) Short: 1 300 put, collateral: 350 rUSDC => excess: 50', async () => {
        const collateralAmount = createTokenAmount(350, rtokenDecimals)
        const expectOutPut = createTokenAmount(50, rtokenDecimals)
        const vault = createVault(put.address, undefined, rusd.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutPut.toString())
      })
    })

    describe('Call vault check before expiry', () => {
      const amountOne = scaleNum(1)
      it('(1) Short: 1 200 call => need 1 weth collateral ', async () => {
        const expectOutput = createTokenAmount(1, wethDecimals)
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(2) Short: 1 200 call, collateral: 1 weth, => excess: 0 ', async () => {
        const collateralAmount = createTokenAmount(1, wethDecimals)
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(3) Short: 1 200 call, collateral: 2 weth, => excess: 1 ', async () => {
        const collateralAmount = createTokenAmount(2, wethDecimals)
        const expectedOutput = createTokenAmount(1, wethDecimals)
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectedOutput)
      })

      it('(4) Short: 1 200 call, long: 1 250 call => need 0.2 eth ', async () => {
        const expectedOutput = createTokenAmount(0.2, wethDecimals)
        const vault = createVault(eth200Call.address, eth250Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedOutput)
      })

      it('(5) Short: 1 200 call, long: 1 250 call, collateral: 0.2 weth => excess: 0 ', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(6) Short: 1 200 call, long: 2 250 call, collateral 0.2 eth => excess: 0 ', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          scaleNum(2),
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(7) Short: 1 250 call, long: 1 200 call => excess: 0 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(8) Short: 1 250 call, long: 3 200 call => excess: 0 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, scaleNum(3), 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(9) Short: 3 250 call, long: 1 200 call => need 2 weth ', async () => {
        const expectedOutput = createTokenAmount(2, wethDecimals)
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, scaleNum(3), amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedOutput.toString())
      })

      it('(10) Short: 1 200 call, long: 1 200 call, collateral 0.5 weth => revert: cant have long = short ', async () => {
        const collateralAmount = createTokenAmount(0.5, wethDecimals)
        const vault = createVault(
          eth200Call.address,
          eth200Call.address,
          weth.address,
          scaleNum(1),
          scaleNum(1),
          collateralAmount,
        )
        await expectRevert(
          calculator.getExcessCollateral(vault, 0),
          'MarginCalculator: long asset not marginable for short asset',
        )
      })

      it('(11) Short: 4 100 call, long: 1 300 call => need 3 weth ', async () => {
        const expectedAmount = createTokenAmount(3, wethDecimals)
        const vault = createVault(eth100Call.address, eth300Call.address, weth.address, scaleNum(4), amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedAmount.toString())
      })

      it('(12) Short: 2 200 call, long: 1 250 call => need 1 weth ', async () => {
        const expectedAmount = createTokenAmount(1, wethDecimals)
        const vault = createVault(eth200Call.address, eth250Call.address, weth.address, scaleNum(2), amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedAmount.toString())
      })

      it('(13) Short: 3 200 call, long: 1 250 call => need 2 weth ', async () => {
        const expectedAmount = createTokenAmount(2, wethDecimals)
        const vault = createVault(eth200Call.address, eth250Call.address, weth.address, scaleNum(3), amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedAmount.toString())
      })

      it('(14) Short: 3 250 call, long: 1 200 call => need 1 weth ', async () => {
        const expectedAmount = createTokenAmount(1, wethDecimals)
        const vault = createVault(eth100Call.address, eth200Call.address, weth.address, scaleNum(2), amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectedAmount)
      })
    })

    describe('Call vault (cETH collateral) check before expiry', () => {
      const amountOne = scaleNum(1)

      before('set oracle price for USDC and cUSDC', async () => {
        const ethPrice = scaleNum(500)
        const cethPrice = scaleNum(10)
        await oracle.setRealTimePrice(weth.address, ethPrice)
        await oracle.setRealTimePrice(ceth.address, cethPrice)
      })

      it('(1) Short: 1 300 call => 50 cETH collateral', async () => {
        const collateralNeeded = createTokenAmount(50, ctokenDecimals)
        const vault = createVault(eth300CallCETH.address, undefined, ceth.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), collateralNeeded)
      })
    })

    describe('Call vault check (with high decimal collateral token) before expiry', () => {
      const amountOne = scaleNum(1)

      let call: MockOtokenInstance

      before('create call with rETH', async () => {
        // create call with rETH as collateral + underlying
        call = await MockOtoken.new()
        await call.init(addressBook.address, reth.address, usdc.address, reth.address, scaleNum(300), expiry, false)
      })

      it('(1) Short: 1 300 call => need 1 rweth collateral ', async () => {
        const expectOutput = createTokenAmount(1, rtokenDecimals)
        const vault = createVault(call.address, undefined, reth.address, amountOne, undefined, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, false)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(2) Short: 1 300 call, collateral: 1 reth, => excess: 0 ', async () => {
        const collateralAmount = createTokenAmount(1, rtokenDecimals)
        const vault = createVault(call.address, undefined, reth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(3) Short: 1 200 call, collateral: 2 reth, => excess: 1 reth', async () => {
        const collateralAmount = createTokenAmount(2, rtokenDecimals)
        const expectedOutput = createTokenAmount(1, rtokenDecimals)
        const vault = createVault(call.address, undefined, reth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectedOutput)
      })
    })

    describe('Put vault check after expiry, ETH price = 150 USD (ITM)', () => {
      const amountOne = scaleNum(1)

      before(async () => {
        // let the optinos expire
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setIsFinalized(usdc.address, expiry, true)
        await oracle.setExpiryPrice(usdc.address, expiry, scaleNum(1))
        await oracle.setIsFinalized(weth.address, expiry, true)
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(150))
      })

      it('(1) Short: 1 250 put, collateral: 250 USDC => can take out 150 USD', async () => {
        const collateralAmount = createTokenAmount(250, usdcDecimals)
        const expectOutput = createTokenAmount(150, usdcDecimals)
        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(2) Short: 1 250 put, collateral: 300 USDC => can take out 200 USD', async () => {
        const collateralAmount = createTokenAmount(300, usdcDecimals)
        const expectOutput = createTokenAmount(200, usdcDecimals)

        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(3) Short: 1 250 put, long: 200 put, collateral: 50 USDC => excess: 0', async () => {
        const collateralAmount = createTokenAmount(50, usdcDecimals)
        const vault = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(4) Short: 1 200 put, long: 250 put => excess: 50 USDC', async () => {
        const expectOutput = createTokenAmount(50, usdcDecimals)
        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(5) Short: 1 200 put, long: 250 put, collateral: 50 USD => excess: 100 USDC', async () => {
        const collateralAmount = createTokenAmount(50, usdcDecimals)
        const expectOutput = createTokenAmount(100, usdcDecimals)

        const vault = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(6) Short: 1 200 put, long: 2 250 put => excess: 150 USDC', async () => {
        const expectOutput = createTokenAmount(150, usdcDecimals)

        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, scaleNum(2), '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(7) long: 1 200 put => excess 50 USDC, just like redeem', async () => {
        const vault = createVault(undefined, eth200Put.address, undefined, undefined, amountOne, undefined)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        const expectExcess = createTokenAmount(50, 6)

        // calculate the payout of exercising 1 ethPut
        const amountFromRedeem = await calculator.getExpiredPayoutRate(eth200Put.address)

        assert.equal(isExcess, true)
        assert.equal(amountFromRedeem.toString(), expectExcess)
        assert.equal(netValue.toString(), expectExcess)
      })
    })

    describe('Put vault check after expiry, ETH price = 300 USD (OTM)', () => {
      const amountOne = scaleNum(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(300))
      })

      it('(1) Short: 1 250 put, collateral: 250 USDC => can take out 250 USD', async () => {
        const collateralAmount = createTokenAmount(250, usdcDecimals)
        const expectOutput = createTokenAmount(250, usdcDecimals)

        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(2) Short: 1 250 put, collateral: 300 USDC => can take out 300 USD', async () => {
        const collateralAmount = createTokenAmount(300, usdcDecimals)
        const expectOutput = createTokenAmount(300, usdcDecimals)

        const vault = createVault(eth250Put.address, undefined, usdc.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(3) Short: 1 250 put, long: 200 put, collateral: 50 USDC => excess: 50', async () => {
        const collateralAmount = createTokenAmount(50, usdcDecimals)
        const expectOutput = createTokenAmount(50, usdcDecimals)

        const vault = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(4) Short: 1 200 put, long: 250 put => excess: 0 USDC', async () => {
        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(5) Short: 1 200 put, long: 250 put, collateral: 50 USD => excess: 50 USDC', async () => {
        const collateralAmount = createTokenAmount(50, usdcDecimals)
        const expectOutput = createTokenAmount(50, usdcDecimals)

        const vault = createVault(
          eth200Put.address,
          eth250Put.address,
          usdc.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(6) Short: 1 200 put, long: 2 250 put => excess: 0', async () => {
        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, scaleNum(2), '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(7) long: 1 200 put, excess 0 USDC', async () => {
        const vault = createVault(undefined, eth200Put.address, undefined, undefined, amountOne, undefined)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })
    })

    describe('Put vault check after expiry, ETH price = 210 USD', () => {
      const amountOne = scaleNum(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(210))
      })

      it('(1) Short: 1 200 put, long 1 250 put => excess 40', async () => {
        const expectOutput = createTokenAmount(40, usdcDecimals)

        const vault = createVault(eth200Put.address, eth250Put.address, usdc.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(2) Short: 1 250 put, long 1 200 put, collateral 50 USDC => excess 10', async () => {
        const collateralAmount = createTokenAmount(50, usdcDecimals)
        const expectOutput = createTokenAmount(10, usdcDecimals)

        const vault = createVault(
          eth250Put.address,
          eth200Put.address,
          usdc.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })
    })

    describe('Call vault check after expiry, ETH price = 150 (OTM)', () => {
      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(150))
      })

      const amountOne = scaleNum(1)
      it('(1) Short: 1 200 call, collateral: 1 weth, => excess: 1 ', async () => {
        const collateralAmount = createTokenAmount(1, wethDecimals)
        const expectOutput = createTokenAmount(1, wethDecimals)

        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
        // net = 1
      })

      it('(2) Short: 1 200 call, collateral: 2 weth, => excess: 2 ', async () => {
        const collateralAmount = createTokenAmount(2, wethDecimals)
        const expectOutput = createTokenAmount(2, wethDecimals)

        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(3) Short: 1 200 call, long: 1 250 call, collateral: 0.2 weth => excess: 0.2 ', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const expectOutput = createTokenAmount(0.2, wethDecimals)

        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(4) Short: 1 200 call, long: 2 250 call, collateral 0.2 eth => excess: 0.2 ', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const expectOutput = createTokenAmount(0.2, wethDecimals)

        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          scaleNum(2),
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })

      it('(5) Short: 1 250 call, long: 1 200 call => excess: 0 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })

      it('(6) Short: 1 250 call, long: 3 200 call => excess: 0 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, scaleNum(3), 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '0')
      })
    })

    describe('Call vault check after expiry, ETH price = 300 (ITM)', () => {
      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(300))
      })

      const amountOne = scaleNum(1)
      it('(1) Short: 1 200 call, collateral: 1 weth, => excess: 0.666 ', async () => {
        const collateralAmount = createTokenAmount(1, wethDecimals)

        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '666666666666666666')
      })

      it('(2) Short: 1 200 call, collateral: 2 weth, => excess: 1.666 ', async () => {
        const collateralAmount = createTokenAmount(2, wethDecimals)
        const vault = createVault(eth200Call.address, undefined, weth.address, amountOne, undefined, collateralAmount)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '1666666666666666666')
      })

      it('(3) Short: 1 200 call, long: 1 250 call, collateral: 0.2 weth => excess: 0.033 ', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '33333333333333333')
      })

      it('(4) Short: 1 200 call, long: 2 250 call, collateral 0.2 eth => excess: 0.2 ', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const expectedAmount = createTokenAmount(0.2, wethDecimals)
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          scaleNum(2),
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectedAmount)
      })

      it('(5) Short: 1 250 call, long: 1 200 call => excess: 0.1666 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '166666666666666666')
      })

      it('(6) Short: 1 250 call, long: 3 200 call => excess: 0.8333 ', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, scaleNum(3), 0)
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '833333333333333333')
      })
    })

    describe('Call vault check after expiry, ETH price = 210 USD', () => {
      const amountOne = scaleNum(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(210))
        await oracle.setIsFinalized(weth.address, expiry, true)
      })

      it('(1) Short: 1 250 call, long 1 200 call, collateral 0 USDC => excess 0.47 eth', async () => {
        const vault = createVault(eth250Call.address, eth200Call.address, weth.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '47619047619047619') // 0.47619047619047619
      })

      it('(2) Short: 1 200 call, long 1 250 call, collateral 0.2 weth => excess: 0.15 eth', async () => {
        const collateralAmount = createTokenAmount(0.2, wethDecimals)
        const vault = createVault(
          eth200Call.address,
          eth250Call.address,
          weth.address,
          amountOne,
          amountOne,
          collateralAmount,
        )
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), '152380952380952380') // 0.152380952380952380
      })
    })

    describe('Call vault check after expiry, ETH price = 250 USD', () => {
      const amountOne = scaleNum(1)

      before(async () => {
        if ((await time.latest()) < expiry) {
          await time.increaseTo(expiry + 2)
        }
        await oracle.setExpiryPrice(weth.address, expiry, scaleNum(250))
      })

      it('(1) Short: 1 200 call, long 1 100 call => excess 0.4 weth', async () => {
        const expectOutput = createTokenAmount(0.4, wethDecimals)

        const vault = createVault(eth200Call.address, eth100Call.address, weth.address, amountOne, amountOne, '0')
        const [netValue, isExcess] = await calculator.getExcessCollateral(vault, 0)
        assert.equal(isExcess, true)
        assert.equal(netValue.toString(), expectOutput)
      })
    })
  })
})
