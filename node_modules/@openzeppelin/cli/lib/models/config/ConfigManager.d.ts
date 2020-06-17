import { TxParams } from '@openzeppelin/upgrades';
import { SessionOptions } from '../network/Session';
declare const ConfigManager: {
    config: any;
    initialize(root?: string): void;
    initStaticConfiguration(root?: string): void;
    initNetworkConfiguration(options: SessionOptions, silent?: boolean, root?: string): Promise<{
        network: string;
        txParams: TxParams;
    }>;
    getBuildDir(root?: string): string;
    getCompilerInfo(root?: string): {
        version?: string;
        optimizer?: boolean;
        optimizerRuns?: number;
    };
    getNetworkNamesFromConfig(root?: string): string[];
    getConfigFileName(root?: string): string;
    setBaseConfig(root?: string): void;
};
export default ConfigManager;
