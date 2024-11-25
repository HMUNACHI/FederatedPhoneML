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


# Device Connector

1. Make sure app is up and connected to the network
2. Set .env in /python with db url and service role api key
3. Run deviceConnector.py