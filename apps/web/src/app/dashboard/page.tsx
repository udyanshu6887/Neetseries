"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getAuthUser } from "@/lib/auth";

interface AdminData {
    role: "ADMIN";
    stats: {
        totalQuestions: number;
        totalTests: number;
        totalStudents: number;
        totalAttempts: number;
        publishedTests: number;
        draftTests: number;
    };
    difficultyDistribution: { label: string; count: number }[];
    categoryDistribution: { label: string; count: number }[];
    recentUploads: { id: string; fileName: string; totalCount: number; status: string; uploadedAt: string }[];
    recentAttempts: { id: string; score: number; submittedAt: string; attemptNumber: number; user: { name: string }; test: { title: string } }[];
}

interface StudentData {
    role: "STUDENT";
    stats: {
        availableTests: number;
        totalAttempts: number;
        avgScore: number;
        bestScore: number;
    };
    recentTests: { id: string; testId: string; testTitle: string; attemptNumber: number; score: number; totalMarks: number; percentage: number; submittedAt: string }[];
    inProgress: { attemptId: string; testId: string; testTitle: string } | null;
}

type DashboardData = AdminData | StudentData;

export default function DashboardHomePage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        const u = getAuthUser();
        if (u) setUserName(u.name);

        authFetch("/api/dashboard")
            .then((r) => r.json())
            .then((d) => { if (d.success) setData(d.data); })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    <div className="h-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!data) return <div className="text-center py-16 text-slate-500">Failed to load dashboard.</div>;

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return "Good Morning";
        if (h < 17) return "Good Afternoon";
        return "Good Evening";
    };

    if (data.role === "ADMIN") return <AdminDashboard data={data} userName={userName} greeting={greeting()} router={router} />;
    return <StudentDashboard data={data} userName={userName} greeting={greeting()} router={router} />;
}

// ──────────────────────────────────────────────
// ADMIN DASHBOARD
// ──────────────────────────────────────────────

