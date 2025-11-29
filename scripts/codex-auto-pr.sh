#!/usr/bin/env bash
set -euo pipefail

log() {
  echo "[codex-auto-pr] $1"
}

usage() {
  cat <<'USAGE'
Automate PR creation, self-review, and squash merge using GitHub API (curl).

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
    - GITHUB_TOKEN or GH_TOKEN environment variable set
    - curl installed
    - git installed
    - python3 installed (for JSON parsing)
    - Local changes present
USAGE
}

BASE_BRANCH="main"
COMMIT_MESSAGE=""
PR_TITLE=""
PR_BODY_FILE=""
RUN_TESTS_CMD=""
AUTO_REVIEW=1
AUTO_MERGE=1

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

# Check requirements
for cmd in git curl python3; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd is required" >&2
    exit 1
  fi
done

if [ -z "${GITHUB_TOKEN:-${GH_TOKEN:-}}" ]; then
  echo "GITHUB_TOKEN or GH_TOKEN must be set" >&2
  exit 1
fi

TOKEN="${GITHUB_TOKEN:-${GH_TOKEN}}"

# Get Repo Info
REMOTE_URL=$(git remote get-url origin)
# Handle ssh and https urls
# git@github.com:Owner/Repo.git -> Owner/Repo
# https://github.com/Owner/Repo.git -> Owner/Repo
# https://github.com/Owner/Repo -> Owner/Repo
REPO_FULL_NAME=$(echo "$REMOTE_URL" | sed -E 's/.*github\.com[:\/](.*)(\.git)?/\1/' | sed 's/\.git$//')

log "Detected Repository: $REPO_FULL_NAME"

if [ -z "$REPO_FULL_NAME" ]; then
    echo "Could not detect repository name from remote URL" >&2
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

BODY_CONTENT=""
if [ -n "$PR_BODY_FILE" ]; then
  if [ -f "$PR_BODY_FILE" ]; then
      BODY_CONTENT=$(cat "$PR_BODY_FILE")
  else
      echo "PR Body file not found: $PR_BODY_FILE" >&2
      exit 1
  fi
else
  BODY_CONTENT="$DEFAULT_BODY"
fi

log "Creating pull request via API"

# Using python to construct the JSON payload
JSON_PAYLOAD=$(python3 -c "import sys, json; print(json.dumps({'title': sys.argv[1], 'body': sys.argv[2], 'head': sys.argv[3], 'base': sys.argv[4]}))" "$PR_TITLE" "$BODY_CONTENT" "$BRANCH_NAME" "$BASE_BRANCH")

RESPONSE=$(curl -s -X POST -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -d "$JSON_PAYLOAD" \
  "https://api.github.com/repos/$REPO_FULL_NAME/pulls")

# Extract info
PR_INFO=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'{data.get(\"number\", \"\")}|{data.get(\"node_id\", \"\")}')")
PR_NUMBER=$(echo "$PR_INFO" | cut -d'|' -f1)
NODE_ID=$(echo "$PR_INFO" | cut -d'|' -f2)

if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" == "None" ]; then
    echo "Failed to create PR. Response:"
    echo "$RESPONSE"
    exit 1
fi

log "PR Created: #$PR_NUMBER (Node ID: $NODE_ID)"
PR_URL="https://github.com/$REPO_FULL_NAME/pull/$PR_NUMBER"
log "PR URL: $PR_URL"

if [ "$AUTO_REVIEW" -eq 1 ]; then
  log "Approving pull request with self-review"
  REVIEW_BODY="Self-review by automation. Verified commit: ${COMMIT_MESSAGE}. Tests: ${RUN_TESTS_CMD:-not specified}."

  REVIEW_PAYLOAD=$(python3 -c "import sys, json; print(json.dumps({'event': 'APPROVE', 'body': sys.argv[1]}))" "$REVIEW_BODY")

  curl -s -X POST -H "Authorization: token $TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "$REVIEW_PAYLOAD" \
    "https://api.github.com/repos/$REPO_FULL_NAME/pulls/$PR_NUMBER/reviews" >/dev/null
else
  log "Skipping self-review (per -R flag)"
fi

if [ "$AUTO_MERGE" -eq 1 ]; then
  log "Enabling auto-merge (squash)"

  GRAPHQL_QUERY="mutation { enablePullRequestAutoMerge(input: { pullRequestId: \"$NODE_ID\", mergeMethod: SQUASH }) { pullRequest { autoMergeRequest { enabledAt } } } }"

  GRAPHQL_PAYLOAD=$(python3 -c "import sys, json; print(json.dumps({'query': sys.argv[1]}))" "$GRAPHQL_QUERY")

  curl -s -X POST -H "Authorization: token $TOKEN" \
     -H "Content-Type: application/json" \
     -d "$GRAPHQL_PAYLOAD" \
     "https://api.github.com/graphql" >/dev/null
else
  log "Skipping auto-merge (per -M flag)"
fi

log "Done"
