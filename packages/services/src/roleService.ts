// ──────────────────────────────────────
// Role Service — role checking and admin validation
// ──────────────────────────────────────

import { UserRole, JWTPayload } from "@mirai/types";
import { env } from "@mirai/config";

export function validateAdminCode(code: string): boolean {
    return code === env.ADMIN_CODE;
}

export function isAdmin(user: JWTPayload): boolean {
    return user.role === UserRole.ADMIN;
}

export function isTeacher(user: JWTPayload): boolean {
    return user.role === UserRole.TEACHER;
}

export function isStudent(user: JWTPayload): boolean {
    return user.role === UserRole.STUDENT;
}

export function hasRole(user: JWTPayload, allowedRoles: UserRole[]): boolean {
    return allowedRoles.includes(user.role);
}