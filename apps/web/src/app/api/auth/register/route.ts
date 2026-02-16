// ──────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@mirai/services";
import type { RegisterInput, ApiResponse, AuthResponse } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as RegisterInput;

        // Basic validation
        if (!body.email || !body.password || !body.name || !body.role) {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.VALIDATION_ERROR,
                        message: "Missing required fields: email, password, name, role",
                    },
                },
                { status: 400 }
            );
        }

        const result = await authService.register(body);

        return NextResponse.json<ApiResponse<AuthResponse>>(
            {
                success: true,
                data: result,
            },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        // Map known service errors to HTTP status codes
        if (message === "EMAIL_ALREADY_EXISTS") {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.EMAIL_ALREADY_EXISTS,
                        message: "An account with this email already exists",
                    },
                },
                { status: 409 }
            );
        }

        if (message === "INVALID_ADMIN_CODE") {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.UNAUTHORIZED,
                        message: "Invalid admin registration code",
                    },
                },
                { status: 403 }
            );
        }

        // Unknown error — don't leak internals
        console.error("Register error:", error);
        return NextResponse.json<ApiResponse<never>>(
            {
                success: false,
                error: {
                    code: ERROR_CODES.INTERNAL_ERROR,
                    message: "Something went wrong. Please try again.",
                },
            },
            { status: 500 }
        );
    }
}
