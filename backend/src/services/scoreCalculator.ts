import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function calculateContentScore(contentId: string) {
    // Get all votes for this content
    // We need to fetch all votes to calculate the score accurately based on the formula
    const votes = await prisma.vote.findMany({
        where: { contentId }
    });

    // Count upvotes and downvotes
    const upvotes = votes.filter(v => v.voteType === 'upvote').length;
    const superUpvotes = votes.filter(v => v.voteType === 'super_upvote').length;
    const downvotes = votes.filter(v => v.voteType === 'downvote').length;

    // Get content for view count
    const content = await prisma.content.findUnique({
        where: { id: contentId }
    });

    if (!content) return 0;

    // Score formula: (Upvotes - Downvotes/3) + (Views / 100 × 0.1)
    // Updated for Super Upvote: netLikes = upvotes + (superUpvotes * 10) - (downvotes / 3)
    const netLikes = upvotes + (superUpvotes * 10) - (downvotes / 3);

    // Handle case where viewCount might be null
    const viewCount = content.viewCount || 0;
    const viewScore = (viewCount / 100) * 0.1;

    const rawScore = netLikes + viewScore;

    // Keep 2 decimal places
    const score = Math.round(rawScore * 100) / 100;

    // Update content score in database
    await prisma.content.update({
        where: { id: contentId },
        data: { score }
    });

    // Shadow archive if score is too low
    if (score < -10) {
        // Force type casting if needed, but updated client should handle it
        await prisma.content.update({
            where: { id: contentId },
            data: { isArchived: true } as any
        });
    } else if (score >= 0) {
        // Check if content is archived (using 'any' cast to avoid TS issues if types aren't fully reloaded yet)
        if ((content as any).isArchived) {
            await prisma.content.update({
                where: { id: contentId },
                data: { isArchived: false } as any
            });
        }
    }

    return score;
}
