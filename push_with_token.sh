#!/bin/bash
# Script to push with GitHub token
# Usage: ./push_with_token.sh YOUR_TOKEN

if [ -z "$1" ]; then
    echo "Usage: ./push_with_token.sh YOUR_GITHUB_TOKEN"
    echo "Or set GITHUB_TOKEN environment variable"
    exit 1
fi

TOKEN=$1
USERNAME="kimmouridsen-cloud"

# Use token in URL for this push
git push https://${TOKEN}@github.com/${USERNAME}/Leonards-game.git main


