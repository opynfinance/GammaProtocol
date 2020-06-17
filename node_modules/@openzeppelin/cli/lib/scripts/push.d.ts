import { PushParams } from './interfaces';
export default function push({ contractAliases, network, deployDependencies, deployProxyAdmin, deployProxyFactory, reupload, force, txParams, networkFile, }: PushParams): Promise<void | never>;
