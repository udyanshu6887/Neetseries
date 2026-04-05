// ──────────────────────────────────────
// Attempt Service — Test-taking operations
// ──────────────────────────────────────

import { prisma } from "@mirai/db";

// ──────────────────────────────────────
// Start a new attempt
// ──────────────────────────────────────

export async function startAttempt(testId: string, userId: string) {
    // Check for existing in-progress attempt
    const existing = await prisma.attempt.findFirst({
        where: { testId, userId, status: "IN_PROGRESS" },
    });

    if (existing) {
        return getAttemptData(existing.id);
    }

    // Count previous attempts for attemptNumber
    const prevCount = await prisma.attempt.count({
        where: { testId, userId },
    });

    // Create new attempt
    const attempt = await prisma.attempt.create({
        data: {
            userId,
            testId,
            attemptNumber: prevCount + 1,
            status: "IN_PROGRESS",
            serverStartTime: new Date(),
        },
    });

    return getAttemptData(attempt.id);
}

// ──────────────────────────────────────
// Get attempt with questions (no correct answers for in-progress)
// ──────────────────────────────────────

export async function getAttemptData(attemptId: string) {
    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: {
            test: {
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
                                    marks: true,
                                    negativeMarks: true,
                                    topic: true,
                                    difficulty: true,
                                    category: true,
                                    subject: true,
                                    // correctAnswer NOT included for in-progress
                                },
                            },
                        },
                    },
                },
            },
            answers: true,
        },
    });

    if (!attempt) return null;

    const isSubmitted = attempt.status === "SUBMITTED";

    // Build question list
    const questions = attempt.test.testQuestions.map((tq) => {
        const answer = attempt.answers.find((a) => a.questionId === tq.question.id);
        return {
            questionId: tq.question.id,
            order: tq.order,
            type: tq.question.type,
            text: tq.question.text,
            options: tq.question.options,
            marks: tq.customMarks ?? tq.question.marks,
            negativeMarks: tq.customNegativeMarks ?? tq.question.negativeMarks,
            topic: tq.question.topic,
            difficulty: tq.question.difficulty,
            category: tq.question.category,
            subject: tq.question.subject,
            // Student's answer
            selectedOption: answer?.selectedOption ?? null,
            numericalAnswer: answer?.numericalAnswer ?? null,
            markedForReview: answer?.markedForReview ?? false,
        };
    });

    return {
        id: attempt.id,
        testId: attempt.testId,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        evaluationStatus: attempt.evaluationStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: isSubmitted ? attempt.score : null,
        serverStartTime: attempt.serverStartTime,
        test: {
            title: attempt.test.title,
            description: attempt.test.description,
            duration: attempt.test.duration,
            totalQuestions: attempt.test.testQuestions.length,
        },
        questions,
    };
}

// ──────────────────────────────────────
// Save answer (auto-save during test)
// ──────────────────────────────────────

export async function saveAnswer(
    attemptId: string,
    questionId: string,
    data: {
        selectedOption?: number | null;
        numericalAnswer?: number | null;
        markedForReview?: boolean;
    }
) {
    // Verify attempt is still in-progress
    const attempt = await prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.status !== "IN_PROGRESS") {
        throw new Error("ATTEMPT_NOT_IN_PROGRESS");
    }

    // Check server-side timeout
    const deadline = new Date(attempt.serverStartTime.getTime());
    const test = await prisma.test.findUnique({ where: { id: attempt.testId }, select: { duration: true } });
    if (test) {
        deadline.setSeconds(deadline.getSeconds() + test.duration + 60); // +60s grace
        if (new Date() > deadline) {
            // Auto-submit if past deadline
            await submitAttempt(attemptId);
            throw new Error("ATTEMPT_AUTO_SUBMITTED");
        }
    }

    // Upsert answer
    const answer = await prisma.answer.upsert({
        where: {
            attemptId_questionId: { attemptId, questionId },
        },
        create: {
            attemptId,
            questionId,
            selectedOption: data.selectedOption,
            numericalAnswer: data.numericalAnswer,
            markedForReview: data.markedForReview ?? false,
        },
        update: {
            selectedOption: data.selectedOption,
            numericalAnswer: data.numericalAnswer,
            ...(data.markedForReview !== undefined && { markedForReview: data.markedForReview }),
        },
    });

    return answer;
}

// ──────────────────────────────────────
// Submit attempt and auto-evaluate
// ──────────────────────────────────────

