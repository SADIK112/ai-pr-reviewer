import { SuggestionReviewState } from "@/types";
import prisma from "./prisma"

export const getDashboardStats = async (userId: string) => {
    try {
        // Get user's repositories
        const repositories = await prisma.repository.findMany({
            where: { userId },
            select: { repoId: true }
        });

        const repoIds = repositories.map(r => r.repoId);

        if (repoIds.length === 0) {
            return getEmptyStats();
        }

        // Get date ranges
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Parallel queries for better performance
        const [
            totalPRsReviewed,
            prsReviewedThisWeek,
            totalSuggestions,
            acceptedSuggestions,
            acceptedSuggestionsLastMonth,
            totalSuggestionsLastMonth,
            criticalIssues,
            issuesByType,
            issuesBySeverity,
            recentReviews
        ] = await Promise.all([
            // total PRs reviwed
            prisma.pullRequest.count({
                where: {
                    repositoryId: { in: repoIds },
                    reviews: { some: {} }
                }
            }),
            // PRs reviewed this week
            prisma.pullRequest.count({
                where: {
                    repositoryId: { in: repoIds },
                    reviews: {
                        some: {
                            createdAt: { gte: oneWeekAgo }
                        }
                    },
                }
            }),
            // Total suggestions
            prisma.suggestion.count({
                where: {
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                }
            }),
            // Accepted suggestions (all time)
            prisma.suggestion.count({
                where: {
                    state: SuggestionReviewState.ACCEPTED,
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                }
            }),
            // Accepted suggestions (last month)
            prisma.suggestion.count({
                where: {
                    state: SuggestionReviewState.ACCEPTED,
                    createdAt: { gte: oneMonthAgo },
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                }
            }),
            // Total suggestions (last month)
            prisma.suggestion.count({
                where: {
                    createdAt: { gte: oneMonthAgo },
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                }
            }),
            // Critical issues
            prisma.suggestion.count({
                where: {
                    severity: { in: ['CRITICAL', 'HIGH'] },
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                }
            }),
            // Issues by type
            prisma.suggestion.groupBy({
                by: ['type'],
                where: {
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                },
                _count: { type: true }
            }),
            // Issues by severity
            prisma.suggestion.groupBy({
                by: ['severity'],
                where: {
                    review: {
                        pullRequest: {
                            repositoryId: { in: repoIds }
                        }
                    }
                },
                _count: { severity: true }
            }),
            // Recent reviews
            prisma.review.findMany({
                where: {
                    pullRequest: {
                        repositoryId: { in: repoIds }
                    }
                },
                include: {
                    pullRequest: {
                        include: {
                            repository: {
                                select: { name: true, owner: true }
                            }
                        }
                    },
                    suggestions: {
                        select: {
                            id: true,
                            state: true,
                            severity: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);
        // Calculate percentages
        const acceptanceRate = totalSuggestions > 0
            ? Math.round((acceptedSuggestions / totalSuggestions) * 100)
            : 0;
        const acceptanceLastMonth = totalSuggestionsLastMonth > 0
            ? Math.round(acceptedSuggestionsLastMonth / totalSuggestionsLastMonth)
            : 0;
        const acceptanceRateChange = acceptanceRate - acceptanceLastMonth;
        // Format issue distribution
        const issueDistribution = issuesByType.map(item => ({
            type: item.type,
            count: item._count.type
        }));
        // Format severity distribution
        const severityDistribution = issuesBySeverity.map(item => ({
            severity: item.severity,
            count: item._count.severity
        }));
        //Format recent reviews
        const formattedRecentReviews = recentReviews.map(review => {
            const acceptedCount =
                review.suggestions.filter(s => s.state === SuggestionReviewState.ACCEPTED).length;
            const totalCount = review.suggestions.length;
            const higestSeverity = getHighestSeverity(review.suggestions.map(s => s.severity));
            const status = review.pullRequest.state;

            return {
                id: review.id,
                prNumber: review.pullRequest.prNumber,
                title: review.pullRequest.title,
                repository: `${review.pullRequest.repository.owner}/${review.pullRequest.repository.name}`,
                createdAt: review.createdAt,
                acceptedCount,
                totalCount,
                acceptanceRate: totalCount > 0 ? Math.round((acceptedCount / totalCount) * 100) : 0,
                severity: higestSeverity,
                status,
                url: review.pullRequest.url,
            }
        });

        return {
            stats: {
                prsReviewed: {
                    total: totalPRsReviewed,
                    thisWeek: prsReviewedThisWeek,
                    change: prsReviewedThisWeek
                },
                suggestionAccepted: {
                    total: acceptedSuggestions,
                    rate: acceptanceRate,
                    change: acceptanceRateChange
                },
                issuesDetected: {
                    total: totalSuggestions,
                    critical: criticalIssues,
                },
            },
            issueDistribution,
            severityDistribution,
            recentReviews: formattedRecentReviews
        };
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
}

/**
 * Get empty stats structure
 * @returns 
 */
const getEmptyStats = () => {
    return {
        stats: {
            prsReviewed: { total: 0, thisWeek: 0, change: 0 },
            suggestionAccepted: { total: 0, rate: 0, change: 0 },
            issuesDetected: { total: 0, critical: 0 },
        },
        issueDistribution: [],
        severityDistribution: [],
        recentReviews: []
    }
}

/**
 * Get highest severity from list
 * @param severities 
 * @returns 
 */
const getHighestSeverity = (severities: string[]): string => {
    const order = [
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW',
    ];
    for (const level of order) {
        if (severities.includes(level)) {
            return level.toLowerCase();
        }
    };
    return 'low';
}

/**
 * Get review timeline data for charts
 * @param userId 
 * @param days 
 * @returns 
 */
export const getReviewTimeline = async (userId: string, days: number = 30) => {
    try {
        const repositories = await prisma.repository.findMany({
            where: { userId },
            select: { repoId: true }
        });

        const repoIds = repositories.map(r => r.repoId);

        if (repoIds.length === 0) return [];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const reviews = await prisma.review.findMany({
            where: {
                pullRequest: {
                    repositoryId: { in: repoIds }
                },
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                totalSuggestions: true,
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date
        const grouped = reviews.reduce((acc, review) => {
            const date = review.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = { date, count: 0, suggestions: 0 };
            };
            acc[date].count += 1;
            acc[date].suggestions += review.totalSuggestions;
            return acc;
        }, {} as Record<string, { date: string, count: number, suggestions: number }>);

        return Object.values(grouped);
    } catch (error) {
        console.error('[Dashboard] Error fetching timeline:', error);
        throw error;
    }
}

/**
 * Get repository statistics
 * @param userId 
 * @returns 
 */
export const getRepositoryStats = async (userId: string) => {
    try {
        const repositories = await prisma.repository.findMany({
            where: { userId },
            include: {
                pullRequests: {
                    include: {
                        reviews: {
                            include: {
                                suggestions: true
                            }
                        }
                    }
                }
            }
        });

        return repositories.map(repo => {
            const totalPRs = repo.pullRequests.length;
            const totalReviews = repo.pullRequests.reduce((sum, pr) => sum + pr.reviews.length, 0);
            const totalSuggestions = repo.pullRequests.reduce((sum, pr) =>
                sum + pr.reviews.reduce((s, r) => s + r.totalSuggestions, 0), 0
            );
            const criticalIssues = repo.pullRequests.reduce((sum, pr) =>
                sum + pr.reviews.reduce((s, r) =>
                    s + r.suggestions.filter(sg => sg.severity === 'CRITICAL' || sg.severity === 'HIGH').length, 0
                ), 0
            );

            return {
                id: repo.id,
                name: repo.name,
                owner: repo.owner,
                fullName: repo.fullName,
                isActive: repo.isActive,
                totalPRs,
                totalReviews,
                totalSuggestions,
                criticalIssues,
                lastReviewed: repo.lastReviewed
            }
        })
    } catch (error) {
        console.error('[Dashboard] Error fetching repository stats:', error);
        throw error;
    }
}