// GET /api/dashboard — Dashboard stats for home page
// Returns different data based on user role

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (_req: NextRequest, user) => {
    try {
        const isAdmin = user.role === "ADMIN" || user.role === "TEACHER";

        if (isAdmin) {
            // Admin dashboard stats
            const [
                totalQuestions,
                totalTests,
                totalStudents,
                totalAttempts,
                recentUploads,
                publishedTests,
                draftTests,
                difficultyDist,
                categoryDist,
                recentAttempts,
            ] = await Promise.all([
                prisma.question.count(),
                prisma.test.count(),
                prisma.user.count({ where: { role: "STUDENT" } }),
                prisma.attempt.count({ where: { status: "SUBMITTED" } }),
                prisma.uploadEvent.findMany({
                    orderBy: { uploadedAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        fileName: true,
                        totalCount: true,
                        status: true,
                        uploadedAt: true,
                    },
                }),
                prisma.test.count({ where: { isPublished: true } }),
                prisma.test.count({ where: { isPublished: false } }),
                prisma.question.groupBy({
                    by: ["difficulty"],
                    _count: { id: true },
                }),
                prisma.question.groupBy({
                    by: ["category"],
                    _count: { id: true },
                }),
                prisma.attempt.findMany({
                    where: { status: "SUBMITTED" },
                    orderBy: { submittedAt: "desc" },
                    take: 5,
                    select: {
                        id: true,
                        score: true,
                        submittedAt: true,
                        attemptNumber: true,
                        user: { select: { name: true } },
                        test: { select: { title: true } },
                    },
                }),
            ]);

            return NextResponse.json({
                success: true,
                data: {
                    role: "ADMIN",
                    stats: {
                        totalQuestions,
                        totalTests,
                        totalStudents,
                        totalAttempts,
                        publishedTests,
                        draftTests,
                    },
                    difficultyDistribution: difficultyDist.map((d) => ({
                        label: d.difficulty,
                        count: d._count.id,
                    })),
                    categoryDistribution: categoryDist.map((c) => ({
                        label: c.category,
                        count: c._count.id,
                    })),
                    recentUploads,
                    recentAttempts,
                },
            });
        } else {
            // Student dashboard stats
            const [
                availableTests,
                myAttempts,
                recentResults,
            ] = await Promise.all([
                prisma.test.count({ where: { isPublished: true } }),
                prisma.attempt.findMany({
                    where: { userId: user.userId, status: "SUBMITTED" },
                    orderBy: { submittedAt: "desc" },
                    take: 5,
                    include: {
                        test: {
                            select: {
                                title: true,
                                duration: true,
                                testQuestions: {
                                    select: {
                                        customMarks: true,
                                        question: { select: { marks: true } },
                                    },
                                },
                            },
                        },
                    },
                }),
                prisma.attempt.findMany({
                    where: { userId: user.userId, status: "SUBMITTED" },
                    orderBy: { submittedAt: "desc" },
                    select: { score: true },
                }),
            ]);

            const totalAttempts = recentResults.length;
            const avgScore = totalAttempts > 0
                ? Math.round(recentResults.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts)
                : 0;
            const bestScore = totalAttempts > 0
                ? Math.max(...recentResults.map((a) => a.score ?? 0))
                : 0;

            const recentTests = myAttempts.map((a) => {
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
                };
            });

            // Check for in-progress attempt
            const inProgress = await prisma.attempt.findFirst({
                where: { userId: user.userId, status: "IN_PROGRESS" },
                include: { test: { select: { title: true, id: true } } },
            });

            return NextResponse.json({
                success: true,
                data: {
                    role: "STUDENT",
                    stats: {
                        availableTests,
                        totalAttempts,
                        avgScore,
                        bestScore,
                    },
                    recentTests,
                    inProgress: inProgress ? {
                        attemptId: inProgress.id,
                        testId: inProgress.test.id,
                        testTitle: inProgress.test.title,
                    } : null,
                },
            });
        }
    } catch (error) {
        console.error("Dashboard error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to load dashboard" } },
            { status: 500 }
        );
    }
});
