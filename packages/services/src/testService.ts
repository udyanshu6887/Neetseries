// ──────────────────────────────────────
// Test Service — CRUD operations for tests
// ──────────────────────────────────────

import { prisma } from "@mirai/db";
import type {
    CreateTestInput,
    TestResponse,
    AddQuestionToTestInput,
    TestQuestionResponse,
    EvaluationType,
} from "@mirai/types";

// Helper: map Prisma test row → TestResponse
function toResponse(
    t: {
        id: string;
        title: string;
        description: string | null;
        duration: number;
        evaluationType: string;
        isPublished: boolean;
        leaderboardVisible: boolean;
        createdById: string;
        createdAt: Date;
    },
    questionCount: number,
    totalMarks: number = 0
): TestResponse {
    return {
        id: t.id,
        title: t.title,
        description: t.description ?? undefined,
        duration: t.duration,
        evaluationType: t.evaluationType as EvaluationType,
        isPublished: t.isPublished,
        leaderboardVisible: t.leaderboardVisible,
        totalQuestions: questionCount,
        totalMarks,
        createdBy: t.createdById,
        createdAt: t.createdAt,
    };
}

// ──────────────────────────────────────
// Create a new test
// ──────────────────────────────────────

export async function create(
    input: CreateTestInput,
    creatorId: string
): Promise<TestResponse> {
    const test = await prisma.test.create({
        data: {
            title: input.title,
            description: input.description,
            duration: input.duration,
            evaluationType: input.evaluationType,
            createdById: creatorId,
        },
    });

    return toResponse(test, 0);
}

// ──────────────────────────────────────
// List all tests
// ──────────────────────────────────────

export async function list(options?: {
    publishedOnly?: boolean;
}): Promise<TestResponse[]> {
    const tests = await prisma.test.findMany({
        where: {
            ...(options?.publishedOnly && { isPublished: true }),
        },
        include: {
            _count: { select: { testQuestions: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return tests.map((t) => toResponse(t, t._count.testQuestions));
}

// ──────────────────────────────────────
// Get test by ID (with questions)
// ──────────────────────────────────────

export async function getById(id: string): Promise<TestResponse | null> {
    const test = await prisma.test.findUnique({
        where: { id },
        include: {
            _count: { select: { testQuestions: true } },
        },
    });

    if (!test) return null;
    return toResponse(test, test._count.testQuestions);
}

// ──────────────────────────────────────
// Add a question to a test
// ──────────────────────────────────────

export async function addQuestion(
    input: AddQuestionToTestInput
): Promise<TestQuestionResponse> {
    // Get the current max order for this test
    const maxOrder = await prisma.testQuestion.aggregate({
        where: { testId: input.testId },
        _max: { order: true },
    });

    const nextOrder = input.order ?? (maxOrder._max.order ?? 0) + 1;

    const testQuestion = await prisma.testQuestion.create({
        data: {
            test: { connect: { id: input.testId } },
            question: { connect: { id: input.questionId } },
            order: nextOrder,
            customMarks: input.customMarks,
            customNegativeMarks: input.customNegativeMarks,
        },
    });

    return {
        id: testQuestion.id,
        testId: testQuestion.testId,
        questionId: testQuestion.questionId,
        order: testQuestion.order,
        customMarks: testQuestion.customMarks ?? undefined,
        customNegativeMarks: testQuestion.customNegativeMarks ?? undefined,
    };
}

// ──────────────────────────────────────
// Publish/unpublish a test
// ──────────────────────────────────────

export async function publish(id: string, isPublished: boolean): Promise<TestResponse> {
    const test = await prisma.test.update({
        where: { id },
        data: { isPublished },
        include: {
            _count: { select: { testQuestions: true } },
        },
    });

    return toResponse(test, test._count.testQuestions);
}
