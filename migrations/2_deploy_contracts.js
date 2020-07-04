const MathTester = artifacts.require('MathTester.sol')
const OToken = artifacts.require('OToken.sol')
const OTokenFactory = artifacts.require('OTokenFactory.sol')

module.exports = function(deployer) {
  deployer.then(async () => {
    await deployer.deploy(MathTester)
    const oTokenLogic = await deployer.deploy(OToken)
    await deployer.deploy(OTokenFactory, oTokenLogic.address)
  })
}
