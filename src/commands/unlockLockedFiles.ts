import * as path from "path";
import { l10n, window } from "vscode";
import { IFileStatus } from "../common/types";
import { Repository } from "../repository";
import { isSvnErrorLike } from "../util";
import { Command } from "./command";

interface LockedFilePick {
  label: string;
  description: string;
  filePath: string;
}

function canForceUnlock(error: unknown): boolean {
  if (!isSvnErrorLike(error)) {
    return false;
  }

  return /(locked by user|lock token)/i.test(error.stderr || "");
}

function getLockedFiles(statuses: IFileStatus[], workspaceRoot: string) {
  return statuses
    .filter(status => status.path !== "." && status.wcStatus.locked)
    .map<LockedFilePick>(status => ({
      label: status.path,
      description: workspaceRoot,
      filePath: path.join(workspaceRoot, status.path)
    }));
}

export class UnlockLockedFiles extends Command {
  constructor() {
    super("svn.unlockLockedFiles", { repository: true });
  }

  public async execute(repository: Repository) {
    const statuses = await repository.repository.getStatus({
      includeIgnored: false,
      includeExternals: false,
      checkRemoteChanges: true
    });

    const picks = getLockedFiles(statuses, repository.workspaceRoot);

    if (!picks.length) {
      window.showInformationMessage(l10n.t("No locked files found"));
      return;
    }

    const selected = await window.showQuickPick(picks, {
      placeHolder: l10n.t("Select locked files to unlock"),
      canPickMany: true
    });

    if (!selected || selected.length === 0) {
      return;
    }

    let unlockedCount = 0;
    const failures: string[] = [];

    for (const item of selected) {
      try {
        await repository.unlock([item.filePath]);
        unlockedCount++;
      } catch (error) {
        if (canForceUnlock(error)) {
          const forceUnlock = l10n.t("Force Unlock");
          const selection = await window.showWarningMessage(
            l10n.t(
              '"{0}" is locked by another user. Do you want to forcibly break the lock?',
              item.label
            ),
            forceUnlock
          );

          if (selection === forceUnlock) {
            try {
              await repository.unlock([item.filePath], true);
              unlockedCount++;
              continue;
            } catch (forceError) {
              failures.push(
                `${item.label}: ${
                  isSvnErrorLike(forceError) && forceError.stderrFormated
                    ? forceError.stderrFormated
                    : String(forceError)
                }`
              );
              continue;
            }
          }
        }

        failures.push(
          `${item.label}: ${
            isSvnErrorLike(error) && error.stderrFormated
              ? error.stderrFormated
              : String(error)
          }`
        );
      }
    }

    if (unlockedCount > 0) {
      window.showInformationMessage(
        l10n.t("Successfully unlocked {0} file(s)", unlockedCount)
      );
    }

    if (failures.length > 0) {
      window.showErrorMessage(
        l10n.t(
          "Failed to unlock {0} file(s): {1}",
          failures.length,
          failures.join("; ")
        )
      );
    }
  }
}
