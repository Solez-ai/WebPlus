#!/bin/bash

# Web+ Quick Publish Script
# Usage: bash scripts/publish.sh [transpiler|cli|all]

set -e

echo "======================================"
echo "  Web+ Package Publishing Script"
echo "======================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

publish_package() {
    local pkg_dir=$1
    local pkg_name=$2

    cd "$pkg_dir"

    # Get current version
    local version=$(node -e "console.log(require('./package.json').version)")

    echo ""
    echo -e "${YELLOW}Publishing ${pkg_name}@${version}...${NC}"

    # Publish
    if npm publish --access public; then
        echo -e "${GREEN}✓ ${pkg_name}@${version} published successfully!${NC}"
    else
        echo -e "${RED}✗ Failed to publish ${pkg_name}${NC}"
        return 1
    fi

    cd - > /dev/null
}

# Publish transpiler first (required by others)
if [[ "$1" == "transpiler" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
    publish_package "C:/Projects/Web+/webplus/transpiler" "@solez-ai/transpiler"
fi

# Publish CLI
if [[ "$1" == "cli" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
    publish_package "C:/Projects/Web+/webplus/packages/cli" "webplus"
fi

# Publish LSP
if [[ "$1" == "lsp" ]] || [[ "$1" == "all" ]] || [[ -z "$1" ]]; then
    publish_package "C:/Projects/Web+/webplus/packages/lsp" "@webplus/lsp"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Publishing Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo "For VS Code extension, run manually:"
echo "  cd vscode-extension && npx vsce package && npx vsce publish"