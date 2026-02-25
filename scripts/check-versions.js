#!/usr/bin/env node
/**
 * Verify all version strings across the repo are in sync.
 *
 * Run before cutting a release:
 *   node scripts/check-versions.js
 *
 * Exit 0 if all versions match, exit 1 if any are out of sync.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sources = [
  {
    file: "package.json",
    extract: (content) => JSON.parse(content).version,
  },
  {
    file: ".claude-plugin/plugin.json",
    extract: (content) => JSON.parse(content).version,
  },
  {
    file: ".claude-plugin/marketplace.json",
    extract: (content) => {
      const data = JSON.parse(content);
      return [data.version, data.plugins?.[0]?.version].filter(Boolean);
    },
    multi: true,
  },
  {
    file: "README.md",
    extract: (content) => {
      const match = content.match(/badge\/version-([\d.]+)/);
      return match ? match[1] : null;
    },
  },
];

let canonical = null;
let canonicalSource = null;
let ok = true;
const results = [];

for (const source of sources) {
  const filePath = path.join(ROOT, source.file);
  if (!fs.existsSync(filePath)) {
    results.push({ file: source.file, version: "MISSING", status: "warn" });
    continue;
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const raw = source.extract(content);
  const versions = source.multi ? raw : [raw];

  for (const version of versions) {
    if (!version) {
      results.push({ file: source.file, version: "NOT FOUND", status: "fail" });
      ok = false;
      continue;
    }

    if (!canonical) {
      canonical = version;
      canonicalSource = source.file;
    }

    const match = version === canonical;
    results.push({
      file: source.file,
      version,
      status: match ? "ok" : "fail",
    });
    if (!match) ok = false;
  }
}

// Also check CHANGELOG has an entry for this version
const changelogPath = path.join(ROOT, "CHANGELOG.md");
if (fs.existsSync(changelogPath)) {
  const changelog = fs.readFileSync(changelogPath, "utf-8");
  const hasEntry = changelog.includes(`## [${canonical}]`);
  results.push({
    file: "CHANGELOG.md",
    version: hasEntry ? canonical : "NO ENTRY",
    status: hasEntry ? "ok" : "fail",
  });
  if (!hasEntry) ok = false;
}

// Output
const symbol = { ok: "\u2713", fail: "\u2717", warn: "?" };
console.log(`\nVersion check (canonical: ${canonical} from ${canonicalSource})\n`);
for (const r of results) {
  const icon = symbol[r.status] || "?";
  console.log(`  ${icon}  ${r.file}: ${r.version}`);
}
console.log("");

if (!ok) {
  console.log("Version mismatch detected! Update all files before releasing.\n");
  process.exit(1);
} else {
  console.log("All versions in sync.\n");
}
