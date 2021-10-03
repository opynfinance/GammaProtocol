const Migrations = artifacts.require('Migrations')

module.exports = function(deployer, network, accounts) {
  const account = accounts[0]
  deployer.deploy(Migrations, {from: account})
}
