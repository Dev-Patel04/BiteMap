#!/bin/bash
# ============================================================
#  BiteMap — Quick Start Script
#  Calls run_project.py to handle npm install & dev server.
#
#  Usage:
#    ./run.sh              # install deps + start dev server
#    ./run.sh dev           # start dev server only
#    ./run.sh build         # production build
#    ./run.sh install       # install deps only
#    ./run.sh preview       # preview production build
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------- locate python ----------
if command -v python3 &>/dev/null; then
    PY=python3
elif command -v python &>/dev/null; then
    PY=python
else
    echo "[ERROR] Python is not installed or not on PATH."
    echo "        Please install Python 3 and try again."
    exit 1
fi

echo ""
echo "  🍽️  BiteMap Runner"
echo "  Using: $($PY --version 2>&1)"
echo ""

# ---------- forward all args to the python script ----------
$PY "$SCRIPT_DIR/run_project.py" "$@"
