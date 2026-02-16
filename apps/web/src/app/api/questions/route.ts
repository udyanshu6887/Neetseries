// ──────────────────────────────────────
// POST /api/questions — Create a question (ADMIN/TEACHER only)
// GET  /api/questions — List all questions
// ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { questionService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { CreateQuestionInput, ApiResponse, QuestionResponse, UserRole } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

// ── POST: Create question (protected — ADMIN/TEACHER) ──

export const POST = withAuth(
    async (request, user) => {
        try {
            const body = (await request.json()) as CreateQuestionInput;

            // Basic validation
            if (!body.type || !body.text || !body.correctAnswer || !body.marks) {
                return NextResponse.json<ApiResponse<never>>(
                    {
                        success: false,
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: "Missing required fields: type, text, correctAnswer, marks",
                        },
                    },
                    { status: 400 }
                );
            }

            const question = await questionService.create(body, user.userId);

            return NextResponse.json<ApiResponse<QuestionResponse>>(
                { success: true, data: question },
                { status: 201 }
            );
        } catch (error) {
            console.error("Create question error:", error);
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.INTERNAL_ERROR,
                        message: "Failed to create question",
                    },
                },
                { status: 500 }
            );
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);

// ── GET: List questions (protected — any authenticated user) ──

export const GET = withAuth(async (request) => {
    try {
        const { searchParams } = new URL(request.url);
        const topic = searchParams.get("topic") || undefined;
        const difficulty = searchParams.get("difficulty") || undefined;
        const type = searchParams.get("type") || undefined;

        const questions = await questionService.list({ topic, difficulty, type });

        return NextResponse.json<ApiResponse<QuestionResponse[]>>(
            { success: true, data: questions },
            { status: 200 }
        );
    } catch (error) {
        console.error("List questions error:", error);
        return NextResponse.json<ApiResponse<never>>(
            {
                success: false,
                error: {
                    code: ERROR_CODES.INTERNAL_ERROR,
                    message: "Failed to fetch questions",
                },
            },
            { status: 500 }
        );
    }
});
