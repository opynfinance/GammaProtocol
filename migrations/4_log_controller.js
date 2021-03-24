// import library

const AddressBook = artifacts.require('AddressBook')

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = async function(deployer, network, accounts) {
  const [deployerAddress] = accounts

  const addressbook = await AddressBook.deployed()

  const controllerProxy = await addressbook.getController()
  console.log(`controllerProxy`, controllerProxy)
}
