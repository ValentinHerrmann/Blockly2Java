#!/bin/bash

# Define the production branch
PROD_BRANCH="releases"

# If it's a preview branch, check if there is an active PR
if [ "$WORKERS_CI_BRANCH" != "$PROD_BRANCH" ]; then
  echo "Checking if an active PR exists for branch: $WORKERS_CI_BRANCH..."
  
  # Call GitHub API (no token needed for public repos)
  PR_JSON=$(curl -s "https://api.github.com/repos/ValentinHerrmann/Blockly2Java/pulls?head=ValentinHerrmann:$WORKERS_CI_BRANCH&state=open")
  
  # Count the number of non-draft open PRs returned
  PR_COUNT=$(echo "$PR_JSON" | jq '[.[] | select(.draft == false)] | length')

  if [ -z "$PR_COUNT" ] || [ "$PR_COUNT" -eq 0 ]; then
    echo "No open, ready-for-review Pull Request found. Skipping build."
    # Exit with 0 to prevent the build from showing as "Failed" in Cloudflare
    exit 0
  fi
  
  echo "Active, ready-for-review Pull Request found!"
fi

# Run your actual build command here (e.g., npm run build)
npm run build
