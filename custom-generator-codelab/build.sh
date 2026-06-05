#!/bin/bash

# Define the production branch
PROD_BRANCH="releases"

# If it's a preview branch, check if there is an active PR
if [ "$WORKERS_CI_BRANCH" != "$PROD_BRANCH" ]; then
  echo "Checking if an active PR exists for branch: $WORKERS_CI_BRANCH..."
  
  # Call GitHub API (no token needed for public repos)
  PR_JSON=$(curl -s "https://api.github.com/repos/ValentinHerrmann/Blockly2Java/pulls?head=ValentinHerrmann:$WORKERS_CI_BRANCH&state=open")
  
  # Count the number of non-draft open PRs returned (using Node since jq might not be installed)
  PR_COUNT=$(echo "$PR_JSON" | node -e "
    const fs = require('fs');
    try {
      const prs = JSON.parse(fs.readFileSync(0, 'utf-8'));
      if (Array.isArray(prs)) {
        console.log(prs.filter(pr => pr.draft === false).length);
      } else {
        console.log(0);
      }
    } catch(e) {
      console.log(0);
    }
  ")

  if [ -z "$PR_COUNT" ] || [ "$PR_COUNT" -eq 0 ]; then
    echo "No open, ready-for-review Pull Request found. Skipping build."
    # Exit with 0 to prevent the build from showing as "Failed" in Cloudflare
    exit 0
  fi
  
  echo "Active, ready-for-review Pull Request found!"
fi

# Run your actual build command here (e.g., npm run build)
npm run build
