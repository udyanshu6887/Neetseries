// ──────────────────────────────────────
// Auth Middleware for Next.js API Routes
// ──────────────────────────────────────
// Usage:
//   export const POST = withAuth(async (request, user) => { ... })
//   export const POST = withAuth(async (request, user) => { ... }, ["ADMIN", "TEACHER"])
// ──────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { authService } from "@mirai/services";
import type { JWTPayload, ApiResponse, UserRole } from "@mirai/types";
import { ERROR_CODES } from "@mirai/types";

type AuthenticatedHandler = (
    request: NextRequest,
    user: JWTPayload,
    context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with JWT authentication.
 *
 * @param handler - The route handler that receives the authenticated user
 * @param allowedRoles - Optional array of roles allowed to access this route
 */
export function withAuth(handler: AuthenticatedHandler, allowedRoles?: UserRole[]) {
    return async (
        request: NextRequest,
        context?: { params: Promise<Record<string, string>> }
    ) => {
        // 1. Extract token from Authorization header
        const authHeader = request.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.UNAUTHORIZED,
                        message: "Missing or invalid Authorization header. Use: Bearer <token>",
                    },
                },
                { status: 401 }
            );
        }

        const token = authHeader.split(" ")[1];

        // 2. Verify the JWT token
        try {
            const user = authService.verifyToken(token);

            // 3. Check role-based access (if allowedRoles specified)
            if (allowedRoles && !allowedRoles.includes(user.role)) {
                return NextResponse.json<ApiResponse<never>>(
                    {
                        success: false,
                        error: {
                            code: ERROR_CODES.FORBIDDEN,
                            message: "You do not have permission to access this resource",
                        },
                    },
                    { status: 403 }
                );
            }

            // 4. Call the actual handler with the verified user
            return handler(request, user, context);
        } catch {
            return NextResponse.json<ApiResponse<never>>(
                {
                    success: false,
                    error: {
                        code: ERROR_CODES.UNAUTHORIZED,
                        message: "Invalid or expired token",
                    },
                },
                { status: 401 }
            );
        }
    };
}
