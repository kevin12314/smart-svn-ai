import { l10n, ProgressLocation, window } from "vscode";
import { IBranchItem, SvnKindType } from "../common/types";
import FolderItem from "../quickPickItems/folderItem";
import ParentFolderItem from "../quickPickItems/parentFolderItem";
import { Repository } from "../repository";
import { configuration } from "./configuration";

export function getBranchName(folder: string): IBranchItem | undefined {
  const confs = [
    "layout.trunkRegex",
    "layout.branchesRegex",
    "layout.tagsRegex"
  ];

  for (const conf of confs) {
    const layout = configuration.get<string>(conf);
    if (!layout) {
      continue;
    }
    const group = configuration.get<number>(`${conf}Name`, 1) + 2;

    const regex = new RegExp(`(^|/)(${layout})$`);

    const matches = folder.match(regex);
    if (matches && matches[2] && matches[group]) {
      return {
        name: matches[group],
        path: matches[2]
      };
    }
  }

  return;
}

export async function selectBranch(
  repository: Repository,
  folder?: string
): Promise<IBranchItem | undefined> {
  const promise = repository.repository.list(folder);

  window.withProgress(
    {
      location: ProgressLocation.Window,
      title: l10n.t("Checking remote branches")
    },
    () => promise
  );

  const list = await promise;

  const dirs = list.filter(item => item.kind === SvnKindType.DIR);

  const picks = [];

  if (folder) {
    const parts = folder.split("/");
    parts.pop();
    const parent = parts.join("/");
    picks.push(new ParentFolderItem(parent));
  }

  picks.push(...dirs.map(dir => new FolderItem(dir, folder)));

  const choice = await window.showQuickPick(picks);

  if (!choice) {
    return;
  }

  if (choice instanceof ParentFolderItem) {
    return selectBranch(repository, choice.path);
  }
  if (choice instanceof FolderItem) {
    if (choice.branch) {
      return choice.branch;
    }

    return selectBranch(repository, choice.path);
  }

  return;
}

export function isTrunk(folder: string): boolean {
  const conf = "layout.trunkRegex";
  const layout = configuration.get<string>(conf);
  const regex = new RegExp(`(^|/)(${layout})$`);
  const matches = folder.match(regex);
  const group = configuration.get<number>(`${conf}Name`, 1) + 2;

  if (matches && matches[2] && matches[group]) {
    return true;
  }
  return false;
}
