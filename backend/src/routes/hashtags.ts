import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

interface AuthRequest extends Router {
    userId?: string;
}

// Get trending hashtags
router.get('/trending', authenticateToken, async (req: any, res) => {
    try {
        const trending = await prisma.hashtagFollow.groupBy({
            by: ['hashtag'],
            _count: {
                hashtag: true
            },
            orderBy: {
                _count: {
                    hashtag: 'desc'
                }
            },
            take: 10
        });

        res.json(trending.map((t: any) => t.hashtag));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch trending hashtags' });
    }
});

// Follow hashtag
router.post('/follow', authenticateToken, async (req: any, res) => {
    try {
        const { hashtag } = req.body;
        const userId = req.userId!;

        const follow = await prisma.hashtagFollow.create({
            data: { userId, hashtag: hashtag.replace('#', '') },
        });

        res.json(follow);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Already following this hashtag' });
        }
        res.status(500).json({ error: 'Failed to follow hashtag' });
    }
});

// Unfollow hashtag
router.delete('/unfollow/:hashtag', authenticateToken, async (req: any, res) => {
    try {
        const { hashtag } = req.params;
        const userId = req.userId!;

        await prisma.hashtagFollow.deleteMany({
            where: { userId, hashtag: hashtag.replace('#', '') },
        });

        res.json({ message: 'Unfollowed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unfollow hashtag' });
    }
});

// Get user's followed hashtags
router.get('/following', authenticateToken, async (req: any, res) => {
    try {
        const follows = await prisma.hashtagFollow.findMany({
            where: { userId: req.userId! },
            select: { hashtag: true, createdAt: true },
        });

        const result = await Promise.all(follows.map(async (f) => {
            const count = await prisma.content.count({
                where: { hashtags: { contains: `"${f.hashtag}"` } }
            });
            return {
                hashtag: f.hashtag,
                followedAt: f.createdAt,
                postCount: count
            };
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch followed hashtags' });
    }
});

// Check if following a hashtag
router.get('/following/:hashtag', authenticateToken, async (req: any, res) => {
    try {
        const { hashtag } = req.params;
        const follow = await prisma.hashtagFollow.findUnique({
            where: {
                userId_hashtag: {
                    userId: req.userId!,
                    hashtag: hashtag.replace('#', ''),
                },
            },
        });

        res.json({ following: !!follow });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check follow status' });
    }
});

export default router;
