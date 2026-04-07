import { l10n, Uri, window } from "vscode";
import { isSvnErrorLike } from "../util";
import { Command } from "./command";

function canForceUnlock(error: unknown): boolean {
  if (!isSvnErrorLike(error)) {
    return false;
  }

  return /(locked by user|lock token)/i.test(error.stderr || "");
}

export class Unlock extends Command {
  constructor() {
    super("svn.unlock");
  }

  public async execute(resourceUri?: Uri) {
    const uri =
      resourceUri ||
      this.getUriFromActiveTab() ||
      window.activeTextEditor?.document.uri;

    if (!uri) {
      window.showErrorMessage(l10n.t("No file is currently open"));
      return;
    }

    if (uri.scheme !== "file") {
      window.showErrorMessage(
        l10n.t("Can only unlock files from the file system")
      );
      return;
    }

    await this.runByRepository(uri, async (repository, resource) => {
      const filePath = resource.fsPath;

      try {
        await repository.unlock([filePath]);
        window.showInformationMessage(
          l10n.t("Successfully unlocked {0}", filePath)
        );
      } catch (error) {
        console.log(error);

        if (canForceUnlock(error)) {
          const forceUnlock = l10n.t("Force Unlock");
          const selection = await window.showWarningMessage(
            l10n.t(
              "This file is locked by another user. Do you want to forcibly break the lock?"
            ),
            forceUnlock
          );

          if (selection === forceUnlock) {
            try {
              await repository.unlock([filePath], true);
              window.showInformationMessage(
                l10n.t("Successfully unlocked {0}", filePath)
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
