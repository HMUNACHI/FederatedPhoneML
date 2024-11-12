#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if credentials file exists
CREDENTIALS_PATH="$SCRIPT_DIR/gcp_credentials.json"
if [ ! -f "$CREDENTIALS_PATH" ]; then
    echo "Error: GCP credentials file not found at $CREDENTIALS_PATH"
    exit 1
fi

# Export environment variables
export GOOGLE_APPLICATION_CREDENTIALS="$CREDENTIALS_PATH"
export BUCKET_NAME="cactus-training"
export VESSEL_NAME="mvp"

# Print confirmation
echo "Set GOOGLE_APPLICATION_CREDENTIALS to $CREDENTIALS_PATH"
echo "Set BUCKET_NAME to $BUCKET_NAME"
echo "Set VESSEL_NAME to $VESSEL_NAME"