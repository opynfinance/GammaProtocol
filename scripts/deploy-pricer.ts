import {ethers} from "hardhat";
import {
    createScaledNumber as scaleNum,
  } from '../test/utils'
import { BigNumber, BigNumberish, utils } from "ethers"
import {Oracle} from "../types/Oracle"

const lockingPeriod = 60 * 10
const disputePeriod = 60 * 20
const chainlinkOracle = "0x5f0423B1a6935dc5596e7A24d98532b67A0AeFd8"
const bot = "0x282f13b62b4341801210657e3aa4ee1df69f4083"
const weth = "0xE32513090f05ED2eE5F3c5819C9Cce6d020Fefe7"

async function main() {
    
    const [deployer] = await ethers.getSigners();
    console.log("deployer: " + await deployer.getAddress())
    const oracle = await ethers.getContractAt("Oracle", "0xe4d64aed5e76bCcE2C255f3c819f4C3817D42f19") as Oracle
    // deploy pricer
    const pricer = await(await ethers.getContractFactory("ChainLinkPricer")).deploy(bot, weth, chainlinkOracle, oracle.address)
    console.log("pricer: " + pricer.address)
    await oracle.setAssetPricer(weth, pricer.address)
    await oracle.setLockingPeriod(pricer.address, lockingPeriod)
    await oracle.setDisputePeriod(pricer.address, disputePeriod)

	console.log("execution complete")
}
main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

