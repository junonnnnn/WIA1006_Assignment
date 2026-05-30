# Tying the (Data) Knot — Love, Life & Likes

**WIA1006 / WID3006 Machine Learning — Group Assignment**
Semester 2, Session 2025/2026 (Occurrence 8) · Group 3
Faculty of Computer Science and Information Technology, Universiti Malaya

Predicting match outcomes on a synthetic dating application using machine
learning, with an accompanying browser-based demo of the final model.

## Project

Modern romantic and social connections increasingly form through dating
applications, where every interaction is mediated by behavioural signals —
how quickly users reply, how they swipe, how they present themselves through
profiles, bios, and emojis. This project asks whether such signals carry
predictive information about what happens to a match.

We framed the task as a supervised **multi-class classification** problem:
given a user's profile and in-app behaviour, predict their `match_outcome`,
which has ten possible classes — *One-sided Like, Instant Match, Blocked,
Catfished, Chat Ignored, Mutual Match, No Action, Ghosted, Date Happened, and
Relationship Formed*. The dataset is a synthetic, extended version of the
Kaggle *Dating App Behavior Dataset* containing 50 000 records and 24
behavioural and demographic features.

## Methodology

The pipeline follows the seven canonical stages of a machine-learning project:

1. **Project design.** Framed `match_outcome` as a balanced ten-class
   classification target, chosen because it folds ghosting, blocking,
   catfishing, and successful matches into a single label.
2. **Data acquisition.** Loaded the 50 000-row synthetic dataset and confirmed
   no exact duplicates.
3. **Pre-processing.** Cleaned and standardised the raw fields, including
   cyclical encoding of `last_active_hour` via a cosine transform and
   conversion of `emoji_usage_rate` to a proper ratio.
4. **Feature selection and extraction.**
   - `MultiLabelBinarizer` expanded the `interest_tags` field, raising the
     working feature count to 114.
   - `VarianceThreshold` removed near-constant columns (114 → 53).
   - `SelectKBest` with mutual information retained the 30 most informative
     features.
   - Random-Forest importance and PCA were used as cross-checks; the named
     30-feature set was kept for interpretability.
5. **Model selection.** Six classifiers spanning linear, bagging, and boosting
   families: Logistic Regression, Random Forest, Extra Trees, Gradient
   Boosting, XGBoost, and LightGBM.
6. **Training and tuning.** Each model was tuned with `RandomizedSearchCV`
   using 3-fold cross-validation and **macro-averaged F1** as the scoring
   metric (appropriate for a balanced multi-class problem).
7. **Evaluation.** Compared models on macro-F1, accuracy, and training time;
   inspected the best model's confusion matrix; and benchmarked against
   `auto-sklearn` to establish the empirical performance ceiling.

## Results

- The target is almost perfectly balanced — each of the ten classes holds
  ~10% of the data, so chance-level accuracy is **10%**.
- Mutual information between every feature and the target is uniformly near
  zero: the strongest feature (`age`) scores **0.0077**, and the rest fall
  below 0.007 — values indistinguishable from noise.
- All six tuned models converged on roughly **10% accuracy and macro-F1**,
  i.e. chance level. Tuned LightGBM was the best of the six and is the model
  shipped here as `final_model.pkl` (300 trees on the 30 selected features).
- The confusion matrix of the best model shows predictions spread almost
  uniformly across every class, with no visible diagonal concentration — the
  visual signature of chance-level performance.
- `auto-sklearn`, given free rein to search and ensemble, reproduced the same
  ~10% ceiling, confirming the limitation is intrinsic to the data and not to
  our modelling choices.

## Conclusion

When linear models, bagging ensembles, boosting ensembles, and a fully
automated AutoML framework all arrive at chance-level performance, the only
consistent explanation is that the target was generated **independently of
the features**: the synthetic dataset's `match_outcome` labels appear to have
been assigned by random sampling rather than by a rule that depends on user
attributes. No amount of feature engineering, model tuning, or automated
search can recover a relationship that was never encoded.

A chance-level result is not the same as a methodological failure. The value
of the project lies in the rigour with which the absence of signal was
established — avoiding the traps of label leakage, training-set evaluation,
or metric misreading that might otherwise have produced a misleadingly
inflated accuracy. Reporting an honest negative finding is, on a topic as
socially loaded as predicting relationship outcomes from demographic
attributes, also the ethically appropriate outcome.

## About this repository

The web app in `web/` is an Apple-minimalist interface that runs the trained
LightGBM model entirely in the browser via `onnxruntime-web` — the pickled
model is converted to ONNX once and shipped as a static asset, with no
backend or data upload. Because the underlying dataset contains no
learnable signal, the predictions surfaced by the app should be understood
as a faithful, interactive demonstration of the trained pipeline rather
than as meaningful life advice. For the full analysis, see the report
PDF included in this repository.
