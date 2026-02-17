interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: "blue" | "violet" | "emerald" | "amber";
    subtitle?: string;
}

const colorMap = {
    blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        icon: "bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400",
        text: "text-blue-600 dark:text-blue-400",
    },
    violet: {
        bg: "bg-violet-50 dark:bg-violet-900/20",
        icon: "bg-violet-100 dark:bg-violet-800/40 text-violet-600 dark:text-violet-400",
        text: "text-violet-600 dark:text-violet-400",
    },
    emerald: {
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        icon: "bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
        bg: "bg-amber-50 dark:bg-amber-900/20",
        icon: "bg-amber-100 dark:bg-amber-800/40 text-amber-600 dark:text-amber-400",
        text: "text-amber-600 dark:text-amber-400",
    },
};

export function StatCard({ label, value, icon, color, subtitle }: StatCardProps) {
    const c = colorMap[color];

    return (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                    {subtitle && (
                        <p className={`text-xs font-medium ${c.text}`}>{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${c.icon}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
