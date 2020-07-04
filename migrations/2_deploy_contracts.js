const MathTester = artifacts.require('MathTester.sol')
const OToken = artifacts.require('Otoken.sol')
const OTokenFactory = artifacts.require('OtokenFactory.sol')

module.exports = function(deployer) {
  deployer.then(async () => {
    await deployer.deploy(MathTester)
    const oTokenLogic = await deployer.deploy(OToken)
    await deployer.deploy(OTokenFactory, oTokenLogic.address)
  })
}