export async function submitAttempt(attemptId: string) {
    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: {
            answers: true,
            test: {
                include: {
                    testQuestions: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    type: true,
                                    correctAnswer: true,
                                    marks: true,
                                    negativeMarks: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!attempt) throw new Error("ATTEMPT_NOT_FOUND");
    if (attempt.status === "SUBMITTED") throw new Error("ALREADY_SUBMITTED");

    let totalScore = 0;

    // Evaluate each answer
    for (const tq of attempt.test.testQuestions) {
        const answer = attempt.answers.find((a) => a.questionId === tq.question.id);
        if (!answer) continue;

        const correctAnswer = tq.question.correctAnswer;
        const marks = tq.customMarks ?? tq.question.marks;
        const negMarks = tq.customNegativeMarks ?? tq.question.negativeMarks;

        let isCorrect: boolean | null = null;
        let marksAwarded = 0;

        if (tq.question.type === "MCQ") {
            if (answer.selectedOption !== null && answer.selectedOption !== undefined) {
                // Convert option index (0-3) to letter (A-D)
                const optionLetter = String.fromCharCode(65 + answer.selectedOption);
                isCorrect = optionLetter === correctAnswer;
                marksAwarded = isCorrect ? marks : -negMarks;
            }
        } else if (tq.question.type === "NUMERICAL") {
            if (answer.numericalAnswer !== null && answer.numericalAnswer !== undefined) {
                isCorrect = String(answer.numericalAnswer) === correctAnswer;
                marksAwarded = isCorrect ? marks : -negMarks;
            }
        }

        totalScore += marksAwarded;

        await prisma.answer.update({
            where: { id: answer.id },
            data: { isCorrect, marksAwarded },
        });
    }

    // Update attempt
    await prisma.attempt.update({
        where: { id: attemptId },
        data: {
            status: "SUBMITTED",
            evaluationStatus: "EVALUATED",
            submittedAt: new Date(),
            score: totalScore,
        },
    });

    return { score: totalScore };
}

// ──────────────────────────────────────
// Get result (after submission)
// ──────────────────────────────────────

export async function getResult(attemptId: string) {
    const attempt = await prisma.attempt.findUnique({
        where: { id: attemptId },
        include: {
            answers: {
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
                            explanation: true,
                        },
                    },
                },
            },
            test: {
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
                                    explanation: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!attempt) return null;
    if (attempt.status !== "SUBMITTED") return null;

    const totalMarks = attempt.test.testQuestions.reduce(
        (s, tq) => s + (tq.customMarks ?? tq.question.marks), 0
    );

    const questions = attempt.test.testQuestions.map((tq) => {
        const answer = attempt.answers.find((a) => a.questionId === tq.question.id);
        return {
            questionId: tq.question.id,
            order: tq.order,
            type: tq.question.type,
            text: tq.question.text,
            options: tq.question.options,
            correctAnswer: tq.question.correctAnswer,
            marks: tq.customMarks ?? tq.question.marks,
            negativeMarks: tq.customNegativeMarks ?? tq.question.negativeMarks,
            topic: tq.question.topic,
            difficulty: tq.question.difficulty,
            category: tq.question.category,
            subject: tq.question.subject,
            explanation: tq.question.explanation,
            // Student's answer
            selectedOption: answer?.selectedOption ?? null,
            numericalAnswer: answer?.numericalAnswer ?? null,
            isCorrect: answer?.isCorrect ?? null,
            marksAwarded: answer?.marksAwarded ?? 0,
        };
    });

    return {
        id: attempt.id,
        testId: attempt.testId,
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        totalMarks,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        test: {
            title: attempt.test.title,
            totalQuestions: attempt.test.testQuestions.length,
        },
        questions,
    };
}

// ──────────────────────────────────────
// Get all attempts for a user
// ──────────────────────────────────────

export async function getUserAttempts(userId: string) {
    const attempts = await prisma.attempt.findMany({
        where: { userId, status: "SUBMITTED" },
        include: {
            test: {
                select: {
                    title: true,
                    duration: true,
                    testQuestions: { select: { customMarks: true, question: { select: { marks: true } } } },
                },
            },
        },
        orderBy: { submittedAt: "desc" },
    });

    return attempts.map((a) => {
        const totalMarks = a.test.testQuestions.reduce(
            (s, tq) => s + (tq.customMarks ?? tq.question.marks), 0
        );
        return {
            id: a.id,
            testId: a.testId,
            testTitle: a.test.title,
            attemptNumber: a.attemptNumber,
            score: a.score,
            totalMarks,
            percentage: totalMarks > 0 ? Math.round(((a.score ?? 0) / totalMarks) * 100) : 0,
            submittedAt: a.submittedAt,
            duration: a.test.duration,
        };
    });
}
