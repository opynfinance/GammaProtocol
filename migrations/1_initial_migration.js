const Migrations = artifacts.require('Migrations')

module.exports = function(deployer, network, accounts) {
  const account = accounts[0]
  console.log(`deploying with account ${account}`)
  deployer.deploy(Migrations)
}
