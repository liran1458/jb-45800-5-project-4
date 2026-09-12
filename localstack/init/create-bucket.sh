#!/bin/bash
set -e

awslocal s3api head-bucket --bucket ml-images 2>/dev/null \
  || awslocal s3 mb s3://ml-images

echo "S3 bucket ml-images is ready"