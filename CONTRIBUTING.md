# Contributing to Nyvora Protocol

We welcome contributions from the community! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and constructive
- Focus on the code, not the person
- Help others learn and grow
- Report issues responsibly

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/nyvora-protocol.git`
3. Add upstream: `git remote add upstream https://github.com/CodedBay/nyvora-protocol.git`
4. Create a feature branch: `git checkout -b feature/your-feature`

## Development Setup

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install soroban-cli

# Install Node.js 18+
node --version  # Should be v18+

# Install dependencies
npm install
```

## Making Changes

### Code Standards

- **Rust**: Follow [Rust Style Guidelines](https://doc.rust-lang.org/1.0.0/style/)
- **TypeScript**: Use ESLint configuration provided
- **Comments**: Document complex logic
- **Tests**: Write tests for all new features

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add split-routing capability
fix: prevent overflow in stream calculations
docs: update API documentation
refactor: simplify stream withdrawal logic
test: add edge case tests for split-router
```

### Pull Request Process

1. **Update tests**: Add tests for new functionality
2. **Run tests**: Ensure all tests pass
   ```bash
   cargo test --all
   cd frontend && npm run test && cd ..
   ```
3. **Lint code**: Format and lint
   ```bash
   cargo fmt
   cargo clippy -- -D warnings
   cd frontend && npm run lint && cd ..
   ```
4. **Update docs**: Update README or docs if needed
5. **Create PR**: Push to your fork and open a PR

PR Template:
```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Testing
- [ ] Unit tests added
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No new warnings
```

## Testing Guidelines

### Unit Tests
```bash
cd contracts/nyvora-stream
cargo test --lib
```

### Integration Tests
```bash
cargo test --test integration --release
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### Full Test Suite
```bash
cargo test --all
cd frontend && npm run test && cd ..
```

## Documentation

- Update `docs/` for major changes
- Add inline comments for complex logic
- Keep README.md up-to-date
- Document breaking changes

## Reporting Bugs

1. Check existing issues first
2. Create a new issue with:
   - Clear title
   - Detailed description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info
   - Suggested fix (if applicable)

## Suggesting Features

1. Check existing issues/discussions
2. Open a discussion or issue with:
   - Feature description
   - Motivation and use cases
   - Proposed implementation (optional)
   - Potential downsides

## Review Process

- At least one maintainer review required
- All CI checks must pass
- Documentation must be complete
- Code must follow standards

## Areas for Contribution

### High Priority
- [ ] Split-routing implementation
- [ ] Batch withdrawal operations
- [ ] Performance optimizations
- [ ] Security audit improvements

### Medium Priority
- [ ] Frontend UX improvements
- [ ] Test coverage expansion
- [ ] Documentation enhancement
- [ ] Example applications

### Low Priority
- [ ] UI polish
- [ ] Code organization
- [ ] Development tooling
- [ ] Community tools

## Questions?

- Open an issue with the `question` label
- Join our [Discord community](https://discord.gg/stellar)
- Check [Stellar documentation](https://developers.stellar.org)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Nyvora Protocol! 🚀
