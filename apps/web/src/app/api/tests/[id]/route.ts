// GET    /api/tests/[id]         — test detail with questions
// PATCH  /api/tests/[id]         — edit test metadata
// DELETE /api/tests/[id]         — delete test

import { NextRequest, NextResponse } from "next/server";
import { testService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

// ── GET: Test detail with questions ──

export const GET = withAuth(async (req: NextRequest) => {
    const id = req.nextUrl.pathname.split("/").pop()!;
    try {
        const test = await testService.getByIdWithQuestions(id);
        if (!test) {
            return NextResponse.json(
                { success: false, error: { message: "Test not found" } },
                { status: 404 }
            );
        }
        return NextResponse.json({ success: true, data: test });
    } catch (error) {
        console.error("Test detail error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to load test" } },
            { status: 500 }
        );
    }
});

// ── PATCH: Edit test metadata ──

export const PATCH = withAuth(
    async (req: NextRequest) => {
        const id = req.nextUrl.pathname.split("/").pop()!;
        try {
            const body = await req.json();

            // Handle publish/unpublish separately
            if (body.isPublished !== undefined) {
                const test = await testService.publish(id, body.isPublished);
                return NextResponse.json({ success: true, data: test });
            }

            const allowedFields = ["title", "description", "duration", "evaluationType", "leaderboardVisible"];
            const updateData: Record<string, any> = {};
            for (const field of allowedFields) {
                if (body[field] !== undefined) updateData[field] = body[field];
            }

            const test = await testService.update(id, updateData);
            return NextResponse.json({ success: true, data: test });
        } catch (error) {
            console.error("Test update error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to update test" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);

// ── DELETE: Delete test ──

export const DELETE = withAuth(
    async (req: NextRequest) => {
        const id = req.nextUrl.pathname.split("/").pop()!;
        try {
            await testService.deleteTest(id);
            return NextResponse.json({ success: true });
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            if (msg === "TEST_NOT_FOUND") {
                return NextResponse.json(
                    { success: false, error: { message: "Test not found" } },
                    { status: 404 }
                );
            }
            if (msg === "TEST_HAS_ATTEMPTS") {
                return NextResponse.json(
                    { success: false, error: { message: "Cannot delete a test that has been attempted by students" } },
                    { status: 409 }
                );
            }
            console.error("Delete test error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to delete test" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);
