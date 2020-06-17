import * as verify from './verify';
import * as deploy from './deploy';
declare const _default: {
    add: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (contractNames: string[], options: any) => Promise<void>;
        runActionIfNeeded: (contractName?: string, options?: any) => Promise<void>;
    };
    bump: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (version: string, options: any) => Promise<void>;
    };
    check: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (contractAlias: string, options: any) => Promise<void>;
    };
    create: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (contractFullName: string, options: any) => Promise<void>;
    };
    create2: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (contractFullName: string, options: any) => Promise<void>;
    };
    freeze: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    init: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (projectName: string, version: string, options: any) => Promise<void>;
        runActionIfNeeded: (options: any) => Promise<void>;
    };
    link: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (dependencies: string[], options: any) => Promise<void>;
        runActionIfNeeded: (contractFullName: string, options: any) => Promise<void>;
    };
    publish: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    push: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
        runActionIfRequested: (externalOptions: any) => Promise<void>;
        runActionIfNeeded: (contracts: string[], network: string, options: any) => Promise<void>;
    };
    remove: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (contracts: string[], options: any) => Promise<void>;
    };
    session: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    setAdmin: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (proxyReference: string, newAdmin: string, options: any) => Promise<void>;
    };
    status: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    unlink: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (dependencies: string[], options: any) => Promise<void>;
    };
    update: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (proxyReference: string, options: any) => Promise<void>;
    };
    verify: typeof verify;
    unpack: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (kit: string, options: any) => Promise<void>;
    };
    transfer: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    balance: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (accountAddress: string, options: any) => Promise<void>;
    };
    sendTx: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    call: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    compile: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: import("../scripts/interfaces").CompileParams & {
            interactive: boolean;
        }) => Promise<void>;
    };
    accounts: {
        name: string;
        signature: string;
        description: string;
        register: (program: any) => any;
        action: (options: any) => Promise<void>;
    };
    deploy: typeof deploy;
};
export default _default;
