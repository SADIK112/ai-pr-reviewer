import NextAuth, { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db/prisma";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GitHubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: {
                params: {
                    scope: 'repo admin:repo_hook',
                },
            },
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    name: profile.name || profile.login,
                    email: profile.email,
                    image: profile.avatar_url,
                    githubId: profile.id.toString(),
                    repoUrl: profile.repos_url,
                }
            },
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "database" },
    events: {
        async linkAccount({ user, account }) {
            console.log({ user, account })
            if (account.provider === "github") {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        githubId: account.providerAccountId,
                    }
                })
            }
        }
    },
    callbacks: {
        session: async ({ session, user }) => {
            if (session?.user) {
                session.user.id = user.id
            }
            return session
        },
    },
}

const handler = NextAuth(authOptions);

export {
    handler as GET,
    handler as POST
}