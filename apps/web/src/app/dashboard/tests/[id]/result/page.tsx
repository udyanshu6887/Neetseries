"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface ResultQuestion {
    questionId: string;
    order: number;
    type: string;
    text: string;
    options: { id: string; text: string }[] | null;
    correctAnswer: string | null;
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: string;
    category: string;
    subject: string | null;
    explanation: string | null;
    selectedOption: number | null;
    numericalAnswer: number | null;
    isCorrect: boolean | null;
    marksAwarded: number;
}

interface ResultData {
    id: string;
    testId: string;
    attemptNumber: number;
    score: number;
    totalMarks: number;
    startedAt: string;
    submittedAt: string;
    test: {
        title: string;
        totalQuestions: number;
    };
    questions: ResultQuestion[];
}

export default function TestResultPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const testId = params.id as string;
    const attemptId = searchParams.get("attemptId");

    const [result, setResult] = useState<ResultData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showExplanation, setShowExplanation] = useState<string | null>(null);

    useEffect(() => {
        const url = attemptId
            ? `/api/tests/${testId}/result?attemptId=${attemptId}`
            : `/api/tests/${testId}/result`;

        authFetch(url)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setResult(d.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [testId, attemptId]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <svg className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <p className="text-slate-400">Loading result...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return <div className="text-center py-16 text-slate-500">Result not found.</div>;
    }

    const percentage = result.totalMarks > 0 ? Math.round((result.score / result.totalMarks) * 100) : 0;
    const correct = result.questions.filter((q) => q.isCorrect === true).length;
    const incorrect = result.questions.filter((q) => q.isCorrect === false).length;
    const unanswered = result.questions.filter((q) => q.isCorrect === null).length;

    const getScoreColor = () => {
        if (percentage >= 80) return "from-emerald-500 to-green-600";
        if (percentage >= 60) return "from-blue-500 to-cyan-600";
        if (percentage >= 40) return "from-amber-500 to-orange-600";
        return "from-red-500 to-rose-600";
    };

    const getOptionLabel = (idx: number) => String.fromCharCode(65 + idx);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Back */}
            <button onClick={() => router.push("/dashboard/tests")} className="text-sm text-blue-500 hover:text-blue-400 inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Tests
            </button>

            {/* Score Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className={`bg-gradient-to-r ${getScoreColor()} p-8 text-white text-center`}>
                    <h2 className="text-lg font-medium opacity-90 mb-2">{result.test.title}</h2>
                    <div className="text-6xl font-bold mb-1">{percentage}%</div>
                    <p className="text-lg opacity-80">{result.score} / {result.totalMarks} marks</p>
                    <p className="text-sm opacity-60 mt-2">Attempt #{result.attemptNumber}</p>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800">
                    <div className="p-5 text-center">
                        <p className="text-2xl font-bold text-emerald-600">{correct}</p>
                        <p className="text-xs text-slate-400 mt-1">Correct</p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-2xl font-bold text-red-500">{incorrect}</p>
                        <p className="text-xs text-slate-400 mt-1">Incorrect</p>
                    </div>
                    <div className="p-5 text-center">
                        <p className="text-2xl font-bold text-slate-400">{unanswered}</p>
                        <p className="text-xs text-slate-400 mt-1">Unanswered</p>
                    </div>
                </div>
            </div>

            {/* Question-by-Question */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Question-wise Analysis</h3>

                {result.questions.map((q, idx) => {
                    const yourAnswer = q.selectedOption !== null ? getOptionLabel(q.selectedOption) : (q.numericalAnswer !== null ? String(q.numericalAnswer) : null);
                    const showExp = showExplanation === q.questionId;

                    return (
                        <div key={q.questionId} className={`bg-white dark:bg-slate-900 rounded-xl border-2 overflow-hidden ${q.isCorrect === true ? "border-emerald-200 dark:border-emerald-800" : q.isCorrect === false ? "border-red-200 dark:border-red-800" : "border-slate-200 dark:border-slate-800"}`}>
                            <div className="p-5">
                                {/* Question header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${q.isCorrect === true ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : q.isCorrect === false ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-slate-100 text-slate-500"}`}>
                                        {idx + 1}
                                    </span>
                                    <span className={`text-xs font-semibold ${q.isCorrect === true ? "text-emerald-600" : q.isCorrect === false ? "text-red-500" : "text-slate-400"}`}>
                                        {q.isCorrect === true ? `+${q.marksAwarded}` : q.isCorrect === false ? `${q.marksAwarded}` : "0"} marks
                                    </span>
                                    <span className="text-xs text-slate-400">{q.topic}</span>
                                </div>

                                {/* Question text */}
                                <p className="text-sm text-slate-800 dark:text-slate-200 mb-4 whitespace-pre-wrap">{q.text}</p>

                                {/* MCQ Options */}
                                {q.type === "MCQ" && q.options && (
                                    <div className="space-y-2">
                                        {(q.options as { id: string; text: string }[]).map((opt, optIdx) => {
                                            const letter = getOptionLabel(optIdx);
                                            const isCorrectOption = letter === q.correctAnswer;
                                            const isYourChoice = q.selectedOption === optIdx;
                                            let optClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900";
                                            if (isCorrectOption) optClass = "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20";
                                            else if (isYourChoice && !isCorrectOption) optClass = "border-red-400 bg-red-50 dark:bg-red-900/20";

                                            return (
                                                <div key={opt.id} className={`p-3 rounded-lg border ${optClass} flex items-center gap-3`}>
                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isCorrectOption ? "bg-emerald-500 text-white" : isYourChoice ? "bg-red-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                                                        {letter}
                                                    </span>
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{opt.text}</span>
                                                    {isCorrectOption && <span className="ml-auto text-xs text-emerald-600 font-medium">✓ Correct</span>}
                                                    {isYourChoice && !isCorrectOption && <span className="ml-auto text-xs text-red-500 font-medium">✗ Your answer</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Numerical answer */}
                                {q.type === "NUMERICAL" && (
                                    <div className="flex gap-4 text-sm">
                                        <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                            Your answer: <span className="font-bold">{yourAnswer || "—"}</span>
                                        </div>
                                        <div className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                            Correct: <span className="font-bold text-emerald-600">{q.correctAnswer}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Explanation toggle */}
                                {q.explanation && (
                                    <button onClick={() => setShowExplanation(showExp ? null : q.questionId)}
                                        className="mt-3 text-xs text-blue-500 hover:text-blue-400 font-medium">
                                        {showExp ? "Hide Explanation ▲" : "Show Explanation ▼"}
                                    </button>
                                )}
                                {showExp && q.explanation && (
                                    <div className="mt-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                                        {q.explanation}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
