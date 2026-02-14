import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user exists
        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash
            }
        });

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'supersecret_jwt_key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password (using bcrypt.compare as requested)
        const valid = await bcrypt.compare(password, user.passwordHash);

        if (!valid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'supersecret_jwt_key',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req: any, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId! },
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true,
                lastSuperUpvoteDate: true,
                notifyOnRemix: true,
                notifyOnQAAnswer: true,
                hideArchivedPosts: true,
                autoLoadImages: true,
                showNSFW: true,
                blurNSFW: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Calculate if super upvote was used today
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const lastUse = user.lastSuperUpvoteDate ? new Date(user.lastSuperUpvoteDate) : null;
        const superUpvoteUsedToday = lastUse && lastUse >= startOfDay;

        // Use req.userId directly
        const contentCount = await prisma.content.count({ where: { userId: req.userId! } });

        res.json({
            ...user,
            contentCount,
            superUpvoteUsedToday
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Delete account
router.post('/delete-account', authenticateToken, async (req: any, res: any) => {
    try {
        const { password, confirmText } = req.body;
        const userId = req.userId!;

        if (confirmText !== 'DELETE MY ACCOUNT') {
            return res.status(400).json({ error: 'Confirmation text mismatch' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(403).json({ error: 'Invalid password' });

        // Delete everything

        // Votes
        await prisma.vote.deleteMany({ where: { userId } });

        // Hashtag Follows
        await prisma.hashtagFollow.deleteMany({ where: { userId } });

        // Saved Contents
        await prisma.savedContent.deleteMany({ where: { userId } });

        // Collections
        await prisma.collection.deleteMany({ where: { userId } });

        // Contents (and their votes/saves/related data)
        const userContents = await prisma.content.findMany({ where: { userId }, select: { id: true } });
        const contentIds = userContents.map(c => c.id);

        if (contentIds.length > 0) {
            await prisma.vote.deleteMany({ where: { contentId: { in: contentIds } } });
            await prisma.savedContent.deleteMany({ where: { contentId: { in: contentIds } } });
            await prisma.content.deleteMany({ where: { userId } });
        }

        // User
        await prisma.user.delete({ where: { id: userId } });

        res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

export default router;
