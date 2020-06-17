import { CompileParams } from '../scripts/interfaces';
declare function action(options: CompileParams & {
    interactive: boolean;
}): Promise<void>;
declare const _default: {
    name: string;
    signature: string;
    description: string;
    register: (program: any) => any;
    action: typeof action;
};
export default _default;
