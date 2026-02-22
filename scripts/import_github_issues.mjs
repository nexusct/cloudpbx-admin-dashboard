#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function parseArgs(argv) {
  const args = {
    file: "github_issues_import.csv",
    limit: null,
    offset: 0,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--file") {
      args.file = argv[i + 1];
      i += 1;
    } else if (arg === "--limit") {
      args.limit = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--offset") {
      args.offset = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (!(row.length === 1 && row[0] === "")) rows.push(row);
      row = [];
    } else if (ch === "\r") {
      // ignore CR, LF handling is above
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
  }

  return rows;
}

function rowsToObjects(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0];
  const objects = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const obj = {};
    for (let j = 0; j < headers.length; j += 1) {
      obj[headers[j]] = row[j] ?? "";
    }
    objects.push(obj);
  }

  return objects;
}

function haveGhCli() {
  const check = spawnSync("gh", ["--version"], { encoding: "utf8" });
  return check.status === 0;
}

function createIssue(issue, { dryRun }) {
  const labels = (issue.labels || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  if (dryRun) {
    console.log(
      `DRY-RUN: ${issue.title} | labels=${labels.join("|")} | milestone=${issue.milestone || "-"}`,
    );
    return { ok: true };
  }

  const baseArgs = ["issue", "create", "--title", issue.title, "--body", issue.body];
  for (const label of labels) {
    baseArgs.push("--label", label);
  }
  const baseArgsNoLabels = ["issue", "create", "--title", issue.title, "--body", issue.body];

  // Try with milestone first if present, then retry without milestone if it fails.
  if (issue.milestone) {
    const withMilestone = spawnSync(
      "gh",
      [...baseArgs, "--milestone", issue.milestone],
      { encoding: "utf8" },
    );
    if (withMilestone.status === 0) {
      return { ok: true, out: withMilestone.stdout.trim() };
    }

    const withoutMilestone = spawnSync("gh", baseArgs, { encoding: "utf8" });
    if (withoutMilestone.status === 0) {
      return { ok: true, out: withoutMilestone.stdout.trim(), milestoneSkipped: true };
    }

    const noLabelsNoMilestone = spawnSync("gh", baseArgsNoLabels, { encoding: "utf8" });
    if (noLabelsNoMilestone.status === 0) {
      return {
        ok: true,
        out: noLabelsNoMilestone.stdout.trim(),
        milestoneSkipped: true,
        labelsSkipped: true,
      };
    }

    return {
      ok: false,
      err: (withMilestone.stderr || withoutMilestone.stderr || noLabelsNoMilestone.stderr || "").trim(),
    };
  }

  const res = spawnSync("gh", baseArgs, { encoding: "utf8" });
  if (res.status === 0) {
    return { ok: true, out: res.stdout.trim() };
  }

  const noLabels = spawnSync("gh", baseArgsNoLabels, { encoding: "utf8" });
  if (noLabels.status === 0) {
    return { ok: true, out: noLabels.stdout.trim(), labelsSkipped: true };
  }

  return { ok: false, err: (res.stderr || noLabels.stderr || "").trim() };
}

function main() {
  const args = parseArgs(process.argv);
  const filePath = path.resolve(process.cwd(), args.file);

  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }
  if (!haveGhCli()) {
    throw new Error("gh CLI is required and must be on PATH.");
  }

  const csv = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(csv);
  const issues = rowsToObjects(rows);

  const offset = Number.isFinite(args.offset) && args.offset > 0 ? args.offset : 0;
  const limit = Number.isFinite(args.limit) && args.limit > 0 ? args.limit : Math.max(issues.length - offset, 0);
  const slice = issues.slice(offset, offset + limit);

  let success = 0;
  let failed = 0;

  for (const issue of slice) {
    const result = createIssue(issue, { dryRun: args.dryRun });
    if (result.ok) {
      success += 1;
      if (!args.dryRun) {
        const flags = [];
        if (result.milestoneSkipped) flags.push("milestone skipped");
        if (result.labelsSkipped) flags.push("labels skipped");
        const suffix = flags.length ? ` (${flags.join(", ")})` : "";
        console.log(`Created: ${issue.title}${suffix}`);
      }
    } else {
      failed += 1;
      console.error(`Failed: ${issue.title}`);
      console.error(result.err);
    }
  }

  console.log(
    `Processed ${slice.length} issues from ${path.basename(filePath)} starting at offset=${offset} | success=${success} failed=${failed}`,
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();
