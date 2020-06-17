export interface UserEnvironment {
    platform: string;
    arch: string;
    nodeVersion: string;
    cliVersion: string;
    upgradesVersion?: string;
    web3Version?: string;
    truffleVersion?: string;
}
declare const _default: {
    DISABLE_TELEMETRY: boolean;
    report(commandName: string, params: Record<string, unknown>, interactive: boolean): Promise<void>;
    sendToFirebase(uuid: string, commandData: StringObject, userEnvironment: UserEnvironment): void;
};
export default _default;
export declare type StringObject = {
    [key in string]?: string | StringObject;
};
