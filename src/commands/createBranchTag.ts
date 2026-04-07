import { l10n, window, QuickPickItem } from "vscode";
import { ISvnListItem, SvnKindType } from "../common/types";
import { Repository } from "../repository";
import { Command } from "./command";

type TargetPathMode = "manual" | "browse";

interface TargetPathModeItem extends QuickPickItem {
  mode: TargetPathMode;
}

type FolderPickMode = "select" | "parent" | "directory";

interface FolderPickItem extends QuickPickItem {
  mode: FolderPickMode;
  path: string;
}

interface SwitchBehaviorItem extends QuickPickItem {
  switchAfterCreate: boolean;
}

function normalizeTargetPath(
  input: string,
  repoUrl: string
): string | undefined {
  let value = input.trim().replace(/\\/g, "/");

  if (!value) {
    return;
  }

  if (/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(value)) {
    if (value === repoUrl) {
      return;
    }

    if (!value.startsWith(`${repoUrl}/`)) {
      return;
    }

    value = value.slice(repoUrl.length);
  }

  value = value.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");

  return value || undefined;
}

function getTargetName(targetPath: string): string {
  const parts = targetPath.split("/").filter(Boolean);
  return parts[parts.length - 1] || targetPath;
}

function getInitialTargetPath(currentUrl: string, repoUrl: string): string {
  const currentPath = normalizeTargetPath(currentUrl, repoUrl);

  if (!currentPath) {
    return "";
  }

  const parts = currentPath.split("/");
  parts.pop();

  return parts.length ? `${parts.join("/")}/` : "";
}

export class CreateBranchTag extends Command {
  constructor() {
    super("svn.createBranchTag", { repository: true });
  }

  public async execute(repository: Repository) {
    try {
      const info = await repository.repository.getInfo();
      const repoUrl = await repository.repository.getRepoUrl();
      const initialTargetPath = getInitialTargetPath(info.url, repoUrl);
      const targetPath = await this.pickTargetPath(
        repository,
        repoUrl,
        initialTargetPath
      );

      if (!targetPath) {
        return;
      }

      const targetName = getTargetName(targetPath);
      const commitMessage = await window.showInputBox({
        value: l10n.t("Created new branch or tag {0}", targetName),
        prompt: l10n.t(
          "Commit message for create branch or tag {0}",
          targetName
        ),
        ignoreFocusOut: true
      });

      if (commitMessage === undefined) {
        return;
      }

      const switchAfterCreate = await this.pickSwitchBehavior();

      if (switchAfterCreate === undefined) {
        return;
      }

      await repository.copyTo(targetPath, commitMessage, switchAfterCreate);
    } catch (error) {
      console.log(error);
      window.showErrorMessage(l10n.t("Unable to create new branch or tag"));
    }
  }

  private async pickTargetPath(
    repository: Repository,
    repoUrl: string,
    initialTargetPath: string
  ): Promise<string | undefined> {
    const selection = await window.showQuickPick<TargetPathModeItem>(
      [
        {
          label: l10n.t("Enter target path"),
          description: l10n.t(
            "Type a target path like branches/my-feature or tags/v1.0.0"
          ),
          mode: "manual"
        },
        {
          label: l10n.t("Browse repository folders"),
          description: l10n.t(
            "Pick a parent folder from the repository and then enter the new name"
          ),
          mode: "browse"
        }
      ],
      {
        placeHolder: l10n.t(
          "How do you want to choose the target repository path?"
        )
      }
    );

    if (!selection) {
      return;
    }

    if (selection.mode === "manual") {
      return this.promptTargetPath(repoUrl, initialTargetPath);
    }

    const folder = await this.browseRepositoryFolder(repository);
    if (folder === undefined) {
      return;
    }

    const prefilledPath = folder ? `${folder}/` : "";
    return this.promptTargetPath(repoUrl, prefilledPath || initialTargetPath);
  }

  private async promptTargetPath(
    repoUrl: string,
    initialValue: string
  ): Promise<string | undefined> {
    const rawValue = await window.showInputBox({
      value: initialValue,
      prompt: l10n.t("Target path or URL. Source URL: {0}", repoUrl),
      placeHolder: l10n.t("For example: branches/my-feature or tags/v1.0.0"),
      ignoreFocusOut: true,
      validateInput: input => {
        if (!input.trim()) {
          return l10n.t("Please provide a target path.");
        }

        if (!normalizeTargetPath(input, repoUrl)) {
          return l10n.t(
            "The target path must be inside the current repository."
          );
        }

        return undefined;
      }
    });

    if (rawValue === undefined) {
      return;
    }

    return normalizeTargetPath(rawValue, repoUrl);
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
      placeHolder: l10n.t("Choose a parent folder in the repository")
    });

    if (!choice) {
      return;
    }

    if (choice.mode === "select") {
      return choice.path;
    }

    return this.browseRepositoryFolder(repository, choice.path);
  }

  private async pickSwitchBehavior(): Promise<boolean | undefined> {
    const selection = await window.showQuickPick<SwitchBehaviorItem>(
      [
        {
          label: l10n.t("Switch working copy to the new path"),
          switchAfterCreate: true
        },
        {
          label: l10n.t("Keep current working copy"),
          switchAfterCreate: false
        }
      ],
      {
        placeHolder: l10n.t("Switch after creation?")
      }
    );

    return selection?.switchAfterCreate;
  }
}
