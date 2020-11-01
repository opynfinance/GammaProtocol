// mainnet fork
import BigNumber from 'bignumber.js'
import {
  Trade0xInstance,
  // IZeroXExchangeInstance,
  MockERC20Instance,
  WETH9Instance,
} from '../../build/types/truffle-types'

const TradeCallee = artifacts.require('Trade0x')
const ERC20 = artifacts.require('MockERC20')
// const Exchange = artifacts.require('IZeroXExchange')
const WETH = artifacts.require('WETH9')
//

const user = '0x108A62856C9d3d8EC98a491Dc7b507bB7d4618cf'

const EXCHANGE_ADDR = '0x61935cbdd02287b511119ddb11aeb42f1593b7ef'
const ERC20PROXY_ADDR = '0x95e6f48254609a6ee006f7d493c8e5fb97094cef'
const STAKING_ADDR = '0xa26e80e7Dea86279c6d778D702Cc413E6CFfA777'
const ZERO_ADDR = '0x0000000000000000000000000000000000000000'

const USDCAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const CTokenAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
const WETHAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'

// the maker's address
const maker = '0xa163e3e565d67c71778060f9dc907cf92d13ce4a'

const order2 = {
  expirationTimeSeconds: '1764547200',
  feeRecipientAddress: '0x1000000000000000000000000000000000000011',
  makerAddress: maker,
  makerAssetAmount: '100000000',
  makerAssetData: '0xf47261b000000000000000000000000039aa39c021dfbae8fac545936693ac917d5e7563',
  makerFee: '0',
  makerFeeAssetData: '0x',
  salt: '24930773035730352667',
  senderAddress: '0x0000000000000000000000000000000000000000',
  takerAddress: '0x0000000000000000000000000000000000000000',
  takerAssetAmount: '1000000',
  takerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  takerFee: '0',
  takerFeeAssetData: '0x',
}

const signature =
  '0x1c698be1f76b87c5a7f8aed7836374fdacca342416862f8c393565037fa506a43e0b71f8b8f45b359bb534ef7074cc24bdb863a633751fefeadb5c22e24425ba6802'

const fillAmount = '1000000'

contract('Callee contract test', async ([deployer, controller]) => {
  let callee: Trade0xInstance
  // let exchange: IZeroXExchangeInstance
  let usdc: MockERC20Instance
  let weth: WETH9Instance
  let cToken: MockERC20Instance

  before('setup transfer account asset', async () => {
    // setup contracts
    // exchange = await Exchange.at(EXCHANGE_ADDR)
    callee = await TradeCallee.new(EXCHANGE_ADDR, ERC20PROXY_ADDR, WETHAddress, STAKING_ADDR, {from: deployer})

    // fund callee contract with some WETH.
    weth = await WETH.at(WETHAddress)
    const fundAmount = web3.utils.toWei('5', 'ether')
    await weth.deposit({value: fundAmount, from: deployer})
    await weth.transfer(callee.address, fundAmount, {from: deployer})
    const wethBalanceInCallee = await weth.balanceOf(callee.address)
    assert.equal(wethBalanceInCallee.toString(), fundAmount)

    // check the weth allowance is set correctly
    const allowance = await weth.allowance(callee.address, STAKING_ADDR)
    assert.equal(allowance.toString(), '115792089237316195423570985008687907853269984665640564039457584007913129639935')

    const proxy = await callee.assetProxy()
    assert.equal(proxy.toLowerCase(), ERC20PROXY_ADDR.toLowerCase())

    usdc = await ERC20.at(USDCAddress)

    // user need to approve callee function
    await usdc.approve(callee.address, fillAmount, {from: user})

    cToken = await ERC20.at(CTokenAddress)

    const makerAllowance = await cToken.allowance(maker, ERC20PROXY_ADDR)
    assert.isTrue(makerAllowance.gte('100000000'))
  })

  it("call the callee address with user's address as sender ", async () => {
    const data = web3.eth.abi.encodeParameters(
      [
        {
          Order: {
            makerAddress: 'address',
            takerAddress: 'address',
            feeRecipientAddress: 'address',
            senderAddress: 'address',

            makerAssetAmount: 'uint256',
            takerAssetAmount: 'uint256',
            makerFee: 'uint256',
            takerFee: 'uint256',
            expirationTimeSeconds: 'uint256',
            salt: 'uint256',

            makerAssetData: 'bytes',
            takerAssetData: 'bytes',
            makerFeeAssetData: 'bytes',
            takerFeeAssetData: 'bytes',
          },
        },
        'uint256',
        'bytes',
      ],
      [order2, fillAmount, signature],
    )

    const usdcBalanceBefore = new BigNumber(await usdc.balanceOf(user))
    const cTokenBalanceBefore = new BigNumber(await cToken.balanceOf(user))

    // pay protocol fee in ETH.
    // const gasPriceGWei = '50'
    // const gasPriceWei = web3.utils.toWei(gasPriceGWei, 'gwei')
    // const value = web3.utils.toWei(new BigNumber(gasPriceGWei).times(0.00015).toString(), 'ether')

    await callee.callFunction(user, ZERO_ADDR, 0, data, {
      from: controller,
      // gasPrice: gasPriceWei,
    })

    const usdcBalanceAfter = new BigNumber(await usdc.balanceOf(user))
    assert.equal(usdcBalanceBefore.minus(usdcBalanceAfter).toString(), fillAmount)

    const cTokenBalanceAfter = new BigNumber(await cToken.balanceOf(user))
    assert.equal(cTokenBalanceAfter.minus(cTokenBalanceBefore).toString(), '100000000')
  })
})
