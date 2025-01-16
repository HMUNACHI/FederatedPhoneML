import numpy as np
from cactus import Trainer, keras

model = keras.Sequential([
    keras.layers.Input(shape=(1,)), 
    keras.layers.Dense(units=20),
    keras.layers.Dense(units=1),
])

model.compile(optimizer="sgd", loss="mean_squared_error")

inputs = np.random.randint(1, 6, size=(200, 1)) 
outputs = inputs * 2 + 1  

# import time
# start = time.time()

trainer = Trainer(
    model,
    inputs,
    outputs,
    batch_size=2, 
    validation_inputs=[[5], [6], [7], [8]],
    validation_outputs=[[11], [13], [15], [17]],
)

while True:
    trainer.fit(epochs=3)

# print(f"Training took {time.time() - start:.2f} seconds")

# preds = trainer.predict(inputs[:10])
# print(f"Predictions: {preds}")