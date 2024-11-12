import os
import numpy as np
from google.cloud import storage
from tensorflow import keras


def download_model_from_gcs(bucket_name, source_blob_prefix, destination_dir):
    client = storage.Client()
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=source_blob_prefix)
    for blob in blobs:
        if not blob.name.endswith("/"):
            blob.download_to_filename(
                os.path.join(destination_dir, os.path.basename(blob.name))
            )
            print(f"Downloaded {blob.name} to {destination_dir}")


def aggregate_models(model_paths):
    models = [keras.models.load_model(path) for path in model_paths]
    new_weights = []
    for weights in zip(*[model.get_weights() for model in models]):
        averaged_weights = np.mean(weights, axis=0)
        new_weights.append(averaged_weights)
    return new_weights


def save_global_model(global_model, new_weights, save_dir):
    global_model.set_weights(new_weights)
    global_model.save(save_dir)
    print(f"Global model saved at {save_dir}")
