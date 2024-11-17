import json
import os
import tempfile
from datetime import timedelta
from typing import Dict, List

from google.cloud import storage


credentials_path = "./gcp_credentials.json"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path

BUCKET_NAME = "cactus-training"
VESSEL_NAME = "mvp"

CORS_CONFIG = [{"origin": ["*"], "method": ["GET"], "maxAgeSeconds": 3600}]


def initialize_storage_client() -> storage.Client:
    """Initializes and returns a Google Cloud Storage client."""
    return storage.Client()


def upload_file(bucket: storage.Bucket, file_path: str, blob_name: str) -> storage.Blob:
    """Uploads a single file to the specified GCS bucket."""
    blob = bucket.blob(blob_name)
    blob.upload_from_filename(file_path)
    return blob


def generate_signed_url(blob: storage.Blob, expiration_hours: int = 10) -> str:
    """Generates a signed URL for a given blob."""
    url = blob.generate_signed_url(
        version="v4", expiration=timedelta(hours=expiration_hours), method="GET"
    )
    # print(f"Generated signed URL for {blob.name}")
    return url


def modify_model_json(model_json_path: str, signed_urls: Dict[str, str]) -> str:
    """Modifies the model.json to replace weight file paths with their signed URLs."""
    with open(model_json_path, "r") as f:
        model_json = json.load(f)

    if "weightsManifest" in model_json:
        for manifest in model_json["weightsManifest"]:
            if "paths" in manifest:
                manifest["paths"] = [
                    signed_urls.get(os.path.basename(path), path)
                    for path in manifest["paths"]
                ]
    else:
        print("weightsManifest not found in model.json.")

    with tempfile.NamedTemporaryFile(
        mode="w+", delete=False, suffix=".json"
    ) as temp_file:
        json.dump(model_json, temp_file)
        temp_model_json_path = temp_file.name

    return temp_model_json_path


def set_bucket_cors(bucket: storage.Bucket, cors_config: List[Dict]) -> None:
    """Sets the CORS configuration for the GCS bucket."""
    bucket.cors = cors_config
    bucket.update()


def upload_to_gcs_and_get_signed_urls(temp_dir: str) -> Dict[str, str]:
    """
    Uploads all files from the specified directory to a GCS bucket, generates signed URLs,
    modifies model.json to include signed URLs for weight files, uploads the modified model.json,
    and sets CORS policies.

    Args:
        temp_dir (str): Path to the local directory containing files to upload.

    Returns:
        Dict[str, str]: A dictionary mapping filenames to their corresponding signed URLs.
    """
    client = initialize_storage_client()
    bucket = client.bucket(BUCKET_NAME)
    signed_urls = {}

    for root, _, files in os.walk(temp_dir):
        for file in files:
            if file == "model.json":
                continue
            file_path = os.path.join(root, file)
            relative_path = os.path.relpath(file_path, temp_dir)
            blob_name = (
                os.path.join(VESSEL_NAME, relative_path).replace("\\", "/")
                if VESSEL_NAME
                else relative_path.replace("\\", "/")
            )

            try:
                blob = upload_file(bucket, file_path, blob_name)
                url = generate_signed_url(blob)
                signed_urls[file] = url
            except Exception as e:
                print(f"Error uploading {file}: {e}")

    model_json_filename = "model"
    model_json_path = os.path.join(temp_dir, model_json_filename)

    if os.path.exists(model_json_path):
        try:
            modified_model_json_path = modify_model_json(model_json_path, signed_urls)
            modified_blob_name = (
                os.path.join(VESSEL_NAME, model_json_filename).replace("\\", "/")
                if VESSEL_NAME
                else model_json_filename.replace("\\", "/")
            )
            modified_blob = upload_file(
                bucket, modified_model_json_path, modified_blob_name
            )
            model_json_url = generate_signed_url(modified_blob)
            signed_urls[model_json_filename] = model_json_url
            os.remove(modified_model_json_path)
        except Exception as e:
            print(f"Error processing {model_json_filename}: {e}")
    else:
        print(f"{model_json_filename} not found in {temp_dir}. Skipping modification.")

    try:
        set_bucket_cors(bucket, CORS_CONFIG)
    except Exception as e:
        print(f"Error setting CORS policies: {e}")

    return signed_urls
