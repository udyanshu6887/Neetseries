// POST /api/tests/[id]/attempt/answer — Save a single answer

import { NextRequest, NextResponse } from "next/server";
import { attemptService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const { attemptId, questionId, selectedOption, numericalAnswer, markedForReview } = await req.json();

        if (!attemptId || !questionId) {
            return NextResponse.json(
                { success: false, error: { message: "Missing attemptId or questionId" } },
                { status: 400 }
            );
        }

        const answer = await attemptService.saveAnswer(attemptId, questionId, {
            selectedOption,
            numericalAnswer,
            markedForReview,
        });

        return NextResponse.json({ success: true, data: answer });
    } catch (error) {
        const msg = error instanceof Error ? error.message : "";
        if (msg === "ATTEMPT_NOT_IN_PROGRESS") {
            return NextResponse.json(
                { success: false, error: { message: "This attempt is no longer in progress" } },
                { status: 409 }
            );
        }
        if (msg === "ATTEMPT_AUTO_SUBMITTED") {
            return NextResponse.json(
                { success: false, error: { message: "Time expired. Your test has been auto-submitted." } },
                { status: 410 }
            );
        }
        console.error("Save answer error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to save answer" } },
            { status: 500 }
        );
    }
});
