# 3.5.1 (2026-04-02)


### Bug Fixes

* improve VS Code language model selection for AI commit messages by avoiding slow version-only lookups while still preferring the default Copilot raptor-mini model
* deduplicate added parent folders in the commit selected webview so the files-to-commit list no longer shows the same folder twice
* normalize and deduplicate multi-selection resource handling for changelist, commit, and open file commands
* stop deferred repository refresh work after a repository is disposed to avoid stale updates during cleanup
* fix the README project reference link so it points to the correct repository documentation

### Maintenance

* document the default AI commit message model selection rules in the README and VS Code setting descriptions
* add an extension host regression test covering the commit selected webview file list for added folders and nested files
* rename the package identifier to smart-svn-ai and add a VSIX publish script

# 3.5.0 (2026-04-01)


### Features

* add AI commit message generation with API key management for OpenAI-compatible and Azure OpenAI providers
* add commit message response sanitization, localized title generation improvements, and translated Local labels
* update the extension for VS Code 1.91 compatibility and refresh AI-assisted naming and descriptions

### Bug Fixes

* fix the missing newline at end of file issue

### Maintenance

* refresh package and publisher metadata to align the AI-assisted extension branding across documentation and workflows
* update release workflows to avoid unnecessary publish steps and JavaScript actions onto Node 24

# 3.4.0 (2026-03-30)


### Features

* add a 3-way merge editor workflow for conflict resolution and merge completion
* add a command to copy commit details including revision, author, date, message, and changed paths
* add Korean and Japanese localization support and improve AI commit message generation guidance

### Bug Fixes

* refine localized revision update and remote check prompt messages
* fix workflow badge links and TypeScript rootDir configuration

### Maintenance

* update README guidance for AI-assisted commit message generation
* refresh TypeScript project settings and dependency versions

# 3.3.0 (2026-03-26)


### Features

* add AI-generated commit message support with template fallback and configurable model preferences

### Bug Fixes

* clarify the missing-file commit confirmation to reflect removal after commit
* localize update revision messages and committed file count summaries

### Maintenance

* update the Open VSX release workflow permissions and tag resolution

# 3.2.0 (2026-03-24)


### Features

* add a confirmation prompt before committing missing files or folders

### Bug Fixes

* update GitHub Actions checkout and setup-node actions to v6

### Maintenance

* extend the Open VSX release workflow with optional publish inputs

# 3.1.0 (2026-03-20)


### Features

* add confirmation prompts before revert and revert all operations
* install Subversion in CI across supported operating systems

### Bug Fixes

* detect the installed Subversion directory on Windows runners and append it to PATH
* update GitHub Actions cache and artifact steps to resolve dependency issues

### Maintenance

* refactor tests to reuse shared repository setup helpers
* update pnpm install configuration and minimatch type definitions

# 3.0.0 (2026-03-20)


### Features

* add a command to copy the URL at the current revision
* add a command to get a lock for the current file
* add repository log filters by author and commit message
* adapt copy URL at the current revision, lock for the current file, and repository log filters by author and commit message for the Smart SVN AI workflow

### Bug Fixes

* support lock and permalink commands from binary file tabs
* bundle runtime dependencies correctly in VSIX packages built with pnpm

### Maintenance

* migrate user-facing strings to VS Code l10n bundles, including Traditional Chinese translations
* migrate the project and release workflows from Yarn to pnpm
* align the build toolchain with TypeScript 5 and supported ESLint versions

### 🔄 Historical Note

This changelog focuses on the Smart SVN AI release line, including its AI features, localization work, merge workflow enhancements, packaging updates, and ongoing maintenance.

Older historical entries from predecessor codebases are intentionally not duplicated here.