// POST /api/tests/[id]/attempt/submit — Submit attempt

import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const { attemptId } = await req.json();

        if (!attemptId) {
            return NextResponse.json(
                { success: false, error: { message: "Missing attemptId" } },
                { status: 400 }
            );
        }

        const result = await attemptService.submitAttempt(attemptId);
        return NextResponse.json({ success: true, data: result });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "";
        if (msg === "ALREADY_SUBMITTED") {
            return NextResponse.json(
                { success: false, error: { message: "This attempt has already been submitted" } },
                { status: 409 }
            );
        }
        console.error("Submit attempt error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to submit attempt" } },
            { status: 500 }
        );
    }
});
