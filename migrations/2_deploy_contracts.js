const MathTester = artifacts.require('MathTester.sol')

module.exports = function(deployer) {
  deployer.then(async () => {
    await deployer.deploy(MathTester)
  })
}
