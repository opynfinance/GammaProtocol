export default class MinimalProxy {
    address: string;
    static at(address: string): MinimalProxy;
    constructor(address: string);
    implementation(): Promise<string>;
}
