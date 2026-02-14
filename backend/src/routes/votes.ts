import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateContentScore } from '../services/scoreCalculator';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/votes - Add or update vote
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const { contentId, voteType } = req.body; // voteType: 'upvote', 'downvote', or 'super_upvote'
        const userId = req.userId!;

        // Check if content exists and get owner
        const content = await prisma.content.findUnique({
            where: { id: contentId }
        });

        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        // Prevent voting on own content
        if (content.userId === userId) {
            return res.status(403).json({ error: 'You cannot vote on your own content' });
        }

        // Handle super upvote logic
        if (voteType === 'super_upvote') {
            const user = await prisma.user.findUnique({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Check if already used today
            const now = new Date();
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);

            const lastUse = user.lastSuperUpvoteDate ? new Date(user.lastSuperUpvoteDate) : null;

            if (lastUse && lastUse >= startOfDay) {
                return res.status(400).json({ error: 'Super upvote already used today' });
            }

            // Mark as used
            await prisma.user.update({
                where: { id: userId },
                data: {
                    superUpvoteUsedToday: true,
                    lastSuperUpvoteDate: new Date()
                }
            });
        }

        // Check if vote exists
        const existingVote = await prisma.vote.findUnique({
            where: {
                userId_contentId: { userId, contentId }
            }
        });

        // Protect super upvote - it cannot be changed or removed
        if (existingVote?.voteType === 'super_upvote') {
            return res.status(400).json({
                error: 'Super upvote is permanent and cannot be changed or removed'
            });
        }

        if (existingVote) {
            // Update vote
            const updated = await prisma.vote.update({
                where: { id: existingVote.id },
                data: { voteType }
            });
            await calculateContentScore(contentId);
            res.json(updated);
        } else {
            // Create new vote
            const vote = await prisma.vote.create({
                data: { userId, contentId, voteType }
            });
            await calculateContentScore(contentId);
            res.json(vote);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to vote' });
    }
});

// Get Super Upvote Status
router.get('/super-upvote-status', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.userId!;
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const lastUse = user.lastSuperUpvoteDate ? new Date(user.lastSuperUpvoteDate) : null;
        let usedToday = false;

        if (lastUse && lastUse >= startOfDay) {
            usedToday = true;
        }

        let contentTitle = null;
        let contentId = null;
        let usedAt = null;

        if (usedToday) {
            const vote = await prisma.vote.findFirst({
                where: {
                    userId,
                    voteType: 'super_upvote',
                    createdAt: { gte: startOfDay }
                },
                include: { content: true }
            });
            if (vote) {
                contentTitle = vote.content.title;
                contentId = vote.contentId;
                usedAt = vote.createdAt;
            }
        }

        const resetAt = new Date(startOfDay);
        resetAt.setDate(startOfDay.getDate() + 1);

        res.json({
            used: usedToday,
            contentId,
            contentTitle,
            usedAt,
            resetAt
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

export default router;
