import * as assert from "assert";
import { LanguageModelChat } from "vscode";
import { __test__ as aiCommitMessageTest } from "../aiCommitMessageService";
import { configuration } from "../helpers/configuration";

function createModel(
  id: string,
  vendor = "copilot",
  family = id,
  version = "1.1"
): LanguageModelChat {
  return {
    id,
    vendor,
    family,
    version,
    name: id,
    maxInputTokens: 1000,
    countTokens: async () => 0,
    sendRequest: async () => {
      throw new Error("Model requests are not expected in selection tests.");
    }
  };
}

suite("AI Commit Message Model Selection", () => {
  test("Defaults to Copilot MAI-Code-1.1-Flash without version constraints", () => {
    const criteria = aiCommitMessageTest.getPreferredModelCriteria();

    assert.deepStrictEqual(criteria, {
      vendor: "copilot",
      family: undefined,
      version: undefined,
      id: "mai-code-1.1-flash"
    });
    assert.deepStrictEqual(aiCommitMessageTest.buildModelSelectors(criteria), [
      { vendor: "copilot" },
      {}
    ]);
  });

  test("Selects the default model by ID regardless of family or version", () => {
    const preferred = createModel(
      "mai-code-1.1-flash",
      "copilot",
      "mai-code",
      "provider-version"
    );
    const selected = aiCommitMessageTest.pickBestMatchingModel(
      [
        createModel("oswe-vscode-prime", "copilot", "oswe-vscode", "raptor-mini"),
        createModel("mai-code-1.1-flash", "other"),
        preferred
      ],
      aiCommitMessageTest.getPreferredModelCriteria()
    );

    assert.strictEqual(selected, preferred);
  });

  test("Does not substitute another model when the default is unavailable", () => {
    assert.strictEqual(
      aiCommitMessageTest.pickBestMatchingModel(
        [createModel("other-model")],
        aiCommitMessageTest.getPreferredModelCriteria()
      ),
      undefined
    );
  });

  test("Honors explicit vendor, family, and version criteria", () => {
    const preferred = createModel("custom-model", "custom", "custom-family", "2");
    const criteria = {
      vendor: "custom",
      family: "custom-family",
      version: "2"
    };

    assert.strictEqual(
      aiCommitMessageTest.pickBestMatchingModel(
        [
          createModel("mai-code-1.1-flash"),
          createModel("old-custom", "custom", "custom-family", "1"),
          preferred
        ],
        criteria
      ),
      preferred
    );
    assert.deepStrictEqual(aiCommitMessageTest.buildModelSelectors(criteria), [
      { vendor: "custom", family: "custom-family" },
      { vendor: "custom" },
      { family: "custom-family" },
      { vendor: "copilot" },
      {}
    ]);
  });

  test("An explicit family setting overrides the default model ID", async () => {
    const section = "commitMessageGeneration.vscodeLM.preferredModelFamily";
    const previousValue = configuration.inspect(section)?.globalValue;

    try {
      await configuration.update(section, "custom-family", true);

      assert.deepStrictEqual(aiCommitMessageTest.getPreferredModelCriteria(), {
        vendor: "copilot",
        family: "custom-family",
        version: undefined,
        id: undefined
      });
    } finally {
      await configuration.update(section, previousValue, true);
    }
  });
});
