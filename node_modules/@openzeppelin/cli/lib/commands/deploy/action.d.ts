import { Options, Args } from './spec';
export declare function preAction(params: Options & Args): Promise<void | (() => Promise<void>)>;
export declare function action(params: Options & Args): Promise<void>;
