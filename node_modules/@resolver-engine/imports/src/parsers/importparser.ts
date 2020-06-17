import { firstResult, SubParser } from "@resolver-engine/core";
import Debug from "debug";

const debug = Debug("resolverengine:importparser");

export interface ImportFile {
  url: string;
  source: string;
  //internalImportURis: string[];
}

export function ImportParser(sourceParsers: SubParser<string>[]): SubParser<ImportFile> {
  return async (url: string): Promise<ImportFile | null> => {
    const source = await firstResult(sourceParsers, parser => parser(url));
    if (!source) {
      debug(`Can't find source for ${url}`);
      return null;
    }
    return {
      url,
      source,
    };
  };
}
