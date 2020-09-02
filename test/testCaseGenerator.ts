// Parameters for the Testing generator
const maxStrikePrice = 5000
const maxStrikeWidth = 5000
const minStrikePrice = 0

const maxAmount = 5000
const maxAmountDifference = 5000
const minAmount = 0

const maxCollateral = 10000
const minCollateral = 0

const minSpot = 0
const maxSpot = 1000000000000

/** Rules */

enum strikePriceRule {
  longLessThanShort,
  shortLessThanLong,
  shortEqualLong,
}

enum amountRule {
  longLessThanShort,
  shortLessThanLong,
  shortEqualLong,
  shortNoLong,
  longNoShort,
}

enum collateralRules {
  insufficient,
  exact,
  excess,
}

enum spotPriceRules {
  spotHighest,
  spotEqualToHigherStrike,
  spotInBetweenStrikes,
  spotEqualToLowerStrike,
  spotLowest,
}

/** helper interfaces */

interface StrikePrices {
  longStrike: number
  shortStrike: number
}

interface Amounts {
  longAmount: number
  shortAmount: number
}

export interface Test {
  shortAmount: number
  longAmount: number
  shortStrike: number
  longStrike: number
  collateral: number
  netValue: number
  isExcess: boolean
  oraclePrice: number
}

export interface Tests {
  beforeExpiryPuts: Test[]
  afterExpiryPuts: Test[]
}

function getRandomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max))
}

function strikePriceGenerator(rule: strikePriceRule): StrikePrices {
  let longStrike = 0
  const shortStrike = getRandomInt(maxStrikePrice)
  const strikeWidth = getRandomInt(maxStrikeWidth)

  if (rule == strikePriceRule.longLessThanShort) {
    longStrike = Math.max(shortStrike - strikeWidth, minStrikePrice)
  } else if (rule == strikePriceRule.shortLessThanLong) {
    longStrike = Math.min(shortStrike + strikeWidth, maxStrikePrice)
  } else {
    longStrike = shortStrike
  }

  return {
    longStrike,
    shortStrike,
  }
}

function amountGenerator(rule: amountRule): Amounts {
  let longAmount = 0
  let shortAmount = getRandomInt(maxStrikePrice)
  const strikeWidth = getRandomInt(maxStrikeWidth)

  if (rule == amountRule.longLessThanShort) {
    longAmount = Math.max(shortAmount - strikeWidth, minAmount)
  } else if (rule == amountRule.shortLessThanLong) {
    longAmount = Math.min(shortAmount + strikeWidth, maxAmount)
  } else if (rule == amountRule.shortNoLong) {
    longAmount = 0
  } else if (rule == amountRule.longNoShort) {
    longAmount = shortAmount
    shortAmount = 0
  } else {
    longAmount = shortAmount
  }

  return {
    longAmount,
    shortAmount,
  }
}

function putMarginRequiredBeforeExpiry(strikePrices: StrikePrices, amounts: Amounts): number {
  const netValue =
    strikePrices.shortStrike * amounts.shortAmount -
    strikePrices.longStrike * Math.min(amounts.shortAmount, amounts.longAmount)
  return Math.max(0, netValue)
}

function callMarginRequiredBeforeExpiry(strikePrices: StrikePrices, amounts: Amounts): number {
  const netValue =
    strikePrices.shortStrike * amounts.shortAmount -
    strikePrices.longStrike * Math.min(amounts.shortAmount, amounts.longAmount)
  return Math.max(0, netValue)
}

function putMarginRequiredAfterExpiry(spotPrice: number, strikePrices: StrikePrices, amounts: Amounts): number {
  const longCashValue = Math.max(0, strikePrices.longStrike - spotPrice) * amounts.longAmount
  const shortCashValue = Math.max(0, strikePrices.shortStrike - spotPrice) * amounts.shortAmount

  return shortCashValue - longCashValue
}

function putAfterExpiryTestCreator(
  rule: spotPriceRules,
  strikePrices: StrikePrices,
  amounts: Amounts,
  collateral: number,
): Test {
  let cashValue

  const highStrike = Math.max(strikePrices.shortStrike, strikePrices.longStrike)
  const lowStrike = Math.min(strikePrices.shortStrike, strikePrices.longStrike)
  let spotPrice = 0

  if (rule == spotPriceRules.spotHighest) {
    spotPrice = Math.min(getRandomInt(maxSpot) + highStrike, maxSpot)
  } else if (rule == spotPriceRules.spotEqualToHigherStrike) {
    spotPrice = highStrike
  } else if (rule == spotPriceRules.spotInBetweenStrikes) {
    const spotPriceDifference = highStrike - lowStrike
    spotPrice = getRandomInt(spotPriceDifference) + lowStrike
  } else if (rule == spotPriceRules.spotEqualToLowerStrike) {
    spotPrice = lowStrike
  } else if (rule == spotPriceRules.spotLowest) {
    spotPrice = Math.max(getRandomInt(lowStrike), minSpot)
  }

  const netValue = collateral - putMarginRequiredAfterExpiry(spotPrice, strikePrices, amounts)

  return {
    shortAmount: amounts.shortAmount,
    longAmount: amounts.longAmount,
    shortStrike: strikePrices.shortStrike,
    longStrike: strikePrices.longStrike,
    collateral: collateral,
    netValue: netValue,
    isExcess: true,
    oraclePrice: spotPrice,
  }
}

function putBeforExpiryTestCreator(rule: collateralRules, strikePrices: StrikePrices, amounts: Amounts): Test {
  const marginRequired = putMarginRequiredBeforeExpiry(strikePrices, amounts)
  let collateral = marginRequired

  if (rule == collateralRules.insufficient) {
    const amountToRemove = getRandomInt(collateral)
    collateral = Math.max(minCollateral, collateral - amountToRemove)
  } else if (rule == collateralRules.excess) {
    const excess = getRandomInt(maxCollateral)
    collateral = Math.min(maxCollateral, collateral + excess)
  }

  const netValue = collateral - marginRequired
  const isExcess = netValue >= 0

  return {
    shortAmount: amounts.shortAmount,
    longAmount: amounts.longAmount,
    shortStrike: strikePrices.shortStrike,
    longStrike: strikePrices.longStrike,
    collateral: collateral,
    netValue: Math.abs(netValue),
    isExcess: isExcess,
    oraclePrice: 0,
  }
}

export function testCaseGenerator(): Tests {
  const testsBeforeExpiry: Test[] = []
  const testsAfterExpiry: Test[] = []
  for (let i = 0; i < Object.keys(strikePriceRule).length / 2; i++) {
    for (let j = 0; j < Object.keys(amountRule).length / 2; j++) {
      for (let k = 0; k < Object.keys(collateralRules).length / 2; k++) {
        const testStrikes = strikePriceGenerator(i)
        const testAmounts = amountGenerator(j)
        let test = putBeforExpiryTestCreator(k, testStrikes, testAmounts)
        testsBeforeExpiry.push(test)
        if (collateralRules.exact == k) {
          for (let l = 0; l < Object.keys(spotPriceRules).length / 2; l++) {
            test = putAfterExpiryTestCreator(l, testStrikes, testAmounts, test.collateral)
            testsAfterExpiry.push(test)
          }
        }
      }
    }
  }

  return {
    beforeExpiryPuts: testsBeforeExpiry,
    afterExpiryPuts: testsAfterExpiry,
  }
}
