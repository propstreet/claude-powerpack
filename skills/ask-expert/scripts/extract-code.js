#!/usr/bin/env node
/**
 * Code Extractor for Expert Consultations
 *
 * Extracts file contents, line ranges, or git diffs with automatic size tracking
 * to stay within the 125 KB limit for expert consultation documents.
 *
 * @author Propstreet
 * @license MIT
 * @requires Node.js 18+
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";
import { execSync } from "child_process";

// ============================================================================
// Constants
// ============================================================================

/** Maximum size for expert consultation documents (125 KB) */
const MAX_SIZE_BYTES = 125 * 1024;

/** Warning threshold at 100 KB */
const WARNING_THRESHOLD_1 = 100 * 1024;

/** Warning threshold at 115 KB (very close to limit) */
const WARNING_THRESHOLD_2 = 115 * 1024;

/** Regex pattern for parsing file arguments with ranges/diffs */
const FILE_ARG_PATTERN = /^(.+?):([\d,:-]+|diff(?:=.+)?)$/;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes as human-readable size in KB
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "25.5 KB")
 */
function formatSize(bytes) {
  return (bytes / 1024).toFixed(1) + " KB";
}

/**
 * Detect programming language from file extension
 * @param {string} filePath - Path to file
 * @returns {string} Language identifier for syntax highlighting
 */
function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const langMap = {
    ".cs": "csharp",
    ".js": "javascript",
    ".ts": "typescript",
    ".vue": "vue",
    ".json": "json",
    ".md": "markdown",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".xml": "xml",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".sh": "bash",
    ".py": "python",
    ".jsx": "jsx",
    ".tsx": "tsx",
  };
  return langMap[ext] || "text";
}

// ============================================================================
// File Argument Parsing
// ============================================================================

/**
 * Parse file argument into path and range/diff specification
 * Supports formats:
 * - "path/to/file.cs" (full file)
 * - "path/to/file.cs:100-200" (line range)
 * - "path/to/file.cs:1-30,100-150" (multiple ranges)
 * - "path/to/file.cs:diff" (git diff vs master)
 * - "path/to/file.cs:diff=master..HEAD" (git diff with range)
 *
 * @param {string} fileArg - File argument from command line
 * @returns {{filePath: string, rangeStr: string|null}} Parsed components
 */
function parseFileArgument(fileArg) {
  const rangeMatch = fileArg.match(FILE_ARG_PATTERN);

  if (rangeMatch) {
    return {
      filePath: rangeMatch[1],
      rangeStr: rangeMatch[2],
    };
  }

  return {
    filePath: fileArg,
    rangeStr: null,
  };
}

// ============================================================================
// Git Operations
// ============================================================================

/**
 * Check if current directory is in a git repository
 * @throws {Error} If not in a git repository
 */
function validateGitRepository() {
  try {
    execSync("git rev-parse --git-dir", { stdio: "pipe" });
  } catch {
    throw new Error("Not in a git repository");
  }
}

/**
 * Split git diff range into individual refs for validation
 * @param {string} diffRange - Git range (e.g., "master", "master..HEAD", "HEAD~3")
 * @returns {string[]} Array of git refs to validate
 */
function splitGitRefs(diffRange) {
  return diffRange.includes("..")
    ? diffRange.split("..").filter((r) => r)
    : [diffRange];
}

/**
 * Validate that git references exist
 * @param {string[]} refs - Array of git refs to validate
 * @throws {Error} If any ref is invalid
 */
function validateGitRefs(refs) {
  for (const ref of refs) {
    try {
      execSync(`git rev-parse --verify ${ref}`, { stdio: "pipe" });
    } catch {
      throw new Error(`Invalid git reference: ${ref}`);
    }
  }
}

/**
 * Parse diff specification from range string
 * @param {string|null} specStr - Diff specification (e.g., "diff", "diff=master..HEAD")
 * @returns {{type: string, range: string}|null} Parsed diff spec or null
 */
