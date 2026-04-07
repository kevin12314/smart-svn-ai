import * as cp from "child_process";
import { ChildProcess, SpawnOptions } from "child_process";
import * as fs from "original-fs";
import * as path from "path";
import * as tmp from "tmp";
import { Extension, extensions, Uri, window } from "vscode";
import { Repository } from "../repository";
import { SourceControlManager } from "../source_control_manager";
import { timeout } from "../util";
import { SvnExtensionApi } from "../extension";

type ExtensionPackageJson = {
  name?: string;
  publisher?: string;
};

let cachedExtensionId: string | undefined;

function getExpectedExtensionId(): string {
  if (cachedExtensionId) {
    return cachedExtensionId;
  }

  const packageJsonPath = path.resolve(__dirname, "../../package.json");
  const packageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
  ) as ExtensionPackageJson;

  if (!packageJson.name || !packageJson.publisher) {
    throw new Error("Unable to resolve extension id from package.json");
  }

  cachedExtensionId = `${packageJson.publisher}.${packageJson.name}`;
  return cachedExtensionId;
}

export function getExtensionUnderTest():
  | Extension<SvnExtensionApi>
  | undefined {
  const extensionId = getExpectedExtensionId();
  const exactMatch = extensions.getExtension<SvnExtensionApi>(extensionId);
  if (exactMatch) {
    return exactMatch;
  }

  const extensionRoot = path.resolve(__dirname, "../..");

  return extensions.all.find(extension => {
    const packageJson = extension.packageJSON as ExtensionPackageJson;

    return (
      extension.extensionPath === extensionRoot ||
      (packageJson.name === "smart-svn-ai" &&
        packageJson.publisher === "kevin12314") ||
      extension.id === extensionId
    );
  }) as Extension<SvnExtensionApi> | undefined;
}

tmp.setGracefulCleanup();

const tempDirList: tmp.DirResult[] = [];

export function getSvnUrl(uri: Uri) {
  const url = uri.toString();

  return url.replace(/%3A/g, ":");
}

export function spawn(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
): ChildProcess {
  const proc = cp.spawn(command, args, options);

  // let fullCommand = "command: " + command;

  // if (args) {
  //   fullCommand += ' "' + args.join('" "') + '"';
  // }
  // console.log(fullCommand);

  // proc.stdout.on("data", function(data) {
  //   console.log("stdout: " + data.toString());
  // });

  // proc.stderr.on("data", function(data) {
  //   console.log("stderr: " + data.toString());
  // });

  // proc.on("exit", function(code) {
  //   console.log("child process exited with code " + code.toString());
  // });

  return proc;
}

export function newTempDir(prefix: string) {
  const dir = tmp.dirSync({
    prefix,
    unsafeCleanup: true
  });

  tempDirList.push(dir);

  return dir.name;
}

export function createRepoServer() {
  return new Promise<Uri>((resolve, reject) => {
    const fullpath = newTempDir("svn_server_");
    const dirname = path.basename(fullpath);

    if (fs.existsSync(fullpath)) {
      destroyPath(fullpath);
    }

    const proc = spawn("svnadmin", ["create", dirname], {
      cwd: path.dirname(fullpath)
    });

    proc.once("exit", exitCode => {
      if (exitCode === 0) {
        resolve(Uri.file(fullpath));
      }
      reject();
    });
  });
}

export function importToRepoServer(
  url: string,
  path: string,
  message = "imported",
  cwd?: string
) {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("svn", ["import", path, url, "-m", message], {
      cwd
    });

    proc.once("exit", exitCode => {
      if (exitCode === 0) {
        resolve();
      }
      reject();
    });
  });
}

export async function createStandardLayout(
  url: string,
  trunk = "trunk",
  branches = "branches",
  tags = "tags"
) {
  const fullpath = newTempDir("svn_layout_");

  fs.mkdirSync(path.join(fullpath, trunk));
  fs.mkdirSync(path.join(fullpath, branches));
  fs.mkdirSync(path.join(fullpath, tags));

  await importToRepoServer(url, fullpath, "Created Standard Layout");

  destroyPath(fullpath);
}

export function createRepoCheckout(url: string) {
  return new Promise<Uri>((resolve, reject) => {
    const fullpath = newTempDir("svn_checkout_");

    const proc = spawn("svn", ["checkout", url, fullpath], {
      cwd: path.dirname(fullpath)
    });

    proc.once("exit", exitCode => {
      if (exitCode === 0) {
        resolve(Uri.file(fullpath));
      }
      reject();
    });
  });
}

