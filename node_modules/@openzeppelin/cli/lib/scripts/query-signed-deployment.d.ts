import { CreateParams } from './interfaces';
export default function querySignedDeployment({ packageName, contractAlias, methodName, methodArgs, network, txParams, salt, signature, admin, networkFile, }: Partial<CreateParams>): Promise<string | never>;
