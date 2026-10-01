// Only this file is allowed to import VS Code modules and bundled dependencies.
// tslint:disable: import-blacklist

import * as iconv from "iconv-lite-umd";
import * as jschardet from "jschardet";

// These dependencies must be bundled with the extension. Resolving them from
// VS Code's installation makes activation depend on VS Code internals.
export { iconv, jschardet };
