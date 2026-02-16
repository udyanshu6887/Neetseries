
import { NextRequest, NextResponse } from "next/server";
import { embeddingService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import { UserRole } from "@mirai/types";

export const POST = withAuth(async (req: NextRequest) => {
    try {
        // Optional: limit from body
        const body = await req.json().catch(() => ({}));
        const limit = body.limit || 100;

        console.log("Admin triggering embedding processing manually...");

        // Trigger processing
        // We can await it here to see result, or return "Started"
        // User asked to "continue that process", so returning count processed is good.

        const count = await embeddingService.processPendingEmbeddings(limit);

        return NextResponse.json({
            success: true,
            message: `Processed ${count} pending embeddings.`,
            count
        });

    } catch (error) {
        console.error("Embedding processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}, [UserRole.ADMIN]);
