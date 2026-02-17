interface Column<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    isLoading?: boolean;
    emptyMessage?: string;
    keyExtractor: (row: T) => string;
}

export function DataTable<T>({ columns, data, isLoading, emptyMessage = "No data found", keyExtractor }: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="animate-pulse p-6 space-y-4">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`text-left px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${col.className || ""}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {data.map((row) => (
                            <tr key={keyExtractor(row)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                {columns.map((col) => (
                                    <td key={col.key} className={`px-6 py-4 text-sm text-slate-700 dark:text-slate-300 ${col.className || ""}`}>
                                        {col.render
                                            ? col.render(row)
                                            : String((row as Record<string, unknown>)[col.key] ?? "")}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
