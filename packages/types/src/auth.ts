// ──────────────────────────────────────
// User Roles
// ──────────────────────────────────────

export enum UserRole {
    STUDENT = "STUDENT",
    TEACHER = "TEACHER",
    ADMIN = "ADMIN",
}

// ──────────────────────────────────────
// Auth Inputs (what the client sends)
// ──────────────────────────────────────

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    adminCode?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

// ──────────────────────────────────────
// Password Change (user knows old password)
// ──────────────────────────────────────

export interface ChangePasswordInput {
    oldPassword: string;
    newPassword: string;
}

// ──────────────────────────────────────
// Forgot Password (user doesn't know password)
// Step 1: User sends email → server sends reset link with token
// Step 2: User clicks link → sends token + new password
// ──────────────────────────────────────

export interface ForgotPasswordInput {
    email: string;
}

export interface ForgotPasswordResetInput {
    token: string;
    newPassword: string;
}

// ──────────────────────────────────────
// Auth Outputs (what the server returns)
// ──────────────────────────────────────
export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: UserRole;
    };
}

// ──────────────────────────────────────
// JWT Payload (what's stored inside the token)
// ──────────────────────────────────────
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}