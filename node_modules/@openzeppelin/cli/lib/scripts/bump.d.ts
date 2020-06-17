import { BumpParams } from './interfaces';
export default function bumpVersion({ version, projectFile }: BumpParams): Promise<void | never>;
