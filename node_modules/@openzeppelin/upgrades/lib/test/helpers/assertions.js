"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Addresses_1 = require("../../utils/Addresses");
const Semver_1 = require("../../utils/Semver");
function assertions(chai, utils) {
    const Assertion = chai.Assertion;
    Assertion.addProperty('nonzeroAddress', function () {
        this.assert(this._obj && this._obj.length === 42 && this._obj.startsWith('0x') && this._obj !== Addresses_1.ZERO_ADDRESS, 'expected #{this} to be a non-zero address', 'expected #{this} to not be a non-zero address');
    });
    Assertion.addProperty('zeroAddress', function () {
        this.assert(this._obj && this._obj.length === 42 && this._obj.startsWith('0x') && this._obj === Addresses_1.ZERO_ADDRESS, 'expected #{this} to be a zero address', 'expected #{this} to not be a zero address');
    });
    Assertion.addMethod('semverEqual', function (expected) {
        this.assert(Semver_1.semanticVersionEqual(this._obj, expected), 'expected #{this} to equal #{exp} but got #{act}', 'expected #{this} to not equal #{exp} but got #{act}', Semver_1.toSemanticVersion(expected).join('.'), Semver_1.toSemanticVersion(this._obj).join('.'));
    });
}
exports.default = assertions;
//# sourceMappingURL=assertions.js.map