// Parameters for the Testing generator
const maxStrikePrice = 5000
const maxStrikeWidth = 5000
const minStrikePrice = 0

const maxAmount = 5000
const maxAmountDifference = 5000
const minAmount = 0

const maxCollateral = 10000
const minCollateral = 0

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
}

enum collateralRules {
  insufficient,
  exact,
  excess,
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
  const shortAmount = getRandomInt(maxStrikePrice)
  const strikeWidth = getRandomInt(maxStrikeWidth)

  if (rule == amountRule.longLessThanShort) {
    longAmount = Math.max(shortAmount - strikeWidth, minAmount)
  } else if (rule == amountRule.shortLessThanLong) {
    longAmount = Math.min(shortAmount + strikeWidth, maxAmount)
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

function putTestCreator(rule: collateralRules, strikePrices: StrikePrices, amounts: Amounts): Test {
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
  }
}

export function testCaseGenerator(): Test[] {
  const tests: Test[] = []
  for (let i = 0; i < Object.keys(strikePriceRule).length / 2; i++) {
    for (let j = 0; j < Object.keys(amountRule).length / 2; j++) {
      for (let k = 0; k < Object.keys(collateralRules).length / 2; k++) {
        const testStrikes = strikePriceGenerator(i)
        const testAmounts = amountGenerator(j)
        const test = putTestCreator(k, testStrikes, testAmounts)
        tests.push(test)
      }
    }
  }

  return tests
}
