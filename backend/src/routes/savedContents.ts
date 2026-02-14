import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// List all saved items
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const userId = req.userId;
        const saves = await prisma.savedContent.findMany({
            where: { userId },
            include: {
                content: { include: { votes: true } },
                collection: true
            },
            orderBy: { savedAt: 'desc' }
        });

        // Format content similar to other endpoints?
        const formatted = saves.map(s => ({
            ...s,
            content: {
                ...s.content,
                mediaUrls: s.content.mediaUrls ? JSON.parse(s.content.mediaUrls) : (s.content.mediaUrl ? [s.content.mediaUrl] : []),
                hashtags: JSON.parse(s.content.hashtags || '[]'),
                voteCount: s.content.votes.reduce((acc, vote) => acc + (vote.voteType === 'upvote' ? 1 : (vote.voteType === 'downvote' ? -1 : 5)), 0),
                userVote: s.content.votes.find(v => v.userId === req.userId)?.voteType || null
            }
        }));

        res.json(formatted);
    } catch (e) { res.status(500).json({ error: 'Failed to fetch saved contents' }); }
});

// Save content (Create/Update)
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const { contentId, collectionId, note } = req.body;

        const existing = await prisma.savedContent.findUnique({
            where: { userId_contentId: { userId: req.userId, contentId } },
        });

        if (existing) {
            const updated = await prisma.savedContent.update({
                where: { id: existing.id },
                data: { collectionId, note }
            });
            // Legacy sync not strictly needed for update, but good practice
            res.json(updated);
        } else {
            const saved = await prisma.savedContent.create({
                data: {
                    userId: req.userId,
                    contentId,
                    collectionId,
                    note
                }
            });

            // Sync backward compat
            const content = await prisma.content.findUnique({ where: { id: contentId } });
            if (content) {
                const savedBy = JSON.parse(content.savedBy || '[]');
                if (!savedBy.includes(req.userId)) {
                    savedBy.push(req.userId);
                    await prisma.content.update({ where: { id: contentId }, data: { savedBy: JSON.stringify(savedBy) } });
                }
            }
            res.json(saved);
        }
    } catch (e) { res.status(500).json({ error: 'Failed to save content' }); }
});

// Update saved content
router.put('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { collectionId, note } = req.body;

        const existing = await prisma.savedContent.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

        const updated = await prisma.savedContent.update({
            where: { id },
            data: { collectionId, note }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Failed to update saved content' }); }
});

// Unsave (Delete)
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        console.log('Unsaving id:', id);
        const existing = await prisma.savedContent.findUnique({ where: { id } });

        // If passing contentId instead of savedContentId?
        // Route is DELETE /api/saved-contents/:id. Usually ID is primary key.
        // But handy logic: if ID not found, check if it's a contentId for this user?
        // User request: DELETE /api/saved-contents/:id (unsave).
        // I'll stick to ID.

        if (!existing) {
            // Try contentId logic fallback?
            const byContent = await prisma.savedContent.findUnique({
                where: { userId_contentId: { userId: req.userId, contentId: id } }
            });
            if (byContent) {
                await prisma.savedContent.delete({ where: { id: byContent.id } });
                // Sync legacy
                const contentId = byContent.contentId;
                const content = await prisma.content.findUnique({ where: { id: contentId } });
                if (content) {
                    const savedBy = JSON.parse(content.savedBy || '[]');
                    const newSavedBy = savedBy.filter((uid: string) => uid !== req.userId);
                    await prisma.content.update({ where: { id: contentId }, data: { savedBy: JSON.stringify(newSavedBy) } });
                }
                return res.json({ message: 'Unsaved by contentId' });
            }
            return res.status(404).json({ error: 'Saved content not found' });
        }

        if (existing.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

        await prisma.savedContent.delete({ where: { id } });

        // Sync legacy
        const contentId = existing.contentId;
        const content = await prisma.content.findUnique({ where: { id: contentId } });
        if (content) {
            const savedBy = JSON.parse(content.savedBy || '[]');
            const newSavedBy = savedBy.filter((uid: string) => uid !== req.userId);
            await prisma.content.update({ where: { id: contentId }, data: { savedBy: JSON.stringify(newSavedBy) } });
        }

        res.json({ message: 'Unsaved' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to unsave' });
    }
});

export default router;
