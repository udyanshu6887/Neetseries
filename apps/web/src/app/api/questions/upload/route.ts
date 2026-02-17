import { NextRequest, NextResponse } from "next/server";
import { csvUploadService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import type { UserRole } from "@mirai/types";

export const POST = withAuth(
    async (req: NextRequest, user) => {
        try {
            const formData = await req.formData();
            const file = formData.get("file") as File;

            if (!file) {
                return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
            }

            console.log(`Upload: file="${file.name}", size=${file.size}`);

            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await csvUploadService.parseAndUploadQuestions(buffer, user.userId, file.name);

            console.log(`Upload: parsed ${result.count} questions, eventId=${result.eventId}`);

            return NextResponse.json({ success: true, data: { count: result.count, eventId: result.eventId } });
        } catch (error) {
            console.error("Upload Error:", error);
            return NextResponse.json({ success: false, error: { message: "Failed to process file" } }, { status: 500 });
        }
    },
    ["ADMIN", "TEACHER"] as UserRole[]
);
