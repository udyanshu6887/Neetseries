// ──────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@mirai/services";
import type { LoginInput, ApiResponse, AuthResponse } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as LoginInput;

        // Basic validation
        if (!body.email || !body.password) {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.VALIDATION_ERROR,
                        message: "Missing required fields: email, password",
                    },
                },
                { status: 400 }
            );
        }

        const result = await authService.login(body);

        return NextResponse.json<ApiResponse<AuthResponse>>(
            {
                success: true,
                data: result,
            },
            { status: 200 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";

        // Generic auth failure — same message for wrong email OR wrong password
        if (message === "INVALID_CREDENTIALS") {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.INVALID_CREDENTIALS,
                        message: "Invalid email or password",
                    },
                },
                { status: 401 }
            );
        }

        // Unknown error — don't leak internals
        console.error("Login error:", error);
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
