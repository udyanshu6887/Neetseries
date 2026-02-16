import { pipeline } from "@xenova/transformers";
import { prisma } from "@mirai/db";

// Singleton holder for the pipeline
let embedder: any = null;

/**
 * Lazy-load the embedding model
 */
async function getEmbedder() {
    if (!embedder) {
        console.log("Loading embedding model...");
        embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        console.log("Embedding model loaded.");
    }
    return embedder;
}

/**
 * Generate embedding vector for a given text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const pipe = await getEmbedder();
    // 'mean' pooling and normalization for cosine similarity
    const result = await pipe(text, { pooling: "mean", normalize: true });
    return Array.from(result.data);
}

/**
 * Update the embedding column for a question using raw SQL
 * (Prisma doesn't support writing to Unsupported types directly)
 */
export async function updateQuestionEmbedding(questionId: string, embedding: number[]) {
    const vectorString = `[${embedding.join(",")}]`;

    // Use executeRawUnsafe because template literal with ::vector might require it,
    // or use $executeRaw with strict casting if possible.
    // Ensure we handle the vector cast correctly for pgvector.

    await prisma.$executeRaw`
        UPDATE "questions"
        SET "embedding" = ${vectorString}::vector
        WHERE "id" = ${questionId}
    `;
}

/**
 * Bulk generate and update embeddings for a list of questions
 */
export async function generateAndStoreEmbeddings(questions: { id: string; text: string }[]) {
    console.log(`Generating embeddings for ${questions.length} questions...`);

    // Process in parallel with concurrency limit? 
    // Transformers.js in Node might be CPU bound. Sequential or chunks is safer.

    for (const q of questions) {
        try {
            if (!q.text || q.text.trim().length === 0) continue;

            const vector = await generateEmbedding(q.text);
            await updateQuestionEmbedding(q.id, vector);
        } catch (error) {
            console.error(`Failed to generate embedding for question ${q.id}:`, error);
        }
    }

    console.log("Embedding generation complete.");
}

/**
 * Process all questions that are missing embeddings.
 * This enables "Resume" capability.
 */
export async function processPendingEmbeddings(limit = 100) {
    console.log("Checking for pending embeddings...");

    // Find questions where embedding is NULL
    // Since 'embedding' is Unsupported type, we use raw query
    // vector extension usually treats NULL as NULL.
    // CASTing to concrete type usually not needed for IS NULL check

    const questions = await prisma.$queryRaw<{ id: string, text: string }[]>`
        SELECT id, text 
        FROM "questions"
        WHERE "embedding" IS NULL
        LIMIT ${limit}
    `;

    console.log(`Found ${questions.length} questions pending embeddings.`);

    if (questions.length > 0) {
        await generateAndStoreEmbeddings(questions);
    }

    return questions.length;
}
