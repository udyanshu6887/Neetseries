// ──────────────────────────────────────
// Question Service — CRUD operations for questions
// ──────────────────────────────────────

import { prisma } from "@mirai/db";
import type { CreateQuestionInput, QuestionResponse, QuestionType, Difficulty, MCQOption } from "@mirai/types";

// Helper: map Prisma question row → QuestionResponse
function toResponse(q: {
    id: string;
    type: string;
    text: string;
    options: unknown;
    correctAnswer: string | null;
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: string;
    explanation: string | null;
    year: number | null;
    subject: string | null;
    chapter: string | null;
    hint: string | null;
    timeExpectedSec: number | null;
    createdById: string;
    createdAt: Date;
}): QuestionResponse {
    return {
        id: q.id,
        type: q.type as QuestionType,
        text: q.text,
        options: (q.options as MCQOption[] | null) ?? undefined,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        topic: q.topic,
        difficulty: q.difficulty as Difficulty,
        explanation: q.explanation ?? undefined,
        year: q.year ?? undefined,
        subject: q.subject ?? undefined,
        chapter: q.chapter ?? undefined,
        hint: q.hint ?? undefined,
        timeExpectedSec: q.timeExpectedSec ?? undefined,
        createdBy: q.createdById,
        createdAt: q.createdAt,
    };
}

// ──────────────────────────────────────
// Create a new question
// ──────────────────────────────────────

export async function create(
    input: CreateQuestionInput,
    creatorId: string
): Promise<QuestionResponse> {
    const question = await prisma.question.create({
        data: {
            type: input.type,
            text: input.text,
            options: input.options ? JSON.parse(JSON.stringify(input.options)) : undefined,
            correctAnswer: input.correctAnswer,
            marks: input.marks,
            negativeMarks: input.negativeMarks || 0,
            topic: input.topic,
            difficulty: input.difficulty,
            explanation: input.explanation,
            year: input.year,
            subject: input.subject,
            chapter: input.chapter,
            hint: input.hint,
            timeExpectedSec: input.timeExpectedSec,
            createdById: creatorId,
        },
    });

    return toResponse(question);
}

// ──────────────────────────────────────
// List all questions (with optional filters)
// ──────────────────────────────────────

export async function list(filters?: {
    topic?: string;
    difficulty?: string;
    type?: string;
}): Promise<QuestionResponse[]> {
    const questions = await prisma.question.findMany({
        where: {
            ...(filters?.topic && { topic: filters.topic }),
            ...(filters?.difficulty && { difficulty: filters.difficulty }),
            ...(filters?.type && { type: filters.type }),
        },
        orderBy: { createdAt: "desc" },
    });

    return questions.map(q => toResponse(q));
}

// ──────────────────────────────────────
// Get question by ID
// ──────────────────────────────────────

export async function getById(id: string): Promise<QuestionResponse | null> {
    const question = await prisma.question.findUnique({
        where: { id },
    });

    if (!question) return null;
    return toResponse(question);
}
