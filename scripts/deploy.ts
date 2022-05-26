
import {ethers} from "hardhat";
import {
    createScaledNumber as scaleNum,
  } from '../test/utils'
import { BigNumber, BigNumberish, utils } from "ethers"
import {AddressBook} from "../types/AddressBook"
import {Whitelist} from "../types/Whitelist"
import {Oracle} from "../types/Oracle"
import {MarginCalculator} from "../types/MarginCalculator"
import {Controller} from "../types/Controller"

// deployer: 0x775d1377223c9338771CbF955A9a53147219ea4A
// weth: 0xE32513090f05ED2eE5F3c5819C9Cce6d020Fefe7
// usdc: 0x3C6c9B6b41B9E0d82FeD45d9502edFFD5eD3D737
// addressbook: 0x2d3E178FFd961BD8C0b035C926F9f2363a436DdC
// otokenFactory: 0xcBcC61d56bb2cD6076E2268Ea788F51309FA253B
// otoken: 0x07F00EB70837091b2D23c902561CE8D1b4df4702
// whitelist: 0x0cc0b0C984036e0942544F70A5708Ab16463cd31
// oracle: 0xe4d64aed5e76bCcE2C255f3c819f4C3817D42f19
// pool: 0xDD91EB7C3822552D89a5Cb8D4166B1EB19A36Ff2
// calculator: 0xa91B46bDDB891fED2cEE626FB03E2929702951A6
// vault: 0x15887BD136Cdc8F170B8564e2E4568ee19C035F7
// controller: 0xb2923CAbbC7dd78e9573D1D6d755E75dCB49CE47

