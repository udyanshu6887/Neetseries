// PATCH /api/tests/[id]/questions/reorder — reorder questions in a test

import { NextRequest, NextResponse } from "next/server";
import { testService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const PATCH = withAuth(
    async (req: NextRequest) => {
        // Extract testId from URL: /api/tests/[id]/questions/reorder
        const segments = req.nextUrl.pathname.split("/");
        // segments = ['', 'api', 'tests', '<id>', 'questions', 'reorder']
        const testId = segments[3];

        try {
            const { order } = await req.json();

            if (!Array.isArray(order) || order.length === 0) {
                return NextResponse.json(
                    { success: false, error: { message: "Invalid order data" } },
                    { status: 400 }
                );
            }

            await testService.reorderQuestions(testId, order);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Reorder error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to reorder questions" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);
