// POST /api/tests/[id]/attempt — Start or resume an attempt
// GET  /api/tests/[id]/attempt — Get current attempt data

import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";

// ── POST: Start a new attempt ──

export const POST = withAuth(async (req: NextRequest, user) => {
    const segments = req.nextUrl.pathname.split("/");
    const testId = segments[3]; // /api/tests/[id]/attempt
    try {
        const data = await attemptService.startAttempt(testId, user.userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Start attempt error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to start attempt" } },
            { status: 500 }
        );
    }
});

// ── GET: Get current attempt ──

export const GET = withAuth(async (req: NextRequest, user) => {
    const segments = req.nextUrl.pathname.split("/");
    const testId = segments[3];
    try {
        // Find in-progress attempt
        const { prisma } = await import("@mirai/db");
        const attempt = await prisma.attempt.findFirst({
            where: { testId, userId: user.userId, status: "IN_PROGRESS" },
            orderBy: { startedAt: "desc" },
        });

        if (!attempt) {
            return NextResponse.json(
                { success: false, error: { message: "No active attempt" } },
                { status: 404 }
            );
        }

        const data = await attemptService.getAttemptData(attempt.id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Get attempt error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to get attempt" } },
            { status: 500 }
        );
    }
});
