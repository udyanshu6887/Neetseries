// GET  /api/admin/events/[eventId] — event detail + questions
// PATCH /api/admin/events/[eventId] — process event (PENDING → PROCESSED)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const GET = withAuth(
    async (req: NextRequest) => {
        const eventId = req.nextUrl.pathname.split("/").pop()!;
        try {
            const event = await prisma.uploadEvent.findUnique({
                where: { id: eventId },
                include: {
                    questions: {
                        orderBy: { createdAt: "asc" },
                        select: {
                            id: true,
                            type: true,
                            text: true,
                            options: true,
                            correctAnswer: true,
                            marks: true,
                            negativeMarks: true,
                            topic: true,
                            difficulty: true,
                            explanation: true,
                            status: true,
                            year: true,
                            subject: true,
                            chapter: true,
                            hint: true,
                            timeExpectedSec: true,
                            category: true,
                        },
                    },
                    uploadedBy: { select: { name: true } },
                },
            });

            if (!event) {
                return NextResponse.json(
                    { success: false, error: { message: "Event not found" } },
                    { status: 404 }
                );
            }

            return NextResponse.json({ success: true, data: event });
        } catch (error) {
            console.error("Event detail error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to load event" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);

export const PATCH = withAuth(
    async (req: NextRequest) => {
        const eventId = req.nextUrl.pathname.split("/").pop()!;
        try {
            // Process the event: set status to PROCESSED, activate all DRAFT questions
            const [updatedEvent] = await prisma.$transaction([
                prisma.uploadEvent.update({
                    where: { id: eventId },
                    data: { status: "PROCESSED", processedAt: new Date() },
                }),
                prisma.question.updateMany({
                    where: { uploadEventId: eventId, status: "DRAFT" },
                    data: { status: "ACTIVE" },
                }),
            ]);

            return NextResponse.json({ success: true, data: updatedEvent });
        } catch (error) {
            console.error("Process event error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to process event" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);
