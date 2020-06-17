import assertions from './helpers/assertions';
import assertRevert from './helpers/assertRevert';
import { signDeploy } from './helpers/signing';
import shouldBehaveLikeOwnable from './behaviors/Ownable';
declare const helpers: {
    assertions: typeof assertions;
    assertRevert: typeof assertRevert;
    assertEvent: {
        inLogs: (logs: any, eventName: string, eventArgs?: any) => any;
        inTransaction: (tx: any, eventName: string, eventArgs?: {}) => Promise<any>;
    };
    signDeploy: typeof signDeploy;
    signer: string;
    signerPk: string;
};
declare const behaviors: {
    shouldBehaveLikeOwnable: typeof shouldBehaveLikeOwnable;
};
export { helpers, behaviors };