export async function destroyPath(fullPath: string) {
  fullPath = fullPath.replace(/^file\:\/\/\//, "");

  if (!fs.existsSync(fullPath)) {
    return false;
  }

  if (!fs.lstatSync(fullPath).isDirectory()) {
    fs.unlinkSync(fullPath);
    return true;
  }

  const files = fs.readdirSync(fullPath);
  for (const file of files) {
    destroyPath(path.join(fullPath, file));
  }

  // Error in windows with anti-malware
  for (let i = 0; i < 3; i++) {
    try {
      fs.rmdirSync(fullPath);
      break;
    } catch (error) {
      await timeout(3000);
      console.error(error);
    }
  }
  return true;
}

export function destroyAllTempPaths() {
  let dir;
  while (true) {
    dir = tempDirList.shift();
    if (!dir) {
      break;
    }

    try {
      dir.removeCallback();
    } catch (error) {}
  }
}

export function activeExtension() {
  return new Promise<void>((resolve, reject) => {
    const extension = getExtensionUnderTest();
    if (!extension) {
      reject(
        new Error(
          `Extension not found. Expected id: ${getExpectedExtensionId()}`
        )
      );
      return;
    }

    if (!extension.isActive) {
      extension.activate().then(
        async () => resolve(),
        error =>
          reject(
            error instanceof Error
              ? error
              : new Error(`Failed to activate extension: ${String(error)}`)
          )
      );
    } else {
      resolve();
    }
  });
}

export async function getSourceControlManager(): Promise<SourceControlManager> {
  const extension = getExtensionUnderTest() as
    | { isActive: boolean; activate(): Thenable<SvnExtensionApi> }
    | undefined;

  if (!extension) {
    throw new Error(
      `Extension not found. Expected id: ${getExpectedExtensionId()}`
    );
  }

  const api = extension.isActive
    ? await extension.activate()
    : await extension.activate();

  return api.getSourceControlManager();
}

export async function getOrOpenRepository(
  sourceControlManager: SourceControlManager,
  checkoutDir: Uri | string
): Promise<Repository> {
  const checkoutPath =
    typeof checkoutDir === "string" ? checkoutDir : checkoutDir.fsPath;

  await sourceControlManager.tryOpenRepository(checkoutPath);

  const repository = sourceControlManager.getRepository(checkoutPath);
  if (!repository) {
    throw new Error(`Repository is not open: ${checkoutPath}`);
  }

  return repository;
}

const overridesShowInputBox: any[] = [];

export function overrideNextShowInputBox(value: any) {
  overridesShowInputBox.push(value);
}

const originalShowInputBox = window.showInputBox;

window.showInputBox = (...args: any[]) => {
  const next = overridesShowInputBox.shift();
  if (typeof next === "undefined") {
    return originalShowInputBox.call(null, args as any);
  }
  return new Promise((resolve, _reject) => {
    resolve(next);
  });
};

const overridesShowQuickPick: any[] = [];

export function overrideNextShowQuickPick(value: any) {
  overridesShowQuickPick.push(value);
}

const originalShowQuickPick = window.showQuickPick;

window.showQuickPick = ((
  items: readonly any[] | Thenable<readonly any[]>,
  ...args: any[]
): Thenable<any | undefined> => {
  let next = overridesShowQuickPick.shift();
  if (typeof next === "undefined") {
    return originalShowQuickPick.apply(window, [items, ...args] as any);
  }

  if (typeof next === "number" && Array.isArray(items)) {
    next = items[next];
  }

  if (
    Array.isArray(next) &&
    Array.isArray(items) &&
    next.every(value => typeof value === "number")
  ) {
    next = next.map(index => items[index]);
  }

  return new Promise((resolve, _reject) => {
    resolve(next);
  });
}) as typeof window.showQuickPick;

const overridesShowWarningMessage: any[] = [];

export function overrideNextShowWarningMessage(value: any) {
  overridesShowWarningMessage.push(value);
}

const originalShowWarningMessage = window.showWarningMessage;

window.showWarningMessage = ((
  message: string,
  ...args: any[]
): Thenable<any | undefined> => {
  const next = overridesShowWarningMessage.shift();
  if (typeof next === "undefined") {
    return originalShowWarningMessage.apply(window, [message, ...args] as any);
  }

  return new Promise((resolve, _reject) => {
    resolve(next);
  });
}) as typeof window.showWarningMessage;
