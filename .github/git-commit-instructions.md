# Git Commit Message Instructions

## Format
Use Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring (no feature/fix)
- `perf`: Performance improvement
- `test`: Adding/updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes

## Scopes
- `web`: web-portal changes
- `api`: agent-api changes
- `desktop`: desktop-app changes
- `mcp`: mcp-server/mcp-bridge changes
- `docs`: documentation changes
- `deps`: dependency updates

## Examples
```
feat(api): add health check endpoint
fix(web): resolve responsive layout on mobile
chore(deps): update React to 18.2.0
docs: update README with MCP setup instructions
ci: add automated deployment workflow
```

## Rules
- Use imperative mood ("add" not "added")
- Keep first line under 72 characters
- Reference issues when applicable (#123)
- No period at end of subject line
