import * as XLSX from "xlsx";
import { prisma } from "@mirai/db";
import * as embeddingService from "./embeddingService";
import { QuestionType, Difficulty } from "@mirai/types";

interface CSVRow {
    Type: string;
    "Question Text"?: string;
    "Option A"?: string;
    "Option B"?: string;
    "Option C"?: string;
    "Option D"?: string;
    "Correct Answer"?: string | number;
    Marks?: number;
    "Negative Marks"?: number;
    Topic?: string;
    Difficulty?: string;
    Explanation?: string;
    Year?: number;
    Subject?: string;
    Chapter?: string;
    Hint?: string;
    "Time Expected (Sec)"?: number;
    // Assertion/Reason specific
    Assertion?: string;
    Reason?: string;
}

export async function parseAndUploadQuestions(buffer: Buffer, instructorId: string) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: CSVRow[] = XLSX.utils.sheet_to_json(sheet);

    const questionsToCreate = [];

    for (const row of rows) {
        // validate required
        if (!row.Type || !row["Question Text"] && (!row.Assertion || !row.Reason)) continue;

        let type: QuestionType;
        let text = row["Question Text"] || "";
        let options: any = null;
        let correctAnswer = String(row["Correct Answer"] || "");

        // Map Type
        const rawType = row.Type.trim().toUpperCase();
        if (rawType === "MCQ") type = QuestionType.MCQ;
        else if (rawType === "INTEGER" || rawType === "NUMERICAL") type = QuestionType.NUMERICAL;
        else if (rawType === "SUBJECTIVE") type = QuestionType.SUBJECTIVE;
        else if (rawType === "A/R" || rawType === "ASSERTION_REASON") {
            type = QuestionType.ASSERTION_REASON;
            if (row.Assertion && row.Reason) {
                text = `Assertion: ${row.Assertion}\nReason: ${row.Reason}`;
            }
            // A/R usually has standard options, we can auto-fill or expect them in columns
            // For now, let's assume standard options if not provided
            if (!row["Option A"]) {
                options = [
                    { id: "A", text: "Both Assertion and Reason are correct and Reason is the correct explanation for Assertion" },
                    { id: "B", text: "Both Assertion and Reason are correct but Reason is NOT the correct explanation for Assertion" },
                    { id: "C", text: "Assertion is correct but Reason is incorrect" },
                    { id: "D", text: "Assertion is incorrect but Reason is correct" }
                ];
            }
        } else {
            type = QuestionType.MCQ; // default? or skip?
            // Skip invalid types to be safe
            continue;
        }

        // Map Options for MCQ
        if (type === QuestionType.MCQ && !options) {
            options = [];
            if (row["Option A"]) options.push({ id: "A", text: row["Option A"] });
            if (row["Option B"]) options.push({ id: "B", text: row["Option B"] });
            if (row["Option C"]) options.push({ id: "C", text: row["Option C"] });
            if (row["Option D"]) options.push({ id: "D", text: row["Option D"] });
        }

        // Difficulty mapping
        let difficulty = Difficulty.MEDIUM;
        const rawDiff = row.Difficulty?.toUpperCase();
        if (rawDiff === "EASY") difficulty = Difficulty.EASY;
        else if (rawDiff === "HARD") difficulty = Difficulty.HARD;

        questionsToCreate.push({
            type,
            text,
            options: options ? options : undefined, // createMany supports JSON
            correctAnswer,
            marks: Number(row.Marks || 4),
            negativeMarks: Number(row["Negative Marks"] || 1),
            topic: row.Topic || "General",
            difficulty,
            explanation: row.Explanation || null,
            year: row.Year ? Number(row.Year) : null,
            subject: row.Subject || null,
            chapter: row.Chapter || null,
            hint: row.Hint || null,
            timeExpectedSec: row["Time Expected (Sec)"] ? Number(row["Time Expected (Sec)"]) : null,
            createdById: instructorId,
        });
    }

    if (questionsToCreate.length > 0) {
        // Use createMany for performance
        // Note: createdById is required
        await prisma.question.createMany({
            data: questionsToCreate,
        });

        // Fire and forget: Trigger processing in background
        // We do NOT await this, so the API returns immediately.
        // processPendingEmbeddings finds ALL pending embeddings, so it covers these new ones.
        // We log errors but don't crash the request.

        console.log(`Triggering background embedding generation for ${questionsToCreate.length} questions...`);

        // Non-blocking call
        embeddingService.processPendingEmbeddings().catch(err => {
            console.error("Background embedding generation failed:", err);
        });
    }

    return { count: questionsToCreate.length };
}