#!/usr/bin/env bash

set -e

version=$(npm pkg get version | tr -d '"')

docker buildx build \
  --platform=linux/amd64,linux/arm64 \
  -t sample-app:"$version" \
  .