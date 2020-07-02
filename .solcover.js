module.exports = {
    port: 8555,
    testrpcOptions: '-p 8555 -l 0xfffffffffff --allowUnlimitedContractSize',
    buildDirPath: '/build',
    dir: '.',
    providerOptions: {
      "gasLimit": 0xfffffffffff,
      "callGasLimit": 0xfffffffffff,
      "allowUnlimitedContractSize": true
    },
    silent: false,
    copyPackages: ['openzeppelin'],
    skipFiles: [
      'Migrations.sol',
    ]
};
