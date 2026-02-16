import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Form */}
            <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white dark:bg-black">
                <div className="w-full max-w-sm space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Welcome back
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <LoginForm />
                </div>
            </div>

            {/* Right Side - Decorative */}
            <div className="relative hidden lg:block bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-violet-600" />
                <div className="absolute inset-0 flex items-center justify-center p-12 text-white">
                    <div className="max-w-md space-y-6 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mb-4">
                            {/* Icon placeholder */}
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold">mir.ai</h2>
                        <p className="text-blue-100 text-lg">
                            AI-powered learning platform. Upload your questions, get semantic search, and master your subjects.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
