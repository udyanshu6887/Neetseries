// GET /api/tests/[id]/result — Get attempt result

import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (req: NextRequest, user) => {
    const segments = req.nextUrl.pathname.split("/");
    const testId = segments[3]; // /api/tests/[id]/result
    const attemptId = req.nextUrl.searchParams.get("attemptId");

    try {
        if (attemptId) {
            const result = await attemptService.getResult(attemptId);
            if (!result) {
                return NextResponse.json(
                    { success: false, error: { message: "Result not found" } },
                    { status: 404 }
                );
            }
            return NextResponse.json({ success: true, data: result });
        }

        // Get the latest submitted attempt for this test/user
        const { prisma } = await import("@mirai/db");
        const attempt = await prisma.attempt.findFirst({
            where: { testId, userId: user.userId, status: "SUBMITTED" },
            orderBy: { submittedAt: "desc" },
        });

        if (!attempt) {
            return NextResponse.json(
                { success: false, error: { message: "No submitted attempt found" } },
                { status: 404 }
            );
        }

        const result = await attemptService.getResult(attempt.id);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        console.error("Get result error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to load result" } },
            { status: 500 }
        );
    }
});
