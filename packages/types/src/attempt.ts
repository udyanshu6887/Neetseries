// ──────────────────────────────────────
// Attempt Status (what stage is the attempt in?)
// ──────────────────────────────────────

export enum AttemptStatus {
    IN_PROGRESS = "IN_PROGRESS",     // student is currently taking the test
    SUBMITTED = "SUBMITTED",         // student clicked submit (or timer expired)
    ABANDONED = "ABANDONED",         // student started but never submitted (browser crash, etc.)
}

// ──────────────────────────────────────
// Evaluation Status (has the attempt been graded?)
// ──────────────────────────────────────

export enum EvaluationStatus {
    PENDING = "PENDING",             // not yet evaluated
    IN_REVIEW = "IN_REVIEW",         // teacher is currently grading (subjective)
    EVALUATED = "EVALUATED",         // fully graded, score is final
}

// ──────────────────────────────────────
// Attempt (a student's test session)
// ──────────────────────────────────────

export interface StartAttemptInput {
    testId: string;
}

export interface AttemptResponse {
    id: string;
    userId: string;
    testId: string;
    status: AttemptStatus;
    evaluationStatus: EvaluationStatus;
    startedAt: Date;
    submittedAt?: Date;              // null if not yet submitted
    score?: number;                  // null until evaluated
    serverStartTime: Date;           // for timer sync
}

// ──────────────────────────────────────
// Answer (a student's response to one question)
// ──────────────────────────────────────

export interface SubmitAnswerInput {
    attemptId: string;
    questionId: string;
    selectedOption?: number;          // for MCQ: index of chosen option
    numericalAnswer?: number;         // for NUMERICAL: the number typed
    subjectiveAnswer?: string;        // for SUBJECTIVE: the text written
}

export interface AnswerResponse {
    id: string;
    attemptId: string;
    questionId: string;
    selectedOption?: number;
    numericalAnswer?: number;
    subjectiveAnswer?: string;
    isCorrect?: boolean;              // null until evaluated
    marksAwarded?: number;            // null until evaluated
}