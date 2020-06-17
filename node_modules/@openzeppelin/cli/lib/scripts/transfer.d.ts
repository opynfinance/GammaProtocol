import { TransferParams } from './interfaces';
export default function transfer({ to, value, unit, from, txParams, }: TransferParams): Promise<void | never>;
