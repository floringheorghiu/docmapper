## Contributing to Documentation Mapper

### Getting Started

1. Fork the repository
2. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

3. Make your changes
4. Run tests and build:
```bash
npm run test
npm run build
```

5. Commit your changes:
```bash
git add .
git commit -m "feat: description of your changes"
```

6. Push to your fork:
```bash
git push origin feature/your-feature-name
```

7. Create a Pull Request

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding or modifying tests
- `chore:` Maintenance tasks

### Version Management

1. Update version in `package.json`
2. Update `VERSION.md`
3. Update `src/constants.ts`
4. Create a version tag:
```bash
git tag -a v0.1.x -m "Version 0.1.x"
git push origin v0.1.x
```