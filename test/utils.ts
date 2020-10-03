import {MockERC20Instance} from '../build/types/truffle-types'

import BigNumber from 'bignumber.js'

export type vault = {
  shortAmounts: (BigNumber | string | number)[]
  longAmounts: (BigNumber | string | number)[]
  collateralAmounts: (BigNumber | string | number)[]
  shortOtokens: string[]
  longOtokens: string[]
  collateralAssets: string[]
}

/**
 * Return a valid expiry timestamp that's today + # days, 0800 UTC.
 * @param now
 * @param days
 */
export const createValidExpiry = (now: number, days: number) => {
  const multiplier = (now - 28800) / 86400
  return (Number(multiplier.toFixed(0)) + 1) * 86400 + days * 86400 + 28800
}

/**
 * Create a vault for testing
 * @param shortOtoken
 * @param longOtoken
 * @param collateralAsset
 * @param shortAmount
 * @param longAmount
 * @param collateralAmount
 */
export const createVault = (
  shortOtoken: string | undefined,
  longOtoken: string | undefined,
  collateralAsset: string | undefined,
  shortAmount: string | BigNumber | number | undefined,
  longAmount: string | BigNumber | number | undefined,
  collateralAmount: string | BigNumber | number | undefined,
): vault => {
  return {
    shortOtokens: shortOtoken ? [shortOtoken] : [],
    longOtokens: longOtoken ? [longOtoken] : [],
    collateralAssets: collateralAsset ? [collateralAsset] : [],
    shortAmounts: shortAmount !== undefined ? [shortAmount] : [],
    longAmounts: longAmount !== undefined ? [longAmount] : [],
    collateralAmounts: collateralAmount !== undefined ? [collateralAmount] : [],
  }
}

BigNumber.config({EXPONENTIAL_AT: 60})

export const createTokenAmount = (num: number | BigNumber, decimals = 8) => {
  const amount = new BigNumber(num).times(new BigNumber(10).pow(decimals))
  return amount.integerValue().toString()
}

/**
 * Create a number string that scales numbers to 1e18
 * @param num
 */
export const createScaledNumber = (num: number): string => {
  return new BigNumber(num).times(1e8).toString()
}

export const underlyingPriceToCtokenPrice = async (
  underlyingPrice: BigNumber,
  exchangeRate: BigNumber,
  underlying: MockERC20Instance,
) => {
  const underlyingDecimals = new BigNumber(await underlying.decimals())
  const cTokenDecimals = new BigNumber(8)
  return exchangeRate
    .times(underlyingPrice)
    .times(new BigNumber(10).exponentiatedBy(cTokenDecimals))
    .div(new BigNumber(10).exponentiatedBy(underlyingDecimals.plus(new BigNumber(18))))
    .integerValue(BigNumber.ROUND_DOWN)
}

/**
 * @param {number} num number to scale
 * @param {number} fromDecimal the decimals the original number has
 * @param {number} toDecimal the decimals the target number has
 * @return {BigNumber}
 */
export const changeAmountScaled = (num: number | string, fromDecimal: number, toDecimal: number) => {
  const numBN = new BigNumber(num)
  if (toDecimal === fromDecimal) {
    return numBN
  } else if (toDecimal >= fromDecimal) {
    return numBN.times(new BigNumber(10).pow(toDecimal - fromDecimal))
  } else {
    return numBN.div(new BigNumber(10).pow(fromDecimal - toDecimal)).integerValue()
  }
}
