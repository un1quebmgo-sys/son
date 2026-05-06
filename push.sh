#!/bin/bash
if [ -z "$GITHUB_PAT" ]; then
  echo "Error: GITHUB_PAT secret is not set."
  echo "Add it in the Replit Secrets panel (padlock icon), then re-run this script."
  exit 1
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://un1quebmgo-sys:${GITHUB_PAT}@github.com/un1quebmgo-sys/son.git"
git push -u origin main && echo "Done! Pushed to GitHub."
