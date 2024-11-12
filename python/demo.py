import streamlit as st
import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
import cactus as ct

X = np.linspace(-2 * np.pi, 2 * np.pi, 100)
Y = np.sin(X)
X = X.reshape(-1, 1)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(1,)),
    tf.keras.layers.Dense(units=64, activation='relu'),
    tf.keras.layers.Dense(units=64, activation='relu'),
    tf.keras.layers.Dense(units=1)
])

model.compile(optimizer='adam', loss='mean_squared_error')

trainer = ct.Trainer(
    model=model,
    inputs=X,
    outputs=Y,
    batch_size=32
)


# 3. Set up Streamlit dashboard
st.title("Approximating a Sine wave using a Neural Network running on Cactus")
chart_data = pd.DataFrame({'X': X.flatten(), 'True Y': Y, 'Predicted Y': np.zeros_like(Y)})
text_placeholder = st.empty()
chart_placeholder = st.empty()
chart_placeholder.line_chart(chart_data[['True Y', 'Predicted Y']])
start_training = st.button("Start Training")

if start_training:
    start_training = None
    epochs = 500 
    batch_size = 10 

    for epoch in range(epochs + 1):
        trainer.fit(epochs=1)
        predicted_Y = trainer.predict(X).flatten()

        if epoch % 1 == 0:
            text_placeholder.header(f"Epoch {epoch}/{epochs}")

        if epoch % 25 == 0:
            chart_data['Predicted Y'] = predicted_Y
            chart_placeholder.line_chart(chart_data[['True Y', 'Predicted Y']])

    st.success("Training Complete!")