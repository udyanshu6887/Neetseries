// GET /api/admin/users — returns list of all users (ADMIN only)

import { NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const GET = withAuth(
    async () => {
        try {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    verified: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
            });

            return NextResponse.json({
                success: true,
                data: users,
            });
        } catch (error) {
            console.error("Users listing error:", error);
            return NextResponse.json(
                { success: false, error: { message: "Failed to load users" } },
                { status: 500 }
            );
        }
    },
    ["ADMIN"] as UserRole[]
);