function parseDiffSpec(specStr) {
  if (!specStr) {
    return null;
  }

  if (specStr === "diff") {
    return { type: "diff", range: "master" };
  }

  const match = specStr.match(/^diff=(.+)$/);
  if (match) {
    return { type: "diff", range: match[1] };
  }

  return null;
}

/**
 * Read git diff content for a file
 * @param {string} filePath - Absolute path to the file
 * @param {string} diffRange - Git range (e.g., "master", "master..HEAD", "HEAD~3")
 * @returns {string} Unified diff output
 * @throws {Error} If git operations fail
 */
function readDiffContent(filePath, diffRange) {
  try {
    validateGitRepository();

    // Validate all refs in the range
    const refs = splitGitRefs(diffRange);
    validateGitRefs(refs);

    // Get relative path from git root for git diff
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
    }).trim();
    const relativePath = path.relative(gitRoot, filePath);

    // Execute git diff
    const diffCommand = diffRange.includes("..")
      ? `git diff ${diffRange} -- "${relativePath}"`
      : `git diff ${diffRange} -- "${relativePath}"`;

    return execSync(diffCommand, {
      encoding: "utf8",
      cwd: gitRoot,
    });
  } catch (error) {
    // Re-throw with context
    if (
      error.message.includes("Not in a git repository") ||
      error.message.includes("Invalid git reference")
    ) {
      throw error;
    }
    throw new Error(`Git diff failed: ${error.message}`);
  }
}

// ============================================================================
// Line Range Operations
// ============================================================================

/**
 * Parse line range string into structured format
 * Supports: "10-20", "10:20", "10-20,50-60,100-150"
 *
 * @param {string|null} rangeStr - Line range string
 * @returns {{from: number, to: number}[]|null} Array of range objects or null
 * @throws {Error} If range format is invalid
 */
function parseLineRanges(rangeStr) {
  if (!rangeStr) {
    return null;
  }

  const ranges = rangeStr.split(",").map((r) => r.trim());
  const parsed = [];

  for (const range of ranges) {
    const match = range.match(/^(\d+)[-:](\d+)$/);
    if (!match) {
      throw new Error(
        `Invalid line range format: "${range}". Use format "10-20" or "10:20"`
      );
    }

    const from = parseInt(match[1], 10);
    const to = parseInt(match[2], 10);

    if (from < 1) {
      throw new Error(`Line numbers must be >= 1, got ${from}`);
    }

    if (to < from) {
      throw new Error(`End line (${to}) must be >= start line (${from})`);
    }

    parsed.push({ from, to });
  }

  return parsed;
}

/**
 * Read file content and optionally extract line ranges
 * @param {string} filePath - Absolute path to file
 * @param {{from: number, to: number}[]|null} lineRanges - Line ranges to extract
 * @returns {string} File content (full or extracted ranges)
 * @throws {Error} If line ranges exceed file length
 */
