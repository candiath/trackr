import z from 'zod';

export const passwordSchema = z
    .string()
    .min(3, 'Password is too chiquita')
    .max(22, 'Password is larga como esta');