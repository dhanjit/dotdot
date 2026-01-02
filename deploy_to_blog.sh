#!/bin/bash
set -e

# Configuration
BLOG_REPO="../dhanjit.me"
DEST_DIR="$BLOG_REPO/public/dotdot"

# 1. Build Wasm (using Docker)
echo "Building Game..."
# Use docker-compose to build. 'up builder' runs the build and exits.
docker-compose up builder

# 2. Prepare Destination
echo "Deploying to $DEST_DIR..."
if [ ! -d "$BLOG_REPO" ]; then
    echo "Error: Blog repository not found at $BLOG_REPO"
    exit 1
fi

mkdir -p "$DEST_DIR"

# 3. Copy Assets
# Copy content of web/ to public/dotdot/
cp -r web/* "$DEST_DIR/"

echo "Deployment assets copied."
echo "---------------------------------------------------"
echo "NEXT STEPS:"
echo "1. cd $BLOG_REPO"
echo "2. git add public/dotdot"
echo "3. git commit -m 'Deploy DotDot game'"
echo "4. git push"
echo "---------------------------------------------------"
