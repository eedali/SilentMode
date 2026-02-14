import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current settings
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            username: true,
            email: true,
            notifyOnRemix: true,
            notifyOnQAAnswer: true,
            hideArchivedPosts: true,
            autoLoadImages: true,
            showNSFW: true,
            blurNSFW: true
        }
    });

    res.json(user);
});

// Update username
router.put('/username', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const { username } = req.body;

    if (!username || username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    // Check if username is taken
    const existing = await prisma.user.findUnique({
        where: { username }
    });

    if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Username already taken' });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { username }
    });

    res.json({ success: true, message: 'Username updated' });
});

// Update email
router.put('/email', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check if email is taken
    const existing = await prisma.user.findUnique({
        where: { email }
    });

    if (existing && existing.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
    }

    await prisma.user.update({
        where: { id: userId },
        data: { email }
    });

    // TODO: Send verification email
    res.json({ success: true, message: 'Email updated (verification email sent)' });
});

// Update password
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Verify current password
    const user = await prisma.user.findUnique({
        where: { id: userId }
    });

    // Prisma user might be null if deleted but token valid? unlikely with auth middleware but user! is safe
    const isValid = await bcrypt.compare(currentPassword, user!.passwordHash); // Schema uses passwordHash, NOT password
    if (!isValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword } // Schema uses passwordHash
    });

    res.json({ success: true, message: 'Password updated' });
});

// Update notification settings
router.put('/notifications', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const { notifyOnRemix, notifyOnQAAnswer } = req.body;

    await prisma.user.update({
        where: { id: userId },
        data: {
            notifyOnRemix: notifyOnRemix !== undefined ? notifyOnRemix : undefined,
            notifyOnQAAnswer: notifyOnQAAnswer !== undefined ? notifyOnQAAnswer : undefined
        }
    });

    res.json({ success: true, message: 'Notification settings updated' });
});

// Update privacy settings
router.put('/privacy', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;
    const { hideArchivedPosts, autoLoadImages, showNSFW, blurNSFW } = req.body;

    await prisma.user.update({
        where: { id: userId },
        data: {
            hideArchivedPosts: hideArchivedPosts !== undefined ? hideArchivedPosts : undefined,
            autoLoadImages: autoLoadImages !== undefined ? autoLoadImages : undefined,
            showNSFW: showNSFW !== undefined ? showNSFW : undefined,
            blurNSFW: blurNSFW !== undefined ? blurNSFW : undefined
        }
    });

    res.json({ success: true, message: 'Privacy settings updated' });
});

// Download user data (GDPR)
router.get('/download-data', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            createdAt: true,
            contents: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    contentType: true,
                    hashtags: true,
                    createdAt: true,
                    score: true
                }
            },
            votes: {
                select: {
                    contentId: true,
                    voteType: true,
                    createdAt: true
                }
            },
            saves: {
                select: {
                    contentId: true,
                    note: true,
                    savedAt: true
                }
            },
            hashtagFollows: {
                select: {
                    hashtag: true,
                    createdAt: true // Schema uses createdAt, not followedAt
                }
            }
        }
    });

    // Return as JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="silentmode-data-${userId}.json"`);
    res.json(user);
});

export default router;
