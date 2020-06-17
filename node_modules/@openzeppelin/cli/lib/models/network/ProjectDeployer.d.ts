import { AppProject, PackageProject, ProxyAdminProject, App, Package, ImplementationDirectory, TxParams } from '@openzeppelin/upgrades';
import NetworkController from './NetworkController';
import ProjectFile from '../files/ProjectFile';
import NetworkFile from '../files/NetworkFile';
interface PartialDeploy {
    app?: App;
    thepackage?: Package;
    directory?: ImplementationDirectory;
}
declare class BaseProjectDeployer {
    protected controller: NetworkController;
    protected projectFile: ProjectFile;
    protected networkFile: NetworkFile;
    protected txParams: TxParams;
    protected requestedVersion: string;
    constructor(controller: NetworkController, requestedVersion: string);
}
declare class BasePackageProjectDeployer extends BaseProjectDeployer {
    get packageAddress(): string;
    protected _tryRegisterPartialDeploy({ thepackage, directory }: PartialDeploy): void;
    protected _registerPackage({ address }: {
        address: string;
    }): void;
    protected _registerVersion(version: string, { address }: {
        address: string;
    }): void;
}
export declare class PackageProjectDeployer extends BasePackageProjectDeployer {
    project: PackageProject;
    fetchOrDeploy(): Promise<PackageProject>;
}
export declare class AppProjectDeployer extends BasePackageProjectDeployer {
    project: AppProject;
    fetchOrDeploy(): Promise<AppProject>;
    fromProxyAdminProject(proxyAdminProject: ProxyAdminProject): Promise<AppProject>;
    get appAddress(): string;
    get proxyAdminAddress(): string;
    get proxyFactoryAddress(): string;
    private _run;
    protected _tryRegisterPartialDeploy({ thepackage, app, directory }: PartialDeploy): void;
    private _registerDeploy;
    private _registerApp;
}
export declare class ProxyAdminProjectDeployer extends BaseProjectDeployer {
    project: ProxyAdminProject;
    fetchOrDeploy(): Promise<ProxyAdminProject>;
}
export {};
