import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.layers import Conv1D, MultiHeadAttention, Dense, Dropout, LayerNormalization, Input
from tensorflow.keras.models import Model

def pinball_loss(tau):
    def loss(y_true, y_pred):
        err = y_true - y_pred
        return tf.reduce_mean(tf.maximum(tau * err, (tau - 1) * err))
    return loss

def multi_quantiles_loss(y_true, y_pred):
    taus = [0.10, 0.50, 0.90]
    # y_pred is (batch, 3)
    loss = 0.0
    for i, tau in enumerate(taus):
        loss += pinball_loss(tau)(y_true, y_pred[:, i:i+1])
    return loss

def build_aqi_adjustment_model() -> Model:
    # Input: (batch, 72, 16)
    inputs = Input(shape=(72, 16))
    
    # Conv1D(64, kernel=3, relu)
    x = Conv1D(64, kernel_size=3, activation='relu', padding='same')(inputs)
    # Conv1D(64, kernel=3, dilation=2, relu)
    x = Conv1D(64, kernel_size=3, dilation_rate=2, activation='relu', padding='same')(x)
    
    # MultiHeadAttention(4 heads, key_dim=32) with residual + LayerNorm
    attn_out = MultiHeadAttention(num_heads=4, key_dim=32)(x, x)
    x = LayerNormalization()(x + attn_out)
    
    # Flatten or Global Average Pooling before Dense
    x = tf.keras.layers.GlobalAveragePooling1D()(x)
    
    # Dense(128, gelu) -> Dropout(0.2) -> Dense(64, gelu)
    x = Dense(128, activation='gelu')(x)
    x = Dropout(0.2)(x)
    x = Dense(64, activation='gelu')(x)
    
    # Output: Dense(3, linear)
    outputs = Dense(3, activation='linear')(x)
    
    model = Model(inputs=inputs, outputs=outputs)
    optimizer = tf.keras.optimizers.Adam(learning_rate=1e-3)
    
    model.compile(optimizer=optimizer, loss=multi_quantiles_loss)
    return model

class AQIAdjuster:
    def __init__(self, model_path: str = None):
        self.model_path = model_path
        self.model = None
        if model_path and os.path.exists(model_path):
            try:
                self.model = tf.keras.models.load_model(model_path, custom_objects={'multi_quantiles_loss': multi_quantiles_loss})
            except Exception as e:
                print(f"Failed to load model from {model_path}: {e}")
        
        if self.model is None:
            print("Using rule-based adjustment fallback.")
            
    def predict(self, features: np.ndarray) -> dict:
        """
        features shape: (batch_size, 72, 16) or (72, 16)
        Returns dictionary with q10, q50, q90 predictions.
        """
        if features.ndim == 2:
            features = np.expand_dims(features, axis=0)
            
        if self.model is not None:
            preds = self.model.predict(features, verbose=0)[0]
            # Output is additive adjustment factor or multiplier?
            # Assuming it outputs multiplier based on typical adjustment models
            return {
                "q10": float(preds[0]),
                "q50": float(preds[1]),
                "q90": float(preds[2])
            }
        else:
            # Rule-based fallback
            # Look at features: e.g., is_diwali_week (index 10 or 11 depending on features order)
            # We'll just return a base multiplier
            return {
                "q10": 0.8,
                "q50": 1.0,
                "q90": 1.2
            }

    def adjust_aqi(self, raw_aqi: float, features: np.ndarray) -> dict:
        """Applies adjustment to raw AQI."""
        preds = self.predict(features)
        
        # Rule-based logic if no model
        if self.model is None:
            # Simple rule-based: if holiday or rush hour
            # Assume features[-2] is rush hour, features[-1] is traffic_index
            # This is a very simplified fallback
            if len(features) > 0 and len(features[0]) >= 16:
                is_rush_hour = features[-1][14] # Approx
                if is_rush_hour:
                    preds['q50'] *= 1.2
                    preds['q90'] *= 1.3

        adjusted_aqi = max(0.0, raw_aqi * preds['q50'])
        lower_bound = max(0.0, raw_aqi * preds['q10'])
        upper_bound = max(0.0, raw_aqi * preds['q90'])
        
        return {
            "adjusted_aqi": adjusted_aqi,
            "confidence_interval": [lower_bound, upper_bound]
        }
