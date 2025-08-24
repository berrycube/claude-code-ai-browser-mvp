# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Fixed build system errors preventing successful compilation
- Resolved CJS format incompatibility with top-level await in mcp-research-tools
- Added missing TypeScript type declarations (@types/node, @types/jsdom)
- Fixed Node.js module import issues in hooks package

### Added
- Comprehensive .gitignore file for Node.js/TypeScript monorepo
- ESLint configuration with modern ES2022 support
- Build system verification and quality checks
- Consistent workspace configuration across all packages

### Changed
- Updated mcp-research-tools to ESM-only format (removed CJS due to top-level await)
- Enhanced package.json configurations with proper TypeScript dependencies
- Improved build scripts and development workflow
- Updated README.md with corrected build commands

### Development
- All packages now build successfully in pnpm workspace
- ESLint passes without errors
- Proper type safety maintained across monorepo
- Build artifacts properly excluded from version control