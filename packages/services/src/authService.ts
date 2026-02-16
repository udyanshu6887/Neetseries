// ──────────────────────────────────────
// Auth Service — handles registration, login, JWT
// ──────────────────────────────────────

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@mirai/db";
import { env } from "@mirai/config";
import {
    UserRole,
    RegisterInput,
    LoginInput,
    AuthResponse,
    JWTPayload,
} from "@mirai/types";

const SALT_ROUNDS = 10;

// ──────────────────────────────────────
// Register a new user
// ──────────────────────────────────────

export async function register(input: RegisterInput): Promise<AuthResponse> {
    // 1. Check if email already exists
    const existing = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (existing) {
        throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // 2. If registering as ADMIN, validate admin code
    if (input.role === UserRole.ADMIN) {
        if (!input.adminCode || input.adminCode !== env.ADMIN_CODE) {
            throw new Error("INVALID_ADMIN_CODE");
        }
    }

    // 3. Hash the password
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // 4. Create user in database
    const user = await prisma.user.create({
        data: {
            email: input.email,
            passwordHash,
            name: input.name,
            role: input.role,
        },
    });

    // 5. Generate JWT token
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
        },
    };
}

// ──────────────────────────────────────
// Login
// ──────────────────────────────────────

export async function login(input: LoginInput): Promise<AuthResponse> {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    // 2. Compare password with stored hash
    const isValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    // 3. Generate JWT token
    const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
        },
    };
}

// ──────────────────────────────────────
// JWT Helpers
// ──────────────────────────────────────

export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): JWTPayload {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}