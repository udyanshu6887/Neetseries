// ──────────────────────────────────────
// Evaluation Types
// ──────────────────────────────────────

export enum EvaluationType {
    AUTO = "AUTO",           // MCQ + Numerical → instant grading
    MANUAL = "MANUAL",       // Subjective → teacher grades manually
    HYBRID = "HYBRID",       // Mix of both (e.g., MCQ + Subjective in same test)
}

// ──────────────────────────────────────
// Test Inputs & Outputs
// ──────────────────────────────────────

export interface CreateTestInput {
    title: string;
    description?: string;
    duration: number;                // in seconds (e.g., 3600 = 1 hour)
    leaderboardVisible: boolean;
    evaluationType: EvaluationType;
}

export interface TestResponse {
    id: string;
    title: string;
    description?: string;
    duration: number;
    leaderboardVisible: boolean;
    evaluationType: EvaluationType;
    isPublished: boolean;
    totalQuestions: number;
    totalMarks: number;
    createdBy: string;
    createdAt: Date;
}

// ──────────────────────────────────────
// TestQuestion — Join Table
// Links questions to tests with per-test customization
// ──────────────────────────────────────

export interface AddQuestionToTestInput {
    testId: string;
    questionId: string;
    order: number;                    // display order in the test
    customMarks?: number;             // override question's default marks for THIS test
    customNegativeMarks?: number;     // override negative marks for THIS test
}

export interface TestQuestionResponse {
    id: string;
    testId: string;
    questionId: string;
    order: number;
    customMarks?: number;
    customNegativeMarks?: number;
}