#!/bin/bash

# Define the production branch
PROD_BRANCH="releases"

# If it's a preview branch, check if there is an active PR (including drafts)
if [ "$CF_PAGES_BRANCH" != "$PROD_BRANCH" ]; then
  echo "Checking if an active PR exists for branch: $CF_PAGES_BRANCH..."
  
  # URL-encode the branch name to handle slashes (e.g., ValentinHerrmann/issue149)
  ENCODED_BRANCH=$(node -e "console.log(encodeURIComponent(process.argv[1]))" "$CF_PAGES_BRANCH")
  
  # Call GitHub API (no token needed for public repos)
  PR_JSON=$(curl -s "https://api.github.com/repos/ValentinHerrmann/Blockly2Java/pulls?head=ValentinHerrmann:$ENCODED_BRANCH&state=open")
  
  # Count the number of open PRs returned (draft or otherwise)
  PR_COUNT=$(echo "$PR_JSON" | node -e "
    const fs = require('fs');
    try {
      const prs = JSON.parse(fs.readFileSync(0, 'utf-8'));
      if (Array.isArray(prs)) {
        console.log(prs.length);
      } else {
        console.log(0);
      }
    } catch(e) {
      console.log(0);
    }
  ")

  if [ -z "$PR_COUNT" ] || [ "$PR_COUNT" -eq 0 ]; then
    echo "No open Pull Request found. Skipping build."
    # Create dummy directory and index.html so Cloudflare Pages deployment succeeds but displays a skipped message
    mkdir -p dist
    echo "<html><head><title>Build Skipped</title><style>body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9f9f9; color: #555; } .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; }</style></head><body><div class='card'><h2>Deployment Skipped</h2><p>This branch does not have an active Pull Request.</p></div></body></html>" > dist/index.html
    # Exit with 0 so Cloudflare marks the build itself as successful
    exit 0
  fi
  
  echo "Active Pull Request found!"
fi

# Run your actual build command here (e.g., npm run build)
npm run build
