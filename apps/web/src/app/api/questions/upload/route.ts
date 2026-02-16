import { NextRequest, NextResponse } from "next/server";
import { csvUploadService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole, ApiResponse } from "@mirai/types";

export const POST = withAuth(
    async (req: NextRequest, user) => {
        try {
            const formData = await req.formData();
            const file = formData.get("file") as File;

            if (!file) {
                return NextResponse.json({ error: "No file provided" }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await csvUploadService.parseAndUploadQuestions(buffer, user.userId);

            return NextResponse.json({ success: true, count: result.count });
        } catch (error) {
            console.error("CSV Upload Error:", error);
            return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);
