"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { authFetch } from "@/lib/auth";

interface Question {
    id: string;
    type: string;
    text: string;
    options: { id: string; text: string }[] | null;
    correctAnswer: string | null;
    marks: number;
    negativeMarks: number;
    topic: string;
    difficulty: string;
    category: string;
    explanation: string | null;
    status: string;
    year: number | null;
    subject: string | null;
    chapter: string | null;
    hint: string | null;
    timeExpectedSec: number | null;
}

interface EventDetail {
    id: string;
    fileName: string;
    status: string;
    totalCount: number;
    uploadedAt: string;
    processedAt: string | null;
    uploadedBy: { name: string };
    questions: Question[];
}

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId as string;

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Question>>({});
    const [saving, setSaving] = useState(false);
    const [processing, setProcessing] = useState(false);

    const fetchEvent = () => {
        setIsLoading(true);
        authFetch(`/api/admin/events/${eventId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setEvent(data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchEvent(); }, [eventId]);

    const startEdit = (q: Question) => {
        setEditingId(q.id);
        setEditData({ ...q });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            const res = await authFetch(`/api/admin/events/${eventId}/questions/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            const data = await res.json();
            if (data.success) {
                setEvent((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        questions: prev.questions.map((q) =>
                            q.id === editingId ? { ...q, ...editData } : q
                        ),
                    };
                });
                setEditingId(null);
                setEditData({});
            }
        } catch (e) {
            console.error("Save failed:", e);
        } finally {
            setSaving(false);
        }
    };

    const processEvent = async () => {
        if (!confirm("Process all questions? This will activate them and make them available for tests.")) return;
        setProcessing(true);
        try {
            const res = await authFetch(`/api/admin/events/${eventId}`, {
                method: "PATCH",
            });
            const data = await res.json();
            if (data.success) {
                fetchEvent();
            }
        } catch (e) {
            console.error("Process failed:", e);
        } finally {
            setProcessing(false);
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

    const statusColor = (s: string) => {
        switch (s) {
            case "DRAFT": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
            case "ACTIVE": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-24 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!event) {
        return <div className="text-center py-16 text-slate-500">Event not found.</div>;
    }

    const isPending = event.status === "PENDING";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <button onClick={() => router.push("/dashboard/admin/events")} className="text-sm text-blue-500 hover:text-blue-400 mb-2 inline-flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        Back to Events
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{event.fileName}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        {event.totalCount} questions • Uploaded by {event.uploadedBy.name} • {new Date(event.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${isPending ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                        {isPending ? "Yet to Process" : "Processed"}
                    </span>
                    {isPending && (
                        <button
                            onClick={processEvent}
                            disabled={processing}
                            className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm inline-flex items-center gap-2"
                        >
                            {processing ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                            Process All
                        </button>
                    )}
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">#</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Type</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs min-w-[250px]">Question Text</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Options</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Answer</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Subject</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Chapter</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Topic</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Difficulty</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Category</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Marks</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">-ve</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Year</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Status</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {event.questions.map((q, idx) => {
                                const isEditing = editingId === q.id;
                                return (
                                    <tr key={q.id} className={`${isEditing ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"} transition-colors`}>
                                        <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select value={editData.type} onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                                                    className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                                    <option value="MCQ">MCQ</option>
                                                    <option value="NUMERICAL">Numerical</option>
                                                    <option value="SUBJECTIVE">Subjective</option>
                                                    <option value="ASSERTION_REASON">A/R</option>
                                                </select>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{q.type}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <textarea value={editData.text} onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                                                    className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-w-[250px]" rows={2} />
                                            ) : (
                                                <p className="text-slate-800 dark:text-slate-200 max-w-xs truncate">{q.text}</p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px]">
                                            {q.options && Array.isArray(q.options) ? (
                                                <div className="space-y-0.5">
                                                    {(q.options as { id: string; text: string }[]).map((opt) => (
                                                        <div key={opt.id} className={`truncate ${q.correctAnswer === opt.id ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
                                                            {opt.id}. {opt.text}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input value={editData.correctAnswer || ""} onChange={(e) => setEditData({ ...editData, correctAnswer: e.target.value })}
                                                    className="w-16 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">{q.correctAnswer}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input value={editData.subject || ""} onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                                                    className="w-24 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="text-slate-600 dark:text-slate-400 text-xs">{q.subject || "—"}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input value={editData.chapter || ""} onChange={(e) => setEditData({ ...editData, chapter: e.target.value })}
                                                    className="w-24 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="text-slate-600 dark:text-slate-400 text-xs">{q.chapter || "—"}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input value={editData.topic || ""} onChange={(e) => setEditData({ ...editData, topic: e.target.value })}
                                                    className="w-24 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="text-slate-600 dark:text-slate-400 text-xs">{q.topic}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select value={editData.difficulty} onChange={(e) => setEditData({ ...editData, difficulty: e.target.value })}
                                                    className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                                    <option value="EASY">Easy</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HARD">Hard</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                    className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                                    <option value="CONCEPTUAL">Conceptual</option>
                                                    <option value="FACTUAL">Factual</option>
                                                    <option value="ANALYTICAL">Analytical</option>
                                                    <option value="APPLICATION">Application</option>
                                                    <option value="NUMERICAL">Numerical</option>
                                                    <option value="DIAGRAM_BASED">Diagram Based</option>
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryColor(q.category)}`}>{q.category}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <input type="number" value={editData.marks ?? 4} onChange={(e) => setEditData({ ...editData, marks: Number(e.target.value) })}
                                                    className="w-14 px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="text-slate-700 dark:text-slate-300">{q.marks}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <input type="number" value={editData.negativeMarks ?? 1} onChange={(e) => setEditData({ ...editData, negativeMarks: Number(e.target.value) })}
                                                    className="w-14 px-2 py-1 text-xs text-center rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="text-red-500 dark:text-red-400 text-xs">-{q.negativeMarks}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input type="number" value={editData.year ?? ""} onChange={(e) => setEditData({ ...editData, year: e.target.value ? Number(e.target.value) : null })}
                                                    className="w-16 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                            ) : (
                                                <span className="text-slate-500 text-xs">{q.year || "—"}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(q.status)}`}>{q.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {isEditing ? (
                                                <div className="flex items-center gap-1 justify-center">
                                                    <button onClick={saveEdit} disabled={saving}
                                                        className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 transition-colors disabled:opacity-50">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                    </button>
                                                    <button onClick={cancelEdit}
                                                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startEdit(q)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    title="Edit question">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
