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
// Get test by ID (basic)
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
// Get test by ID WITH full question details
// ──────────────────────────────────────

export async function getByIdWithQuestions(id: string) {
    const test = await prisma.test.findUnique({
        where: { id },
        include: {
            testQuestions: {
                orderBy: { order: "asc" },
                include: {
                    question: {
                        select: {
                            id: true,
                            type: true,
                            text: true,
                            options: true,
                            correctAnswer: true,
                            marks: true,
                            negativeMarks: true,
                            topic: true,
                            difficulty: true,
                            category: true,
                            subject: true,
                            chapter: true,
                            year: true,
                        },
                    },
                },
            },
            _count: { select: { attempts: true } },
        },
    });

    if (!test) return null;

    const totalMarks = test.testQuestions.reduce((sum, tq) => {
        return sum + (tq.customMarks ?? tq.question.marks);
    }, 0);

    return {
        id: test.id,
        title: test.title,
        description: test.description,
        duration: test.duration,
        evaluationType: test.evaluationType,
        isPublished: test.isPublished,
        leaderboardVisible: test.leaderboardVisible,
        totalQuestions: test.testQuestions.length,
        totalMarks,
        totalAttempts: test._count.attempts,
        createdById: test.createdById,
        createdAt: test.createdAt,
        questions: test.testQuestions.map((tq) => ({
            testQuestionId: tq.id,
            order: tq.order,
            customMarks: tq.customMarks,
            customNegativeMarks: tq.customNegativeMarks,
            ...tq.question,
        })),
    };
}

// ──────────────────────────────────────
// Update test metadata
// ──────────────────────────────────────

export async function update(
    id: string,
    data: {
        title?: string;
        description?: string;
        duration?: number;
        evaluationType?: string;
        leaderboardVisible?: boolean;
    }
): Promise<TestResponse> {
    const test = await prisma.test.update({
        where: { id },
        data,
        include: {
            _count: { select: { testQuestions: true } },
        },
    });

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
// Remove a question from a test
// ──────────────────────────────────────

export async function removeQuestion(testId: string, questionId: string) {
    await prisma.testQuestion.deleteMany({
        where: { testId, questionId },
    });
}

// ──────────────────────────────────────
// Reorder questions in a test
// ──────────────────────────────────────

export async function reorderQuestions(
    testId: string,
    questionOrder: { testQuestionId: string; order: number }[]
) {
    await prisma.$transaction(
        questionOrder.map((q) =>
            prisma.testQuestion.update({
                where: { id: q.testQuestionId },
                data: { order: q.order },
            })
        )
    );
}

// ──────────────────────────────────────
// Delete a test (guard: no attempts allowed)
// ──────────────────────────────────────

export async function deleteTest(id: string) {
    const test = await prisma.test.findUnique({
        where: { id },
        include: { _count: { select: { attempts: true } } },
    });

    if (!test) throw new Error("TEST_NOT_FOUND");
    if (test._count.attempts > 0) throw new Error("TEST_HAS_ATTEMPTS");

    // Delete test questions first, then the test
    await prisma.$transaction([
        prisma.testQuestion.deleteMany({ where: { testId: id } }),
        prisma.test.delete({ where: { id } }),
    ]);
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
