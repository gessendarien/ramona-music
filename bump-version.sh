#!/bin/bash
# Script to bump version across all projects

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
  echo "Error: No version provided."
  echo "Usage: ./bump-version.sh 0.0.2"
  exit 1
fi

echo "Updating version to $NEW_VERSION in all projects..."

# Update backend/package.json
if [ -f "backend/package.json" ]; then
  sed -i -E 's/"version": "[0-9]+\.[0-9]+\.[0-9]+"/"version": "'$NEW_VERSION'"/' backend/package.json
  echo "backend/package.json updated"
fi

# Update web/package.json
if [ -f "web/package.json" ]; then
  sed -i -E 's/"version": "[0-9]+\.[0-9]+\.[0-9]+"/"version": "'$NEW_VERSION'"/' web/package.json
  echo "web/package.json updated"
fi

# Update mobile/package.json
if [ -f "mobile/package.json" ]; then
  sed -i -E 's/"version": "[0-9]+\.[0-9]+\.[0-9]+"/"version": "'$NEW_VERSION'"/' mobile/package.json
  echo "mobile/package.json updated"
fi

# Update mobile/app.json
if [ -f "mobile/app.json" ]; then
  sed -i -E 's/"version": "[0-9]+\.[0-9]+\.[0-9]+"/"version": "'$NEW_VERSION'"/' mobile/app.json
  echo "mobile/app.json updated"
fi

echo "Done. Version updated to $NEW_VERSION."
