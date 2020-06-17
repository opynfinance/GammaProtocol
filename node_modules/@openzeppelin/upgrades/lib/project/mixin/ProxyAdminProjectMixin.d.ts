import Constructable from '../../utils/Mixin';
import ProxyAdmin from '../../proxy/ProxyAdmin';
declare function ProxyAdminProjectMixin<T extends Constructable>(Base: T): {
    new (...args: any[]): {
        proxyAdmin: ProxyAdmin;
        transferAdminOwnership(newAdminOwner: string): Promise<void>;
        changeProxyAdmin(proxyAddress: string, newAdmin: string): Promise<void>;
    };
} & T;
export default ProxyAdminProjectMixin;
