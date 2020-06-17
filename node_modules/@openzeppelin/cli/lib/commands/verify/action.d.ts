import { Options, Args } from './spec';
export declare function action(params: Options & Args & {
    dontExitProcess: boolean;
}): Promise<void>;
