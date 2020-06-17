import semver from 'semver';
import { TxParams, PackageProject } from '@openzeppelin/upgrades';
import ProjectFile from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
export default class Dependency {
    name: string;
    version: string;
    nameAndVersion: string;
    requirement: string | semver.Range;
    private _networkFiles;
    private _projectFile;
    static fromNameWithVersion(nameAndVersion: string): Dependency;
    static satisfiesVersion(version: string | semver.SemVer, requirement: string | semver.Range): boolean;
    static fetchVersionFromNpm(name: string): Promise<string>;
    static hasDependenciesForDeploy(network: string, packageFileName?: string, networkFileName?: string): boolean;
    static install(nameAndVersion: string): Promise<Dependency>;
    static splitNameAndVersion(nameAndVersion: string): [string, string];
    constructor(name: string, requirement?: string | semver.Range);
    deploy(txParams: TxParams): Promise<PackageProject>;
    get projectFile(): ProjectFile | never;
    getNetworkFile(network: string): NetworkFile | never;
    isDeployedOnNetwork(network: string): boolean;
    private getDependencyFolder;
    private getExistingNetworkFilePath;
    private validateSatisfiesVersion;
}
