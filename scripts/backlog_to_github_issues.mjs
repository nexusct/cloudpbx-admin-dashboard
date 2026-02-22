#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsv(text) {
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = cols[j] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toIssueRow(ticket) {
  const title = `[${ticket.id}] ${ticket.ticket}`;
  const body = [
    `Backlog ID: ${ticket.id}`,
    `Epic: ${ticket.epic}`,
    `Owner Role: ${ticket.owner_role}`,
    `Sprint: ${ticket.sprint}`,
    `Priority: ${ticket.priority}`,
    `Dependencies: ${ticket.dependencies || "None"}`,
    "",
    "Acceptance Test:",
    `${ticket.acceptance_test}`,
    "",
    "Definition of Done:",
    "1. Code merged with linked tests",
    "2. Rollback note documented",
    "3. Test evidence attached",
  ].join("\n");

  const labels = [
    `epic:${ticket.epic.toLowerCase().replace(/\s+/g, "-")}`,
    `owner:${ticket.owner_role.toLowerCase().replace(/\s+/g, "-")}`,
    `priority:${ticket.priority.toLowerCase()}`,
    `sprint:${ticket.sprint.toLowerCase()}`,
  ].join(",");

  const milestone = ticket.sprint;

  return { title, body, labels, milestone };
}

function main() {
  const inputPath = path.resolve(process.cwd(), "agent_backlog.csv");
  const outputPath = path.resolve(process.cwd(), "github_issues_import.csv");

  const input = fs.readFileSync(inputPath, "utf8");
  const tickets = parseCsv(input);
  const issueRows = tickets.map(toIssueRow);

  const header = ["title", "body", "labels", "milestone"];
  const outputLines = [header.join(",")];

  for (const row of issueRows) {
    outputLines.push(
      [
        csvEscape(row.title),
        csvEscape(row.body),
        csvEscape(row.labels),
        csvEscape(row.milestone),
      ].join(","),
    );
  }

  fs.writeFileSync(outputPath, `${outputLines.join("\n")}\n`, "utf8");
  console.log(`Generated ${outputPath} with ${issueRows.length} issues`);
}

main();
