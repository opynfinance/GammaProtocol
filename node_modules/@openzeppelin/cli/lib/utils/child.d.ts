/// <reference types="node" />
import child from 'child_process';
declare const _default: {
    exec: typeof child.exec.__promisify__;
    execSync: typeof child.execSync;
};
export default _default;
