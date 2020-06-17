import { SendTxParams } from './interfaces';
export default function sendTx({ proxyAddress, methodName, methodArgs, value, gas, network, txParams, networkFile, }: Partial<SendTxParams>): Promise<void | never>;
