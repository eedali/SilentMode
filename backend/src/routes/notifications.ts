import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's notifications
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.userId;

        const notifications = await prisma.notification.findMany({
            where: { userId },
            include: {
                content: {
                    select: {
                        id: true,
                        title: true,
                        contentType: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20 // Limit to 20 most recent
        });

        res.json(notifications);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.userId;

        const count = await prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req: any, res) => {
    try {
        const notificationId = req.params.id; // UUID are strings
        const userId = req.userId;

        // Verify notification belongs to user
        const notification = await prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId
            }
        });

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

// Mark all as read
router.put('/mark-all-read', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.userId;

        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

export default router;
