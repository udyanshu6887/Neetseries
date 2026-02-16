import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-black p-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl mb-6">
        Master Your Exams with <span className="text-blue-600">mira.ai</span>
      </h1>
      <p className="max-w-xl text-lg text-slate-600 dark:text-slate-400 mb-8">
        AI-powered question bank, semantic search, and smart analytics for NEET aspirants.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button size="lg">Get Started</Button>
        </Link>
        <a href="/register">
          <Button size="lg" variant="outline">Create Account</Button>
        </a>
      </div>
    </div>
  );
}
