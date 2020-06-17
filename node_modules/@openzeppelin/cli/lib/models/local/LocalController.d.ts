import { BuildArtifacts, TxParams } from '@openzeppelin/upgrades';
import NetworkController from '../network/NetworkController';
import ProjectFile from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
export default class LocalController {
    projectFile: ProjectFile;
    constructor(projectFile?: ProjectFile, init?: boolean);
    init(name: string, version: string, force?: boolean, publish?: boolean): void | never;
    initProjectFile(name: string, version: string, force: boolean, publish: boolean): void | never;
    bumpVersion(version: string): void;
    add(contractAlias: string, contractName: string): void;
    addAll(): void;
    remove(contractAlias: string): void;
    checkCanAdd(contractName: string): void | never;
    validateAll(): boolean;
    validate(contractAlias: string, buildArtifacts?: BuildArtifacts): boolean;
    hasBytecode(contractDataPath: string): boolean;
    getContractSourcePath(contractAlias: string): {
        sourcePath: string;
        compilerVersion: string;
    } | never;
    writePackage(): void;
    linkDependencies(dependencies: string[], installDependencies?: boolean): Promise<void>;
    unlinkDependencies(dependenciesNames: string[]): void;
    onNetwork(network: string, txParams: TxParams, networkFile?: NetworkFile): NetworkController;
}
