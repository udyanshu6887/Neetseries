// PATCH /api/admin/events/[eventId]/questions/[questionId] — edit a question

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const PATCH = withAuth(
    async (req: NextRequest) => {
        // Extract IDs from URL path: /api/admin/events/[eventId]/questions/[questionId]
        const segments = req.nextUrl.pathname.split("/");
        const questionId = segments.pop()!;       // last segment
        segments.pop();                            // "questions"
        const eventId = segments.pop()!;           // event ID

        try {
            // Verify question belongs to this event
            const question = await prisma.question.findFirst({
                where: { id: questionId, uploadEventId: eventId },
            });

            if (!question) {
                return NextResponse.json(
                    { success: false, error: { message: "Question not found in this event" } },
                    { status: 404 }
                );
            }

            const body = await req.json();

            // Only allow editing specific fields
            const allowedFields = [
                "type", "text", "options", "correctAnswer",
                "marks", "negativeMarks", "topic", "difficulty", "category",
                "explanation", "year", "subject", "chapter",
                "hint", "timeExpectedSec",
            ];

            const updateData: Record<string, any> = {};
            for (const field of allowedFields) {
                if (body[field] !== undefined) {
                    updateData[field] = body[field];
                }
            }

            const updated = await prisma.question.update({
                where: { id: questionId },
                data: updateData,
            });

            return NextResponse.json({ success: true, data: updated });
        } catch (error) {
            console.error("Question edit error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to update question" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);
