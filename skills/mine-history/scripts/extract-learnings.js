#!/usr/bin/env node
/**
 * History Mining: Extract correction pairs from Claude Code session transcripts.
 *
 * Scans all session JSONL files for user corrections (messages that correct or
 * redirect Claude), pairs them with the preceding assistant context, and outputs
 * a compact markdown file with all high-signal learnings.
 *
 * @license MIT
 * @requires Node.js 18+
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { parseArgs } from "util";

// ============================================================================
// CLI Arguments
// ============================================================================

const { values: args } = parseArgs({
  options: {
    project: { type: "string", short: "p" },
    output: { type: "string", short: "o", default: "learnings-raw.md" },
    "max-pairs": { type: "string", short: "m", default: "500" },
    "min-correction-length": { type: "string", default: "15" },
    "since-days": { type: "string", default: "90" },
    "batch-size": { type: "string", short: "b", default: "0" },
    "batch-offset": { type: "string", default: "0" },
    verbose: { type: "boolean", short: "v", default: false },
  },
});

const CLAUDE_DIR = path.join(process.env.HOME, ".claude");
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects");
const MAX_PAIRS = parseInt(args["max-pairs"], 10);
const MIN_CORRECTION_LENGTH = parseInt(args["min-correction-length"], 10);
const SINCE_DAYS = parseInt(args["since-days"], 10);
const BATCH_SIZE = parseInt(args["batch-size"], 10); // 0 = all at once
const BATCH_OFFSET = parseInt(args["batch-offset"], 10);
const VERBOSE = args.verbose;

// ============================================================================
// Correction Detection
// ============================================================================

/** Patterns that strongly signal a user correction or mandate */
const CORRECTION_PATTERNS = [
  // Direct corrections
  /^no[,.\s!]/i,
  /^wrong/i,
  /^incorrect/i,
  /^that's not/i,
  /^this is not/i,
  /^not quite/i,
  /^not really/i,

  // Redirections
  /^instead[,\s]/i,
  /^actually[,\s]/i,
  /^rather[,\s]/i,
  /^but\s/i,

  // Mandates
  /^never\s/i,
  /^always\s/i,
  /^don'?t\s/i,
  /^dont\s/i,
  /^do not\s/i,

  // Process corrections
  /^use\s.+\s(instead|not)\s/i,
  /^you (need|should|must|have)\sto/i,
  /^you can'?t/i,
  /^we (should|must|need|always|never)/i,
  /^this (should|must|needs)/i,
  /^that (should|must|needs)/i,

  // Learning/pattern signals
  /^(read|check|follow|see)\s(our|the)\s(docs|guidelines|patterns|conventions)/i,
  /^(read|check|follow)\s(our|the)\s/i,

  // Tool/workflow corrections
  /npm\s+run\s/i,
  /not\s+use\s/i,
  /use\s.+not\s/i,
];

