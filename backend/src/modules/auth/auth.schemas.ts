import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema,
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  }),
});

export type LoginInput = z.infer<typeof loginSchema>['body'];
