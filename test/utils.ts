import BigNumber from 'bignumber.js'

import {MockOracleInstance} from '../build/types/truffle-types'

export type vault = {
  shortAmounts: (BigNumber | string | number)[]
  longAmounts: (BigNumber | string | number)[]
  collateralAmounts: (BigNumber | string | number)[]
  shortOtokens: string[]
  longOtokens: string[]
  collateralAssets: string[]
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

BigNumber.config({EXPONENTIAL_AT: 30})

export const createTokenAmount = (num: number, decimals = 18) => {
  return new BigNumber(num).times(new BigNumber(10).pow(decimals)).toString()
}

/**
 * Create a number string that scales numbers to 1e18
 * @param num
 */
export const createScaledNumber = (num: number): string => {
  return new BigNumber(num).times(1e18).toString()
}
