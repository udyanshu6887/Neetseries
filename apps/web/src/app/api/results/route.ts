// GET /api/results — Get all results for current user

import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (_req: NextRequest, user) => {
    try {
        const results = await attemptService.getUserAttempts(user.userId);
        return NextResponse.json({ success: true, data: results });
    } catch (error) {
        console.error("Get results error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to load results" } },
            { status: 500 }
        );
    }
});