const chainlinkOracle = "0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8"
const productSpotShockValue = scaleNum(0.5, 27)
// array of time to expiry
const day = 60 * 60 * 24
const timeToExpiry = [day * 7, day * 14, day * 28, day * 42, day * 56, day * 84]
// array of upper bound value correspond to time to expiry
const expiryToValue = [
	scaleNum(0.1678, 27),
	scaleNum(0.237, 27),
	scaleNum(0.3326, 27),
	scaleNum(0.4032, 27),
	scaleNum(0.4603, 27),
	scaleNum(0.5, 27)
]

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("deployer: " + await deployer.getAddress())
	const addressbook = await ethers.getContractAt("AddressBook", "0x2d3E178FFd961BD8C0b035C926F9f2363a436DdC") as AddressBook
	const usdc = await ethers.getContractAt("MockERC20", "0x3C6c9B6b41B9E0d82FeD45d9502edFFD5eD3D737")
	const weth = await ethers.getContractAt("MockERC20", "0xE32513090f05ED2eE5F3c5819C9Cce6d020Fefe7")
	const whitelist = await ethers.getContractAt("Whitelist", "0x0cc0b0C984036e0942544F70A5708Ab16463cd31") as Whitelist
	const oracle = await ethers.getContractAt("Oracle", "0xe4d64aed5e76bCcE2C255f3c819f4C3817D42f19") as Oracle
	const calculator = await ethers.getContractAt("MarginCalculator", "0xa91B46bDDB891fED2cEE626FB03E2929702951A6") as MarginCalculator
	const vault = await ethers.getContractAt("MarginVault", "0x15887BD136Cdc8F170B8564e2E4568ee19C035F7")
	const controller = await ethers.getContractAt("Controller", "0xb2923CAbbC7dd78e9573D1D6d755E75dCB49CE47") as Controller
    // // deploy weth
    // const weth = await (await ethers.getContractFactory("MockERC20")).deploy("WETH", "WETH", 18)
    // console.log("weth: " + weth.address)

    // // deploy usdc
    // const usdc = await (await ethers.getContractFactory("MockERC20")).deploy("USDC", "USDC", 6)
    // console.log("usdc: " + usdc.address)

    // // deploy AddressBook & transfer ownership
    // const addressbook = await (await ethers.getContractFactory("AddressBook")).deploy()
    // console.log("addressbook: " + addressbook.address)

    // // deploy OtokenFactory & set address
    // const otokenFactory = await(await ethers.getContractFactory("OtokenFactory")).deploy(addressbook.address)
    // await addressbook.setOtokenFactory(otokenFactory.address)
    // console.log("otokenFactory: " + otokenFactory.address)

    // // deploy Otoken implementation & set address
    // const otoken = await (await ethers.getContractFactory("Otoken")).deploy()
    // await addressbook.setOtokenImpl(otoken.address)
    // console.log("otoken: " + otoken.address)

    // // deploy Whitelist module & set address
    // const whitelist = await (await ethers.getContractFactory("Whitelist")).deploy(addressbook.address)
    // await addressbook.setWhitelist(whitelist.address)
    // console.log("whitelist: " + whitelist.address)

    // // deploy Oracle module & set address
    // const oracle = await (await ethers.getContractFactory("Oracle")).deploy()
    // await addressbook.setOracle(oracle.address)
    // console.log("oracle: " + oracle.address)

    // // deploy MarginPool module & set address
    // const pool = await (await ethers.getContractFactory("MarginPool")).deploy(addressbook.address)
    // await addressbook.setMarginPool(pool.address)
    // console.log("pool: " + pool.address)

    // deploy Calculator module & set address
    // const calculator = await (await ethers.getContractFactory("MarginCalculator")).deploy(oracle.address, addressbook.address)
    await addressbook.setMarginCalculator(calculator.address)
    // console.log("calculator: " + calculator.address)

    // deploy Controller & set address
    // deploy MarginVault library
    // const vault = await (await ethers.getContractFactory("MarginVault")).deploy()
    // const controller = await (await ethers.getContractFactory("Controller", {libraries:{MarginVault: vault.address}})).deploy()
    await addressbook.setController(controller.address)
    console.log("controller: " + controller.address)
    await controller.initialize(addressbook.address, await deployer.getAddress())
	await controller.setNakedCap(weth.address, utils.parseEther('1000000'))
	await controller.setNakedCap(usdc.address, utils.parseEther('1000000'))
    await controller.refreshConfiguration()
    
    // whitelist stuff

    await whitelist.whitelistCollateral(weth.address)
	await whitelist.whitelistCollateral(usdc.address)

    // whitelist products
	// normal calls
	await whitelist.whitelistProduct(
		weth.address,
		usdc.address,
		weth.address,
		false
	)
	// normal puts
	await whitelist.whitelistProduct(
		weth.address,
		usdc.address,
		usdc.address,
		true
	)
	// usd collateralised calls
	await whitelist.whitelistProduct(
		weth.address,
		usdc.address,
		usdc.address,
		false
	)
	// eth collateralised puts
	await whitelist.whitelistProduct(
		weth.address,
		usdc.address,
		weth.address,
		true
	)
	// whitelist vault type 0 collateral
	await whitelist.whitelistCoveredCollateral(weth.address, weth.address, false)
	await whitelist.whitelistCoveredCollateral(usdc.address, weth.address, true)
	// whitelist vault type 1 collateral
	await whitelist.whitelistNakedCollateral(usdc.address, weth.address, false)
	await whitelist.whitelistNakedCollateral(weth.address, weth.address, true)

    // set product spot shock values
	// usd collateralised calls
	await calculator.setSpotShock(
		weth.address,
		usdc.address,
		usdc.address,
		false,
		productSpotShockValue
	)
	// usd collateralised puts
	await calculator.setSpotShock(
		weth.address,
		usdc.address,
		usdc.address,
		true,
		productSpotShockValue
	)
	// eth collateralised calls
	await calculator.setSpotShock(
		weth.address,
		usdc.address,
		weth.address,
		false,
		productSpotShockValue
	)
	// set expiry to value values
	// usd collateralised calls
	await calculator.setUpperBoundValues(
		weth.address,
		usdc.address,
		usdc.address,
		false,
		timeToExpiry,
		expiryToValue
	)
	// usd collateralised puts
	await calculator.setUpperBoundValues(
		weth.address,
		usdc.address,
		usdc.address,
		true,
		timeToExpiry,
		expiryToValue
	)
	// eth collateralised calls
	await calculator.setUpperBoundValues(
		weth.address,
		usdc.address,
		weth.address,
		false,
		timeToExpiry,
		expiryToValue
	)

	await oracle.setStablePrice(usdc.address, "100000000")
	console.log("execution complete")
}
main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });