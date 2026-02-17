"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/admin/DataTable";
import { authFetch } from "@/lib/auth";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    verified: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        authFetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setUsers(data.data);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, []);

    const roleColor = (role: string) => {
        switch (role) {
            case "ADMIN": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
            case "TEACHER": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
            case "STUDENT": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    const roleCounts = {
        ADMIN: users.filter((u) => u.role === "ADMIN").length,
        TEACHER: users.filter((u) => u.role === "TEACHER").length,
        STUDENT: users.filter((u) => u.role === "STUDENT").length,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Users</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">{users.length} registered users</p>
            </div>

            {!isLoading && users.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{roleCounts.STUDENT} Students</span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{roleCounts.TEACHER} Teachers</span>
                    <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{roleCounts.ADMIN} Admins</span>
                </div>
            )}

            <DataTable<User>
                keyExtractor={(u) => u.id}
                isLoading={isLoading}
                emptyMessage="No users registered yet."
                data={users}
                columns={[
                    {
                        key: "name", header: "Name", render: (u) => (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</div>
                                <span className="font-medium text-slate-900 dark:text-white">{u.name}</span>
                            </div>
                        )
                    },
                    { key: "email", header: "Email" },
                    { key: "role", header: "Role", render: (u) => <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColor(u.role)}`}>{u.role}</span> },
                    {
                        key: "verified", header: "Verified", render: (u) => (
                            u.verified
                                ? <span className="text-emerald-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                                : <span className="text-slate-300 dark:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                        )
                    },
                    {
                        key: "createdAt", header: "Joined", render: (u) => (
                            <span className="text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        )
                    },
                ]}
            />
        </div>
    );
}
