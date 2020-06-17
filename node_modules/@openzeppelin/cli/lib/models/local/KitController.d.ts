import KitFile from '../files/KitFile';
export default class KitController {
    unpack(url: string, branchName: string, workingDirPath: string, config: KitFile): Promise<void | never>;
    verifyRepo(url: string, branchName?: string): Promise<KitFile | never>;
}
