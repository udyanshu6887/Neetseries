"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { authFetch, getAuthToken } from "@/lib/auth";

interface Question {
    id: string;
    type: string;
    text: string;
    topic: string;
    difficulty: string;
    marks: number;
    subject?: string;
    chapter?: string;
    createdAt: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({ topic: "", difficulty: "", type: "" });
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    const fetchQuestions = () => {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filters.topic) params.set("topic", filters.topic);
        if (filters.difficulty) params.set("difficulty", filters.difficulty);
        if (filters.type) params.set("type", filters.type);

        authFetch(`/api/questions?${params}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setQuestions(data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchQuestions();
    }, [filters]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus("Uploading...");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = getAuthToken();
            const res = await fetch("/api/questions/upload", {
                method: "POST",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setUploadStatus(`Uploaded ${data.data?.count ?? ""} questions!`);
                fetchQuestions();
            } else {
                setUploadStatus(`Error: ${data.error?.message || "Upload failed"}`);
            }
        } catch {
            setUploadStatus("Upload failed");
        }

        // Clear status after 4s
        setTimeout(() => setUploadStatus(null), 4000);
        e.target.value = "";
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
            case "SUBJECTIVE": return "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Questions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {questions.length} questions in the bank
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {uploadStatus && (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 animate-pulse">
                            {uploadStatus}
                        </span>
                    )}
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload CSV
                        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>
                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="NUMERICAL">Numerical</option>
                    <option value="SUBJECTIVE">Subjective</option>
                </select>
                <input
                    type="text"
                    placeholder="Filter by topic..."
                    value={filters.topic}
                    onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 min-w-[200px]"
                />
            </div>

            {/* Table */}
            <DataTable<Question>
                keyExtractor={(q) => q.id}
                isLoading={isLoading}
                emptyMessage="No questions found. Upload a CSV to get started."
                data={questions}
                columns={[
                    {
                        key: "text",
                        header: "Question",
                        render: (q) => (
                            <div className="max-w-md">
                                <p className="truncate font-medium">{q.text}</p>
                                {q.subject && (
                                    <p className="text-xs text-slate-400 mt-0.5">{q.subject}{q.chapter ? ` › ${q.chapter}` : ""}</p>
                                )}
                            </div>
                        ),
                    },
                    {
                        key: "type",
                        header: "Type",
                        render: (q) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor(q.type)}`}>
                                {q.type}
                            </span>
                        ),
                    },
                    {
                        key: "difficulty",
                        header: "Difficulty",
                        render: (q) => (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>
                                {q.difficulty}
                            </span>
                        ),
                    },
                    {
                        key: "topic",
                        header: "Topic",
                    },
                    {
                        key: "marks",
                        header: "Marks",
                        className: "text-center",
                    },
                ]}
            />
        </div>
    );
}
