import { QueryDeploymentParams } from './interfaces';
export default function queryDeployment({ salt, sender, network, txParams, networkFile, }: QueryDeploymentParams): Promise<string | never>;
