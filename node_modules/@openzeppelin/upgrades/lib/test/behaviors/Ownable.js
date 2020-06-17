"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const assertRevert_1 = __importDefault(require("../helpers/assertRevert"));
function shouldBehaveLikeOwnable(owner, anotherAccount) {
    describe('owner', function () {
        it('sets the creator as the owner of the contract', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const contractOwner = yield this.ownable.methods.owner().call();
                assert_1.default.equal(contractOwner, owner);
            });
        });
    });
    describe('transferOwnership', function () {
        describe('when the proposed owner is not the zero address', function () {
            const newOwner = anotherAccount;
            describe('when the sender is the owner', function () {
                const from = owner;
                it('transfers the ownership', function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield this.ownable.methods.transferOwnership(newOwner).send({ from });
                        const contractOwner = yield this.ownable.methods.owner().call();
                        assert_1.default.equal(contractOwner, anotherAccount);
                    });
                });
                it('emits an event', function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        const { events } = yield this.ownable.methods.transferOwnership(newOwner).send({ from });
                        const event = events['OwnershipTransferred'];
                        assert_1.default.equal(event.returnValues.previousOwner, owner);
                        assert_1.default.equal(event.returnValues.newOwner, newOwner);
                    });
                });
            });
            describe('when the sender is not the owner', function () {
                const from = anotherAccount;
                it('reverts', function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        yield assertRevert_1.default(this.ownable.methods.transferOwnership(newOwner).send({ from }));
                    });
                });
            });
        });
        describe('when the new proposed owner is the zero address', function () {
            const newOwner = '0x0000000000000000000000000000000000000000';
            it('reverts', function () {
                return __awaiter(this, void 0, void 0, function* () {
                    yield assertRevert_1.default(this.ownable.methods.transferOwnership(newOwner).send({ from: owner }));
                });
            });
        });
    });
}
exports.default = shouldBehaveLikeOwnable;
//# sourceMappingURL=Ownable.js.map