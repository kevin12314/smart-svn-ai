import { l10n, QuickPickItem, window } from "vscode";
import { ISvnListItem, SvnKindType } from "../common/types";
import { Repository } from "../repository";
import { isSvnErrorLike } from "../util";
import { Command } from "./command";

type FolderPickMode = "select" | "parent" | "directory";

interface FolderPickItem extends QuickPickItem {
  mode: FolderPickMode;
  path: string;
}

export class SwitchBranch extends Command {
  constructor() {
    super("svn.switchBranch", { repository: true });
  }

  public async execute(repository: Repository) {
    const branchPath = await this.browseRepositoryFolder(repository);

    if (!branchPath) {
      return;
    }

    try {
      try {
        await repository.switchBranch(branchPath);
      } catch (error) {
        if (
          isSvnErrorLike(error) &&
          error.stderrFormated?.includes("ignore-ancestry")
        ) {
          const yes = l10n.t("Yes");
          const answer = await window.showErrorMessage(
            l10n.t(
              "Seems like these branches don't have a common ancestor. Do you want to retry with '--ignore-ancestry' option?"
            ),
            yes,
            l10n.t("No")
          );
          if (answer === yes) {
            await repository.switchBranch(branchPath, true);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.log(error);
      window.showErrorMessage(l10n.t("Unable to switch branch"));
    }
  }

  private async browseRepositoryFolder(
    repository: Repository,
    folder: string = ""
  ): Promise<string | undefined> {
    const list = await repository.repository.list(folder || undefined);
    const directories = list.filter(
      item => item.kind === SvnKindType.DIR
    ) as ISvnListItem[];
    const picks: FolderPickItem[] = [
      {
        label: l10n.t("Use this folder"),
        description: folder || l10n.t("Repository root"),
        mode: "select",
        path: folder
      }
    ];

    if (folder) {
      const parts = folder.split("/");
      parts.pop();

      picks.unshift({
        label: "$(arrow-left) ..",
        description: l10n.t("Parent folder"),
        mode: "parent",
        path: parts.join("/")
      });
    }

    picks.push(
      ...directories.map(directory => ({
        label: `$(file-directory) ${directory.name}`,
        description: folder || l10n.t("Repository root"),
        mode: "directory" as const,
        path: folder ? `${folder}/${directory.name}` : directory.name
      }))
    );

    const choice = await window.showQuickPick(picks, {
      placeHolder: l10n.t("Choose a folder to switch to in the repository")
    });

    if (!choice) {
      return;
    }

    if (choice.mode === "select") {
      return choice.path;
    }

    return this.browseRepositoryFolder(repository, choice.path);
  }
}
