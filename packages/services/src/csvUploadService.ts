import * as XLSX from "xlsx";
import { prisma } from "@mirai/db";
import * as embeddingService from "./embeddingService";
import { QuestionType, Difficulty, QuestionCategory } from "@mirai/types";

// ---------------------------------------------------------------------------
// Header normalisation — maps many common column names to canonical keys
// ---------------------------------------------------------------------------
const HEADER_ALIASES: Record<string, string> = {
    "type": "Type", "question_type": "Type", "questiontype": "Type",
    "question text": "Question Text", "question_text": "Question Text", "questiontext": "Question Text", "text": "Question Text",
    "option a": "Option A", "option_a": "Option A", "optiona": "Option A",
    "option b": "Option B", "option_b": "Option B", "optionb": "Option B",
    "option c": "Option C", "option_c": "Option C", "optionc": "Option C",
    "option d": "Option D", "option_d": "Option D", "optiond": "Option D",
    "correct answer": "Correct Answer", "correct_answer": "Correct Answer", "correct_option": "Correct Answer",
    "correctanswer": "Correct Answer", "correctoption": "Correct Answer", "answer": "Correct Answer",
    "marks": "Marks", "marks_correct": "Marks", "markscorrect": "Marks",
    "negative marks": "Negative Marks", "negative_marks": "Negative Marks", "negativemarks": "Negative Marks",
    "marks_wrong": "Negative Marks", "markswrong": "Negative Marks",
    "topic": "Topic", "difficulty": "Difficulty", "explanation": "Explanation",
    "year": "Year", "subject": "Subject", "chapter": "Chapter", "hint": "Hint",
    "time expected (sec)": "Time Expected (Sec)", "time_expected_sec": "Time Expected (Sec)",
    "timeexpectedsec": "Time Expected (Sec)", "time_expected": "Time Expected (Sec)",
    "assertion": "Assertion", "reason": "Reason",
    "category": "Category", "question_category": "Category", "questioncategory": "Category",
};

function normalizeRow(raw: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(raw)) {
        const lower = key.trim().toLowerCase();
        const canonical = HEADER_ALIASES[lower] || key;
        out[canonical] = value;
    }
    return out;
}

// ---------------------------------------------------------------------------
// Parse a single normalised row into a question-create payload
// ---------------------------------------------------------------------------
function parseCategory(raw?: string): QuestionCategory {
    if (!raw) return QuestionCategory.CONCEPTUAL;
    const upper = String(raw).trim().toUpperCase().replace(/[\s-]+/g, "_");
    if (upper === "FACTUAL" || upper === "FACT") return QuestionCategory.FACTUAL;
    if (upper === "ANALYTICAL" || upper === "ANALYSIS") return QuestionCategory.ANALYTICAL;
    if (upper === "APPLICATION" || upper === "APPLIED") return QuestionCategory.APPLICATION;
    if (upper === "NUMERICAL" || upper === "CALCULATION") return QuestionCategory.NUMERICAL;
    if (upper === "DIAGRAM_BASED" || upper === "DIAGRAM" || upper === "FIGURE") return QuestionCategory.DIAGRAM_BASED;
    return QuestionCategory.CONCEPTUAL;
}

function parseRow(row: Record<string, any>) {
    if (!row["Type"] || (!row["Question Text"] && (!row["Assertion"] || !row["Reason"]))) return null;

    let type: QuestionType;
    let text = row["Question Text"] || "";
    let options: any = null;
    let correctAnswer = String(row["Correct Answer"] || "");

    const rawType = String(row["Type"]).trim().toUpperCase();
    if (rawType === "MCQ") type = QuestionType.MCQ;
    else if (rawType === "INTEGER" || rawType === "NUMERICAL") type = QuestionType.NUMERICAL;
    else if (rawType === "SUBJECTIVE") type = QuestionType.SUBJECTIVE;
    else if (rawType === "A/R" || rawType === "ASSERTION_REASON") {
        type = QuestionType.ASSERTION_REASON;
        if (row["Assertion"] && row["Reason"]) {
            text = `Assertion: ${row["Assertion"]}\nReason: ${row["Reason"]}`;
        }
        if (!row["Option A"]) {
            options = [
                { id: "A", text: "Both Assertion and Reason are correct and Reason is the correct explanation for Assertion" },
                { id: "B", text: "Both Assertion and Reason are correct but Reason is NOT the correct explanation for Assertion" },
                { id: "C", text: "Assertion is correct but Reason is incorrect" },
                { id: "D", text: "Assertion is incorrect but Reason is correct" },
            ];
        }
    } else {
        return null;
    }

    if ((type === QuestionType.MCQ || type === QuestionType.ASSERTION_REASON) && !options) {
        options = [];
        if (row["Option A"]) options.push({ id: "A", text: String(row["Option A"]) });
        if (row["Option B"]) options.push({ id: "B", text: String(row["Option B"]) });
        if (row["Option C"]) options.push({ id: "C", text: String(row["Option C"]) });
        if (row["Option D"]) options.push({ id: "D", text: String(row["Option D"]) });
    }

    let difficulty = Difficulty.MEDIUM;
    const rawDiff = String(row["Difficulty"] || "").toUpperCase();
    if (rawDiff === "EASY") difficulty = Difficulty.EASY;
    else if (rawDiff === "HARD") difficulty = Difficulty.HARD;

    const rawNeg = Number(row["Negative Marks"] || 1);

    return {
        type,
        text,
        options: options || undefined,
        correctAnswer,
        marks: Number(row["Marks"] || 4),
        negativeMarks: Math.abs(rawNeg),
        topic: row["Topic"] || "General",
        difficulty,
        explanation: row["Explanation"] || null,
        year: row["Year"] ? Number(row["Year"]) : null,
        subject: row["Subject"] || null,
        chapter: row["Chapter"] || null,
        hint: row["Hint"] || null,
        timeExpectedSec: row["Time Expected (Sec)"] ? Number(row["Time Expected (Sec)"]) : null,
        category: parseCategory(row["Category"]),
        status: "DRAFT",
    };
}

// ---------------------------------------------------------------------------
// Main upload function — creates an UploadEvent and links questions to it
// ---------------------------------------------------------------------------
export async function parseAndUploadQuestions(buffer: Buffer, instructorId: string, fileName: string) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`[Upload] Sheet "${sheetName}" has ${rawRows.length} raw rows`);
    if (rawRows.length > 0) {
        console.log(`[Upload] Original headers: ${Object.keys(rawRows[0]).join(", ")}`);
    }

    const rows = rawRows.map(normalizeRow);
    const questionsData = rows.map(parseRow).filter(Boolean) as any[];

    console.log(`[Upload] Parsed ${questionsData.length} valid questions from ${rawRows.length} rows`);

    // Create the upload event
    const event = await prisma.uploadEvent.create({
        data: {
            fileName,
            status: "PENDING",
            totalCount: questionsData.length,
            uploadedById: instructorId,
        },
    });

    if (questionsData.length > 0) {
        // Add event + instructor linkage
        const withRelations = questionsData.map((q) => ({
            ...q,
            createdById: instructorId,
            uploadEventId: event.id,
        }));

        await prisma.question.createMany({ data: withRelations });

        console.log(`Triggering background embedding generation for ${questionsData.length} questions...`);
        embeddingService.processPendingEmbeddings().catch((err) => {
            console.error("Background embedding generation failed:", err);
        });
    }

    return { count: questionsData.length, eventId: event.id };
}