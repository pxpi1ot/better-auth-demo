import { betterAuth, BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/actions/email";
import { openAPI } from "better-auth/plugins";
import { admin } from "better-auth/plugins";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 // Cache duration in seconds
        }
    },
    user: {
        additionalFields: {
            premium: {
                type: "boolean",
                required: false,
            },
        },
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ newEmail, url }) => {
                await sendEmail({
                    to: newEmail,
                    subject: 'Verify your email change',
                    text: `Click the link to verify: ${url}`
                })
            }
        }
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    plugins: [openAPI(), admin({
        impersonationSessionDuration: 60 * 60 * 24 * 7, // 7 days
    })], // api/auth/reference
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "重置你的密码",
                text: `点击此链接重置密码: ${url}`,
            });
        },
    },
    emailVerification: {
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, token }) => {
            const verificationUrl = `${process.env.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${process.env.EMAIL_VERIFICATION_CALLBACK_URL}`;
            await sendEmail({
                to: user.email,
                subject: "验证你的邮箱",
                text: `点击此链接验证你的邮箱: ${verificationUrl}`,
            });
        },
    }
} satisfies BetterAuthOptions);

export type Session = typeof auth.$Infer.Session;