#!/bin/bash

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf legacy/dist modern/dist

# Ensure dependencies are installed
echo "Installing dependencies..."
pnpm install

# Run build time comparison
echo "Running build time comparison..."
hyperfine \
  --warmup 2 \
  --runs 5 \
  --export-json benchmark/results/build-times.json \
  --prepare 'rm -rf legacy/dist modern/dist' \
  'pnpm run build:legacy' \
  'pnpm run build:modern'

echo "Results saved to benchmark/results/build-times.json" 