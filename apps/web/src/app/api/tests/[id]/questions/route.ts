// ──────────────────────────────────────
// POST /api/tests/[id]/questions — Add question to test (ADMIN/TEACHER only)
// ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { testService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { ApiResponse, TestQuestionResponse, UserRole } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

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

            // Prisma unique constraint violation (question already in test)
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
