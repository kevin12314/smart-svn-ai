import * as assert from "assert";
import { SourceControlResourceState, Uri } from "vscode";
import { Command } from "../commands/command";

class NormalizeResourceStatesCommand extends Command {
  constructor() {
    super("svn.test.normalizeResourceStates");
  }

  public execute() {}

  public normalize(args: unknown[]): SourceControlResourceState[] {
    return this.normalizeResourceStates(args);
  }
}

suite("Command Tests", () => {
  let command: NormalizeResourceStatesCommand;

  setup(() => {
    command = new NormalizeResourceStatesCommand();
  });

  teardown(() => {
    command.dispose();
  });

  test("Normalizes SCM multi-select resource arguments", () => {
    const first = { resourceUri: Uri.file("/repo/first.txt") };
    const second = { resourceUri: Uri.file("/repo/second.txt") };

    const result = command.normalize([first, [first, second]]);

    assert.deepStrictEqual(
      result.map(state => state.resourceUri.fsPath),
      [first.resourceUri.fsPath, second.resourceUri.fsPath]
    );
  });

  test("Normalizes SCM selection container arguments", () => {
    const first = { resourceUri: Uri.file("/repo/first.txt") };
    const second = { resourceUri: Uri.file("/repo/second.txt") };
    const third = { resourceUri: Uri.file("/repo/third.txt") };

    const result = command.normalize([
      first,
      {
        resourceStates: [first, second],
        selectedResourceStates: [third]
      }
    ]);

    assert.deepStrictEqual(
      result.map(state => state.resourceUri.fsPath),
      [
        first.resourceUri.fsPath,
        second.resourceUri.fsPath,
        third.resourceUri.fsPath
      ]
    );
  });
});
