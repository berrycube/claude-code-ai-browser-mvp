#!/usr/bin/env bash
set -e
for d in workspace/reports workspace/sources workspace/snapshots workspace/runs; do
  test -d "$d" && echo "[OK] $d" || (echo "[MISS] $d" && exit 1)
done
for f in templates/report.md.hbs templates/dashboard.html.hbs; do
  test -f "$f" && echo "[OK] $f" || (echo "[MISS] $f" && exit 1)
done
test -f packages/mcp-research-tools/dist/index.js && echo "[OK] research-tools built (or build it with pnpm -r build)"
