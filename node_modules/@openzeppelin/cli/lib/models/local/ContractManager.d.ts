import { Contract } from '@openzeppelin/upgrades';
import ProjectFile from '../files/ProjectFile';
export default class ContractManager {
    projectFile: ProjectFile;
    constructor(projectFile?: ProjectFile);
    getContractClass(packageName: string, contractAlias: string): Contract;
    hasContract(packageName: string, contractAlias: string): boolean;
    getContractNames(root?: string): string[];
    private isLocalContract;
    private isAbstractContract;
    private isLibrary;
}
