# Contributing to Claude Powerpack

Thank you for your interest in contributing! This plugin aims to provide high-quality, production-ready productivity tools for the Claude Code community.

## How to Contribute

### Reporting Issues

- Use [GitHub Issues](https://github.com/propstreet/claude-powerpack/issues)
- Provide clear reproduction steps
- Include Claude Code version and environment details
- For skill-specific issues, mention the skill name

### Suggesting New Skills or Features

- Open a [GitHub Discussion](https://github.com/propstreet/claude-powerpack/discussions)
- Describe the use case and expected behavior
- Explain how it improves productivity or solves a problem

### Submitting Code

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-improvement`
3. **Make your changes**:
   - Follow existing code style and patterns
   - Add comprehensive documentation
   - Include examples and usage instructions
4. **Test thoroughly**:
   - Test locally using plugin installation
   - Verify all components work as expected
   - Ensure compatibility with different environments
5. **Commit with clear messages**:
   ```
   feat: improve code extraction performance

   - Add caching for file reads
   - Optimize git diff operations
   - Include performance benchmarks
   ```
6. **Submit a pull request** with:
   - Clear description of changes
   - Reference to related issues
   - Testing details

## Code Quality Standards

### Documentation
- ✅ Clear README with installation and usage instructions
- ✅ Examples of common use cases
- ✅ Troubleshooting guide
- ✅ License information

### Code Quality
- ✅ Well-commented code (JSDoc for functions)
- ✅ DRY principles applied
- ✅ Proper error handling
- ✅ Linted and formatted (ESLint + Prettier)

### Skills
- ✅ Clear activation criteria in SKILL.md description
- ✅ Proper YAML frontmatter with allowed-tools
- ✅ Progressive disclosure (keep SKILL.md concise, details in EXAMPLES.md)
- ✅ Version documented in plugin.json

### Testing
- ✅ Tested locally before submission
- ✅ Verified on multiple operating systems if applicable
- ✅ Includes test cases or usage examples

## Development Workflow

### Local Testing

1. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/claude-powerpack.git
   cd claude-powerpack
   ```

2. **Make your changes**

3. **Test the plugin locally**:
   ```shell
   # In Claude Code
   /plugin install YOUR-USERNAME/claude-powerpack
   ```

4. **Verify functionality**:
   - Test skill activation
   - Try all features
   - Check edge cases

5. **Iterate on changes**:
   ```shell
   /plugin uninstall claude-powerpack
   # Make changes
   /plugin install YOUR-USERNAME/claude-powerpack
   ```

## Code Style

### JavaScript/Node.js
- Use ESLint with project settings
- Run Prettier for formatting
- Add JSDoc comments for all functions
- Use clear, descriptive variable names

### Markdown
- Use proper heading hierarchy
- Include code examples with syntax highlighting
- Add clear section dividers

### Bash Scripts
- Add descriptive comments
- Handle errors gracefully
- Use meaningful error messages

## Skill Development Guidelines

### SKILL.md Frontmatter
```yaml
---
name: skill-name
description: Clear description with trigger phrases. Mention when to use.
allowed-tools: [Bash, Read, Write, Edit]
---
```

### Activation Triggers
- Include clear trigger phrases in description
- Examples: "create X document", "prepare Y for review"
- Test that Claude activates the skill appropriately

### Progressive Disclosure
- Keep SKILL.md under 500 lines
- Move detailed examples to EXAMPLES.md
- Move comprehensive docs to README.md

## Code of Conduct

- Be respectful and constructive
- Focus on the technical merits
- Help others learn and improve
- Assume good intentions

## Questions?

- Open a [Discussion](https://github.com/propstreet/claude-powerpack/discussions)
- Check existing issues and documentation
- Reach out to maintainers for guidance

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