function AdminDashboard({ data, userName, greeting, router }: { data: AdminData; userName: string; greeting: string; router: ReturnType<typeof useRouter> }) {
    const stats = [
        { label: "Total Questions", value: data.stats.totalQuestions, icon: "📝", color: "from-blue-500 to-cyan-500", href: "/dashboard/admin/questions" },
        { label: "Total Tests", value: data.stats.totalTests, icon: "📋", sub: `${data.stats.publishedTests} live · ${data.stats.draftTests} draft`, color: "from-violet-500 to-purple-500", href: "/dashboard/admin/tests" },
        { label: "Students", value: data.stats.totalStudents, icon: "👥", color: "from-emerald-500 to-green-500", href: "/dashboard/admin/users" },
        { label: "Test Attempts", value: data.stats.totalAttempts, icon: "🎯", color: "from-amber-500 to-orange-500", href: "#" },
    ];

    const diffColors: Record<string, string> = { EASY: "#34d399", MEDIUM: "#fbbf24", HARD: "#ef4444" };
    const catColors: Record<string, string> = { CONCEPTUAL: "#38bdf8", FACTUAL: "#818cf8", ANALYTICAL: "#a78bfa", APPLICATION: "#2dd4bf", NUMERICAL: "#fb923c", DIAGRAM_BASED: "#f472b6" };

    const totalDiff = data.difficultyDistribution.reduce((s, d) => s + d.count, 0) || 1;
    const totalCat = data.categoryDistribution.reduce((s, d) => s + d.count, 0) || 1;

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold">{greeting}, {userName}! 👋</h1>
                <p className="text-blue-100 mt-1">Here&apos;s an overview of your platform</p>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => router.push("/dashboard/admin/events")}
                        className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                        Upload Questions
                    </button>
                    <button onClick={() => router.push("/dashboard/admin/tests")}
                        className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                        Create Test
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label}
                        onClick={() => router.push(s.href)}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{s.value.toLocaleString()}</p>
                                {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
                            </div>
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                                {s.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Difficulty Distribution */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Difficulty Distribution</h3>
                    <div className="space-y-3">
                        {data.difficultyDistribution.map((d) => {
                            const pct = Math.round((d.count / totalDiff) * 100);
                            return (
                                <div key={d.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600 dark:text-slate-400">{d.label}</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{d.count} ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: diffColors[d.label] || "#94a3b8" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Category Distribution</h3>
                    <div className="space-y-3">
                        {data.categoryDistribution.map((c) => {
                            const pct = Math.round((c.count / totalCat) * 100);
                            return (
                                <div key={c.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600 dark:text-slate-400">{c.label}</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{c.count} ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: catColors[c.label] || "#94a3b8" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent Uploads */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Recent Uploads</h3>
                        <button onClick={() => router.push("/dashboard/admin/events")} className="text-xs text-blue-500 hover:text-blue-400">View all →</button>
                    </div>
                    {data.recentUploads.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">No uploads yet</p>
                    ) : (
                        <div className="space-y-3">
                            {data.recentUploads.map((u) => (
                                <div key={u.id} onClick={() => router.push(`/dashboard/admin/events/${u.id}`)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{u.fileName}</p>
                                        <p className="text-xs text-slate-400">{u.totalCount} questions · {new Date(u.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.status === "PROCESSED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
                                        {u.status === "PROCESSED" ? "Done" : "Pending"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Attempts */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Student Attempts</h3>
                    {data.recentAttempts.length === 0 ? (
                        <p className="text-sm text-slate-400 py-4 text-center">No attempts yet</p>
                    ) : (
                        <div className="space-y-3">
                            {data.recentAttempts.map((a) => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs text-white font-bold shrink-0">
                                        {a.user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.user.name}</p>
                                        <p className="text-xs text-slate-400 truncate">{a.test.title} · #{a.attemptNumber}</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{a.score}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// STUDENT DASHBOARD
// ──────────────────────────────────────────────

function StudentDashboard({ data, userName, greeting, router }: { data: StudentData; userName: string; greeting: string; router: ReturnType<typeof useRouter> }) {
    const stats = [
        { label: "Available Tests", value: data.stats.availableTests, icon: "📋", color: "from-blue-500 to-cyan-500" },
        { label: "Tests Completed", value: data.stats.totalAttempts, icon: "✅", color: "from-emerald-500 to-green-500" },
        { label: "Average Score", value: data.stats.avgScore, icon: "📊", color: "from-violet-500 to-purple-500" },
        { label: "Best Score", value: data.stats.bestScore, icon: "🏆", color: "from-amber-500 to-orange-500" },
    ];

    const getScoreColor = (pct: number) => {
        if (pct >= 80) return "text-emerald-600 dark:text-emerald-400";
        if (pct >= 60) return "text-blue-600 dark:text-blue-400";
        if (pct >= 40) return "text-amber-600 dark:text-amber-400";
        return "text-red-500 dark:text-red-400";
    };

    const getBarColor = (pct: number) => {
        if (pct >= 80) return "#34d399";
        if (pct >= 60) return "#60a5fa";
        if (pct >= 40) return "#fbbf24";
        return "#ef4444";
    };

    return (
        <div className="space-y-6">
            {/* Greeting */}
            <div className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                    <h1 className="text-2xl font-bold">{greeting}, {userName}! 🎓</h1>
                    <p className="text-blue-100 mt-1">Ready to ace your next mock test?</p>
                    <div className="flex gap-3 mt-4">
                        <button onClick={() => router.push("/dashboard/tests")}
                            className="px-5 py-2.5 bg-white text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm">
                            Start a Test →
                        </button>
                        <button onClick={() => router.push("/dashboard/results")}
                            className="px-4 py-2.5 bg-white/20 backdrop-blur rounded-lg text-sm font-medium hover:bg-white/30 transition-colors">
                            View Results
                        </button>
                    </div>
                </div>
            </div>

            {/* In-progress alert */}
            {data.inProgress && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">You have a test in progress</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">{data.inProgress.testTitle}</p>
                    </div>
                    <button onClick={() => router.push(`/dashboard/tests/${data.inProgress!.testId}/attempt`)}
                        className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
                        Resume →
                    </button>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{s.label}</p>
                            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-base shadow-sm`}>
                                {s.icon}
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Recent Performance */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Recent Performance</h3>
                    <button onClick={() => router.push("/dashboard/results")} className="text-xs text-blue-500 hover:text-blue-400">View all →</button>
                </div>

                {data.recentTests.length === 0 ? (
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-slate-500 text-sm">No tests completed yet</p>
                        <button onClick={() => router.push("/dashboard/tests")}
                            className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                            Take your first test
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.recentTests.map((t) => (
                            <div key={t.id}
                                onClick={() => router.push(`/dashboard/tests/${t.testId}/result?attemptId=${t.id}`)}
                                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${getScoreColor(t.percentage)} bg-slate-50 dark:bg-slate-800`}>
                                    {t.percentage}%
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{t.testTitle}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t.score}/{t.totalMarks} marks · Attempt #{t.attemptNumber} · {t.submittedAt ? new Date(t.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}
                                    </p>
                                </div>
                                <div className="w-24 shrink-0">
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.percentage}%`, backgroundColor: getBarColor(t.percentage) }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div onClick={() => router.push("/dashboard/tests")}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Practice Tests</h4>
                    <p className="text-xs text-slate-400 mt-1">Browse and attempt available mock tests</p>
                </div>
                <div onClick={() => router.push("/dashboard/results")}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer group">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">My Performance</h4>
                    <p className="text-xs text-slate-400 mt-1">Review your scores and track progress</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 opacity-60">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Study Materials</h4>
                    <p className="text-xs text-slate-400 mt-1">Coming soon...</p>
                </div>
            </div>
        </div>
    );
}
