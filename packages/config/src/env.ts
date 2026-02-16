// ──────────────────────────────────────
// Environment Variable Loader
// ──────────────────────────────────────

import dotenv from "dotenv";

// Load .env file from the project root
dotenv.config();

// Helper: get an env variable or throw if missing
function required(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

// Helper: get an env variable or return a default
function optional(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export const env = {
    // Database
    DATABASE_URL: required("DATABASE_URL"),

    // Auth
    JWT_SECRET: required("JWT_SECRET"),
    ADMIN_CODE: required("ADMIN_CODE"),

    // Email (optional in Phase-0, required later)
    SMTP_HOST: optional("SMTP_HOST", ""),
    SMTP_PORT: optional("SMTP_PORT", "587"),
    SMTP_USER: optional("SMTP_USER", ""),
    SMTP_PASS: optional("SMTP_PASS", ""),

    // App
    NODE_ENV: optional("NODE_ENV", "development"),
    PORT: optional("PORT", "3000"),
};