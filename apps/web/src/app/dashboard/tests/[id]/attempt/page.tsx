"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface TestQuestion {
    questionId: string;
    order: number;
    type: string;
    text: string;
    options: { id: string; text: string }[] | null;
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: string;
    category: string;
    subject: string | null;
    selectedOption: number | null;
    numericalAnswer: number | null;
    markedForReview: boolean;
}

interface AttemptData {
    id: string;
    testId: string;
    attemptNumber: number;
    status: string;
    serverStartTime: string;
    test: {
        title: string;
        duration: number;
        totalQuestions: number;
    };
    questions: TestQuestion[];
}

export default function TestAttemptPage() {
    const params = useParams();
    const router = useRouter();
    const testId = params.id as string;

    const [attempt, setAttempt] = useState<AttemptData | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Map<string, { selectedOption: number | null; numericalAnswer: number | null; markedForReview: boolean }>>(new Map());
    const [timeLeft, setTimeLeft] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const savingRef = useRef(false);

    // Load or start attempt
    useEffect(() => {
        authFetch(`/api/tests/${testId}/attempt`, { method: "POST" })
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    const data = d.data as AttemptData;
                    setAttempt(data);
                    // Initialize answers from existing data
                    const initAnswers = new Map<string, { selectedOption: number | null; numericalAnswer: number | null; markedForReview: boolean }>();
                    data.questions.forEach((q) => {
                        initAnswers.set(q.questionId, {
                            selectedOption: q.selectedOption,
                            numericalAnswer: q.numericalAnswer,
                            markedForReview: q.markedForReview,
                        });
                    });
                    setAnswers(initAnswers);

                    // Calculate time left
                    const started = new Date(data.serverStartTime).getTime();
                    const deadline = started + data.test.duration * 1000;
                    const remaining = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
                    setTimeLeft(remaining);
                } else if (d.data?.status === "SUBMITTED") {
                    router.push(`/dashboard/tests/${testId}/result`);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [testId, router]);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || !attempt) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [attempt, timeLeft > 0]);

    // Save answer to server
    const saveAnswer = useCallback(async (questionId: string, data: { selectedOption?: number | null; numericalAnswer?: number | null; markedForReview?: boolean }) => {
        if (!attempt || savingRef.current) return;
        savingRef.current = true;
        try {
            await authFetch(`/api/tests/${testId}/attempt/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attemptId: attempt.id, questionId, ...data }),
            });
        } catch (e) {
            console.error("Auto-save failed:", e);
        } finally {
            savingRef.current = false;
        }
    }, [attempt, testId]);

    // Select MCQ option
    const selectOption = (optionIdx: number) => {
        if (!attempt) return;
        const q = attempt.questions[currentIdx];
        const current = answers.get(q.questionId);
        const newSelected = current?.selectedOption === optionIdx ? null : optionIdx; // toggle
        const newAnswer = { selectedOption: newSelected, numericalAnswer: null, markedForReview: current?.markedForReview ?? false };
        setAnswers(new Map(answers.set(q.questionId, newAnswer)));
        saveAnswer(q.questionId, { selectedOption: newSelected });
    };

    // Set numerical answer
    const setNumericalAnswer = (value: string) => {
        if (!attempt) return;
        const q = attempt.questions[currentIdx];
        const current = answers.get(q.questionId);
        const numVal = value === "" ? null : parseFloat(value);
        const newAnswer = { selectedOption: null, numericalAnswer: numVal, markedForReview: current?.markedForReview ?? false };
        setAnswers(new Map(answers.set(q.questionId, newAnswer)));
        saveAnswer(q.questionId, { numericalAnswer: numVal });
    };

    // Toggle mark for review
    const toggleReview = () => {
        if (!attempt) return;
        const q = attempt.questions[currentIdx];
        const current = answers.get(q.questionId);
        const newReview = !(current?.markedForReview ?? false);
        const newAnswer = { ...current, selectedOption: current?.selectedOption ?? null, numericalAnswer: current?.numericalAnswer ?? null, markedForReview: newReview };
        setAnswers(new Map(answers.set(q.questionId, newAnswer)));
        saveAnswer(q.questionId, { markedForReview: newReview });
    };

    // Clear response
    const clearResponse = () => {
        if (!attempt) return;
        const q = attempt.questions[currentIdx];
        const newAnswer = { selectedOption: null, numericalAnswer: null, markedForReview: false };
        setAnswers(new Map(answers.set(q.questionId, newAnswer)));
        saveAnswer(q.questionId, { selectedOption: null, numericalAnswer: null, markedForReview: false });
    };

    // Submit
    const handleSubmit = async (autoSubmit = false) => {
        if (!attempt) return;
        if (!autoSubmit) {
            setShowSubmitModal(true);
            return;
        }

        setSubmitting(true);
        try {
            const res = await authFetch(`/api/tests/${testId}/attempt/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attemptId: attempt.id }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/dashboard/tests/${testId}/result?attemptId=${attempt.id}`);
            }
        } catch (e) {
            console.error("Submit failed:", e);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmSubmit = () => {
        setShowSubmitModal(false);
        handleSubmit(true);
    };

    // Format time
    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
    };

    // Get question status for palette
    const getQuestionStatus = (questionId: string, idx: number) => {
        if (idx === currentIdx) return "current";
        const a = answers.get(questionId);
        if (a?.markedForReview) return "review";
        if (a?.selectedOption !== null && a?.selectedOption !== undefined) return "answered";
        if (a?.numericalAnswer !== null && a?.numericalAnswer !== undefined) return "answered";
        return "unanswered";
    };

    const paletteColor = (status: string) => {
        switch (status) {
            case "current": return "bg-blue-600 text-white border-blue-600";
            case "answered": return "bg-emerald-500 text-white border-emerald-500";
            case "review": return "bg-amber-500 text-white border-amber-500";
            default: return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600";
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <svg className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    <p className="text-slate-400">Loading test...</p>
                </div>
            </div>
        );
    }

    if (!attempt) {
        return <div className="text-center py-16 text-slate-500">Failed to load test.</div>;
    }

    const currentQ = attempt.questions[currentIdx];
    const currentAnswer = answers.get(currentQ.questionId);
    const answeredCount = Array.from(answers.values()).filter((a) => (a.selectedOption !== null && a.selectedOption !== undefined) || (a.numericalAnswer !== null && a.numericalAnswer !== undefined)).length;
    const reviewCount = Array.from(answers.values()).filter((a) => a.markedForReview).length;
    const isTimeLow = timeLeft < 300; // 5 minutes

    return (
        <div className="flex flex-col lg:flex-row gap-4 -m-6 lg:-m-8 min-h-screen">
            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Header Bar */}
                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h1 className="font-semibold text-slate-900 dark:text-white">{attempt.test.title}</h1>
                        <p className="text-xs text-slate-400">Attempt #{attempt.attemptNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${isTimeLow ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className="px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                            Submit Test
                        </button>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Question Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Q{currentIdx + 1}/{attempt.questions.length}</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentQ.type === "MCQ" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"}`}>{currentQ.type}</span>
                                <span className="text-xs text-slate-400">{currentQ.marks} marks {currentQ.negativeMarks > 0 && `| -${currentQ.negativeMarks} negative`}</span>
                            </div>
                            <button
                                onClick={toggleReview}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentAnswer?.markedForReview ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"}`}
                            >
                                {currentAnswer?.markedForReview ? "★ Marked for Review" : "☆ Mark for Review"}
                            </button>
                        </div>

                        {/* Question Text */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
                            <p className="text-slate-800 dark:text-slate-200 text-base leading-relaxed whitespace-pre-wrap">{currentQ.text}</p>
                        </div>

                        {/* Options */}
                        {currentQ.type === "MCQ" && currentQ.options && (
                            <div className="space-y-3">
                                {(currentQ.options as { id: string; text: string }[]).map((opt, idx) => {
                                    const isSelected = currentAnswer?.selectedOption === idx;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => selectOption(idx)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-slate-900"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                                                    {opt.id}
                                                </span>
                                                <span className={`text-sm ${isSelected ? "text-blue-700 dark:text-blue-300 font-medium" : "text-slate-700 dark:text-slate-300"}`}>{opt.text}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Numerical Input */}
                        {currentQ.type === "NUMERICAL" && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Enter your answer:</label>
                                <input
                                    type="number"
                                    value={currentAnswer?.numericalAnswer ?? ""}
                                    onChange={(e) => setNumericalAnswer(e.target.value)}
                                    className="w-full px-4 py-3 text-lg rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Type your numerical answer..."
                                />
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                                    disabled={currentIdx === 0}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                                >
                                    ← Previous
                                </button>
                                <button
                                    onClick={() => setCurrentIdx(Math.min(attempt.questions.length - 1, currentIdx + 1))}
                                    disabled={currentIdx === attempt.questions.length - 1}
                                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition-colors"
                                >
                                    Next →
                                </button>
                            </div>
                            <button
                                onClick={clearResponse}
                                className="px-3 py-2 text-xs text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Clear Response
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar — Question Palette */}
            <div className="w-full lg:w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto order-first lg:order-last">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Question Palette</h3>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4 text-[10px]">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> Answered ({answeredCount})</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500" /> Review ({reviewCount})</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" /> Not Answered ({attempt.questions.length - answeredCount})</div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-6 gap-1.5">
                    {attempt.questions.map((q, idx) => {
                        const status = getQuestionStatus(q.questionId, idx);
                        return (
                            <button
                                key={q.questionId}
                                onClick={() => setCurrentIdx(idx)}
                                className={`w-full aspect-square rounded-lg border-2 text-xs font-bold transition-all hover:scale-105 ${paletteColor(status)}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-6 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Total</span><span className="font-medium text-slate-700 dark:text-slate-300">{attempt.questions.length}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Answered</span><span className="font-medium text-emerald-600">{answeredCount}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>For Review</span><span className="font-medium text-amber-600">{reviewCount}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Unanswered</span><span className="font-medium text-slate-600">{attempt.questions.length - answeredCount}</span>
                    </div>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Submit Test?</h3>
                        <div className="space-y-2 mb-6">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                You have answered <span className="font-bold text-emerald-600">{answeredCount}</span> of <span className="font-bold">{attempt.questions.length}</span> questions.
                            </p>
                            {attempt.questions.length - answeredCount > 0 && (
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    ⚠ {attempt.questions.length - answeredCount} questions are unanswered.
                                </p>
                            )}
                            {reviewCount > 0 && (
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    ★ {reviewCount} questions are marked for review.
                                </p>
                            )}
                            <p className="text-sm text-slate-500 mt-3">Once submitted, you cannot modify your answers.</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitModal(false)}
                                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                Continue Test
                            </button>
                            <button onClick={confirmSubmit} disabled={submitting}
                                className="flex-1 py-2.5 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                                {submitting ? "Submitting..." : "Submit Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
