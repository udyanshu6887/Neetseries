"use client";

import { useEffect, useState, useMemo } from "react";
import { authFetch } from "@/lib/auth";

interface TopicInfo {
    name: string;
    count: number;
    easy: number;
    medium: number;
    hard: number;
}

interface SubjectInfo {
    name: string;
    totalQuestions: number;
    topics: TopicInfo[];
}

interface Question {
    id: string;
    type: string;
    text: string;
    options: { id: string; text: string }[] | null;
    correctAnswer: string | null;
    topic: string;
    difficulty: string;
    marks: number;
    negativeMarks: number;
    subject?: string;
    chapter?: string;
    hint?: string;
    explanation?: string;
    year?: number;
    timeExpectedSec?: number;
    category: string;
    status: string;
}

type SortKey = "topic" | "difficulty" | "count";
type SortDir = "asc" | "desc";

export default function QuestionsPage() {
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const [search, setSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [topicSearch, setTopicSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("count");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState<Partial<Question>>({});
    const [saving, setSaving] = useState(false);

    // Load subjects
    useEffect(() => {
        authFetch("/api/questions/subjects")
            .then((r) => r.json())
            .then((d) => { if (d.success) setSubjects(d.data); })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    // Load questions when topic is selected
    useEffect(() => {
        if (!selectedSubject) { setQuestions([]); return; }
        // "All Subjects" — load all, optionally filtered by topic
        setIsLoadingQuestions(true);
        const params = new URLSearchParams();
        if (selectedSubject !== "__ALL__") {
            // TODO: API doesn't support subject filter; using topic as proxy
            if (selectedTopic) params.set("topic", selectedTopic);
        } else if (selectedTopic) {
            params.set("topic", selectedTopic);
        }
        if (difficultyFilter) params.set("difficulty", difficultyFilter);
        if (typeFilter) params.set("type", typeFilter);

        authFetch(`/api/questions?${params}`)
            .then((r) => r.json())
            .then((d) => { if (d.success) setQuestions(d.data); })
            .catch(console.error)
            .finally(() => setIsLoadingQuestions(false));
    }, [selectedTopic, selectedSubject, difficultyFilter, typeFilter]);

    const currentSubject = selectedSubject === "__ALL__"
        ? {
            name: "All Subjects",
            totalQuestions: subjects.reduce((s, sb) => s + sb.totalQuestions, 0),
            topics: subjects.flatMap((sb) => sb.topics),
        }
        : subjects.find((s) => s.name === selectedSubject);

    // Merge duplicate topics for "All Subjects"
    const mergedTopics = useMemo(() => {
        if (!currentSubject) return [];
        const map = new Map<string, TopicInfo>();
        for (const t of currentSubject.topics) {
            if (map.has(t.name)) {
                const existing = map.get(t.name)!;
                existing.count += t.count;
                existing.easy += t.easy;
                existing.medium += t.medium;
                existing.hard += t.hard;
            } else {
                map.set(t.name, { ...t });
            }
        }
        return Array.from(map.values());
    }, [currentSubject]);

    // Filter and sort topics
    const filteredTopics = useMemo(() => {
        let topics = [...mergedTopics];
        if (topicSearch) {
            const q = topicSearch.toLowerCase();
            topics = topics.filter((t) => t.name.toLowerCase().includes(q));
        }
        topics.sort((a, b) => {
            const av = sortKey === "topic" ? a.name : sortKey === "difficulty" ? (a.hard * 3 + a.medium * 2 + a.easy) : a.count;
            const bv = sortKey === "topic" ? b.name : sortKey === "difficulty" ? (b.hard * 3 + b.medium * 2 + b.easy) : b.count;
            if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
        return topics;
    }, [mergedTopics, topicSearch, sortKey, sortDir]);

    // Filter questions by search
    const filteredQuestions = useMemo(() => {
        if (!search) return questions;
        const q = search.toLowerCase();
        return questions.filter((qu) => qu.text.toLowerCase().includes(q) || qu.topic.toLowerCase().includes(q));
    }, [questions, search]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("desc"); }
    };

    const startEdit = (q: Question) => { setEditingId(q.id); setEditData({ ...q }); };
    const cancelEdit = () => { setEditingId(null); setEditData({}); };

    const saveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        try {
            const res = await authFetch(`/api/questions/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editData),
            });
            const data = await res.json();
            if (data.success) {
                setQuestions((prev) => prev.map((q) => q.id === editingId ? { ...q, ...editData } : q));
                setEditingId(null);
                setEditData({});
            }
        } catch (e) {
            console.error("Save failed:", e);
        } finally {
            setSaving(false);
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

    const SortIcon = ({ active, dir }: { active: boolean; dir: SortDir }) => (
        <svg className={`w-3 h-3 inline ml-1 ${active ? "text-blue-500" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
        </svg>
    );

    // ── SUBJECT GRID (no subject selected) ──
    if (!selectedSubject) {
        const totalQuestions = subjects.reduce((s, sb) => s + sb.totalQuestions, 0);
        const totalTopics = subjects.reduce((s, sb) => s + sb.topics.length, 0);
        const totalEasy = subjects.reduce((s, sb) => s + sb.topics.reduce((ss, t) => ss + t.easy, 0), 0);
        const totalMed = subjects.reduce((s, sb) => s + sb.topics.reduce((ss, t) => ss + t.medium, 0), 0);
        const totalHard = subjects.reduce((s, sb) => s + sb.topics.reduce((ss, t) => ss + t.hard, 0), 0);

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Questions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Browse question bank by subject</p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-36 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />)}
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">No questions yet</p>
                        <p className="text-sm text-slate-400 mt-1">Upload and process questions from the Upload Events page.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* All Subjects Card */}
                        <button
                            onClick={() => { setSelectedSubject("__ALL__"); setSelectedTopic(null); }}
                            className="text-left p-5 bg-gradient-to-br from-blue-600 to-violet-600 rounded-xl border border-blue-500 hover:shadow-lg hover:shadow-blue-500/20 transition-all group col-span-full sm:col-span-1"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-lg text-white">All Subjects</h3>
                                    <p className="text-xs text-blue-100 mt-1">{subjects.length} subjects • {totalTopics} topics • {totalQuestions} questions</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/20 text-white group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">{totalEasy} Easy</span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">{totalMed} Medium</span>
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white">{totalHard} Hard</span>
                            </div>
                        </button>

                        {/* Individual Subject Cards */}
                        {subjects.map((subj) => {
                            const easyTotal = subj.topics.reduce((s, t) => s + t.easy, 0);
                            const medTotal = subj.topics.reduce((s, t) => s + t.medium, 0);
                            const hardTotal = subj.topics.reduce((s, t) => s + t.hard, 0);
                            return (
                                <button
                                    key={subj.name}
                                    onClick={() => setSelectedSubject(subj.name)}
                                    className="text-left p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{subj.name}</h3>
                                            <p className="text-xs text-slate-400 mt-1">{subj.topics.length} topics • {subj.totalQuestions} questions</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">{easyTotal} Easy</span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">{medTotal} Medium</span>
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{hardTotal} Hard</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    // ── TOPIC LIST (subject selected, no topic) ──
    if (!selectedTopic) {
        const isAll = selectedSubject === "__ALL__";
        return (
            <div className="space-y-6">
                <div>
                    <button onClick={() => { setSelectedSubject(null); setTopicSearch(""); }} className="text-sm text-blue-500 hover:text-blue-400 inline-flex items-center gap-1 mb-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        All Subjects
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{isAll ? "All Subjects" : selectedSubject}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{currentSubject?.totalQuestions} questions across {mergedTopics.length} topics</p>
                </div>

                {/* Search + Sort */}
                <div className="flex gap-3 flex-wrap items-center">
                    <div className="relative flex-1 min-w-[200px] max-w-md">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input type="text" placeholder="Search topics..." value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-400 mr-1">Sort:</span>
                        <button onClick={() => toggleSort("topic")} className={`px-2 py-1 rounded ${sortKey === "topic" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                            Name <SortIcon active={sortKey === "topic"} dir={sortDir} />
                        </button>
                        <button onClick={() => toggleSort("count")} className={`px-2 py-1 rounded ${sortKey === "count" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                            Count <SortIcon active={sortKey === "count"} dir={sortDir} />
                        </button>
                        <button onClick={() => toggleSort("difficulty")} className={`px-2 py-1 rounded ${sortKey === "difficulty" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
                            Difficulty <SortIcon active={sortKey === "difficulty"} dir={sortDir} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {filteredTopics.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">No topics match your search.</div>
                    ) : (
                        filteredTopics.map((topic) => (
                            <button
                                key={topic.name}
                                onClick={() => setSelectedTopic(topic.name)}
                                className="w-full text-left px-5 py-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <span className="font-medium text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{topic.name}</span>
                                        <span className="text-xs text-slate-400">{topic.count} questions</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {topic.easy > 0 && <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">{topic.easy}</span>}
                                        {topic.medium > 0 && <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">{topic.medium}</span>}
                                        {topic.hard > 0 && <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">{topic.hard}</span>}
                                        <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // ── QUESTIONS TABLE (topic selected) — with inline editing ──
    const isAll = selectedSubject === "__ALL__";
    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div>
                <div className="flex items-center gap-2 text-sm mb-2">
                    <button onClick={() => { setSelectedSubject(null); setSelectedTopic(null); }} className="text-blue-500 hover:text-blue-400">All Subjects</button>
                    <span className="text-slate-400">›</span>
                    <button onClick={() => setSelectedTopic(null)} className="text-blue-500 hover:text-blue-400">{isAll ? "All Subjects" : selectedSubject}</button>
                    <span className="text-slate-400">›</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{selectedTopic}</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedTopic}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{filteredQuestions.length} questions</p>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input type="text" placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                </div>
                <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <option value="">All Difficulties</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                </select>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="NUMERICAL">Numerical</option>
                    <option value="SUBJECTIVE">Subjective</option>
                </select>
            </div>

            {/* Table with inline editing */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {isLoadingQuestions ? (
                    <div className="p-8 space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />)}
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">No questions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs min-w-[250px]">Question</th>
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
                                    <th className="text-center px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredQuestions.map((q, idx) => {
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
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColor(q.type)}`}>{q.type}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {isEditing ? (
                                                    <textarea value={editData.text} onChange={(e) => setEditData({ ...editData, text: e.target.value })}
                                                        className="w-full px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 min-w-[250px]" rows={2} />
                                                ) : (
                                                    <div className="max-w-xs">
                                                        <p className="text-slate-800 dark:text-slate-200 font-medium truncate">{q.text}</p>
                                                    </div>
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
                                                    <input type="number" value={editData.year ?? ""} onChange={(e) => setEditData({ ...editData, year: e.target.value ? Number(e.target.value) : undefined })}
                                                        className="w-16 px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200" />
                                                ) : (
                                                    <span className="text-slate-500 text-xs">{q.year || "—"}</span>
                                                )}
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
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Edit">
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
                )}
            </div>
        </div>
    );
}
