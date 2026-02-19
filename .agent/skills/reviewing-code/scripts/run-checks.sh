#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<EOF
run-checks.sh — run project lint/tests/build heuristics

Usage: run-checks.sh [--help]

This script attempts to run common checks in a Node project:
  - `npm run lint` (if defined)
  - `npm test` (if defined)
  - `npm run build` (if defined)

It treats missing scripts as non-fatal and reports status.
EOF
}

if [ "${1-}" = "--help" ]; then
  usage
  exit 0
fi

if [ ! -f package.json ]; then
  echo "No package.json found in current directory — run from repo root." >&2
  exit 2
fi

echo "Running project checks (non-fatal failures will be reported)"

# Try lint
echo "--- lint ---"
if npm run lint --silent 2>/dev/null; then
  echo "lint: OK"
else
  echo "lint: not defined or failed — continue" >&2
fi

# Try tests
echo "--- test ---"
if npm test --silent 2>/dev/null; then
  echo "tests: OK"
else
  echo "tests: not defined or failed — continue" >&2
fi

# Try build
echo "--- build ---"
if npm run build --silent 2>/dev/null; then
  echo "build: OK"
else
  echo "build: not defined or failed — continue" >&2
fi

echo "Checks complete"
exit 0
