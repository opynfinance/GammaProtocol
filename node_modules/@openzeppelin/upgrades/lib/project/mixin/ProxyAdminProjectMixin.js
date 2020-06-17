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
Object.defineProperty(exports, "__esModule", { value: true });
// A mixin that adds ProxyAdmin field and related ProxyAdminProject methods
// Intented to as a building block for Project class
// Can't extend contructor at that moment due to TypeScript limitations https://github.com/Microsoft/TypeScript/issues/14126
function ProxyAdminProjectMixin(Base) {
    return class extends Base {
        transferAdminOwnership(newAdminOwner) {
            return __awaiter(this, void 0, void 0, function* () {
                yield this.proxyAdmin.transferOwnership(newAdminOwner);
            });
        }
        changeProxyAdmin(proxyAddress, newAdmin) {
            return __awaiter(this, void 0, void 0, function* () {
                return this.proxyAdmin.changeProxyAdmin(proxyAddress, newAdmin);
            });
        }
    };
}
exports.default = ProxyAdminProjectMixin;
//# sourceMappingURL=ProxyAdminProjectMixin.js.map