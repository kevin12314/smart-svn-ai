import * as assert from "assert";
import { SourceControlResourceState, Uri } from "vscode";
import { Status } from "../common/types";
import { Command } from "../commands/command";
import { Resource } from "../resource";

class NormalizeResourceStatesCommand extends Command {
  constructor() {
    super("svn.test.normalizeResourceStates");
  }

  public execute() {}

  public normalize(args: unknown[]): SourceControlResourceState[] {
    return this.normalizeResourceStates(args);
  }

  public resolve(args: unknown[]): Promise<Resource[]> {
    return this.getResourceStates(args as SourceControlResourceState[]);
  }

  protected async getSCMResource(): Promise<Resource> {
    return new Resource(Uri.file("/repo/active.txt"), Status.MODIFIED);
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

  test("Does not fall back to the active editor for stale SCM arguments", async () => {
    const result = await command.resolve([undefined]);

    assert.deepStrictEqual(result, []);
  });

  test("Falls back to the active editor when invoked without arguments", async () => {
    const result = await command.resolve([]);

    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].resourceUri.fsPath, Uri.file("/repo/active.txt").fsPath);
  });

  test("Resource commands use stable serializable arguments", () => {
    const resourceUri = Uri.file("/repo/modified.txt");
    const resource = new Resource(resourceUri, Status.MODIFIED);
    const args = resource.command.arguments ?? [];

    assert.strictEqual(args[0], resourceUri);
    assert.strictEqual(args[1], Status.MODIFIED);
    assert.ok(!args.some(arg => arg instanceof Resource));
  });
});