/** Patterns that indicate noise (not real corrections) */
const NOISE_PATTERNS = [
  // System/tool content
  /^\[pasted\s+text/i,
  /^\[image/i,
  /^\/\w+/, // slash commands
  /^<command/i,
  /^<local-command/i,
  /^<teammate-message/i, // agent team task assignments
  /^<task-notification/i, // agent task completions
  /^<user-prompt-submit-hook/i, // hook feedback
  /^\{"type":\s*"task/i, // JSON task messages

  // Simple confirmations / non-corrections
  /^(yes|ok|sure|good|great|thanks|perfect|done|continue|commit|push)\s*$/i,
  /^(yes|ok|sure|good|great|thanks|perfect|done|continue|commit|push)[,.!\s]*$/i,
  /^(lgtm|looks good|ship it|approved|merge it)\b/i,
  /^no\s+(this is|that is|worries|need|problem|that'?s)\s+(good|fine|ok|enough)/i, // "no this is good enough"
  /^no\s+(worries|problem|rush|hurry)/i, // "no worries"

  // Session management / skill invocations
  /^base directory for this skill/i,
  /^this session is being continued/i,
  /^#\s+(session debrief|pr simplification)/i,
  /^implement the following plan/i,

  // Expert consultations (pasting external expert responses)
  /use expert skill/i,
  /expert\s+(response|answer|consultation)/i,
  /^(here is|here are|here comes)\s+(an? )?expert/i,
  /responses? arrived/i,
  /^EXPERT\s*\d/i,
  /synthesize.*expert/i,
  /help synte[sz]i[sz]e/i,
  /^(I have|i've) got (two|three|multiple) (different )?expert/i,

  // Task delegation / status (not corrections)
  /^(check|look at|review|read)\s+(the )?(most recent )?(pr|pull request)\s+(review )?comments?/i,
  /cross.?check against (code|the)/i,

  // Contextual non-corrections ("no" + context, not "no" + correction)
  /^no\s+the\s+\w+\s+is\s+(on|in|at)\s/i, // "no the scalar is on master" — pointing at location, not correcting
  /^no\s+(worries|rush|problem|it'?s?\s+(fine|ok|good))/i, // dismissals, not corrections
  /^no\s+(just|it'?s?\s+just)/i, // "no just..." - clarifications
];

/** Strip XML/HTML-like tags and their content from text before scoring */
function stripTags(text) {
  return text
    .replace(/<teammate-message[\s\S]*?(<\/teammate-message>|$)/g, "")
    .replace(/<task-notification[\s\S]*?(<\/task-notification>|$)/g, "")
    .replace(/<system-reminder[\s\S]*?(<\/system-reminder>|$)/g, "")
    .replace(/<[a-z][\w-]*[^>]*>[\s\S]*?<\/[a-z][\w-]*>/g, "") // generic paired tags
    .trim();
}

/**
 * Get the "first sentence" of a message — the part before any markdown headers,
 * code blocks, or multi-paragraph structure. This is where corrections live.
 */
function getLeadText(text) {
  // Take text before first markdown header, code block, or blank line
  const lines = text.split("\n");
  const leadLines = [];
  for (const line of lines) {
    if (/^#{1,4}\s/.test(line) && leadLines.length > 0) break; // markdown header (not first line)
    if (/^```/.test(line)) break; // code block
    if (/^\s*$/.test(line) && leadLines.length > 0) break; // blank line after content
    if (/^\|/.test(line)) break; // markdown table
    leadLines.push(line);
  }
  return leadLines.join(" ").trim();
}

/**
 * Score a user message for correction signal strength.
 * Returns 0 (no signal) to 5 (strongest correction).
 *
 * Philosophy: Real corrections are SHORT and DIRECT. Long messages are
 * almost never pure corrections — they're task descriptions, expert pastes,
 * or context dumps that happen to contain correction-like words.
 */
function scoreCorrection(text) {
  if (!text || text.length < MIN_CORRECTION_LENGTH) return 0;

  // Strip XML tags first
  const cleaned = stripTags(text);
  if (!cleaned || cleaned.length < MIN_CORRECTION_LENGTH) return 0;

  // Filter noise patterns on original text (tags may be at start)
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(text)) return 0;
  }

  // Score based on the lead text (first sentence/paragraph)
  const lead = getLeadText(cleaned);
  if (!lead || lead.length < MIN_CORRECTION_LENGTH) return 0;

  let score = 0;

  // Match correction patterns against lead text only
  for (const pattern of CORRECTION_PATTERNS) {
    if (pattern.test(lead)) {
      score += 1;
    }
  }

  if (score === 0) return 0;

  // Bonus for containing documentation/pattern keywords
  if (/guideline|pattern|convention|docs|our\s+(code|project)/i.test(lead)) {
    score += 1;
  }

  // === Brevity bonus: short, direct messages are highest signal ===
  const charLen = cleaned.length;
  if (charLen <= 100) {
    score += 2; // Very short = very likely a real correction
  } else if (charLen <= 200) {
    score += 1; // Short = probably real
  } else if (charLen > 800) {
    score -= 1; // Long = probably context/task description
  }
  if (charLen > 1500) {
    score -= 1; // Very long = almost certainly not a correction
  }

  // === Penalty for structural complexity (multi-paragraph, markdown) ===
  const lineCount = cleaned.split("\n").length;
  if (lineCount > 10) {
    score -= 1; // Multi-paragraph messages are rarely pure corrections
  }
  if (lineCount > 25) {
    score -= 1;
  }

  // Penalty for markdown-heavy messages (headers, tables, code blocks)
  const markdownHeaders = (cleaned.match(/^#{1,4}\s/gm) || []).length;
  if (markdownHeaders >= 2) {
    score -= 1; // Structured documents, not corrections
  }

  return Math.max(0, Math.min(5, score));
}

// ============================================================================
// Topic Classification
// ============================================================================

const TOPIC_KEYWORDS = {
  testing: /\btest\b|vitest|jest|xunit|pytest|\bmock\b|fixture|\bspec\b|\btdd\b|flaky|\bci[\s,]/i,
  frontend: /vue|react|angular|component|pinia|store|\bref\b|computed|css|bootstrap|template|tailwind/i,
  database: /ef\s?core|migration|prisma|drizzle|linq|query|\bsql\b|entity|db\s?context|typeorm|sequelize/i,
  api: /controller|endpoint|\bapi\b|\bdto\b|validation|rest\b|graphql/i,
  tools: /\bmcp\b|\btool\b|smart.?id|\bagent\b|\bplugin\b|\bskill\b/i,
  services: /\bservice\b|background.?job|hangfire|cron|signalr|websocket|queue/i,
  translations: /translat|i18n|resx|locali/i,
  git: /\bcommit\b|\bbranch\b|\bmerge\b|\bpush\b|\brebase\b|\bamend\b|\bpr\b/i,
  prompts: /\bprompt\b|\bllm\b|\bgpt\b|openai|copilot|claude|gemini/i,
  workflow: /npm\s+run|\bbuild\b|\blint\b|\bdeploy\b|\bdocker\b|pipeline|\bci\b/i,
  architecture: /architect|pattern|refactor|abstract|interface|\bdesign\b/i,
};

function classifyTopic(text) {
  const topics = [];
  for (const [topic, pattern] of Object.entries(TOPIC_KEYWORDS)) {
    if (pattern.test(text)) {
      topics.push(topic);
    }
  }
  return topics.length > 0 ? topics : ["general"];
}

// ============================================================================
// Session Processing
// ============================================================================

/**
 * Extract the text content from a message's content field.
 * Handles both string content and array content (with text blocks).
 */
function extractText(message) {
  if (!message?.content) return "";
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text || "")
      .join("\n")
      .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, "")
      .replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/g, "")
      .replace(/<teammate-message[\s\S]*?(<\/teammate-message>|$)/g, "")
      .replace(/<task-notification[\s\S]*?(<\/task-notification>|$)/g, "")
      .replace(/<user-prompt-submit-hook[\s\S]*?(<\/user-prompt-submit-hook>|$)/g, "")
      .trim();
  }
  return "";
}

/**
 * Truncate text to maxLen, preserving word boundaries.
 */
function truncate(text, maxLen = 300) {
  if (!text || text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.7 ? cut.slice(0, lastSpace) : cut) + " ...";
}

/**
 * Process a single session JSONL file.
 * Returns an array of { userText, assistantContext, score, topics, timestamp, sessionFile }.
 */
async function processSession(filePath) {
  const pairs = [];
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let prevAssistantText = "";
  let prevAssistantTimestamp = null;

  for await (const line of rl) {
    let record;
    try {
      record = JSON.parse(line);
    } catch {
      continue;
    }

    if (record.type === "assistant" && record.message) {
      prevAssistantText = extractText(record.message);
      prevAssistantTimestamp = record.timestamp;
      continue;
    }

    if (record.type === "user" && record.message) {
      const userText = extractText(record.message);
      const score = scoreCorrection(userText);

      if (score > 0) {
        pairs.push({
          userText: truncate(userText, 300),
          assistantContext: truncate(prevAssistantText, 200),
          charLen: userText.length,
          score,
          topics: classifyTopic(userText),
          timestamp: record.timestamp || prevAssistantTimestamp,
          sessionFile: path.basename(filePath),
        });
      }

      // Reset assistant context after processing
      prevAssistantText = "";
      prevAssistantTimestamp = null;
    }
  }

  return pairs;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  // Resolve project directory
  let projectDir;
  if (args.project) {
    // Encode project path the same way Claude Code does
    const encoded = args.project.replace(/\//g, "-");
    projectDir = path.join(PROJECTS_DIR, encoded);
  } else {
    // Auto-detect: use the project dir with the most session files
    const dirs = fs.readdirSync(PROJECTS_DIR).filter((d) => {
      const p = path.join(PROJECTS_DIR, d);
      return fs.statSync(p).isDirectory();
    });

    let maxFiles = 0;
    for (const d of dirs) {
      const p = path.join(PROJECTS_DIR, d);
      const files = fs.readdirSync(p).filter((f) => f.endsWith(".jsonl"));
      if (files.length > maxFiles) {
        maxFiles = files.length;
        projectDir = p;
      }
    }
  }

  if (!projectDir || !fs.existsSync(projectDir)) {
    console.error(`Project directory not found: ${projectDir}`);
    process.exit(1);
  }

  // Find session files
  const cutoffMs = Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000;
  const sessionFiles = fs
    .readdirSync(projectDir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({
      name: f,
      path: path.join(projectDir, f),
      mtime: fs.statSync(path.join(projectDir, f)).mtimeMs,
    }))
    .filter((f) => f.mtime >= cutoffMs)
    .sort((a, b) => b.mtime - a.mtime);

  console.error(`Found ${sessionFiles.length} sessions in last ${SINCE_DAYS} days`);
  console.error(`Project: ${projectDir}`);

  // Apply batch windowing if requested
  if (BATCH_SIZE > 0) {
    const start = BATCH_OFFSET;
    const end = Math.min(start + BATCH_SIZE, sessionFiles.length);
    console.error(`Batch: sessions ${start}-${end - 1} of ${sessionFiles.length}`);
    sessionFiles.splice(end);
    sessionFiles.splice(0, start);
  }

  // Process all sessions
  let allPairs = [];
  let processed = 0;

  for (const sf of sessionFiles) {
    try {
      const pairs = await processSession(sf.path);
      allPairs.push(...pairs);
      processed++;

      if (VERBOSE && pairs.length > 0) {
        console.error(`  ${sf.name}: ${pairs.length} corrections`);
      }
    } catch (err) {
      if (VERBOSE) {
        console.error(`  ${sf.name}: ERROR ${err.message}`);
      }
    }
  }

  console.error(`Processed ${processed} sessions, found ${allPairs.length} corrections`);

  // Deduplicate by user text (keep highest-scored instance)
  const seen = new Map();
  for (const pair of allPairs) {
    const key = pair.userText.toLowerCase().trim();
    const existing = seen.get(key);
    if (!existing || pair.score > existing.score) {
      if (existing) {
        pair.occurrences = (existing.occurrences || 1) + 1;
      }
      seen.set(key, pair);
    } else {
      existing.occurrences = (existing.occurrences || 1) + 1;
    }
  }
  const deduped = allPairs.length;
  allPairs = [...seen.values()];
  if (allPairs.length < deduped) {
    console.error(`Deduplicated: ${deduped} → ${allPairs.length} unique corrections`);
  }

  // Boost score for corrections that appear in multiple sessions (recurring pattern)
  for (const pair of allPairs) {
    if (pair.occurrences && pair.occurrences >= 2) {
      pair.score = Math.min(5, pair.score + 1);
      pair.recurring = true;
    }
  }

  // Sort by score (highest first), then by timestamp (newest first)
  allPairs.sort((a, b) => b.score - a.score || (b.timestamp || 0) - (a.timestamp || 0));

  // Cap at max pairs
  if (allPairs.length > MAX_PAIRS) {
    allPairs = allPairs.slice(0, MAX_PAIRS);
    console.error(`Capped at ${MAX_PAIRS} pairs (use --max-pairs to adjust)`);
  }

  // Group by topic
  const byTopic = {};
  for (const pair of allPairs) {
    for (const topic of pair.topics) {
      if (!byTopic[topic]) byTopic[topic] = [];
      byTopic[topic].push(pair);
    }
  }

  // Generate output markdown
  const lines = [
    "# Extracted Learnings from Claude Code Session History",
    "",
    `> ${allPairs.length} corrections from ${processed} sessions (last ${SINCE_DAYS} days)`,
    `> Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
  ];

  // Sort topics by count
  const sortedTopics = Object.entries(byTopic).sort((a, b) => b[1].length - a[1].length);

  for (const [topic, pairs] of sortedTopics) {
    lines.push(`## ${topic} (${pairs.length})`);
    lines.push("");

    for (const pair of pairs) {
      const date = pair.timestamp
        ? new Date(typeof pair.timestamp === "string" ? pair.timestamp : pair.timestamp).toISOString().slice(0, 10)
        : "unknown";
      const scoreStars = "★".repeat(pair.score) + "☆".repeat(5 - pair.score);
      const recurTag = pair.recurring ? ` 🔁×${pair.occurrences}` : "";

      lines.push(`### ${scoreStars} ${date} (${pair.charLen} chars)${recurTag}`);
      lines.push("");
      lines.push(`**User:** ${pair.userText}`);
      if (pair.assistantContext) {
        // Escape markdown headers in context to prevent them from being parsed as section headers
        const safeContext = pair.assistantContext.replace(/^(#{1,4})\s/gm, "$1\\");
        lines.push("");
        lines.push(`**Context:** ${safeContext}`);
      }
      lines.push("");
    }
  }

  // Write output
  const output = lines.join("\n");
  fs.writeFileSync(args.output, output, "utf-8");
  console.error(`\nOutput: ${args.output} (${(output.length / 1024).toFixed(1)} KB)`);

  // Summary stats
  console.error("\nTopic distribution:");
  for (const [topic, pairs] of sortedTopics) {
    console.error(`  ${topic}: ${pairs.length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
