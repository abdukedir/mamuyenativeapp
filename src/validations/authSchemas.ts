import { z } from 'zod';

import type { UserRole } from '@/types/user';

export const userRoles = ['admin', 'member', 'manager', 'salesperson'] as const satisfies readonly UserRole[];

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254, 'Email is too long');

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or fewer')
  .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, and underscores only');

const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Full name must be at least 2 characters')
  .max(80, 'Full name must be 80 characters or fewer')
  .regex(/^[\p{L}\p{M}' .-]+$/u, 'Use a real name with letters only');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/\d/, 'Add at least one number')
  .regex(/[^A-Za-z0-9]/, 'Add at least one symbol');

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
    role: z.enum(userRoles),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Enter your password'),
});

export const forgotPasswordSchema = z.object({
  username: usernameSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
