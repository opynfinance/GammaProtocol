import NetworkFile from '../models/files/NetworkFile';
import { ProxyAdminProject, AppProject, TxParams } from '@openzeppelin/upgrades';
/**
 * Initializes a zOS application testing and deploying it to the test network,
 * along with dependencies (if specified)
 * @param txParams optional txParams (from, gas, gasPrice) to use on every transaction
 * @param networkFile optional `NetworkFile` object to use, instead of zos.test.json
 */
export default function (txParams?: TxParams, networkFile?: NetworkFile): Promise<ProxyAdminProject | AppProject>;
