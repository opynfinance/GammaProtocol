declare const version: string;
import commands from './commands';
import scripts from './scripts';
import files from './models/files';
import local from './models/local';
import network from './models/network';
import TestHelper from './models/TestHelper';
import ConfigManager from './models/config/ConfigManager';
import * as naming from './utils/naming';
import log, { silent } from './utils/stdout';
declare const stdout: {
    log: typeof log;
    silent: typeof silent;
};
export { version, files, local, network, commands, scripts, naming, stdout, ConfigManager, TestHelper };
