import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user collections
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const collections = await prisma.collection.findMany({
            where: { userId: req.userId },
            include: { _count: { select: { saves: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(collections);
    } catch (error) {
        console.error('Failed to fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

// Create collection
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const { name } = req.body;
        const collection = await prisma.collection.create({
            data: {
                userId: req.userId,
                name,
            },
        });
        res.json(collection);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

// Rename collection
router.put('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        // Verify owner
        const existing = await prisma.collection.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const updated = await prisma.collection.update({
            where: { id },
            data: { name },
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

// Delete collection
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        // Verify owner
        const existing = await prisma.collection.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        // What to do with saved contents?
        // Usually, items in a deleted collection become "unsorted" (collectionId=null)?
        // Or deleted?
        // User request: "Delete contents, delete votes..." (for Delete Account).
        // For deleting a collection, usually we keep the saved items but disassociate.
        // Or prompt asks "Delete custom collections (folders)".
        // I'll set collectionId to null for associated saves.
        await prisma.savedContent.updateMany({
            where: { collectionId: id },
            data: { collectionId: null }
        });

        await prisma.collection.delete({ where: { id } });
        res.json({ message: 'Collection deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});

// Get user saved contents (grouped/filtered)
router.get('/saved', authenticateToken, async (req: any, res) => { // This route might clash if mounted at /saved-contents
    // I'll assume this file handles /api/collections and /api/saved-contents?
    // Or I mount it at /api/collections and add /api/saved-contents separatly.
    // User listed APIs: /api/collections and /api/saved-contents.
    // I will export TWO routers or handle paths carefully.
    // I'll assume this router is for /api/collections mainly.
    // But saved contents are related.
    // I'll put SavedContent CRUD here too but mount at /api/collections? No.
    // I'll create separate router or handle all in index.ts.
    // I'll add '/saved-contents' endpoints here but with full path if needed, OR just export router and mount appropriately.
    // I'll create a `savedContentsRouter` in same file or separate.
    // For simplicity, I'll put everything in this file and assume standard routes.
    // BUT Express Router routes are relative to mount point.
    // I'll strictly implement /api/collections here.
    // And I'll need another for /api/saved-contents?
    // User requested "View all saved contents grouped by collection".
    // I can return grouped data in `GET /collections`.
    // But `GET /api/saved-contents` is requested.
    // I'll add logic for `/api/saved-contents` here but I must mount correctly.
    // I will write TWO files or ONE file exporting TWO routers?
    // Standard is one file per resource.
    // I'll write `collections.ts` for Collections only.
    // And `savedContents.ts`? Or put logic in `collections.ts` and handle `/saved` subroute if appropriate.
    // User asked for `/api/collections` AND `/api/saved-contents`.
    // I'll create `backend/src/routes/savedContents.ts` too.

    // So this file deals with /api/collections.
    res.status(404).json({ error: "Use /api/saved-contents" });
    return;
});

export default router;
