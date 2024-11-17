# Cactus Python Library

```python
from cactus import keras, Trainer

model = keras.Sequential([
    keras.layers.Input(shape=(1,)), 
    keras.layers.Dense(units=1)   
])
model.compile(optimizer='sgd', loss='mean_squared_error')

# Only additional code needed
trainer = Trainer(
    model, inputs, outputs,
    batch_size=2,
)
trainer.fit(epochs=10)
```
