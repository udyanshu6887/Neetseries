"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { authFetch } from "@/lib/auth";

interface Test {
    id: string;
    title: string;
    description?: string;
    duration: number;
    totalQuestions: number;
    isPublished: boolean;
    evaluationType: string;
    createdAt: string;
}

export default function TestsPage() {
    const [tests, setTests] = useState<Test[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    useEffect(() => {
        fetchTests();
    }, []);

    const togglePublish = async (id: string, currently: boolean) => {
        try {
            const res = await authFetch(`/api/tests/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isPublished: !currently }),
            });
            if (res.ok) {
                setTests((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, isPublished: !currently } : t))
                );
            }
        } catch (e) {
            console.error("Failed to toggle publish:", e);
        }
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tests</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {tests.length} tests created
                    </p>
                </div>
            </div>

            {/* Table */}
            <DataTable<Test>
                keyExtractor={(t) => t.id}
                isLoading={isLoading}
                emptyMessage="No tests yet. Create your first test."
                data={tests}
                columns={[
                    {
                        key: "title",
                        header: "Test Name",
                        render: (t) => (
                            <div>
                                <p className="font-medium text-slate-900 dark:text-white">{t.title}</p>
                                {t.description && (
                                    <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{t.description}</p>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "totalQuestions",
                        header: "Questions",
                        className: "text-center",
                        render: (t) => (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {t.totalQuestions}
                            </span>
                        ),
                    },
                    {
                        key: "duration",
                        header: "Duration",
                        render: (t) => <span className="text-slate-600 dark:text-slate-400">{formatDuration(t.duration)}</span>,
                    },
                    {
                        key: "evaluationType",
                        header: "Evaluation",
                        render: (t) => (
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium">
                                {t.evaluationType}
                            </span>
                        ),
                    },
                    {
                        key: "isPublished",
                        header: "Status",
                        render: (t) => (
                            <button
                                onClick={() => togglePublish(t.id, t.isPublished)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${t.isPublished ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${t.isPublished ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        ),
                    },
                ]}
            />
        </div>
    );
}
