# Web+ Package Publishing Guide

This guide covers how to update and publish all Web+ packages to npm.

## Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH

Examples:
- 0.1.0 → 0.1.1 (patch: bug fixes)
- 0.1.0 → 0.2.0 (minor: new features)
- 0.1.0 → 1.0.0 (major: breaking changes)
```

## Package Structure

| Package | Name | Version | Description |
|---------|------|---------|-------------|
| Transpiler | `@solez-ai/transpiler` | 0.1.1 | Web+ to C++ transpiler |
| CLI | `webplus` | 0.1.2 | Command-line interface |
| VSCode Extension | `webplus-vscode` | 0.1.0 | VS Code extension |
| Compiler | `@webplus/compiler` | 0.1.0 | Browser-compatible compiler |
| LSP | `@webplus/lsp` | 0.1.0 | Language Server Protocol |
| Runtime | `@webplus/runtime` | 0.1.0 | Browser runtime |

---

## Step 1: Update Versions

### Option A: Manual Version Update

Edit each `package.json` and increment the version:

```json
{
  "name": "@solez-ai/transpiler",
  "version": "0.1.2",  // ← Increment this
  ...
}
```

### Option B: npm version command

```bash
# In each package directory
cd transpiler && npm version patch  # 0.1.1 → 0.1.2
cd packages/cli && npm version patch  # 0.1.2 → 0.1.3
```

### Option C: Update dependencies

If you update the transpiler, update dependent packages:

```bash
# In packages/cli/package.json, update:
{
  "dependencies": {
    "@solez-ai/transpiler": "^0.1.2"  // ← Match new version
  }
}
```

---

## Step 2: Build All Packages

### Build Transpiler

```bash
cd C:/Projects/Web+/webplus/transpiler
npm run build
# Output: lib/ directory with compiled JS
```

### Build CLI

```bash
cd C:/Projects/Web+/webplus/packages/cli
npm run build
# Output: lib/ directory
```

### Build VSCode Extension

```bash
cd C:/Projects/Web+/webplus/vscode-extension
npm install
npm run compile
```

---

## Step 3: Publish Packages

### Publish Transpiler (First)

```bash
cd C:/Projects/Web+/webplus/transpiler
npm publish --access public
# Result: @solez-ai/transpiler@x.x.x on npm
```

### Publish CLI

```bash
cd C:/Projects/Web+/webplus/packages/cli
npm publish --access public
# Result: webplus@x.x.x on npm
```

### Publish VSCode Extension

```bash
cd C:/Projects/Web+/webplus/vscode-extension

# First time: Create publisher token on Azure DevOps / VS Code Marketplace
# Login: npx vsce login Solez

# Package and publish
npx vsce package    # Creates webplus-vscode-x.x.x.vsix
npx vsce publish    # Publishes to VS Code Marketplace
```

---

## Complete Publishing Script

Create `publish.sh` in root:

```bash
#!/bin/bash

# Update versions
cd transpiler && npm version patch && cd ..
cd packages/lsp && npm version patch && cd ../..

# Build all
npm run build

# Publish in order
cd transpiler && npm publish --access public && cd ..
cd packages/lsp && npm publish --access public && cd ..
cd packages/compiler && npm publish --access public && cd ..
cd packages/runtime && npm publish --access public && cd ..
cd packages/cli && npm publish --access public && cd ..

# VSCode extension (manual publish)
cd vscode-extension
npx vsce package
echo "Upload webplus-vscode-*.vsix to VS Code Marketplace"
```

---

## Quick Version Bump (Recommended)

For a simple patch release after bug fixes:

```bash
# 1. Update transpiler version
cd transpiler
# Edit package.json → version: "0.1.2"
npm run build
npm publish --access public

# 2. Update CLI to use new transpiler
cd ../packages/cli
# Edit package.json:
#   "@solez-ai/transpiler": "^0.1.2"
npm run build
npm publish --access public
```

---

## Current Versions (as of latest update)

| Package | Current Version | Next Version |
|---------|----------------|--------------|
| `@solez-ai/transpiler` | 0.1.1 | 0.1.2 |
| `webplus` (CLI) | 0.1.2 | 0.1.3 |
| `@webplus/compiler` | 0.1.0 | (update if needed) |
| `@webplus/lsp` | 0.1.0 | (update if needed) |
| `@webplus/runtime` | 0.1.0 | (update if needed) |
| `webplus-vscode` | 0.1.0 | 0.1.1 |

---

## Post-Publish Checklist

- [ ] Verify on npm: `npm view @solez-ai/transpiler`
- [ ] Test install: `npm install @solez-ai/transpiler`
- [ ] VS Code: Check extension in Marketplace
- [ ] Update CHANGELOG.md with changes

---

## Troubleshooting

### "You must specify a version"

```bash
# Check current version
npm view @solez-ai/transpiler version

# If stuck, explicitly set version
npm publish --access public --version 0.1.2
```

### "Auth token required"

```bash
# Login to npm
npm login
# Enter username, password, email
```

### VS Code extension publish fails

```bash
# Create personal access token at:
# https://dev.azure.com/_identity?authority=https://vssPs.visualstudio.com/

npx vsce login Solez
npx vsce publish
```

---

## Version Update Command Reference

```bash
# Patch (bug fixes): 0.1.0 → 0.1.1
npm version patch

# Minor (new features): 0.1.0 → 0.2.0
npm version minor

# Major (breaking changes): 0.1.0 → 1.0.0
npm version major
```