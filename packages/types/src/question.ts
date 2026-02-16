// ──────────────────────────────────────
// Question Types
// ──────────────────────────────────────

export enum QuestionType {
    MCQ = "MCQ",
    NUMERICAL = "NUMERICAL",
    SUBJECTIVE = "SUBJECTIVE",
    ASSERTION_REASON = "ASSERTION_REASON",
}

export enum Difficulty {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
}

// ──────────────────────────────────────
// MCQ Option Shape
// ──────────────────────────────────────

export interface MCQOption {
    id: string;
    text: string;
    isCorrect: boolean;
}

// ──────────────────────────────────────
// Question Inputs & Outputs
// ──────────────────────────────────────

export interface CreateQuestionInput {
    type: QuestionType;
    text: string;
    options?: MCQOption[];          // only for MCQ
    correctAnswer?: string;         // for NUMERICAL: the number as string; for SUBJECTIVE: model answer
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: Difficulty;
    explanation?: string;
    // CSV Import Fields
    year?: number;
    subject?: string;
    chapter?: string;
    hint?: string;
    timeExpectedSec?: number;
}

export interface QuestionResponse {
    id: string;
    type: QuestionType;
    text: string;
    options?: MCQOption[];
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: Difficulty;
    explanation?: string;
    // CSV Import Fields
    year?: number;
    subject?: string;
    chapter?: string;
    hint?: string;
    timeExpectedSec?: number;
    createdBy: string;
    createdAt: Date;
}