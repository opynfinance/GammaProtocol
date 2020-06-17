import { SetAdminParams } from './interfaces';
export default function setAdmin({ newAdmin, packageName, contractAlias, proxyAddress, network, txParams, networkFile, }: SetAdminParams): Promise<void | never>;
