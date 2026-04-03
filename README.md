# Smart SVN AI for VS Code

![Visual Studio Marketplace Release Date](https://img.shields.io/visual-studio-marketplace/release-date/kevin12314.smart-svn-ai)
![Visual Studio Marketplace Last Updated](https://img.shields.io/visual-studio-marketplace/last-updated/kevin12314.smart-svn-ai)
![Visual Studio Marketplace Version](https://vsmarketplacebadges.dev/version-short/kevin12314.smart-svn-ai.svg?&colorB=orange)
![Visual Studio Marketplace Rating](https://vsmarketplacebadges.dev/rating-star/kevin12314.smart-svn-ai.svg)

![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/kevin12314/smart-svn-ai/main.yml?branch=main)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

[![Known Vulnerabilities](https://snyk.io/test/github/kevin12314/smart-svn-ai/badge.svg)](https://snyk.io/test/github/kevin12314/smart-svn-ai)

# Smart SVN AI

**Smart SVN AI** is an independently maintained Subversion extension for Visual Studio Code focused on AI-assisted SVN workflows.

It brings together three core capabilities in one extension:
- AI-generated commit messages
- Native 3-way merge workflows for conflict resolution
- Full localization for multilingual teams

Smart SVN AI is designed for teams that still rely on SVN but want a more modern day-to-day experience inside VS Code, especially around commit quality, merge handling, and localized UI support.

---

## ✨ Key Features

### 🤖 AI‑Powered Commit Messages  
Generate clear, consistent commit messages using:
- OpenAI or OpenAI-Compatible  
- Azure OpenAI  
- VS Code Copilot language models  

Includes:
- Model selection rules  
- Message sanitization  
- Template fallback  
- Localized title generation  

### 🔀 Modern 3‑Way Merge Editor  
Resolve SVN tree conflicts using a native 3‑way merge interface designed for clarity and productivity.

### 🌍 Full Localization Support  
All UI strings are localized using VS Code’s l10n system.
Supported languages:
- Traditional Chinese  
- Simplified Chinese  
- Japanese  
- Korean  

### 🛡️ Safety & Productivity Enhancements  
- Confirmation prompts for revert and missing‑file commits  
- File locking and permalink commands  
- Copy commit details and revision URLs  
- Improved multi‑selection handling for changelists and commit views  
- Better resource refresh logic to avoid stale updates  

---

## ⚙️ AI Configuration & Setup

### VS Code Copilot (Default Model Selection)
When `svn.commitMessageGeneration.provider` is set to `vscode-lm`, the extension prefers the Copilot `oswe-vscode` family with the `raptor-mini` version by default.

If you do not explicitly set `svn.commitMessageGeneration.vscodeLM.preferredVendor` or `svn.commitMessageGeneration.vscodeLM.preferredModelFamily`, the extension will try to resolve that default model from broader Copilot selectors first and then pick the best matching model in memory. This keeps the default selection fast while still targeting `oswe-vscode-prime` when it is available.

### OpenAI-Compatible Setup
To use an OpenAI-compatible API for commit message generation:
1. Set `svn.commitMessageGeneration.provider` to `openai-compatible`.
2. Configure `svn.commitMessageGeneration.openAICompatible.baseUrl`.
3. Configure `svn.commitMessageGeneration.openAICompatible.model`.
4. Run the `SVN: Set OpenAI-Compatible API Key` command to store the API key in VS Code SecretStorage.

> **Note:** The extension can use either the Responses API or Chat Completions API. In `auto` mode, it tries Responses first and falls back to Chat Completions when needed.

### Azure OpenAI Setup
To use Azure OpenAI for commit message generation:
1. Set `svn.commitMessageGeneration.provider` to `azure-openai`.
2. Configure `svn.commitMessageGeneration.azureOpenAI.endpoint`.
3. Configure `svn.commitMessageGeneration.azureOpenAI.deployment`.
4. Optionally adjust `svn.commitMessageGeneration.azureOpenAI.apiVersion` and `svn.commitMessageGeneration.azureOpenAI.apiType`.
5. Run the `SVN: Set Azure OpenAI API Key` command to store the API key in VS Code SecretStorage.

> **Note:** This provider is separate from the generic OpenAI-compatible mode so Azure-specific URL structure and `api-version` handling do not need to be forced into the generic provider.

---

## 📦 Installation  
Search for **Smart SVN AI** in the Visual Studio Code Marketplace.

---

## 🧩 Compatibility  
- VS Code 1.91+  
- Subversion installed on your system  
- Optional: OpenAI / Azure OpenAI API keys for AI features  

---

## 🤝 Translations & Contributing
Please open an [issue](https://github.com/kevin12314/smart-svn-ai/issues) with improvements to translations or create a [PR](https://github.com/kevin12314/smart-svn-ai/pulls) to add a new language. 

---

## 📝 License  
Smart SVN AI is distributed under the MIT License.

This project includes and builds upon MIT-licensed open-source work, with additional product-specific features, UI changes, localization work, packaging changes, and workflow enhancements maintained in this repository.