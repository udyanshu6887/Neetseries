"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "STUDENT" as "STUDENT" | "ADMIN",
        adminCode: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    ...(formData.role === "ADMIN" && { adminCode: formData.adminCode }),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || "Registration failed");
            }

            // Success — redirect to dashboard
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
                <Input
                    id="name"
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                />
                <Input
                    id="email"
                    label="Email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                />
                <Input
                    id="password"
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                />
                <Input
                    id="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                />

                {/* Role selector */}
                <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                        I am a
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: "STUDENT" })}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${formData.role === "STUDENT"
                                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300"
                                }`}
                            disabled={isLoading}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, role: "ADMIN" })}
                            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${formData.role === "ADMIN"
                                    ? "bg-violet-600 text-white border-violet-600 shadow-md"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-300"
                                }`}
                            disabled={isLoading}
                        >
                            Admin
                        </button>
                    </div>
                </div>

                {/* Admin code (conditional) */}
                {formData.role === "ADMIN" && (
                    <Input
                        id="adminCode"
                        label="Admin Code"
                        type="password"
                        placeholder="Enter admin registration code"
                        value={formData.adminCode}
                        onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                        required
                        disabled={isLoading}
                    />
                )}
            </div>

            {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
                    {error}
                </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
                Create Account
            </Button>

            <div className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <a href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                    Sign in
                </a>
            </div>
        </form>
    );
}
