import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white dark:bg-black">
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Create your account
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Get started with mir.ai in seconds
                        </p>
                    </div>

                    <RegisterForm />
                </div>
            </div>

            {/* Right Side - Decorative */}
            <div className="relative hidden lg:block bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center p-12 text-white">
                    <div className="max-w-md space-y-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold">Join mir.ai</h2>
                        <p className="text-violet-100 text-lg">
                            Create your free account to start uploading questions, searching with AI, and tracking your progress.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
