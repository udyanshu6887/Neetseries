// PATCH /api/questions/[questionId] — edit a question directly

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const PATCH = withAuth(
    async (req: NextRequest) => {
        const questionId = req.nextUrl.pathname.split("/").pop()!;
        try {
            const question = await prisma.question.findUnique({ where: { id: questionId } });
            if (!question) {
                return NextResponse.json({ success: false, error: { message: "Question not found" } }, { status: 404 });
            }

            const body = await req.json();
            const allowedFields = [
                "type", "text", "options", "correctAnswer",
                "marks", "negativeMarks", "topic", "difficulty",
                "explanation", "year", "subject", "chapter",
                "hint", "timeExpectedSec",
            ];

            const updateData: Record<string, any> = {};
            for (const field of allowedFields) {
                if (body[field] !== undefined) updateData[field] = body[field];
            }

            const updated = await prisma.question.update({
                where: { id: questionId },
                data: updateData,
            });

            return NextResponse.json({ success: true, data: updated });
        } catch (error) {
            console.error("Question edit error:", error);
            return NextResponse.json({ success: false, error: { message: "Failed to update question" } }, { status: 500 });
        }
    },
    ["ADMIN"] as UserRole[]
);
