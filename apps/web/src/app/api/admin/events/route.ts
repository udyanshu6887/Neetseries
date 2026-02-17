// GET /api/admin/events — list all upload events

import { NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const GET = withAuth(
    async () => {
        try {
            const events = await prisma.uploadEvent.findMany({
                select: {
                    id: true,
                    fileName: true,
                    status: true,
                    totalCount: true,
                    uploadedAt: true,
                    processedAt: true,
                    uploadedBy: { select: { name: true } },
                },
                orderBy: { uploadedAt: "desc" },
            });

            return NextResponse.json({ success: true, data: events });
        } catch (error) {
            console.error("Events listing error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to load events" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);
