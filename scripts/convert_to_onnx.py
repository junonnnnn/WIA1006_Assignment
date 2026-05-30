"""Convert final_model.pkl (LightGBM) -> web/public/model.onnx + feature_meta.json.

Run from repo root:  python scripts/convert_to_onnx.py
"""
from __future__ import annotations

import json
import sys
import warnings
from pathlib import Path

import joblib
import numpy as np
import onnxruntime as ort
import pandas as pd
from onnxmltools.convert import convert_lightgbm
from onnxmltools.convert.common.data_types import FloatTensorType

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parent.parent
MODEL_PKL = ROOT / "final_model.pkl"
DATASET_CSV = ROOT / "dating_app_behavior_dataset_extended.csv"
OUT_DIR = ROOT / "web" / "public"
OUT_ONNX = OUT_DIR / "model.onnx"
OUT_META = OUT_DIR / "feature_meta.json"

# Alphabetical LabelEncoder order — verified against dataset uniques below.
CLASS_LABELS = [
    "Blocked",
    "Catfished",
    "Chat Ignored",
    "Date Happened",
    "Ghosted",
    "Instant Match",
    "Mutual Match",
    "No Action",
    "One-sided Like",
    "Relationship Formed",
]


def main() -> int:
    print(f"[load] {MODEL_PKL}")
    model = joblib.load(MODEL_PKL)
    feature_names = list(model.feature_name_)
    n_features = model.n_features_in_
    assert n_features == len(feature_names) == 30, "unexpected feature count"
    assert list(model.classes_) == list(range(10)), f"classes_ = {model.classes_}"

    print(f"[load] {DATASET_CSV}")
    df = pd.read_csv(DATASET_CSV)
    csv_classes = sorted(df["match_outcome"].dropna().unique().tolist())
    assert csv_classes == CLASS_LABELS, f"label mismatch: {csv_classes}"

    print("[convert] LightGBM -> ONNX")
    initial_types = [("input", FloatTensorType([None, n_features]))]
    onnx_model = convert_lightgbm(
        model,
        initial_types=initial_types,
        zipmap=False,
        target_opset=13,
    )
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_ONNX.write_bytes(onnx_model.SerializeToString())
    print(f"[write] {OUT_ONNX} ({OUT_ONNX.stat().st_size/1_048_576:.2f} MB)")

    # ---- parity check: ONNX vs sklearn on 20 random rows --------------------
    print("[verify] generating random feature rows for parity check")
    rng = np.random.default_rng(0)
    X = rng.standard_normal((20, n_features)).astype(np.float32)
    sk_probs = model.predict_proba(X)
    sess = ort.InferenceSession(str(OUT_ONNX), providers=["CPUExecutionProvider"])
    out_names = [o.name for o in sess.get_outputs()]
    onnx_out = sess.run(None, {"input": X})
    # find the probability tensor (shape [20, 10])
    onnx_probs = next(arr for arr in onnx_out if arr.ndim == 2 and arr.shape == (20, 10))
    max_abs = float(np.max(np.abs(sk_probs - onnx_probs)))
    print(f"[verify] outputs={out_names}  max abs prob diff = {max_abs:.2e}")
    if max_abs > 1e-4:
        print("[verify] FAILED — parity error too large", file=sys.stderr)
        return 1

    # ---- compute medians/modes for perturbation-based explanations ----------
    # Recompute the same engineered/dummy features the trainer used so that the
    # frontend can substitute a "neutral" baseline per UI field.
    print("[meta] computing dataset baselines for explanation perturbations")
    medians = {
        "age": float(df["age"].median()),
        "mutual_matches": float(df["mutual_matches"].median()),
        "bio_length": float(df["bio_length"].median()),
        "emoji_usage_rate": float(df["emoji_usage_rate"].median()),
        "last_active_hour_cos": float(
            np.cos(2 * np.pi * df["last_active_hour"].median() / 24.0)
        ),
    }
    modes = {
        col: df[col].mode().iloc[0]
        for col in [
            "gender",
            "sexual_orientation",
            "location_type",
            "body_type",
            "relationship_intent",
            "swipe_time_of_day",
        ]
    }

    meta = {
        "feature_names": feature_names,
        "class_labels": CLASS_LABELS,
        "global_importances": {
            name: int(imp)
            for name, imp in zip(feature_names, model.feature_importances_)
        },
        "baseline": {
            "numeric_medians": medians,
            "categorical_modes": modes,
        },
        "n_features": n_features,
    }
    OUT_META.write_text(json.dumps(meta, indent=2))
    print(f"[write] {OUT_META}")
    print("[done]")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
