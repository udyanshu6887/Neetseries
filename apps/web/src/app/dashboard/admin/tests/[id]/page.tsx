"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface TestQuestion {
    testQuestionId: string;
    order: number;
    customMarks: number | null;
    customNegativeMarks: number | null;
    id: string;
    type: string;
    text: string;
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: string;
    category: string;
    subject: string | null;
    chapter: string | null;
    year: number | null;
}

interface TestDetail {
    id: string;
    title: string;
    description: string | null;
    duration: number;
    evaluationType: string;
    isPublished: boolean;
    leaderboardVisible: boolean;
    totalQuestions: number;
    totalMarks: number;
    totalAttempts: number;
    questions: TestQuestion[];
}

interface BankQuestion {
    id: string;
    type: string;
    text: string;
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: string;
    category?: string;
    subject?: string;
}

export default function TestBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const testId = params.id as string;

    const [test, setTest] = useState<TestDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editDuration, setEditDuration] = useState(60);
    const [editEval, setEditEval] = useState("AUTO");
    const [isEditingHeader, setIsEditingHeader] = useState(false);

    // Question bank
    const [showBank, setShowBank] = useState(false);
    const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankSearch, setBankSearch] = useState("");
    const [bankSubject, setBankSubject] = useState("");
    const [bankDifficulty, setBankDifficulty] = useState("");
    const [bankCategory, setBankCategory] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [addingQuestions, setAddingQuestions] = useState(false);

    const fetchTest = useCallback(() => {
        setIsLoading(true);
        authFetch(`/api/tests/${testId}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) {
                    setTest(d.data);
                    setEditTitle(d.data.title);
                    setEditDesc(d.data.description || "");
                    setEditDuration(Math.floor(d.data.duration / 60));
                    setEditEval(d.data.evaluationType);
                }
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [testId]);

    useEffect(() => { fetchTest(); }, [fetchTest]);

    // Load question bank
    const loadBank = useCallback(() => {
        setBankLoading(true);
        const params = new URLSearchParams();
        if (bankSubject) params.set("topic", bankSubject); // uses topic filter
        if (bankDifficulty) params.set("difficulty", bankDifficulty);
        authFetch(`/api/questions?${params.toString()}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setBankQuestions(d.data);
            })
            .catch(console.error)
            .finally(() => setBankLoading(false));
    }, [bankSubject, bankDifficulty]);

    useEffect(() => {
        if (showBank) loadBank();
    }, [showBank, loadBank]);

    // Save header edits
    const saveHeader = async () => {
        setSaving(true);
        try {
            await authFetch(`/api/tests/${testId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle,
                    description: editDesc || undefined,
                    duration: editDuration * 60,
                    evaluationType: editEval,
                }),
            });
            fetchTest();
            setIsEditingHeader(false);
        } catch (e) {
            console.error("Save failed:", e);
        } finally {
            setSaving(false);
        }
    };

    // Toggle publish
    const togglePublish = async () => {
        if (!test) return;
        if (test.isPublished && test.totalAttempts > 0) {
            if (!confirm("This test has student attempts. Are you sure you want to unpublish?")) return;
        }
        try {
            await authFetch(`/api/tests/${testId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: !test.isPublished }),
            });
            fetchTest();
        } catch (e) {
            console.error("Publish toggle failed:", e);
        }
    };

    // Add selected questions
    const addSelectedQuestions = async () => {
        if (selectedIds.size === 0) return;
        setAddingQuestions(true);
        try {
            for (const questionId of selectedIds) {
                await authFetch(`/api/tests/${testId}/questions`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ questionId }),
                });
            }
            setSelectedIds(new Set());
            fetchTest();
        } catch (e) {
            console.error("Add questions failed:", e);
        } finally {
            setAddingQuestions(false);
        }
    };

    // Remove question
    const removeQuestion = async (questionId: string) => {
        try {
            await authFetch(`/api/tests/${testId}/questions`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId }),
            });
            fetchTest();
        } catch (e) {
            console.error("Remove question failed:", e);
        }
    };

    // Move question
    const moveQuestion = async (idx: number, dir: -1 | 1) => {
        if (!test) return;
        const qs = [...test.questions];
        const target = idx + dir;
        if (target < 0 || target >= qs.length) return;
        [qs[idx], qs[target]] = [qs[target], qs[idx]];
        const order = qs.map((q, i) => ({ testQuestionId: q.testQuestionId, order: i + 1 }));
        // Optimistic update
        setTest({ ...test, questions: qs.map((q, i) => ({ ...q, order: i + 1 })) });
        try {
            await authFetch(`/api/tests/${testId}/questions/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order }),
            });
        } catch (e) {
            console.error("Reorder failed:", e);
            fetchTest(); // revert
        }
    };

    const difficultyColor = (d: string) => {
        switch (d) {
            case "EASY": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "MEDIUM": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            case "HARD": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const typeColor = (t: string) => {
        switch (t) {
            case "MCQ": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            case "NUMERICAL": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
            case "ASSERTION_REASON": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const categoryColor = (c: string) => {
        switch (c) {
            case "CONCEPTUAL": return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400";
            case "FACTUAL": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
            case "ANALYTICAL": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
            case "APPLICATION": return "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
            case "NUMERICAL": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
            case "DIAGRAM_BASED": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            </div>
        );
    }

    if (!test) {
        return <div className="text-center py-16 text-slate-500">Test not found.</div>;
    }

    // Questions already in test (by id)
    const addedIds = new Set(test.questions.map((q) => q.id));

    // Filter bank questions
    const filteredBank = bankQuestions.filter((q) => {
        if (addedIds.has(q.id)) return false;
        if (bankSearch && !q.text.toLowerCase().includes(bankSearch.toLowerCase()) && !q.topic.toLowerCase().includes(bankSearch.toLowerCase())) return false;
        if (bankCategory && q.category !== bankCategory) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            {/* Back and Title */}
            <button onClick={() => router.push("/dashboard/admin/tests")} className="text-sm text-blue-500 hover:text-blue-400 inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Tests
            </button>

            {/* Header Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                {isEditingHeader ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Duration (min)</label>
                                <input type="number" value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Evaluation</label>
                                <select value={editEval} onChange={(e) => setEditEval(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="AUTO">Auto</option><option value="MANUAL">Manual</option><option value="HYBRID">Hybrid</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={saveHeader} disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                            <button onClick={() => setIsEditingHeader(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{test.title}</h1>
                            {test.description && <p className="text-slate-500 dark:text-slate-400 mt-1">{test.description}</p>}
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-500 dark:text-slate-400">
                                <span>{formatDuration(test.duration)}</span>
                                <span>•</span>
                                <span>{test.totalQuestions} questions</span>
                                <span>•</span>
                                <span>{test.totalMarks} marks</span>
                                <span>•</span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">{test.evaluationType}</span>
                                {test.totalAttempts > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>{test.totalAttempts} attempts</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setIsEditingHeader(true)} className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={togglePublish}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${test.isPublished ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
                                {test.isPublished ? "Unpublish" : "Publish"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Questions in Test */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="font-semibold text-slate-900 dark:text-white">Questions ({test.totalQuestions})</h2>
                    <button
                        onClick={() => setShowBank(!showBank)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        {showBank ? "Close Bank" : "Add Questions"}
                    </button>
                </div>

                {test.questions.length === 0 ? (
                    <div className="p-12 text-center">
                        <svg className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No questions added yet. Click "Add Questions" to select from the question bank.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs w-10">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs min-w-[200px]">Question</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Subject</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Topic</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Difficulty</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Category</th>
                                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Marks</th>
                                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs w-24">Order</th>
                                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {test.questions.map((q, idx) => (
                                    <tr key={q.testQuestionId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor(q.type)}`}>{q.type}</span></td>
                                        <td className="px-4 py-3"><p className="text-slate-800 dark:text-slate-200 truncate max-w-xs">{q.text}</p></td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{q.subject || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">{q.topic}</td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span></td>
                                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(q.category)}`}>{q.category}</span></td>
                                        <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">{q.customMarks ?? q.marks}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}
                                                    className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                </button>
                                                <button onClick={() => moveQuestion(idx, 1)} disabled={idx === test.questions.length - 1}
                                                    className="p-1 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button onClick={() => removeQuestion(q.id)}
                                                className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remove">
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Question Bank Panel */}
            {showBank && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden">
                    <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-200 dark:border-blue-800">
                        <h2 className="font-semibold text-blue-800 dark:text-blue-300">Question Bank</h2>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Select questions to add to this test</p>
                    </div>

                    {/* Filters */}
                    <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center">
                        <input
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            placeholder="Search questions..."
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-64 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <select value={bankDifficulty} onChange={(e) => setBankDifficulty(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none">
                            <option value="">All Difficulties</option>
                            <option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                        </select>
                        <select value={bankCategory} onChange={(e) => setBankCategory(e.target.value)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none">
                            <option value="">All Categories</option>
                            <option value="CONCEPTUAL">Conceptual</option><option value="FACTUAL">Factual</option><option value="ANALYTICAL">Analytical</option>
                            <option value="APPLICATION">Application</option><option value="NUMERICAL">Numerical</option><option value="DIAGRAM_BASED">Diagram Based</option>
                        </select>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={addSelectedQuestions}
                                disabled={addingQuestions}
                                className="ml-auto px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
                            >
                                {addingQuestions ? "Adding..." : `Add ${selectedIds.size} Selected`}
                            </button>
                        )}
                    </div>

                    {/* Bank Table */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {bankLoading ? (
                            <div className="p-8 text-center text-slate-400">Loading questions...</div>
                        ) : filteredBank.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No matching questions found</div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="px-4 py-2 w-10">
                                            <input
                                                type="checkbox"
                                                checked={filteredBank.length > 0 && filteredBank.every((q) => selectedIds.has(q.id))}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(new Set([...selectedIds, ...filteredBank.map((q) => q.id)]));
                                                    } else {
                                                        const newSet = new Set(selectedIds);
                                                        filteredBank.forEach((q) => newSet.delete(q.id));
                                                        setSelectedIds(newSet);
                                                    }
                                                }}
                                                className="rounded border-slate-300 dark:border-slate-600"
                                            />
                                        </th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Type</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 min-w-[200px]">Question</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Subject</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Topic</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Difficulty</th>
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500">Category</th>
                                        <th className="text-center px-4 py-2 text-xs font-semibold text-slate-500">Marks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredBank.map((q) => (
                                        <tr key={q.id} className={`transition-colors cursor-pointer ${selectedIds.has(q.id) ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                                            onClick={() => {
                                                const newSet = new Set(selectedIds);
                                                newSet.has(q.id) ? newSet.delete(q.id) : newSet.add(q.id);
                                                setSelectedIds(newSet);
                                            }}>
                                            <td className="px-4 py-2.5">
                                                <input type="checkbox" checked={selectedIds.has(q.id)} readOnly className="rounded border-slate-300 dark:border-slate-600 pointer-events-none" />
                                            </td>
                                            <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor(q.type)}`}>{q.type}</span></td>
                                            <td className="px-4 py-2.5"><p className="text-slate-800 dark:text-slate-200 truncate max-w-xs text-xs">{q.text}</p></td>
                                            <td className="px-4 py-2.5 text-xs text-slate-500">{q.subject || "—"}</td>
                                            <td className="px-4 py-2.5 text-xs text-slate-500">{q.topic}</td>
                                            <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span></td>
                                            <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(q.category || "")}`}>{q.category || "—"}</span></td>
                                            <td className="px-4 py-2.5 text-center text-xs text-slate-600 dark:text-slate-400">{q.marks}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
