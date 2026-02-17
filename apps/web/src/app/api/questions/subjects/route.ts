// GET /api/questions/subjects — get distinct subjects with their topics

import { NextResponse } from "next/server";
import { prisma } from "@mirai/db";

export async function GET() {
    try {
        // Get all distinct subject-topic-difficulty combos, only for ACTIVE questions
        const questions = await prisma.question.findMany({
            where: { status: "ACTIVE" },
            select: { subject: true, chapter: true, topic: true, difficulty: true },
        });

        // Build a hierarchy: subject → topics[] with counts
        const subjectMap = new Map<string, Map<string, { count: number; easy: number; medium: number; hard: number }>>();

        for (const q of questions) {
            const subj = q.subject || "Uncategorized";
            const topic = q.topic || "General";

            if (!subjectMap.has(subj)) subjectMap.set(subj, new Map());
            const topicMap = subjectMap.get(subj)!;

            if (!topicMap.has(topic)) topicMap.set(topic, { count: 0, easy: 0, medium: 0, hard: 0 });
            const stats = topicMap.get(topic)!;
            stats.count++;
            if (q.difficulty === "EASY") stats.easy++;
            else if (q.difficulty === "MEDIUM") stats.medium++;
            else if (q.difficulty === "HARD") stats.hard++;
        }

        const subjects = Array.from(subjectMap.entries()).map(([name, topicMap]) => ({
            name,
            totalQuestions: Array.from(topicMap.values()).reduce((s, t) => s + t.count, 0),
            topics: Array.from(topicMap.entries()).map(([topicName, stats]) => ({
                name: topicName,
                ...stats,
            })),
        }));

        // Sort by total questions descending
        subjects.sort((a, b) => b.totalQuestions - a.totalQuestions);

        return NextResponse.json({ success: true, data: subjects });
    } catch (error) {
        console.error("Subjects error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to load subjects" } },
            { status: 500 }
        );
    }
}
