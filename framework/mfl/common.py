version = "1.7.0"


# File name for the indexing JSON file in an artifact directory.
ARTIFACT_MODEL_JSON_FILE_NAME = "model.json"
ASSETS_DIRECTORY_NAME = "assets"

# JSON string keys for fields of the indexing JSON.
ARTIFACT_MODEL_TOPOLOGY_KEY = "modelTopology"
ARTIFACT_MODEL_INITIALIZER = "modelInitializer"
ARTIFACT_WEIGHTS_MANIFEST_KEY = "weightsManifest"

FORMAT_KEY = "format"
TFJS_GRAPH_MODEL_FORMAT = "graph-model"
TFJS_LAYERS_MODEL_FORMAT = "layers-model"

GENERATED_BY_KEY = "generatedBy"
CONVERTED_BY_KEY = "convertedBy"

SIGNATURE_KEY = "signature"
INITIALIZER_SIGNATURE_KEY = "initializerSignature"
USER_DEFINED_METADATA_KEY = "userDefinedMetadata"
STRUCTURED_OUTPUTS_KEYS_KEY = "structuredOutputKeys"
RESOURCE_ID_KEY = "resourceId"

# Model formats.
KERAS_SAVED_MODEL = "keras_saved_model"
KERAS_MODEL = "keras"
KERAS_KERAS_MODEL = "keras_keras"
TF_SAVED_MODEL = "tf_saved_model"
TF_HUB_MODEL = "tf_hub"
TFJS_GRAPH_MODEL = "tfjs_graph_model"
TFJS_LAYERS_MODEL = "tfjs_layers_model"
TF_FROZEN_MODEL = "tf_frozen_model"

# CLI argument strings.
INPUT_PATH = "input_path"
OUTPUT_PATH = "output_path"
INPUT_FORMAT = "input_format"
OUTPUT_FORMAT = "output_format"
OUTPUT_NODE = "output_node_names"
SIGNATURE_NAME = "signature_name"
SAVED_MODEL_TAGS = "saved_model_tags"
QUANTIZATION_BYTES = "quantization_bytes"
QUANTIZATION_TYPE_FLOAT16 = "quantize_float16"
QUANTIZATION_TYPE_UINT8 = "quantize_uint8"
QUANTIZATION_TYPE_UINT16 = "quantize_uint16"
SPLIT_WEIGHTS_BY_LAYER = "split_weights_by_layer"
VERSION = "version"
SKIP_OP_CHECK = "skip_op_check"
STRIP_DEBUG_OPS = "strip_debug_ops"
USE_STRUCTURED_OUTPUTS_NAMES = "use_structured_outputs_names"
WEIGHT_SHARD_SIZE_BYTES = "weight_shard_size_bytes"
CONTROL_FLOW_V2 = "control_flow_v2"
EXPERIMENTS = "experiments"
METADATA = "metadata"

# Federated
DATASET_MINIMUM_REPEAT = 2


def get_converted_by():
    """Get the convertedBy string for storage in model artifacts."""
    return "TensorFlow.js Converter v%s" % version
