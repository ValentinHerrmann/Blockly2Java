#!/bin/bash
set -e

# Determine git branch
if [ -n "$CF_PAGES_BRANCH" ]; then
  git_branch="$CF_PAGES_BRANCH"
elif [ -n "$GITHUB_REF_NAME" ]; then
  git_branch="$GITHUB_REF_NAME"
else
  git_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
fi

# Determine git SHA
if [ -n "$CF_PAGES_COMMIT_SHA" ]; then
  git_sha="$CF_PAGES_COMMIT_SHA"
elif [ -n "$GITHUB_SHA" ]; then
  git_sha="$GITHUB_SHA"
else
  git_sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
fi

short_sha=$(echo "$git_sha" | cut -c1-7)

# Determine git tag
git_tag=$(git describe --tags --exact-match 2>/dev/null || git tag --points-at HEAD 2>/dev/null | head -n 1 || echo "")

# Determine commit message
commit_msg=$(git log -1 --pretty=%B 2>/dev/null || echo "")
first_line=$(echo "$commit_msg" | head -n 1 | xargs) # trim whitespace

app_version="$short_sha"
app_version_link="https://github.com/ValentinHerrmann/Blockly2Java/tree/$git_sha"

if [ "$git_branch" = "release" ]; then
  if [ -n "$git_tag" ]; then
    app_version="$git_tag"
    app_version_link="https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/$git_tag"
  elif [[ "$first_line" =~ ^v[0-9] ]]; then
    app_version="$first_line"
    app_version_link="https://github.com/ValentinHerrmann/Blockly2Java/releases/tag/$first_line"
  fi
fi

# Write version to root VERSION file (relative to build.sh location which is in custom-generator-codelab/)
echo "$app_version" > "$(dirname "$0")/../VERSION"

build_date=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

export APP_BRANCH="$git_branch"
export APP_SHA="$git_sha"
export APP_VERSION_LINK="$app_version_link"
export BUILD_DATE="$build_date"

npx webpack --mode production
