#!/usr/bin/env bash
set -euo pipefail

# Usage:
# 1) Generate import file:
#    node scripts/backlog_to_github_issues.mjs
# 2) Dry run:
#    ./scripts/import_github_issues.sh --dry-run
# 3) Import into current gh repo:
#    ./scripts/import_github_issues.sh
#
# Optional:
#    --limit N     Import only first N issues
#    --file PATH   Use a different CSV file

FILE="github_issues_import.csv"
LIMIT=""
DRY_RUN="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      FILE="$2"
      shift 2
      ;;
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required."
  exit 1
fi

if [[ ! -f "$FILE" ]]; then
  echo "CSV file not found: $FILE"
  exit 1
fi

mapfile -t LINES < "$FILE"
if [[ ${#LINES[@]} -le 1 ]]; then
  echo "No rows found in $FILE"
  exit 1
fi

# Skip header
COUNT=0
for ((i=1; i<${#LINES[@]}; i++)); do
  LINE="${LINES[$i]}"

  # Parse CSV using Node for robust quoted handling.
  PARSED=$(node -e '
const line = process.argv[1];
let inQ = false, cur = "", out = [];
for (let i = 0; i < line.length; i++) {
  const ch = line[i];
  if (ch === "\"") {
    if (inQ && line[i + 1] === "\"") { cur += "\""; i++; }
    else inQ = !inQ;
  } else if (ch === "," && !inQ) {
    out.push(cur); cur = "";
  } else cur += ch;
}
out.push(cur);
console.log(JSON.stringify(out));
' "$LINE")

  TITLE=$(node -e "const a = JSON.parse(process.argv[1]); process.stdout.write(a[0] || '');" "$PARSED")
  BODY=$(node -e "const a = JSON.parse(process.argv[1]); process.stdout.write(a[1] || '');" "$PARSED")
  LABELS=$(node -e "const a = JSON.parse(process.argv[1]); process.stdout.write(a[2] || '');" "$PARSED")
  MILESTONE=$(node -e "const a = JSON.parse(process.argv[1]); process.stdout.write(a[3] || '');" "$PARSED")

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "DRY-RUN: $TITLE | labels=$LABELS | milestone=$MILESTONE"
  else
    CMD=(gh issue create --title "$TITLE" --body "$BODY")
    if [[ -n "$LABELS" ]]; then
      IFS=',' read -ra LABEL_ARR <<< "$LABELS"
      for label in "${LABEL_ARR[@]}"; do
        [[ -n "$label" ]] && CMD+=(--label "$label")
      done
    fi
    if [[ -n "$MILESTONE" ]]; then
      CMD+=(--milestone "$MILESTONE")
    fi
    "${CMD[@]}"
    echo "Created: $TITLE"
  fi

  COUNT=$((COUNT + 1))
  if [[ -n "$LIMIT" && "$COUNT" -ge "$LIMIT" ]]; then
    break
  fi
done

echo "Processed $COUNT issue rows from $FILE"
