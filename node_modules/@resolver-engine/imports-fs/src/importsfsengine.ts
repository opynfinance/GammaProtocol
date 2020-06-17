import { FsParser, FsResolver, NodeResolver } from "@resolver-engine/fs";
import { ImportFile, ImportParser, ImportsEngine, ResolverEngine } from "@resolver-engine/imports";
import { EthPmResolver } from "./resolvers/ethpmresolver";

export function ImportsFsEngine(): ResolverEngine<ImportFile> {
  return ImportsEngine()
    .addResolver(FsResolver())
    .addResolver(NodeResolver())
    .addResolver(EthPmResolver())
    .addParser(ImportParser([FsParser()]));
}
