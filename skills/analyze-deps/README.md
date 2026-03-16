# Analyze Dependencies Skill

Generate changelog analysis reports for dependency updates with breaking changes, new features, and actionable recommendations.

## Supported Ecosystems

- **npm** — detected via `package.json`
- **NuGet** — detected via `Directory.Packages.props` or `*.csproj`

Future versions may add support for pip, cargo, go modules, and other ecosystems.

## Example Prompts

```
"Analyze what changed after the dependency update"
"Run a preflight check before updating packages"
"What breaking changes are in vue 3.5 to 3.6?"
"Analyze deps for frontend only"
"What would break if we update NuGet packages?"
```

## Modes

| Mode | Command | Description |
|------|---------|-------------|
| Post-update | `/analyze-deps` | Analyze changes already applied (git diff) |
| Preflight | `/analyze-deps preflight` | Research what's outdated before updating |
| Scoped (npm) | `/analyze-deps frontend` | npm packages only |
| Scoped (NuGet) | `/analyze-deps backend` | NuGet packages only |
| Specific | `/analyze-deps vue 3.5 to 3.6` | Research a single package |

## Research Sources

The skill fetches release notes from multiple sources in priority order:

1. **Context7 MCP** — library documentation (if available)
2. **GitHub Releases API** — structured release notes
3. **WebSearch** — release announcements and blog posts
4. **WebFetch** — raw CHANGELOG.md files

## Report Sections

- **Breaking Changes** — with affected code paths
- **New Features Worth Adopting** — with concrete project use cases
- **Performance Improvements** — speed, memory, bundle size
- **Deprecation Warnings** — only APIs you actually use
- **Security Fixes** — CVEs and advisories
- **Recommendations** — quick wins, planned work, watch list

## Requirements

- **Git** — for detecting changes
- **gh CLI** — for GitHub Releases API ([install](https://cli.github.com/))
- **ncu** (optional) — for npm preflight mode (`npm install -g npm-check-updates`)

## License

MIT — See [LICENSE](../../LICENSE) for details.
