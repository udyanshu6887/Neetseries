// ──────────────────────────────────────
// POST /api/tests — Create a test (ADMIN/TEACHER only)
// GET  /api/tests — List all tests
// ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { testService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { CreateTestInput, ApiResponse, TestResponse, UserRole } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

// ── POST: Create test (protected — ADMIN/TEACHER) ──

export const POST = withAuth(
    async (request, user) => {
        try {
            const body = (await request.json()) as CreateTestInput;

            if (!body.title || !body.duration || !body.evaluationType) {
                return NextResponse.json<ApiResponse<never>>(
                    {
                        success: false,
                        error: {
                            code: ERROR_CODES.VALIDATION_ERROR,
                            message: "Missing required fields: title, duration, evaluationType",
                        },
                    },
                    { status: 400 }
                );
            }

            const test = await testService.create(body, user.userId);

            return NextResponse.json<ApiResponse<TestResponse>>(
                { success: true, data: test },
                { status: 201 }
            );
        } catch (error) {
            console.error("Create test error:", error);
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.INTERNAL_ERROR,
                        message: "Failed to create test",
                    },
                },
                { status: 500 }
            );
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);

// ── GET: List tests (protected — any authenticated user) ──

export const GET = withAuth(async (request) => {
    try {
        const { searchParams } = new URL(request.url);
        const publishedOnly = searchParams.get("published") === "true";

        const tests = await testService.list({ publishedOnly });

        return NextResponse.json<ApiResponse<TestResponse[]>>(
            { success: true, data: tests },
            { status: 200 }
        );
    } catch (error) {
        console.error("List tests error:", error);
        return NextResponse.json<ApiResponse<never>>(
            {
                success: false,
                error: {
                    code: ERROR_CODES.INTERNAL_ERROR,
                    message: "Failed to fetch tests",
                },
            },
            { status: 500 }
        );
    }
});
