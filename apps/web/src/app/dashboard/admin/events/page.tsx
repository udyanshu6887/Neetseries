"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getAuthToken } from "@/lib/auth";

interface UploadEvent {
    id: string;
    fileName: string;
    status: string;
    totalCount: number;
    uploadedAt: string;
    processedAt: string | null;
    uploadedBy: { name: string };
}

export default function EventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<UploadEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);

    const fetchEvents = () => {
        setIsLoading(true);
        authFetch("/api/admin/events")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setEvents(data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    };

    useEffect(() => { fetchEvents(); }, []);

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
                const count = data.data?.count ?? 0;
                const eventId = data.data?.eventId;
                if (count === 0) {
                    setUploadStatus("0 questions parsed — check column headers");
                } else if (eventId) {
                    setUploadStatus(`Uploaded ${count} questions! Redirecting...`);
                    setTimeout(() => router.push(`/dashboard/admin/events/${eventId}`), 600);
                } else {
                    setUploadStatus(`Uploaded ${count} questions!`);
                    fetchEvents();
                }
            } else {
                setUploadStatus(`Error: ${data.error?.message || "Upload failed"}`);
            }
        } catch {
            setUploadStatus("Upload failed");
        }

        setTimeout(() => setUploadStatus(null), 5000);
        e.target.value = "";
    };

    const statusBadge = (status: string) => {
        if (status === "PENDING") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
        if (status === "PROCESSED") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
        return "bg-slate-100 text-slate-600";
    };

    return (
        <div className="space-y-6">
            {/* Header with Upload Button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Events</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Upload question files and manage batches before processing.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {uploadStatus && (
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 animate-pulse">{uploadStatus}</span>
                    )}
                    <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload File
                        <input type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} className="hidden" />
                    </label>
                </div>
            </div>

            {/* Events List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No uploads yet</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Click &ldquo;Upload File&rdquo; to upload a CSV or Excel file.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {events.map((event) => (
                        <button
                            key={event.id}
                            onClick={() => router.push(`/dashboard/admin/events/${event.id}`)}
                            className="w-full text-left p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{event.fileName}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {event.totalCount} questions • Uploaded by {event.uploadedBy.name} • {new Date(event.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(event.status)}`}>
                                        {event.status === "PENDING" ? "Yet to Process" : "Processed"}
                                    </span>
                                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
