"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuthUser, clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const homeItems: NavItem[] = [
    {
        label: "Home",
        href: "/dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
];

const adminItems: NavItem[] = [
    {
        label: "Overview",
        href: "/dashboard/admin",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm10 0a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
            </svg>
        ),
    },
    {
        label: "Upload Events",
        href: "/dashboard/admin/events",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
        ),
    },
    {
        label: "Questions",
        href: "/dashboard/admin/questions",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        label: "Tests",
        href: "/dashboard/admin/tests",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
    },
    {
        label: "Users",
        href: "/dashboard/admin/users",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
    },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
    const pathname = usePathname();
    const isActive = item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname === item.href || pathname.startsWith(item.href + "/");

    return (
        <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                    ? "bg-blue-600/20 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                } ${collapsed ? "justify-center" : ""}`}
            title={collapsed ? item.label : undefined}
        >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
        </Link>
    );
}

export function DashboardSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [user, setUser] = useState<{ name: string; role: string } | null>(null);
    const [adminOpen, setAdminOpen] = useState(false);

    useEffect(() => {
        const u = getAuthUser();
        if (u) setUser(u);
    }, []);

    // Auto-expand admin section if on an admin page
    useEffect(() => {
        if (pathname.startsWith("/dashboard/admin")) {
            setAdminOpen(true);
        }
    }, [pathname]);

    const isAdmin = user?.role === "ADMIN";

    const handleLogout = () => {
        clearAuth();
        router.push("/login");
    };

    return (
        <aside
            className={`${collapsed ? "w-16" : "w-64"} flex flex-col bg-slate-900 text-white transition-all duration-300 ease-in-out min-h-screen shrink-0`}
        >
            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700/50">
                {!collapsed && (
                    <Link href="/dashboard" className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-sm font-bold">
                            P
                        </div>
                        <span className="text-lg font-semibold tracking-tight">Padh.ai</span>
                    </Link>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {collapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Main nav */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {homeItems.map((item) => (
                    <NavLink key={item.href} item={item} collapsed={collapsed} />
                ))}

                {/* Admin dropdown section */}
                {isAdmin && (
                    <>
                        {collapsed ? (
                            <>
                                <div className="my-3 mx-2 border-t border-slate-700/50" />
                                {adminItems.map((item) => (
                                    <NavLink key={item.href} item={item} collapsed={collapsed} />
                                ))}
                            </>
                        ) : (
                            <div className="pt-4">
                                <button
                                    onClick={() => setAdminOpen(!adminOpen)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    <span>Admin Configurations</span>
                                    <svg
                                        className={`w-3.5 h-3.5 transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <div className={`space-y-1 overflow-hidden transition-all duration-200 ${adminOpen ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                                    {adminItems.map((item) => (
                                        <NavLink key={item.href} item={item} collapsed={collapsed} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </nav>

            {/* User & Logout */}
            <div className="px-2 py-4 border-t border-slate-700/50 space-y-1">
                {!collapsed && user && (
                    <div className="px-3 py-2 mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-xs font-bold">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-400">{user.role}</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all ${collapsed ? "justify-center" : ""}`}
                    title={collapsed ? "Logout" : undefined}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {!collapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
}
