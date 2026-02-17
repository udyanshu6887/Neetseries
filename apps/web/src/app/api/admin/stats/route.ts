// GET /api/admin/stats — returns dashboard overview counts (ADMIN only)

import { NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const GET = withAuth(
    async () => {
        try {
            const [totalUsers, totalQuestions, totalTests, publishedTests] = await Promise.all([
                prisma.user.count(),
                prisma.question.count(),
                prisma.test.count(),
                prisma.test.count({ where: { isPublished: true } }),
            ]);

            return NextResponse.json({
                success: true,
                data: { totalUsers, totalQuestions, totalTests, publishedTests },
            });
        } catch (error) {
            console.error("Stats error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to load stats" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);
