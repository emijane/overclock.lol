import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(projectRoot, "app");
const featureRoot = path.join(projectRoot, "features");

function getTopLevelDirectories(rootPath, excludedNames = []) {
  return fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !excludedNames.includes(entry.name))
    .map((entry) => entry.name);
}

const appRouteDirectories = getTopLevelDirectories(appRoot, ["components"]);
const featureDirectories = getTopLevelDirectories(featureRoot);

const sharedCodeZones = [
  {
    target: ["./components", "./features", "./lib"],
    from: "./app",
    message: "Shared code cannot import route-local files from app/*.",
  },
];

const appRouteZones = appRouteDirectories.map((routeDirectory) => ({
  target: `./app/${routeDirectory}`,
  from: appRouteDirectories
    .filter((candidate) => candidate !== routeDirectory)
    .map((candidate) => `./app/${candidate}`),
  message: `Route files in app/${routeDirectory} cannot import sibling route folders.`,
}));

const featureZones = featureDirectories.map((featureDirectory) => ({
  target: `./features/${featureDirectory}`,
  from: [
    "./app",
    ...featureDirectories
      .filter((candidate) => candidate !== featureDirectory)
      .map((candidate) => `./features/${candidate}`),
  ],
  message: `Feature files in features/${featureDirectory} may only depend on shared components, lib, and their own feature.`,
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,jsx,tsx}"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          basePath: projectRoot,
          zones: [...sharedCodeZones, ...appRouteZones, ...featureZones],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    ".test-dist/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
