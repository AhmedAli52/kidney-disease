# server/model/predict.py (PURE CLUSTER ASSIGNMENT VERSION)
import sys
import os
import json
import numpy as np
import pandas as pd
from scipy.fft import fft2, fftshift
from scipy.stats import entropy
from sklearn.preprocessing import minmax_scale
import joblib

BASE_DIR = os.path.dirname(__file__)

# --- CONFIGURATION: Using your single bundled file ---
MODEL_BUNDLE_PATH = os.path.join(BASE_DIR, "RF_FFT_Model.pkl") 

# Feature list MUST match the order used during training (9 features)
RF_FEATURES = [
    "Env_Energy", "Env_Mean", "Env_Std", "Env_Entropy",
    "Spec_Mean", "Spec_Std", "Spec_Entropy", "Spec_Peak", "Spec_Centroid",
]

# New labels derived from your two clusters
CLUSTER_LABELS = {
    0: "LowReflectionStone",  # Low/Moderate Reflection Stone (Cluster 0)
    1: "HighReflectionStone", # High Reflection Stone (Cluster 1)
}

# --- 1. FULL PREPROCESSING ---

def load_and_preprocess_rf(csv_path):
    """Loads raw RF data, preprocesses, and returns the normalized amplitude array."""
    df = pd.read_csv(csv_path)
    if "mode" in df.columns:
        df = df[df["mode"].astype(str).str.upper() == "B"]
    
    df.sort_values(["beam", "sample"], inplace=True)
    nb, ns = int(df["beam"].max() + 1), int(df["sample"].max() + 1)
    
    real = np.zeros((nb, ns), np.float32)
    imag = np.zeros((nb, ns), np.float32)
    b = df["beam"].astype(int).values
    s = df["sample"].astype(int).values
    real[b, s] = df["real"].astype(np.float32).values
    imag[b, s] = df["imag"].astype(np.float32).values

    # Full Preprocessing Pipeline
    real = real - np.mean(real)
    imag = imag - np.mean(imag)
    amp = np.sqrt(real**2 + imag**2)
    thresh = np.percentile(amp, 99.9) 
    amp = np.clip(amp, 0, thresh)
    amp_log = np.log1p(amp)
    amp_norm = minmax_scale(amp_log.flatten()).reshape(amp_log.shape)
    
    # Return the normalized amplitude array with scaling factor
    return amp_norm * np.sqrt(2.0) 


# --- 2. 9-FEATURE EXTRACTION ---

def extract_fft_features(amp_array):
    """Calculates 9 Envelope and Spectral features."""
    A = amp_array.astype(np.float32)
    
    # 2D FFT and Log Power Spectrum
    F = np.abs(fftshift(fft2(A)))
    F = np.log(F + 1e-6)
    F = np.nan_to_num(F)
    F_flat = F.flatten()
    F_min, F_max = np.min(F_flat), np.max(F_flat) + 1e-9
    hist, _ = np.histogram(F_flat, bins=128, range=(F_min, F_max), density=True)

    # Entropy requires normalized histogram of the Amplitude Array
    env_entropy_hist, _ = np.histogram(A, bins=64, range=(0, np.max(A) + 1e-9), density=True)
    
    return {
        "Env_Energy": float(np.mean(A**2)),
        "Env_Mean": float(np.mean(A)),
        "Env_Std": float(np.std(A)),
        "Env_Entropy": float(entropy(env_entropy_hist + 1e-9)),
        "Spec_Mean": float(np.mean(F_flat)),
        "Spec_Std": float(np.std(F_flat)),
        "Spec_Entropy": float(entropy(hist + 1e-9)),
        "Spec_Peak": float(np.max(F_flat)),
        "Spec_Centroid": float(np.sum(np.arange(F_flat.size) * F_flat) / (np.sum(F_flat) + 1e-9)),
    }

# --- 3. PREDICTION LOGIC ---

def predict_rf_csv(csv_path):
    try:
        # Load Model Bundle (Model + Scaler) from the single file
        bundle = joblib.load(MODEL_BUNDLE_PATH)
        rf_model = bundle["model"]
        scaler = bundle["scaler"]
    except Exception as e:
        return {"error": f"Failed to load model/scaler bundle from {os.path.basename(MODEL_BUNDLE_PATH)}: {str(e)}"}

    try:
        # Pipeline: Preprocess -> Feature Extract -> Scale
        amp_norm = load_and_preprocess_rf(csv_path)
        feats = extract_fft_features(amp_norm)
        
        # Format features and scale
        X = np.array([[feats[f] for f in RF_FEATURES]])
        X_scaled = scaler.transform(X)

        # Prediction and Interpretation
        probs = rf_model.predict_proba(X_scaled)[0]
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx]) # Confidence 0.0 to 1.0

        # --- KEY CHANGE: ALWAYS ASSIGN TO CLUSTER ---
        pred_class = CLUSTER_LABELS.get(pred_idx, f"UnknownCluster_{pred_idx}")
        stone_exists = True # Always True, as the model is only for stone subtypes
        message = f"Assigned Stone Subtype: {pred_class}."
        size_category = pred_class 
        
        # Return Compatible JSON (Confidence as Percentage)
        result = {
            "file": os.path.basename(csv_path),
            "prediction": pred_class, # e.g., "LowReflectionStone"
            "confidence": round(confidence * 100.0, 2), # Frontend expects percentage
            "stone_exists": stone_exists, # Set to True for compatibility
            "message": message,
            "size_category": size_category 
        }
        return result
    except Exception as e:
        return {"error": f"Prediction error: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No CSV file provided"}))
        sys.exit(1)

    csv_path = sys.argv[1]
    result = predict_rf_csv(csv_path)
    # ALWAYS print exactly one JSON object to stdout
    print(json.dumps(result))