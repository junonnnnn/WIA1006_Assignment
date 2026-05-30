# Match Outcome Predictor

A production-grade, Apple-minimalist web UI for the LightGBM model trained in
`final_model.pkl`. The model predicts the most likely dating-app interaction
outcome (Mutual Match, Ghosted, Relationship Formed, …) from a user's profile
and behaviour signals.

Inference runs **entirely in the browser** via `onnxruntime-web` — no server,
no data leaves the user's device. The site deploys to GitHub Pages as static
assets.

## Layout

```
final_model.pkl                  trained LightGBM classifier (Python)
dating_app_behavior_dataset_extended.csv   training data
scripts/convert_to_onnx.py       one-shot pkl -> ONNX conversion
web/                             Vite + React + TypeScript + Tailwind frontend
.github/workflows/deploy.yml     CI: build + deploy to GitHub Pages
```

## Local development

```bash
# 1. (one-time) convert the pickled model to ONNX
pip install onnxmltools skl2onnx onnxruntime lightgbm scikit-learn joblib
python scripts/convert_to_onnx.py
# outputs: web/public/model.onnx, web/public/feature_meta.json

# 2. frontend
cd web
npm install
npm run dev       # http://localhost:5173/
npm test          # vitest unit + parity tests
npm run build     # static bundle in web/dist/
npm run preview   # serve the build locally on :4173
```

## Deploying to GitHub Pages

1. Push the repo to GitHub.
2. In the repository settings → **Pages**, set **Source** to **GitHub Actions**.
3. The first push to `main` triggers `.github/workflows/deploy.yml`, which
   builds `web/` and publishes the result. The site URL appears in the
   workflow's deploy step output.

The workflow injects `VITE_BASE_PATH=/<repo-name>/` automatically so asset
paths resolve correctly under the Pages sub-directory.

## Notes on the model

- 300-tree LightGBM classifier, 30 input features, 10 output classes.
- Features cover 5 numeric signals (age, mutual matches, emoji-usage rate,
  bio length, last-active hour cosine) and 25 one-hot dummies covering a
  subset of category levels. The remaining category levels act as the
  baseline (all-zero) class — see [`web/src/lib/encodeFeatures.ts`](web/src/lib/encodeFeatures.ts).
- `scripts/convert_to_onnx.py` verifies ONNX/sklearn parity to ≤1e-4 before
  writing the model, and emits dataset medians/modes used for per-prediction
  perturbation-based explanations.
