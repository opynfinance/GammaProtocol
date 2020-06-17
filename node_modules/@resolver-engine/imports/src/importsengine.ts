import { ResolverEngine, UriResolver, UrlParser } from "@resolver-engine/core";
import { ImportFile, ImportParser } from "./parsers/importparser";
import { GithubResolver } from "./resolvers/githubresolver";

export function ImportsEngine(): ResolverEngine<ImportFile> {
  return (
    new ResolverEngine<ImportFile>()
      //.addResolver(FsResolver())
      //.addResolver(EthPmResolver())
      //.addResolver(NodeResolver())
      .addResolver(GithubResolver())
      .addResolver(UriResolver())
      .addParser(ImportParser([UrlParser()]))
  );
}
