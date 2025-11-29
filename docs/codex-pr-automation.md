# Codex Pull Request Automation

This guide turns the manual Codex workflow (implement → test → commit → PR → self-review → squash-merge) into a repeatable script-driven process.

## Prerequisites
- Git is configured with write access to the repository
- [GitHub CLI](https://cli.github.com/) installed and authenticated (`GITHUB_TOKEN` or `GH_TOKEN` in the environment) with permissions to create, review, and merge PRs
- Local changes ready to commit (the script stashes and reapplies them onto the working branch)

## Script
Use `scripts/codex-auto-pr.sh` to automate branch creation, commit, PR creation, self-review, and squash merge.

```bash
bash scripts/codex-auto-pr.sh \
  -b main \
  -m "feat: improve agent auth" \
  -t "feat: improve agent auth" \
  -d ./pr-body.md \
  -r "npm test && npm run lint" \
  feature/agent-auth
```

### Flags
- `-b` Base branch (default: `main`)
- `-m` Conventional commit message (required)
- `-t` Pull request title (defaults to commit message)
- `-d` Path to PR body file (optional; uses default template if omitted)
- `-r` Command to run tests/checks before committing (optional)
- `-R` Skip approving the PR with an automated self-review
- `-M` Skip enabling auto-merge (squash)

### Behavior
1. Stashes your local changes, fetches the base branch, and creates/force-syncs a working branch
2. Restores the stashed changes onto the branch
3. Runs the provided tests/checks (if any)
4. Stages all changes and commits with the supplied message
5. Pushes the branch to `origin`
6. Opens a PR with the given title/body, approves it with a self-review note (unless `-R` is set), and enables auto-merge (squash + delete branch) unless `-M` is set

### Notes & Safety
- Run the script from the workspace containing your changes; it will stash and re-apply them to the new branch
- Self-approval and squash auto-merge are enabled by default; use `-R` and/or `-M` when you need manual review or merge control
- Auto-merge waits on branch protection rules and required checks; it will not force-merge failing PRs
- Use descriptive commit messages and PR bodies to preserve clarity in the squashed history
- If you need to skip auto-merge, omit the final step by running `gh pr create` manually instead of the script
