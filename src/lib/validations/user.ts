import { Role } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    mobile: z.string().optional().nullable(),
    role: z.nativeEnum(Role),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Za-z]/, "Password must include a letter")
        .regex(/[0-9]/, "Password must include a number"),
});

export const updateUserSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Valid email is required"),
    mobile: z.string().optional().nullable(),
    role: z.nativeEnum(Role),
});

export const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Za-z]/, "Password must include a letter")
        .regex(/[0-9]/, "Password must include a number"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
