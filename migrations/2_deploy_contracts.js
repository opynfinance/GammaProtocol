const MathTester = artifacts.require('MathTester.sol');
// const SafeUnsignedFloatMath = artifacts.require('SafeUnsignedFloatMath.sol')

module.exports = function (deployer) {
    deployer.then( async () => {
        // await deployer.deploy(SafeUnsignedFloatMath);
        // await deployer.link(SafeUnsignedFloatMath, MathTester);

        await deployer.deploy(MathTester);
    })
}; 