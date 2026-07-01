import zod from 'zod';

export const envSchema = zod.object({
    DATABASE_URL: zod.string().url(),
    AUTH_JWT_SECRET: zod.string().optional(),
    AUTH_PASSWORD_HASH: zod.string().regex(/^[0-9a-f]+:[0-9a-f]+$/).optional(),
    CORS_ORIGIN: zod.string().optional(),
    PORT: zod.coerce.number().default(3000),
    COOKIE_SECURE: zod.coerce.boolean().default(true),
    NODE_ENV: zod.enum(['development', 'production', 'test']).nonoptional(),
    DISCORD_WEBHOOK_URL: zod.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // console.error('❌ Invalid environment variables:', parsed.error.format());
    console.error('❌ Invalid environment variables:', zod.prettifyError(parsed.error));
    process.exit(1);
}
export const env = parsed.data;