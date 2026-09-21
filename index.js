/**
 * Root entrypoint so OpenCode v2 can load this repository as a local
 * plugin directory (it resolves `<dir>/server` then `<dir>/index`, not
 * `package.json#exports`). Published npm installs use `package.json` `exports`.
 */
export { default } from "./src/index.js";