function readFileContent(filePath, lineRanges) {
  const content = fs.readFileSync(filePath, "utf8");

  if (!lineRanges || lineRanges.length === 0) {
    return content;
  }

  const lines = content.split("\n");
  const totalLines = lines.length;
  const extractedSegments = [];

  for (const range of lineRanges) {
    if (range.from > totalLines) {
      throw new Error(
        `Start line ${range.from} exceeds file length (${totalLines} lines)`
      );
    }

    const endLine = Math.min(range.to, totalLines);
    const segment = lines.slice(range.from - 1, endLine);
    extractedSegments.push(segment.join("\n"));
  }

  return extractedSegments.join("\n\n");
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Format file content as markdown code block
 * @param {string} filePath - Path to file
 * @param {string} language - Language for syntax highlighting
 * @param {string} content - File content
 * @param {{from: number, to: number}[]|null} lineRanges - Line ranges (for display)
 * @returns {string} Formatted markdown code block
 */
function formatCodeBlock(filePath, language, content, lineRanges) {
  let lineRangeStr = "";
  if (lineRanges && lineRanges.length > 0) {
    const rangeStrings = lineRanges.map((r) => `${r.from}-${r.to}`);
    lineRangeStr = ` (lines ${rangeStrings.join(", ")})`;
  }

  return `# File: ${filePath}${lineRangeStr}
\`\`\`${language}
${content}
\`\`\``;
}

/**
 * Format git diff output as markdown code block
 * @param {string} filePath - Path to file
 * @param {string} diffContent - Git diff output
 * @param {string} diffRange - Git range for display
 * @returns {string} Formatted markdown diff block
 */
function formatDiffBlock(filePath, diffContent, diffRange) {
  return `# File: ${filePath} (diff=${diffRange})
\`\`\`diff
${diffContent}
\`\`\``;
}

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate file argument without processing it
 * Checks file existence, git refs, and line ranges
 *
 * @param {string} fileArg - File argument from command line
 * @returns {{valid: boolean, fileArg?: string, error?: string}} Validation result
 */
function validateFile(fileArg) {
  const { filePath: parsedPath, rangeStr } = parseFileArgument(fileArg);

  // Resolve to absolute path
  const filePath = path.isAbsolute(parsedPath)
    ? parsedPath
    : path.resolve(process.cwd(), parsedPath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    const cwd = process.cwd();
    const suggestion = getSuggestion(filePath);
    return {
      valid: false,
      fileArg,
      error: `File not found: ${filePath}\n  Current directory: ${cwd}${suggestion}`,
    };
  }

  // Validate range specification if present
  if (rangeStr) {
    const diffSpec = parseDiffSpec(rangeStr);

    if (diffSpec) {
      // Validate git diff specification
      try {
        validateGitRepository();
        const refs = splitGitRefs(diffSpec.range);
        validateGitRefs(refs);
      } catch (error) {
        return {
          valid: false,
          fileArg,
          error: error.message,
        };
      }
    } else {
      // Validate line ranges
      try {
        const lineRanges = parseLineRanges(rangeStr);
        const content = fs.readFileSync(filePath, "utf8");
        const totalLines = content.split("\n").length;

        for (const range of lineRanges) {
          if (range.from > totalLines || range.to > totalLines) {
            return {
              valid: false,
              fileArg,
              error: `Line range ${range.from}-${range.to} exceeds file length (${totalLines} lines) in ${filePath}`,
            };
          }
        }
      } catch (error) {
        return {
          valid: false,
          fileArg,
          error: `Invalid line range format in "${fileArg}": ${error.message}`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Process a single file argument and return formatted content
 * @param {string} fileArg - File argument (path with optional range/diff spec)
 * @returns {string} Formatted markdown output
 * @throws {Error} If file processing fails
 */
function processFile(fileArg) {
  const { filePath: parsedPath, rangeStr } = parseFileArgument(fileArg);

  // Resolve to absolute path
  const filePath = path.isAbsolute(parsedPath)
    ? parsedPath
    : path.resolve(process.cwd(), parsedPath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    const cwd = process.cwd();
    const suggestion = getSuggestion(filePath);
    throw new Error(
      `File not found: ${filePath}\n  Current directory: ${cwd}${suggestion}`
    );
  }

  // Check for diff specification
  const diffSpec = rangeStr ? parseDiffSpec(rangeStr) : null;

  if (diffSpec) {
    // Handle git diff mode
    const diffContent = readDiffContent(filePath, diffSpec.range);

    // Handle empty diff
    if (!diffContent || diffContent.trim() === "") {
      return formatDiffBlock(
        filePath,
        `(No changes between ${diffSpec.range})`,
        diffSpec.range
      );
    }

    return formatDiffBlock(filePath, diffContent, diffSpec.range);
  }

  // Handle line range or full file mode
  const lineRanges = rangeStr ? parseLineRanges(rangeStr) : null;
  const language = detectLanguage(filePath);
  const content = readFileContent(filePath, lineRanges);

  return formatCodeBlock(filePath, language, content, lineRanges);
}

// ============================================================================
// Config File Operations
// ============================================================================

/**
 * Read and validate JSON config file
 * @param {string} configPath - Path to config file
 * @returns {object} Validated config object
 * @throws {Error} If config is invalid
 */
function readConfigFile(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  let config;
  try {
    const content = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse config file: ${error.message}`);
  }

  // Validate schema
  if (!config.sections || !Array.isArray(config.sections)) {
    throw new Error(
      'Config must have "sections" array. See example config for format.'
    );
  }

  if (config.sections.length === 0) {
    throw new Error("Config must have at least one section");
  }

  for (const [index, section] of config.sections.entries()) {
    if (!section.files || !Array.isArray(section.files)) {
      throw new Error(
        `Section ${index + 1} must have "files" array. Header: ${section.header || "(no header)"}`
      );
    }

    if (section.files.length === 0) {
      throw new Error(
        `Section ${index + 1} must have at least one file. Header: ${section.header || "(no header)"}`
      );
    }
  }

  return config;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Provide helpful error suggestions when file is not found
 * @param {string} filePath - Path that was not found
 * @returns {string} Suggestion text (empty if none applicable)
 */
function getSuggestion(filePath) {
  // Provide helpful suggestion for relative path issues
  if (!path.isAbsolute(filePath) && filePath.includes(path.sep)) {
    return `\n  💡 Tip: Verify you're in the correct directory:\n     pwd  # Check current directory\n     ls ${path.dirname(filePath)}  # Check parent directory exists`;
  }

  // Check if file exists with different casing
  const dir = path.dirname(filePath);
  const filename = path.basename(filePath);
  if (fs.existsSync(dir)) {
    try {
      const files = fs.readdirSync(dir);
      const match = files.find(
        (f) => f.toLowerCase() === filename.toLowerCase()
      );
      if (match && match !== filename) {
        return `\n  💡 Tip: File exists with different casing: ${match}`;
      }
    } catch {
      // Ignore directory read errors
    }
  }

  return "";
}

// ============================================================================
// CLI Interface
// ============================================================================

/**
 * Display help message
 */
function showHelp() {
  console.log(`
📄 Code Extractor for Expert Consultations

Usage:
  extract-code [options] <file1> [file2] [file3] ...
  extract-code --help

Arguments:
  file    File path with optional line range(s) or diff spec
          Formats:
            /path/to/file.cs                    (extract full file)
            /path/to/file.cs:10-50              (extract lines 10-50)
            /path/to/file.cs:10:50              (extract lines 10-50, alternative)
            /path/to/file.cs:10-50,100-150      (multiple ranges, comma-separated)
            /path/to/file.cs:1-30,86-213,500-600  (multiple ranges)
            /path/to/file.cs:diff               (git diff vs master)
            /path/to/file.cs:diff=master..HEAD  (git diff with explicit range)
            /path/to/file.cs:diff=HEAD~3        (git diff vs 3 commits ago)
            relative/path/file.cs               (resolved to absolute path)
            relative/path/file.cs:5-15          (with line range)

Options:
  --help, -h           Show this help message
  --output, -o <file>  Write output to file (appends to existing file)
  --track-size         Show size tracking and progress (requires --output)
  --section <header>   Add markdown section header before next file
                       Can be used multiple times for different files
  --config <file>      Use JSON config file for batch extraction
                       See example-config.json for format

Output:
  Prints markdown-formatted code blocks with file paths and line ranges.
  Output can be redirected to a file or piped to other commands.

Examples:
  # Extract full files
  extract-code src/Service.cs tests/ServiceTests.cs

  # Extract specific line ranges
  extract-code src/Service.cs:100-200 tests/ServiceTests.cs:50-75

  # Extract multiple ranges from a single file
  extract-code src/Service.cs:1-30,86-213

  # Mix full files and ranges
  extract-code src/Models/User.cs src/Service.cs:100-150

  # Show git diff vs master (default)
  extract-code src/Service.cs:diff

  # Show git diff with explicit range
  extract-code src/Service.cs:diff=master..feature-branch
  extract-code src/Service.cs:diff=HEAD~3..HEAD

  # Show what changed in recent commits
  extract-code src/Service.cs:diff=HEAD~5

  # Combine diffs with regular files
  extract-code src/Service.cs:diff src/Tests.cs:100-200

  # Save to file with size tracking (appends to existing file)
  extract-code --track-size --output=consultation.md src/Service.cs

  # Add section headers
  extract-code --section="Core Interfaces" Interface.cs \\
               --section="Domain Models" Contact.cs Company.cs \\
               --output=doc.md

  # Combined: size tracking + sections
  extract-code --track-size --output=doc.md \\
               --section="Core" Interface.cs \\
               --section="Tests" Tests.cs:100-200

  # Include diffs in consultation documents
  extract-code --track-size --output=consultation.md \\
               --section="What Changed" \\
               src/NetworkService.cs:diff \\
               src/PineconeHelper.cs:diff=master..feature-branch

  # Build document incrementally (appends each time)
  extract-code --track-size -o doc.md File1.cs
  extract-code --track-size -o doc.md File2.cs  # Appends to existing
  extract-code --track-size -o doc.md File3.cs  # Appends again

  # Traditional output redirection still works
  extract-code src/Service.cs > expert-consultation.md
  extract-code src/Tests.cs >> expert-consultation.md  # Append

  # Use config file for complex extractions
  extract-code --config=extraction-plan.json
  extract-code --config=extraction-plan.json --track-size  # Override trackSize

Notes:
  • Automatically detects language from file extension
  • Line numbers are 1-indexed (first line is line 1)
  • Line ranges are inclusive (10-20 includes both lines 10 and 20)
  • Multiple ranges are separated by blank lines in output
  • Supports 20+ file types (cs, js, ts, vue, py, etc.)
  • Error messages go to stderr, formatted output to stdout
  • --output mode always appends (matches >> behavior)
  • Size tracking shows warnings at 100KB, 115KB, errors at 125KB
  • Section headers apply to the immediately following file only
  • Diff mode requires git repository and valid refs
  • Diff output uses unified diff format (standard git diff)
`);
}

/**
 * Main entry point
 */
function main() {
  const options = {
    help: {
      type: "boolean",
      short: "h",
    },
    "track-size": {
      type: "boolean",
    },
    output: {
      type: "string",
      short: "o",
    },
    section: {
      type: "string",
      multiple: true,
    },
    config: {
      type: "string",
    },
  };

  let args;
  try {
    const parsed = parseArgs({ options, allowPositionals: true });
    args = parsed.values;
    args.positionals = parsed.positionals;
  } catch (error) {
    console.error(`❌ ${error.message}`);
    showHelp();
    process.exit(1);
  }

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Handle config file mode
  if (args.config) {
    try {
      const config = readConfigFile(args.config);
      processConfigFile(config, args);
      return;
    } catch (error) {
      console.error(`❌ Error processing config file: ${error.message}`);
      process.exit(1);
    }
  }

  if (!args.positionals || args.positionals.length === 0) {
    console.error("❌ No files specified");
    showHelp();
    process.exit(1);
  }

  // Filter out empty arguments
  const fileArgs = args.positionals.filter((arg) => arg && arg.trim() !== "");

  // VALIDATE ALL FILES FIRST - before writing anything
  const validationErrors = [];
  for (const fileArg of fileArgs) {
    const validation = validateFile(fileArg);
    if (!validation.valid) {
      validationErrors.push({
        fileArg: validation.fileArg,
        error: validation.error,
      });
    }
  }

  // If any validation errors, report them all and exit without modifying output
  if (validationErrors.length > 0) {
    console.error(
      `❌ Validation failed for ${validationErrors.length} file(s):\n`
    );
    for (const { fileArg, error } of validationErrors) {
      console.error(`  • "${fileArg}":`);
      console.error(`    ${error.replace(/\n/g, "\n    ")}`);
      console.error("");
    }
    console.error("⚠️  No files were written to avoid partial output.");
    process.exit(1);
  }

  const results = [];
  let hasErrors = false;
  let totalBytes = 0;
  let sectionIndex = 0;

  // Read existing file size if output file specified
  if (args.output && fs.existsSync(args.output)) {
    const stats = fs.statSync(args.output);
    totalBytes = stats.size;
    if (args["track-size"]) {
      console.error(`📄 ${args.output}: ${formatSize(totalBytes)} (existing)`);
    }
  }

  // Process each file
  for (const [index, fileArg] of fileArgs.entries()) {
    try {
      // Add section header if specified
      let output = "";
      if (args.section && sectionIndex < args.section.length) {
        const sectionHeader = args.section[sectionIndex];
        if (sectionHeader) {
          output = `### ${sectionHeader}\n\n`;
        }
        sectionIndex++;
      }

      const result = processFile(fileArg);
      output += result;
      results.push(output);

      // Calculate size
      const contentSize = Buffer.byteLength(output + "\n\n", "utf8");
      totalBytes += contentSize;

      // Write to file or collect for stdout
      if (args.output) {
        fs.appendFileSync(args.output, output + "\n\n", "utf8");
      }

      // Show progress if tracking size
      if (args["track-size"]) {
        const percent = ((totalBytes / MAX_SIZE_BYTES) * 100).toFixed(1);
        const filename = path.basename(fileArg.split(":")[0]);
        console.error(
          `[${index + 1}/${fileArgs.length}] ${filename} → +${formatSize(contentSize)} (${formatSize(totalBytes)} / 125 KB, ${percent}%)`
        );

        // Check thresholds
        if (totalBytes >= MAX_SIZE_BYTES) {
          console.error(
            `❌ Error: Exceeded 125 KB limit (${formatSize(totalBytes)})`
          );
          console.error(
            `   Stop processing to stay within expert consultation limits`
          );
          process.exit(1);
        } else if (totalBytes >= WARNING_THRESHOLD_2) {
          console.error(`⚠️  Very close to 125 KB limit!`);
        } else if (totalBytes >= WARNING_THRESHOLD_1) {
          console.error(`⚠️  Approaching 100 KB`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing "${fileArg}": ${error.message}`);
      hasErrors = true;
    }
  }

  if (results.length === 0) {
    console.error("\n❌ No files were successfully processed");
    process.exit(1);
  }

  // Output results to stdout if no output file specified
  if (!args.output) {
    console.log(results.join("\n\n"));
  } else if (args["track-size"]) {
    const status = hasErrors ? "⚠️  Completed with errors" : "✅ Saved";
    const fileCount = `${results.length} ${results.length === 1 ? "file" : "files"}`;
    console.error(
      `${status}: ${fileCount} to ${args.output} (${formatSize(totalBytes)} / 125 KB)`
    );
  }

  process.exit(hasErrors ? 1 : 0);
}

/**
 * Process files from config file
 * @param {object} config - Validated config object
 * @param {object} args - Parsed command-line arguments
 */
function processConfigFile(config, args) {
  let totalBytes = 0;
  let totalFilesProcessed = 0;
  let hasErrors = false;

  // Use output from config or args
  const outputFile = args.output || config.output;
  const trackSize = args["track-size"] || config.trackSize || false;

  if (!outputFile) {
    console.error(
      "❌ Config mode requires output file. Specify in config file or use --output flag"
    );
    process.exit(1);
  }

  // Read existing file size if output file exists
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    totalBytes = stats.size;
    if (trackSize) {
      console.error(`📄 ${outputFile}: ${formatSize(totalBytes)} (existing)`);
    }
  }

  // VALIDATE ALL FILES FIRST - before writing anything
  const validationErrors = [];
  for (const section of config.sections) {
    for (const fileArg of section.files) {
      const validation = validateFile(fileArg);
      if (!validation.valid) {
        validationErrors.push({
          fileArg: validation.fileArg,
          error: validation.error,
          section: section.header || "(no header)",
        });
      }
    }
  }

  // If any validation errors, report them all and exit without modifying output
  if (validationErrors.length > 0) {
    console.error(
      `❌ Validation failed for ${validationErrors.length} file(s):\n`
    );
    for (const { fileArg, error, section } of validationErrors) {
      console.error(`  • "${fileArg}" in section "${section}":`);
      console.error(`    ${error.replace(/\n/g, "\n    ")}`);
      console.error("");
    }
    console.error("⚠️  No files were written to avoid partial output.");
    process.exit(1);
  }

  // Process each section
  for (const [sectionIndex, section] of config.sections.entries()) {
    if (trackSize) {
      console.error(
        `[Section ${sectionIndex + 1}/${config.sections.length}] ${section.header || "(no header)"}`
      );
    }

    // Add section header if specified
    if (section.header) {
      const headerContent = `### ${section.header}\n\n`;
      fs.appendFileSync(outputFile, headerContent, "utf8");
      totalBytes += Buffer.byteLength(headerContent, "utf8");
    }

    // Process each file in section
    for (const [fileIndex, fileArg] of section.files.entries()) {
      try {
        const result = processFile(fileArg);
        const content = result + "\n\n";
        const contentSize = Buffer.byteLength(content, "utf8");
        totalBytes += contentSize;

        // Write to file
        fs.appendFileSync(outputFile, content, "utf8");
        totalFilesProcessed++;

        // Show progress if tracking size
        if (trackSize) {
          const percent = ((totalBytes / MAX_SIZE_BYTES) * 100).toFixed(1);
          const filename = path.basename(fileArg.split(":")[0]);
          console.error(
            `  [${fileIndex + 1}/${section.files.length}] ${filename} → +${formatSize(contentSize)} (${formatSize(totalBytes)} / 125 KB, ${percent}%)`
          );

          // Check thresholds
          if (totalBytes >= MAX_SIZE_BYTES) {
            console.error(
              `❌ Error: Exceeded 125 KB limit (${formatSize(totalBytes)})`
            );
            console.error(
              `   Stop processing to stay within expert consultation limits`
            );
            process.exit(1);
          } else if (totalBytes >= WARNING_THRESHOLD_2) {
            console.error(`⚠️  Very close to 125 KB limit!`);
          } else if (totalBytes >= WARNING_THRESHOLD_1) {
            console.error(`⚠️  Approaching 100 KB`);
          }
        }
      } catch (error) {
        console.error(
          `❌ Error processing "${fileArg}" in section "${section.header || "(no header)"}": ${error.message}`
        );
        hasErrors = true;
      }
    }
  }

  if (trackSize) {
    const status = hasErrors ? "⚠️  Completed with errors" : "✅ Saved";
    const fileCount = `${totalFilesProcessed} ${totalFilesProcessed === 1 ? "file" : "files"}`;
    const sectionCount = `${config.sections.length} ${config.sections.length === 1 ? "section" : "sections"}`;
    console.error(
      `${status}: ${fileCount}, ${sectionCount} to ${outputFile} (${formatSize(totalBytes)} / 125 KB)`
    );
  }

  process.exit(hasErrors ? 1 : 0);
}

// ============================================================================
// Entry Point
// ============================================================================

// Handle unhandled errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});

// Run the script only if executed directly (not imported)
const scriptPath = path.normalize(process.argv[1]);
const modulePath = path.normalize(fileURLToPath(import.meta.url));
if (modulePath === scriptPath) {
  try {
    main();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}
