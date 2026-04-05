"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface Test {
    id: string;
    title: string;
    description?: string;
    duration: number;
    totalQuestions: number;
    totalMarks: number;
    isPublished: boolean;
    evaluationType: string;
    createdAt: string;
}

export default function TestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        duration: 60,
        evaluationType: "AUTO",
    });

    const fetchTests = () => {
        setIsLoading(true);
        authFetch("/api/tests")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setTests(data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchTests(); }, []);

    const createTest = async () => {
        if (!form.title.trim()) return;
        setCreating(true);
        try {
            const res = await authFetch("/api/tests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    duration: form.duration * 60, // convert minutes to seconds
                    leaderboardVisible: false,
                }),
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/dashboard/admin/tests/${data.data.id}`);
            }
        } catch (e) {
            console.error("Failed to create test:", e);
        } finally {
            setCreating(false);
        }
    };

    const togglePublish = async (id: string, currently: boolean) => {
        try {
            const res = await authFetch(`/api/tests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: !currently }),
            });
            if (res.ok) {
                setTests((prev) => prev.map((t) => (t.id === id ? { ...t, isPublished: !currently } : t)));
            }
        } catch (e) {
            console.error("Failed to toggle publish:", e);
        }
    };

    const deleteTest = async (id: string) => {
        if (!confirm("Delete this test? This cannot be undone.")) return;
        try {
            const res = await authFetch(`/api/tests/${id}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setTests((prev) => prev.filter((t) => t.id !== id));
            } else {
                alert(data.error?.message || "Failed to delete");
            }
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tests</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{tests.length} tests created</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm inline-flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Test
                </button>
            </div>

            {/* Create Test Form */}
            {showCreate && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">New Test</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Title *</label>
                            <input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="e.g., NEET Mock Test - Series 1"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
                            <input
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Optional description"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duration (minutes)</label>
                            <input
                                type="number"
                                value={form.duration}
                                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                                min={1}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Evaluation Type</label>
                            <select
                                value={form.evaluationType}
                                onChange={(e) => setForm({ ...form, evaluationType: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            >
                                <option value="AUTO">Auto (MCQ + Numerical)</option>
                                <option value="MANUAL">Manual (Subjective)</option>
                                <option value="HYBRID">Hybrid (Mixed)</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={createTest}
                            disabled={creating || !form.title.trim()}
                            className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {creating ? "Creating..." : "Create & Configure"}
                        </button>
                        <button
                            onClick={() => setShowCreate(false)}
                            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Tests Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : tests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-2">No tests yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Create your first test to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tests.map((t) => (
                        <div
                            key={t.id}
                            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer overflow-hidden"
                            onClick={() => router.push(`/dashboard/admin/tests/${t.id}`)}
                        >
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">{t.title}</h3>
                                    <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.isPublished ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                                        {t.isPublished ? "LIVE" : "DRAFT"}
                                    </span>
                                </div>
                                {t.description && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 truncate">{t.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {t.totalQuestions} Qs
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {formatDuration(t.duration)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {t.totalMarks} marks
                                    </span>
                                </div>
                            </div>
                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                                    {t.evaluationType}
                                </span>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => togglePublish(t.id, t.isPublished)}
                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${t.isPublished ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                                        title={t.isPublished ? "Unpublish" : "Publish"}
                                    >
                                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${t.isPublished ? "translate-x-4" : "translate-x-0.5"}`} />
                                    </button>
                                    {!t.isPublished && (
                                        <button
                                            onClick={() => deleteTest(t.id)}
                                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            title="Delete test"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
