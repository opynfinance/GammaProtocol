import { CreateParams } from './interfaces';
import { Contract } from '@openzeppelin/upgrades';
export default function createProxy({ packageName, contractAlias, methodName, methodArgs, network, txParams, force, salt, signature, admin, kind, networkFile, }: Partial<CreateParams>): Promise<Contract | never>;
