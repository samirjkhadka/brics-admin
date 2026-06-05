"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireRole } from "@/lib/auth/session";
import {
    createUserSchema,
    updateUserSchema,
    resetPasswordSchema,
} from "@/lib/validations/user";

async function countSuperAdmins(excludeId?: string) {
    return db.user.count({
        where: {
            role: Role.SUPERADMIN,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
    });
}

export async function listUsers() {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const users = await db.user.findMany({
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                createdAt: true,
            },
        });
        return { success: true, data: users };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to list users";
        return { success: false, error: message };
    }
}

export async function createUser(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = createUserSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

        const user = await db.user.create({
            data: {
                name: parsed.data.name,
                email: parsed.data.email,
                mobile: parsed.data.mobile || null,
                role: parsed.data.role,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
            },
        });

        revalidatePath("/dashboard/users");
        return { success: true, data: user };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create user";
        return { success: false, error: message };
    }
}

export async function updateUser(id: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = updateUserSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const existing = await db.user.findUnique({ where: { id } });
        if (!existing) {
            return { success: false, error: "User not found" };
        }

        if (existing.role === Role.SUPERADMIN && parsed.data.role !== Role.SUPERADMIN) {
            const otherSuperAdmins = await countSuperAdmins(id);
            if (otherSuperAdmins === 0) {
                return { success: false, error: "Cannot demote the last SUPERADMIN" };
            }
        }

        const user = await db.user.update({
            where: { id },
            data: {
                name: parsed.data.name,
                email: parsed.data.email,
                mobile: parsed.data.mobile || null,
                role: parsed.data.role,
            },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
            },
        });

        revalidatePath("/dashboard/users");
        revalidatePath(`/dashboard/users/${id}/edit`);
        return { success: true, data: user };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to update user";
        return { success: false, error: message };
    }
}

export async function resetUserPassword(id: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = resetPasswordSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const hashedPassword = await bcrypt.hash(parsed.data.password, 10);

        await db.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        revalidatePath(`/dashboard/users/${id}/edit`);
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to reset password";
        return { success: false, error: message };
    }
}

export async function deleteUser(id: string) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    if (auth.session.user.id === id) {
        return { success: false, error: "Cannot delete your own account" };
    }

    try {
        const existing = await db.user.findUnique({ where: { id } });
        if (!existing) {
            return { success: false, error: "User not found" };
        }

        if (existing.role === Role.SUPERADMIN) {
            const otherSuperAdmins = await countSuperAdmins(id);
            if (otherSuperAdmins === 0) {
                return { success: false, error: "Cannot delete the last SUPERADMIN" };
            }
        }

        await db.user.delete({ where: { id } });
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to delete user";
        return { success: false, error: message };
    }
}

export async function getUserById(id: string) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const user = await db.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                role: true,
                createdAt: true,
            },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        return { success: true, data: user };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to fetch user";
        return { success: false, error: message };
    }
}
