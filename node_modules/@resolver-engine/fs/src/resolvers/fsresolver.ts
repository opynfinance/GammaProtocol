import { ResolverContext, SubResolver } from "@resolver-engine/core";
import * as fs from "fs";
import * as path from "path";

const statAsync = (path: string): Promise<fs.Stats> =>
  new Promise<fs.Stats>((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err);
      }

      resolve(stats);
    });
  });
const NO_FILE = "ENOENT";

export function FsResolver(): SubResolver {
  return async (resolvePath: string, ctx: ResolverContext): Promise<string | null> => {
    const cwd = ctx.cwd || process.cwd();

    let myPath: string;
    if (!path.isAbsolute(resolvePath)) {
      myPath = path.join(cwd, resolvePath);
    } else {
      myPath = resolvePath;
    }
    try {
      const stats = await statAsync(myPath);
      return stats.isFile() ? myPath : null;
    } catch (e) {
      if (e.code === NO_FILE) {
        return null;
      }
      throw e;
    }
  };
}
