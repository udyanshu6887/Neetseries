// GET    /api/tests/[id]/questions — List questions in test
// POST   /api/tests/[id]/questions — Add question to test
// DELETE /api/tests/[id]/questions — Remove question from test

import { NextRequest, NextResponse } from "next/server";
import { testService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { ApiResponse, TestQuestionResponse, UserRole } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

// ── GET: List questions in test ──

export const GET = withAuth(async (req: NextRequest, _user, context) => {
    try {
        const params = await context!.params;
        const testId = params.id;
        const test = await testService.getByIdWithQuestions(testId);
        if (!test) {
            return NextResponse.json(
                { success: false, error: { message: "Test not found" } },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: test.questions });
    } catch (error) {
        console.error("List test questions error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to load questions" } },
            { status: 500 }
        );
    }
});

// ── POST: Add question to test ──

export const POST = withAuth(
    async (request, _user, context) => {
        try {
            const params = await context!.params;
            const testId = params.id;

            const body = await request.json();
            const questionId = body.questionId;

            if (!questionId) {
                return NextResponse.json<ApiResponse<never>>(
                    {
                        success: false,
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: "Missing required field: questionId",
                        },
                    },
                    { status: 400 }
                );
            }

            const testQuestion = await testService.addQuestion({
                testId,
                questionId,
                customMarks: body.customMarks,
                customNegativeMarks: body.customNegativeMarks,
            });

            return NextResponse.json<ApiResponse<TestQuestionResponse>>(
                { success: true, data: testQuestion },
                { status: 201 }
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : "";

            if (message.includes("Unique constraint")) {
                return NextResponse.json<ApiResponse<never>>(
                    {
                        success: false,
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: "This question is already in the test",
                        },
                    },
                    { status: 409 }
                );
            }

            console.error("Add question to test error:", error);
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.INTERNAL_ERROR,
                        message: "Failed to add question to test",
                    },
                },
                { status: 500 }
            );
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);

// ── DELETE: Remove question from test ──

export const DELETE = withAuth(
    async (req: NextRequest, _user, context) => {
        try {
            const params = await context!.params;
            const testId = params.id;
            const { questionId } = await req.json();

            if (!questionId) {
                return NextResponse.json(
                    { success: false, error: { message: "Missing questionId" } },
                    { status: 400 }
                );
            }

            await testService.removeQuestion(testId, questionId);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Remove question error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to remove question" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);
