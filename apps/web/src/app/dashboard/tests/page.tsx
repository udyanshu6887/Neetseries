"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface AvailableTest {
    id: string;
    title: string;
    description?: string;
    duration: number;
    totalQuestions: number;
    totalMarks: number;
    evaluationType: string;
    isPublished: boolean;
}

export default function StudentTestsPage() {
    const router = useRouter();
    const [tests, setTests] = useState<AvailableTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [startingId, setStartingId] = useState<string | null>(null);

    useEffect(() => {
        authFetch("/api/tests?published=true")
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setTests(d.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const startTest = async (testId: string) => {
        if (!confirm("Are you sure you want to start this test? The timer will begin immediately.")) return;
        setStartingId(testId);
        try {
            const res = await authFetch(`/api/tests/${testId}/attempt`, { method: "POST" });
            const data = await res.json();
            if (data.success) {
                router.push(`/dashboard/tests/${testId}/attempt`);
            }
        } catch (e) {
            console.error("Start test failed:", e);
        } finally {
            setStartingId(null);
        }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m} min`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Available Tests</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Choose a test to begin your practice session</p>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : tests.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center">
                    <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg mb-1">No tests available</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Check back later for new test series</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tests.map((t) => (
                        <div
                            key={t.id}
                            className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all overflow-hidden"
                        >
                            {/* Gradient accent bar */}
                            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

                            <div className="p-5 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {t.title}
                                    </h3>
                                    {t.description && (
                                        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{t.description}</p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{t.totalQuestions}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Questions</p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{t.totalMarks}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Marks</p>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{formatDuration(t.duration)}</p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">Duration</p>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => startTest(t.id)}
                                    disabled={startingId === t.id}
                                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md inline-flex items-center justify-center gap-2"
                                >
                                    {startingId === t.id ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Start Test
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
