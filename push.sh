#!/bin/bash
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN secret is not set."
  echo "Add it in the Replit Secrets panel (padlock icon), then re-run this script."
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://un1quebmgo-sys:${GITHUB_PERSONAL_ACCESS_TOKEN}@github.com/un1quebmgo-sys/son.git"
git push -u origin main --force && echo "Done! Pushed to GitHub."
