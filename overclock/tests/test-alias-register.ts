import Module from "node:module";
import path from "node:path";

const moduleWithResolver = Module as typeof Module & {
  _resolveFilename: (
    request: string,
    parent: NodeModule | null | undefined,
    isMain: boolean,
    options?: { paths?: string[] }
  ) => string;
};
const originalResolveFilename = moduleWithResolver._resolveFilename;
const compiledRoot = path.resolve(__dirname, "..");

moduleWithResolver._resolveFilename = function (
  request: string,
  parent: NodeModule | null | undefined,
  isMain: boolean,
  options?: { paths?: string[] }
) {
  const resolvedRequest = request.startsWith("@/")
    ? path.join(compiledRoot, request.slice(2))
    : request;

  return originalResolveFilename.call(this, resolvedRequest, parent, isMain, options);
};
