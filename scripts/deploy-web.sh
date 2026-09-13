#!/usr/bin/env bash
set -euo pipefail

# Build the SPA and publish it to an environment's S3 bucket, then invalidate
# the CloudFront cache. Usage:
#   scripts/deploy-web.sh <bucket-name> <distribution-id>
BUCKET="${1:?usage: deploy-web.sh <bucket> <distribution-id>}"
DIST_ID="${2:?usage: deploy-web.sh <bucket> <distribution-id>}"

pnpm --filter @dev-workflow/web build

# --delete removes stale objects so the bucket mirrors the new build exactly.
aws s3 sync apps/web/dist "s3://${BUCKET}" --delete

aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths '/*'
