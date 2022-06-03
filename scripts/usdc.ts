import {ethers} from "hardhat";

import { BigNumber, BigNumberish, utils } from "ethers"
import {MockERC20} from "../types/MockERC20"


const usdc = "0x3C6c9B6b41B9E0d82FeD45d9502edFFD5eD3D737"
async function main() {
    
    const [deployer] = await ethers.getSigners();
    console.log("deployer: " + await deployer.getAddress())
    const usdcContract = await ethers.getContractAt("MockERC20", usdc) as MockERC20
    await usdcContract.mint(await deployer.getAddress(), BigNumber.from("100000000000000000000000000"))
	await usdcContract.mint("0xAD5B468F6Fb897461E388396877fD5E3c5114539", BigNumber.from("1000000000000000"))
    await usdcContract.mint("0xF8F8E45A1f470E92D2B714EBf58b266AabBeD45D", BigNumber.from("1000000000000000"))
    console.log("execution complete")
}
main()
    .then(() => process.exit())
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

