#!/usr/bin/env bash
set -euo pipefail

node scripts/import_github_issues.mjs "$@"
