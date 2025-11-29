#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[codex-auto-pr] $1"
}

usage() {
  cat <<'USAGE'
Automate PR creation, self-review, and squash merge using GitHub CLI.

Usage:
  codex-auto-pr.sh [-b base_branch] [-m commit_message] [-t pr_title] [-d pr_body_file] [-r test_command] [-R skip_review] [-M skip_auto_merge] branch_name

Options:
  -b  Base branch to start from (default: main)
  -m  Conventional commit message for the changes
  -t  Pull request title (defaults to commit message)
  -d  File path for pull request body (if omitted, a default template is used)
  -r  Command to run tests/checks before committing (e.g., "npm test && npm run lint")
  -R  Skip approving the PR with a self-review
  -M  Skip enabling auto-merge (squash)
  -h  Show this help message

  Requirements:
    - GitHub CLI installed and authenticated with a token that can open, review, and merge PRs
    - Local changes present; the script stashes and reapplies them to the working branch
USAGE
}

BASE_BRANCH="main"
COMMIT_MESSAGE=""
PR_TITLE=""
PR_BODY_FILE=""
RUN_TESTS_CMD=""
AUTO_REVIEW=1
AUTO_MERGE=1
GH_USER=""

while getopts "b:m:t:d:r:RMh" opt; do
  case "$opt" in
    b) BASE_BRANCH="$OPTARG" ;;
    m) COMMIT_MESSAGE="$OPTARG" ;;
    t) PR_TITLE="$OPTARG" ;;
    d) PR_BODY_FILE="$OPTARG" ;;
    r) RUN_TESTS_CMD="$OPTARG" ;;
    R) AUTO_REVIEW=0 ;;
    M) AUTO_MERGE=0 ;;
    h)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done

shift $((OPTIND - 1))

if [ $# -ne 1 ]; then
  usage
  exit 1
fi

BRANCH_NAME="$1"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required" >&2
  exit 1
fi

if [ -z "${GITHUB_TOKEN:-${GH_TOKEN:-}}" ]; then
  echo "GITHUB_TOKEN or GH_TOKEN must be set for GitHub CLI" >&2
  exit 1
fi

if ! GH_USER=$(gh api user --jq '.login'); then
  echo "Unable to determine authenticated GitHub user via gh" >&2
  exit 1
fi

if git diff --quiet && git diff --cached --quiet; then
  echo "No local changes detected. Make edits before running." >&2
  exit 1
fi

STASH_NAME="codex-auto-pr-$(date +%s)"
STASHED=0

log "Stashing local changes to move onto a clean branch base"
if git stash push -u -m "$STASH_NAME" >/dev/null; then
  STASHED=1
else
  echo "Failed to stash changes" >&2
  exit 1
fi

log "Fetching origin/${BASE_BRANCH}"
git fetch origin "$BASE_BRANCH"

log "Creating branch ${BRANCH_NAME} from origin/${BASE_BRANCH}"
git checkout -B "$BRANCH_NAME" "origin/${BASE_BRANCH}"

if [ "$STASHED" -eq 1 ]; then
  log "Restoring stashed changes onto ${BRANCH_NAME}"
  if ! git stash pop --quiet; then
    echo "Failed to re-apply stashed changes. Resolve conflicts and retry." >&2
    exit 1
  fi
fi

if [ -n "$RUN_TESTS_CMD" ]; then
  log "Running tests/checks: ${RUN_TESTS_CMD}"
  eval "$RUN_TESTS_CMD"
fi

if [ -z "$COMMIT_MESSAGE" ]; then
  echo "Commit message is required (use -m)" >&2
  exit 1
fi

log "Staging changes"
git add -A

if git diff --cached --quiet; then
  echo "No changes staged for commit" >&2
  exit 1
fi

log "Committing with message: ${COMMIT_MESSAGE}"
git commit -m "$COMMIT_MESSAGE"

log "Pushing branch to origin"
git push -u origin "$BRANCH_NAME"

if [ -z "$PR_TITLE" ]; then
  PR_TITLE="$COMMIT_MESSAGE"
fi

DEFAULT_BODY="Automated PR created by codex-auto-pr.sh.\n\n- Commit: ${COMMIT_MESSAGE}\n- Branch: ${BRANCH_NAME}\n- Base: ${BASE_BRANCH}\n- Tests: ${RUN_TESTS_CMD:-not specified}\n"

if [ -n "$PR_BODY_FILE" ]; then
  PR_CREATE_ARGS=(--title "$PR_TITLE" --body-file "$PR_BODY_FILE")
else
  PR_CREATE_ARGS=(--title "$PR_TITLE" --body "$DEFAULT_BODY")
fi

log "Creating pull request"
PR_URL=$(gh pr create "${PR_CREATE_ARGS[@]}" --base "$BASE_BRANCH" --head "$BRANCH_NAME")

if [ "$AUTO_REVIEW" -eq 1 ]; then
  log "Approving pull request with self-review"
  REVIEW_BODY="Self-review by automation. Verified commit: ${COMMIT_MESSAGE}. Tests: ${RUN_TESTS_CMD:-not specified}."
  gh pr review "$PR_URL" --approve --body "$REVIEW_BODY"

  log "Verifying self-review is recorded"
  REVIEW_COUNT=$(gh pr view "$PR_URL" --json reviews --jq "map(select(.author.login==\"$GH_USER\" and .state==\"APPROVED\")) | length")
  if [ -z "$REVIEW_COUNT" ] || [ "$REVIEW_COUNT" -lt 1 ]; then
    echo "Failed to confirm automated self-review was applied" >&2
    exit 1
  fi
else
  log "Skipping self-review (per -R flag)"
fi

if [ "$AUTO_MERGE" -eq 1 ]; then
  log "Enabling auto-merge (squash)"
  gh pr merge "$PR_URL" --squash --delete-branch --auto

  log "Checking auto-merge status"
  AUTO_ENABLED=$(gh pr view "$PR_URL" --json autoMergeRequest --jq '.autoMergeRequest.enabledAt')
  if [ -z "$AUTO_ENABLED" ]; then
    echo "Auto-merge was not enabled; ensure repository allows auto-merge for this PR" >&2
    exit 1
  fi
else
  log "Skipping auto-merge (per -M flag)"
fi

log "Done"
