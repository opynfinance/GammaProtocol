import { InitParams } from './interfaces';
export default function init({ name, version, publish, dependencies, installDependencies, force, projectFile, typechainEnabled, typechainOutdir, typechainTarget, }: InitParams): Promise<void | never>;
