from cactus import Trainer, keras

model = keras.Sequential([
    keras.layers.Input(shape=(1,)), 
    keras.layers.Dense(units=20),
    keras.layers.Dense(units=1),
])

model.compile(optimizer="sgd", loss="mean_squared_error")

inputs = [[1], [2], [3], [4], [5]]
outputs = [[3], [5], [7], [9], [11]]

# Only additional code needed

import time

start = time.time()
trainer = Trainer(
    model,
    inputs,
    outputs,
    batch_size=2, 
    validation_inputs=[[5], [6], [7], [8]],
    validation_outputs=[[11], [13], [15], [17]],
)
trainer.fit(epochs=3)
end = time.time()

print(f"Training took {end - start:.2f} seconds")