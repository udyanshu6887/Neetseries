
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mirai/db";
import { embeddingService } from "@mirai/services";
import { withAuth } from "@/lib/middleware/withAuth";
import { UserRole } from "@mirai/types";

// Define the response type for raw query
interface SearchResult {
    id: string;
    text: string;
    similarity: number;
    type: string;
    difficulty: string;
    topic: string;
}

export const POST = withAuth(async (req: NextRequest) => {
    try {
        const body = await req.json();
        const { text, limit = 5, threshold = 0.5 } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        // 1. Generate embedding for query
        const vector = await embeddingService.generateEmbedding(text);

        // 2. Perform similarity search
        // using pgvector cosine distance operator <=>
        // similarity = 1 - distance
        // vector string format: '[0.1, 0.2, ...]'
        const vectorString = `[${vector.join(",")}]`;

        // Note: Prisma raw query returns unknown[], need casting
        // We select fields needed for display
        const results = await prisma.$queryRaw<SearchResult[]>`
            SELECT 
                id, 
                text, 
                type,
                difficulty,
                topic,
                1 - (embedding <=> ${vectorString}::vector) as similarity
            FROM "questions"
            WHERE embedding IS NOT NULL
            AND 1 - (embedding <=> ${vectorString}::vector) > ${parseFloat(threshold)}
            ORDER BY similarity DESC
            LIMIT ${parseInt(limit)};
        `;

        // Handle potential BigInt serialization issues if any (though floats are fine)
        // Convert to clean JSON
        const sanitizedResults = results.map(r => ({
            ...r,
            similarity: Number(r.similarity) // ensure number
        }));

        return NextResponse.json({
            data: sanitizedResults,
            meta: {
                count: sanitizedResults.length,
                query: text
            }
        });

    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}, [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT]);
