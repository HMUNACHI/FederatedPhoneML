import time
import numpy as np
from cactus import Trainer, keras

num_samples = 40000
num_features = 10
hidden_dim = 20
batch_size = 1
epochs = 3

# Define the model
model = keras.Sequential([
    keras.layers.Input(shape=(num_features,)),
    keras.layers.Dense(units=hidden_dim),
    keras.layers.Dense(units=num_features),
])

# Compile the model
model.compile(optimizer="sgd", loss="mean_squared_error")

# Generate synthetic training data
inputs = np.random.randint(1, 6, size=(num_samples, num_features)) 
outputs = inputs * 2 + 1  

trainer = Trainer(
    model,
    inputs,
    outputs,
    batch_size=batch_size)

start = time.time()
trainer.fit(epochs=epochs)
print(f"Training took {time.time() - start:.2f} seconds")
