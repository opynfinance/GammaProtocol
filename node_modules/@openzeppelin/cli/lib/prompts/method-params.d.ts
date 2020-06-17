import { ContractMethodMutability as Mutability } from '@openzeppelin/upgrades';
export default function promptForMethodParams(contractFullName: string, options: any, additionalOpts?: {
    [key: string]: string;
}, constant?: Mutability): Promise<{
    methodName: string;
    methodArgs: string[];
}>;
