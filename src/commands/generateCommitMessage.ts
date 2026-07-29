import { l10n, ProgressLocation, window } from "vscode";
import {
  generateAICommitMessage,
  getCommitMessageGenerationMode
} from "../aiCommitMessageService";
import {
  generateCommitMessage,
  getCommitMessageResources
} from "../commitMessageGenerator";
import { noChangesToCommit } from "../messages";
import { Repository } from "../repository";
import { Command } from "./command";

export class GenerateCommitMessage extends Command {
  constructor() {
    super("svn.generateCommitMessage", { repository: true });
  }

  public async execute(repository: Repository, ...args: unknown[]) {
    const selectedFilePaths = args.find(
      (arg): arg is string[] =>
        Array.isArray(arg) && arg.every(item => typeof item === "string")
    );

    const resources = selectedFilePaths?.length
      ? getCommitMessageResources(repository).filter(resource => {
          const renamePath = resource.renameResourceUri?.fsPath;

          return (
            selectedFilePaths.includes(resource.resourceUri.fsPath) ||
            (renamePath ? selectedFilePaths.includes(renamePath) : false)
          );
        })
      : getCommitMessageResources(repository);

    if (resources.length === 0) {
      await noChangesToCommit();
      return;
    }

    const fallbackMessage = generateCommitMessage(
      repository,
      selectedFilePaths
    );
    if (!fallbackMessage) {
      await noChangesToCommit();
      return;
    }

    const mode = getCommitMessageGenerationMode();
    let message = fallbackMessage;

    if (mode !== "template") {
      const aiResult = await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: l10n.t("Generating commit message"),
          cancellable: true
        },
        async (_progress, token) =>
          generateAICommitMessage(repository, resources, fallbackMessage, token)
      );

      if (aiResult.message) {
        message = aiResult.message;
        window.setStatusBarMessage(
          l10n.t("AI commit message generated."),
          3000
        );
      } else if (aiResult.reason === "cancelled") {
        window.setStatusBarMessage(
          l10n.t("Commit message generation cancelled."),
          3000
        );
        return;
      } else if (mode === "ai") {
        const useTemplate = l10n.t("Use Template");
        const selection = await window.showWarningMessage(
          aiResult.reason === "no-model"
            ? l10n.t(
                "No language model is currently available for AI commit message generation."
              )
            : aiResult.reason === "missing-api-key"
            ? l10n.t("OpenAI-compatible API key is not configured.")
            : aiResult.reason === "http-error"
            ? l10n.t("OpenAI-compatible API request failed.")
            : aiResult.reason === "cli-not-found"
            ? l10n.t(
                "Claude Code CLI was not found. Install Claude Code or configure its executable path."
              )
            : aiResult.reason === "codex-cli-not-found"
            ? l10n.t(
                "Codex CLI was not found. Install Codex or configure its executable path."
              )
            : aiResult.reason === "timeout"
            ? l10n.t("AI commit message generation timed out.")
            : l10n.t("AI commit message generation failed."),
          useTemplate
        );

        if (selection !== useTemplate) {
          return;
        }

        window.setStatusBarMessage(
          l10n.t("Using template commit message instead."),
          3000
        );
      } else {
        window.setStatusBarMessage(
          aiResult.reason === "no-model"
            ? l10n.t("No AI model found, used template commit message.")
            : aiResult.reason === "missing-api-key"
            ? l10n.t(
                "AI provider API key missing, used template commit message."
              )
            : aiResult.reason === "http-error"
            ? l10n.t(
                "AI provider API request failed, used template commit message."
              )
            : aiResult.reason === "cli-not-found"
            ? l10n.t(
                "Claude Code CLI was not found, used template commit message."
              )
            : aiResult.reason === "codex-cli-not-found"
            ? l10n.t("Codex CLI was not found, used template commit message.")
            : aiResult.reason === "timeout"
            ? l10n.t("AI generation timed out, used template commit message.")
            : l10n.t("AI generation failed, used template commit message."),
          3000
        );
      }
    } else {
      window.setStatusBarMessage(
        l10n.t("Template commit message generated."),
        3000
      );
    }

    repository.inputBox.value = message;

    return message;
  }
}
