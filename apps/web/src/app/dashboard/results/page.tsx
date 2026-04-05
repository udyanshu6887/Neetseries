"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface ResultSummary {
    id: string;
    testId: string;
    testTitle: string;
    attemptNumber: number;
    score: number;
    totalMarks: number;
    percentage: number;
    submittedAt: string;
    duration: number;
}

export default function ResultsPage() {
    const router = useRouter();
    const [results, setResults] = useState<ResultSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authFetch("/api/results")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setResults(d.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const getScoreBadge = (pct: number) => {
        if (pct >= 80) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        if (pct >= 60) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        if (pct >= 40) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Results</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{results.length} test attempts completed</p>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No results yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Complete a test to see your results here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {results.map((r) => (
                        <div
                            key={r.id}
                            onClick={() => router.push(`/dashboard/tests/${r.testId}/result?attemptId=${r.id}`)}
                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer p-5 flex items-center gap-5"
                        >
                            {/* Score circle */}
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${getScoreBadge(r.percentage)}`}>
                                {r.percentage}%
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-slate-900 dark:text-white truncate">{r.testTitle}</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                    <span>Attempt #{r.attemptNumber}</span>
                                    <span>•</span>
                                    <span>{r.score}/{r.totalMarks} marks</span>
                                    <span>•</span>
                                    <span>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}</span>
                                </div>
                            </div>

                            {/* Arrow */}
                            <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
