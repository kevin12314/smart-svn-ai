import { l10n, Uri, window } from "vscode";
import { isSvnErrorLike } from "../util";
import { Command } from "./command";

function canForceUnlock(error: unknown): boolean {
  if (!isSvnErrorLike(error)) {
    return false;
  }

  return /(locked by user|lock token)/i.test(error.stderr || "");
}

function getErrorMessage(error: unknown): string {
  if (isSvnErrorLike(error)) {
    if (error.stderrFormated) {
      return error.stderrFormated;
    }

    if (error.stderr) {
      return error.stderr;
    }
  }

  return String(error);
}

export class Unlock extends Command {
  constructor() {
    super("svn.unlock");
  }

  private getUrisFromArgs(args: unknown[]): Uri[] {
    const normalizedResourceStates = this.normalizeResourceStates(args);

    if (normalizedResourceStates.length > 0) {
      return normalizedResourceStates.map(resource => resource.resourceUri);
    }

    const seenUris = new Map<string, Uri>();
    const uriArgs = args.flatMap(arg => (Array.isArray(arg) ? arg : [arg]));

    for (const candidate of uriArgs) {
      if (!(candidate instanceof Uri)) {
        continue;
      }

      seenUris.set(candidate.toString(), candidate);
    }

    return Array.from(seenUris.values());
  }

  public async execute(...args: unknown[]) {
    const uris = this.getUrisFromArgs(args);

    if (uris.length === 0) {
      const uri =
        this.getUriFromActiveTab() || window.activeTextEditor?.document.uri;

      if (uri) {
        uris.push(uri);
      }
    }

    if (uris.length === 0) {
      window.showErrorMessage(l10n.t("No file is currently open"));
      return;
    }

    if (uris.some(uri => uri.scheme !== "file")) {
      window.showErrorMessage(
        l10n.t("Can only unlock files from the file system")
      );
      return;
    }

    await this.runByRepository(uris, async (repository, resources) => {
      const filePaths = resources.map(resource => resource.fsPath);

      try {
        await repository.unlock(filePaths);
        window.showInformationMessage(
          filePaths.length === 1
            ? l10n.t("Successfully unlocked {0}", filePaths[0])
            : l10n.t("Successfully unlocked {0} file(s)", filePaths.length)
        );
      } catch (error) {
        console.log(error);

        if (filePaths.length > 1) {
          window.showErrorMessage(
            l10n.t(
              "Failed to unlock {0} file(s): {1}",
              filePaths.length,
              getErrorMessage(error)
            )
          );
          return;
        }

        if (filePaths.length === 1 && canForceUnlock(error)) {
          const forceUnlock = l10n.t("Force Unlock");
          const selection = await window.showWarningMessage(
            l10n.t(
              "This file is locked by another user. Do you want to forcibly break the lock?"
            ),
            forceUnlock
          );

          if (selection === forceUnlock) {
            try {
              await repository.unlock(filePaths, true);
              window.showInformationMessage(
                l10n.t("Successfully unlocked {0}", filePaths[0])
              );
              return;
            } catch (forceError) {
              console.log(forceError);
              window.showErrorMessage(
                l10n.t("Unable to unlock file: {0}", `${forceError}`)
              );
              return;
            }
          }
        }

        window.showErrorMessage(
          l10n.t("Unable to unlock file: {0}", `${error}`)
        );
      }
    });
  }
}
