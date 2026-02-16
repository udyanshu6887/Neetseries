// ──────────────────────────────────────
// Feature Flags
// ──────────────────────────────────────

export const features = {
    leaderboard: process.env.FEATURE_LEADERBOARD === "true",
    payments: process.env.FEATURE_PAYMENTS === "true",
    aiEvaluation: process.env.FEATURE_AI_EVALUATION === "true",
    ads: process.env.FEATURE_ADS === "true",
};