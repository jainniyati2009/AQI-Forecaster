import numpy as np
import matplotlib.pyplot as plt
from typing import Dict

def evaluate_model(model, test_data: tuple) -> Dict[str, float]:
    """Evaluates model and returns metrics."""
    X_test, y_test = test_data
    y_pred_quantiles = model.predict(X_test, verbose=0)
    
    # Extract median prediction (q50) for standard metrics
    y_pred = y_pred_quantiles[:, 1]
    
    mse = np.mean((y_test - y_pred) ** 2)
    mae = np.mean(np.abs(y_test - y_pred))
    
    ss_res = np.sum((y_test - y_pred) ** 2)
    ss_tot = np.sum((y_test - np.mean(y_test)) ** 2)
    r2 = 1 - (ss_res / (ss_tot + 1e-8))
    
    mape = np.mean(np.abs((y_test - y_pred) / (y_test + 1e-8))) * 100
    
    return {
        "MSE": float(mse),
        "MAE": float(mae),
        "R2": float(r2),
        "MAPE": float(mape)
    }

def plot_predictions(actual: np.ndarray, predicted: np.ndarray, save_path: str):
    """Saves comparison plot."""
    import os
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    plt.figure(figsize=(12, 6))
    
    # Plot first 300 points for clarity
    num_points = min(300, len(actual))
    plt.plot(actual[:num_points], label='Actual', color='blue', alpha=0.7)
    
    if predicted.ndim == 2 and predicted.shape[1] == 3:
        # Plot quantiles
        plt.plot(predicted[:num_points, 1], label='Predicted (Median)', color='red')
        plt.fill_between(range(num_points), 
                         predicted[:num_points, 0], 
                         predicted[:num_points, 2], 
                         color='red', alpha=0.2, label='80% Confidence Interval')
    else:
        plt.plot(predicted[:num_points], label='Predicted', color='red')
        
    plt.title('AQI Model Predictions vs Actual')
    plt.xlabel('Time Step')
    plt.ylabel('AQI Adjustment Factor')
    plt.legend()
    plt.tight_layout()
    plt.savefig(save_path)
    plt.close()

def print_report(metrics: Dict[str, float]):
    """Formatted console output."""
    print("-" * 30)
    print(" MODEL EVALUATION REPORT")
    print("-" * 30)
    for k, v in metrics.items():
        print(f"{k:>10}: {v:.4f}")
    print("-" * 30)
