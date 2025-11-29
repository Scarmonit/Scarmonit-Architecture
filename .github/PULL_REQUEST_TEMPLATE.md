# Pull Request

## Summary
- [ ] Implements feature/fix described in issue
- [ ] Follows repository conventions and coding standards

### Linked Issue
Closes #<issue-number>

## Type of Change
- [ ] feat
- [ ] fix
- [ ] docs
- [ ] style
- [ ] refactor
- [ ] test
- [ ] chore

## Description
Provide a concise description of changes.

## Changes
- [ ] Code adheres to 2-space indentation, single quotes, no semicolons
- [ ] TypeScript strict typing (no `any` without justification)
- [ ] Error handling with try/catch and proper logging
- [ ] No hardcoded secrets or credentials
- [ ] Tests added/updated where applicable

## Testing
Describe how you tested the changes.

- Commands run:
  - npm test
  - npx tsc --noEmit

## Screenshots/Logs
Attach relevant screenshots or logs.

## Checklist
- [ ] Branch name uses `feature/`, `fix/`, `chore/`, or `docs/`
- [ ] Conventional Commits used in commit messages
- [ ] All tests pass locally
- [ ] Linting passes
- [ ] Documentation updated if needed
- [ ] CI pipelines pass

## Deployment
- [ ] Verified compatibility with `wrangler.toml` (if Workers)
- [ ] Verified Cloudflare Pages build (if web-portal)

## Additional Notes
Anything else reviewers should know.
