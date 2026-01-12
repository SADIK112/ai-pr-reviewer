import { prisma } from "../lib/db/prisma";

async function main() {
    const user = await prisma.user.create({
        data: {
            githubId: 123456,
            username: "testuser",
            accessToken: "fake_token",
            repositories: {
                create: {
                    repoName: "ai-code-reviewer",
                    owner: "testuser",
                    webhookId: "12345",
                    isActive: false,
                    pullRequests: {
                        create: {
                            prNumber: 1,
                            title: "Initial PR",
                            author: "testuser",
                            status: "OPEN",
                            url: "https://github.com/testuser/repo/pull/1",
                            reviews: {
                                create: {
                                    reviewer: "code-review-bot",
                                    comments: "Nice",
                                    complexityScore: 7,
                                    totalSuggestions: 2,
                                    suggestions: {
                                        create: [
                                            {
                                                type: "PERFORMANCE",
                                                severity: "MEDIUM",
                                                filePath: "src/app.ts",
                                                lineNumber: 42,
                                                description: "Optimize loop",
                                                codeSnippet: "for (let i = 0; i < n; i++) {}",
                                                wasAccepted: "yes",
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    console.log("Seeded user:", user.username);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
