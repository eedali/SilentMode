import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { calculateContentScore } from '../services/scoreCalculator';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

// Test endpoint to force score and set archive status directly
router.post('/:id/set-score', async (req, res) => {
    try {
        const { id } = req.params;
        const { score } = req.body;

        const isArchived = score < -10;

        const updated = await prisma.content.update({
            where: { id },
            data: { score, isArchived }
        });

        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to set score' });
    }
});

// Get my posts
router.get('/my-posts', authenticateToken, async (req: any, res) => {
    try {
        const contents = await prisma.content.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            include: { votes: true }
        });

        const formatted = contents.map(c => ({
            ...c,
            mediaUrls: c.mediaUrls ? JSON.parse(c.mediaUrls) : (c.mediaUrl ? [c.mediaUrl] : []),
            hashtags: JSON.parse(c.hashtags || '[]'),
            voteCount: c.votes.reduce((acc, vote) => acc + (vote.voteType === 'upvote' ? 1 : (vote.voteType === 'downvote' ? -1 : 5)), 0),
            userVote: c.votes.find(v => v.userId === req.userId)?.voteType || null
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json({ error: 'Failed to fetch my posts' }); }
});

// Get hidden contents
router.get('/hidden', authenticateToken, async (req: any, res) => {
    try {
        const contents = await prisma.content.findMany({
            where: { hiddenBy: { contains: `"${req.userId}"` } },
            orderBy: { createdAt: 'desc' },
            include: { votes: true }
        });
        const formatted = contents.map(c => ({
            ...c,
            mediaUrls: c.mediaUrls ? JSON.parse(c.mediaUrls) : (c.mediaUrl ? [c.mediaUrl] : []),
            hashtags: JSON.parse(c.hashtags || '[]'),
            voteCount: c.votes.reduce((acc, vote) => acc + (vote.voteType === 'upvote' ? 1 : (vote.voteType === 'downvote' ? -1 : 5)), 0),
            userVote: c.votes.find(v => v.userId === req.userId)?.voteType || null
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json({ error: 'Failed to fetch hidden contents' }); }
});

// Unhide content
router.post('/:id/unhide', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const content = await prisma.content.findUnique({ where: { id } });
        if (!content) return res.status(404).json({ error: 'Not found' });

        const hiddenBy = JSON.parse(content.hiddenBy || '[]');
        const newHiddenBy = hiddenBy.filter((uid: string) => uid !== req.userId);

        await prisma.content.update({
            where: { id },
            data: { hiddenBy: JSON.stringify(newHiddenBy) }
        });
        res.json({ message: 'Unhidden' });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

// Get all content
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { hashtag, sort } = req.query;
        const requestingUserId = req.userId || '';

        const where: any = { isArchived: false };
        if (hashtag) {
            where.hashtags = { contains: hashtag as string };
        }

        let orderBy: any = { score: 'desc' };
        if (sort === 'newest') orderBy = { createdAt: 'desc' };
        if (sort === 'oldest') orderBy = { createdAt: 'asc' };
        if (sort === 'unseen') orderBy = { viewCount: 'asc' };

        const { contentType } = req.query;
        if (contentType && contentType !== 'all') {
            where.contentType = contentType;
        }

        // Fetch larger set to allow for filtering
        const contents = await prisma.content.findMany({
            where,
            orderBy,
            take: 50,
            select: {
                id: true,
                userId: true,
                contentType: true,
                title: true,
                description: true,
                mainHashtag: true,
                hashtags: true,
                mediaUrl: true,
                mediaUrls: true,
                score: true,
                viewCount: true,
                createdAt: true,
                isArchived: true,
                editedAt: true,
                hiddenBy: true,
                savedBy: true,
                updatedAt: true,
                remixedFromId: true,
                remixCount: true,
                remixedFrom: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        contentType: true,
                        mediaUrls: true,
                        createdAt: true,
                        hashtags: true
                    }
                },
                _count: {
                    select: { answers: true }
                }
            }
        });

        // Filter hidden content in memory
        const visibleContents = contents.filter(content => {
            const hiddenBy = JSON.parse(content.hiddenBy || '[]');
            return !hiddenBy.includes(requestingUserId);
        });

        // Slice to requested limit after filtering if needed, or just return visible
        const finalContents = visibleContents.slice(0, 20);

        // Get user's votes for visible content
        const contentIds = finalContents.map(c => c.id);
        const userVotes = await prisma.vote.findMany({
            where: {
                userId: requestingUserId,
                contentId: { in: contentIds }
            }
        });

        const voteMap = new Map(userVotes.map(v => [v.contentId, v.voteType]));

        const contentsWithUserVotes = finalContents.map(content => {
            const userVote = voteMap.get(content.id) || null;

            let hashtagsArray: string[] = [];
            try {
                hashtagsArray = JSON.parse(content.hashtags);
            } catch (e) {
                hashtagsArray = content.mainHashtag ? [content.mainHashtag.replace('#', '')] : [];
            }

            // Check if saved by user
            const savedBy = JSON.parse(content.savedBy || '[]');
            const isSaved = savedBy.includes(requestingUserId);

            const contentWithHashtags = {
                ...content,
                hashtags: hashtagsArray,
                isSaved,
                mediaUrls: (content as any).mediaUrls
                    ? JSON.parse((content as any).mediaUrls)
                    : (content.mediaUrl ? [content.mediaUrl] : []),
                answerCount: (content as any)._count?.answers || 0,
                remixedFrom: (content as any).remixedFrom ? {
                    ...(content as any).remixedFrom,
                    hashtags: typeof (content as any).remixedFrom.hashtags === 'string'
                        ? JSON.parse((content as any).remixedFrom.hashtags)
                        : (content as any).remixedFrom.hashtags,
                    mediaUrls: typeof (content as any).remixedFrom.mediaUrls === 'string'
                        ? JSON.parse((content as any).remixedFrom.mediaUrls)
                        : (content as any).remixedFrom.mediaUrls
                } : null
            };

            if (content.userId !== requestingUserId) {
                const { score, ...contentWithoutScore } = contentWithHashtags;
                return { ...contentWithoutScore, score: 0, userVote };
            }
            return { ...contentWithHashtags, userVote };
        });

        res.json(contentsWithUserVotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch contents' });
    }
});

// Create content
// Create content
router.post('/', authenticateToken, async (req: any, res) => {
    try {
        const {
            title,
            description,
            hashtags,
            mediaUrls,
            contentType = 'text',
            remixedFromId,
            isNSFW = false
        } = req.body;
        const userId = req.userId;

        if (!['text', 'image', 'video', 'qa'].includes(contentType)) {
            return res.status(400).json({ error: 'Invalid content type' });
        }

        // NEW: Check if remixing
        let originalContent = null;
        if (remixedFromId) {
            originalContent = await prisma.content.findUnique({
                where: { id: remixedFromId }
            });

            if (!originalContent) {
                return res.status(404).json({ error: 'Original content not found' });
            }

            if (originalContent.contentType === 'qa') {
                return res.status(400).json({ error: 'Cannot remix Q&A posts' });
            }

            // Cannot remix own content (Prevent circular logic or ego boosting)
            if (originalContent.userId === userId) {
                return res.status(400).json({ error: 'Cannot remix your own content' });
            }
        }

        // Validate Q&A
        if (contentType === 'qa') {
            if (!description || description.trim().length === 0) {
                return res.status(400).json({ error: 'Question text (description) is required' });
            }
            if (description.length > 500) {
                return res.status(400).json({ error: 'Question too long (max 500)' });
            }
        } else {
            // Validate Text/Image/Remix
            if (!title || !description) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // For remixing, hashtags are optional (can inherit or be new). 
            // If new post (not remix), hashtags required.
            if (!remixedFromId && (!hashtags || hashtags.length === 0)) {
                return res.status(400).json({ error: 'At least one hashtag is required' });
            }

            if (title.length > 200) {
                return res.status(400).json({ error: 'Title too long (max 200 characters)' });
            }
        }

        const content = await prisma.content.create({
            data: {
                title: title || (contentType === 'qa' ? 'Q&A' : ''),
                description,
                // Inherit type if remixing
                contentType: remixedFromId ? originalContent!.contentType : contentType,
                mainHashtag: hashtags && hashtags[0] ? `#${hashtags[0]}` : '#general',
                hashtags: JSON.stringify(hashtags || []),
                // Inherit media if remixing
                mediaUrls: remixedFromId
                    ? originalContent!.mediaUrls
                    : (contentType === 'qa' ? '[]' : JSON.stringify(mediaUrls || [])),
                userId: userId!,
                score: 0,
                viewCount: 0,
                remixedFromId: remixedFromId || null,
                isNSFW
            },
        });

        // Increment remix count on original
        // Increment remix count on original
        if (remixedFromId) {
            await prisma.content.update({
                where: { id: remixedFromId },
                data: { remixCount: { increment: 1 } }
            });

            // NEW: Notify original content author
            // NEW: Notify original content author if they enabled notifications
            if (originalContent && originalContent.userId !== userId) {
                const author = await prisma.user.findUnique({
                    where: { id: originalContent.userId },
                    select: { notifyOnRemix: true }
                });

                if (author && author.notifyOnRemix) {
                    await prisma.notification.create({
                        data: {
                            userId: originalContent.userId,
                            type: 'remix',
                            contentId: content.id, // ID of the NEW remix content
                            actorId: userId
                        }
                    });
                }
            }
        }


        // Initialize score
        await calculateContentScore(content.id);

        const updated = await prisma.content.findUnique({
            where: { id: content.id },
            include: {
                remixedFrom: {
                    select: {
                        id: true,
                        title: true,
                        contentType: true
                    }
                }
            }
        });

        if (!updated) return res.status(500).json({ error: 'Failed to retrieve created content' });

        const responseContent = {
            ...updated,
            hashtags: hashtags || [],
            mediaUrls: contentType === 'qa' ? [] : (updated.mediaUrls ? JSON.parse(updated.mediaUrls) : [])
        };

        res.status(201).json(responseContent);

    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({ error: 'Failed to create content' });
    }
});

// Get trending hashtags
router.get('/trending/hashtags', async (req, res) => {
    try {
        const contents = await prisma.content.findMany({
            where: { isArchived: false },
            select: { hashtags: true }
        });

        const hashtagCounts: { [key: string]: number } = {};

        contents.forEach(content => {
            if (content.hashtags) {
                let tags: string[] = [];
                try {
                    tags = typeof content.hashtags === 'string'
                        ? JSON.parse(content.hashtags)
                        : content.hashtags;
                } catch (e) {
                    tags = [];
                }

                if (Array.isArray(tags)) {
                    tags.forEach((tag: string) => {
                        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
                    });
                }
            }
        });

        const trending = Object.entries(hashtagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([tag, count]) => ({ tag, count }));

        res.json(trending);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch trending hashtags' });
    }
});

// Get single content
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const requestingUserId = req.userId || '';


        const contentItem = await prisma.content.findUnique({
            where: { id },
            include: {
                votes: requestingUserId ? { where: { userId: requestingUserId } } : false,
                remixedFrom: true,
                answers: {
                    include: {
                        votes: true
                    },
                    orderBy: { score: 'desc' }
                }
            }
        });

        if (!contentItem) return res.status(404).json({ error: 'Content not found' });

        // Update view count
        await prisma.content.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });

        await calculateContentScore(id);

        const userVote = contentItem.votes && contentItem.votes.length > 0 ? contentItem.votes[0] : null;

        const voteType = userVote ? userVote.voteType : null;

        let hashtagsArray: string[] = [];
        try {
            hashtagsArray = JSON.parse(contentItem.hashtags);
        } catch (e) {
            hashtagsArray = contentItem.mainHashtag ? [contentItem.mainHashtag.replace('#', '')] : [];
        }

        const savedBy = JSON.parse(contentItem.savedBy || '[]');
        const isSaved = savedBy.includes(requestingUserId);

        const answers = contentItem.answers ? contentItem.answers.map((a: any) => {
            const userVoteObj = a.votes.find((v: any) => v.userId === requestingUserId);
            return {
                ...a,
                // userId: undefined, // KEEP USER ID for frontend ownership check
                userVote: userVoteObj ? userVoteObj.voteType : null,
                votes: undefined // Hide all votes array
            };
        }) : [];

        const contentWithHashtags = {
            ...contentItem,
            hashtags: hashtagsArray,
            isSaved,
            mediaUrls: (contentItem as any).mediaUrls
                ? JSON.parse((contentItem as any).mediaUrls)
                : (contentItem.mediaUrl ? [contentItem.mediaUrl] : []),
            answers,
            remixedFrom: (contentItem as any).remixedFrom ? {
                ...(contentItem as any).remixedFrom,
                hashtags: typeof (contentItem as any).remixedFrom.hashtags === 'string'
                    ? JSON.parse((contentItem as any).remixedFrom.hashtags)
                    : (contentItem as any).remixedFrom.hashtags,
                mediaUrls: typeof (contentItem as any).remixedFrom.mediaUrls === 'string'
                    ? JSON.parse((contentItem as any).remixedFrom.mediaUrls)
                    : (contentItem as any).remixedFrom.mediaUrls
            } : null
        };

        // Standard content detail response (hiding user if not owner of the POST? No, posts are public)
        // But Q&A answers are anonymous (handled above).
        // Return full content.

        // Wait, original code sanitized checks `content.userId !== requestingUserId`.
        // If it's not my post, do I hide score?
        // Original code: `return res.json({ ...contentWithoutScore, score: 0 ... });`
        // Why hide score? Maybe "Anonymous" posts?
        // But `Content` usually shows score.
        // It seems consistent to existing logic to keep score visible?
        // Wait, original logic:
        // `if (content.userId !== requestingUserId) { ... score: 0 ... }`
        // This implies score is hidden for others? That's weird for a social app.
        // Ah, maybe `score` field is meant to be private?
        // But `VoteButtons` displays score.
        // I will trust the existing logic if it was hiding it, but usually score is public.
        // The code at line 346: `if (content.userId !== requestingUserId) ... score: 0`.
        // This effectively HIDES score from other users?
        // I'll keep it as is for `Content`.

        // BUT for Q&A, answers have scores. Should they be visible?
        // User prompt: `score Float @default(0)`.
        // Usually Q&A scores are visible to find best answer.
        // I will return answers with scores.

        if (contentItem.userId !== requestingUserId) {
            const { score, ...rest } = contentWithHashtags;
            // But existing code returned score=0.
            // I'll follow that pattern for Content.
            return res.json({ ...rest, score: 0, userVote: voteType });
        }

        res.json({ ...contentWithHashtags, userVote: voteType });
    } catch (error) {
        console.error('Get By ID Error', error);
        res.status(404).json({ error: 'Content not found' });
    }
});

// Add Answer to Q&A
router.post('/:id/answer', authenticateToken, async (req: any, res) => {
    try {
        const contentId = req.params.id; // String
        const { text } = req.body;
        const userId = req.userId;

        // Validation
        const content = await prisma.content.findUnique({ where: { id: contentId } });
        if (!content || content.contentType !== 'qa') {
            return res.status(400).json({ error: 'Not a Q&A post' });
        }

        if (!text || text.length > 440) {
            return res.status(400).json({ error: 'Answer must be 1-440 characters' });
        }

        // Check if already answered
        const existing = await prisma.qAAnswer.findUnique({
            where: { contentId_userId: { contentId, userId } }
        });

        if (existing) {
            return res.status(400).json({ error: 'You already answered this question' });
        }

        const answer = await prisma.qAAnswer.create({
            data: { contentId, userId, text }
        });

        // Create notification for Q&A author
        // Create notification for Q&A author if checking settings
        if (content.userId !== userId) {
            const author = await prisma.user.findUnique({
                where: { id: content.userId },
                select: { notifyOnQAAnswer: true }
            });

            if (author && author.notifyOnQAAnswer) {
                await prisma.notification.create({
                    data: {
                        userId: content.userId,
                        type: 'qa_answer',
                        contentId: content.id,
                        actorId: userId
                    }
                });
            }
        }

        res.json(answer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to answer' });
    }
});

// Vote on Answer
router.post('/:contentId/answers/:answerId/vote', authenticateToken, async (req: any, res) => {
    try {
        const { contentId, answerId } = req.params;
        const { voteType } = req.body;
        const userId = req.userId;

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ error: 'Invalid vote type' });
        }

        // Check if already voted in this Q&A
        const existingVote = await prisma.qAAnswerVote.findUnique({
            where: { userId_contentId: { userId, contentId } }
        });

        if (existingVote) {
            // Calculate old answer score BEFORE deleting the vote
            const oldAnswer = await prisma.qAAnswer.findUnique({
                where: { id: existingVote.answerId },
                include: { votes: true }
            });

            if (oldAnswer) {
                // Count votes BEFORE deletion and adjust for the vote being removed
                const oldUpvotes = oldAnswer.votes.filter((v: any) => v.voteType === 'upvote').length;
                const oldDownvotes = oldAnswer.votes.filter((v: any) => v.voteType === 'downvote').length;

                // Adjust counts: subtract 1 from the appropriate count
                const adjustedUpvotes = existingVote.voteType === 'upvote' ? oldUpvotes - 1 : oldUpvotes;
                const adjustedDownvotes = existingVote.voteType === 'downvote' ? oldDownvotes - 1 : oldDownvotes;
                const oldScore = adjustedUpvotes - (adjustedDownvotes * 0.33);

                // Delete old vote
                await prisma.qAAnswerVote.delete({ where: { id: existingVote.id } });

                // Update old answer with corrected score (rounded to 2 decimals)
                await prisma.qAAnswer.update({
                    where: { id: existingVote.answerId },
                    data: { score: Math.round(oldScore * 100) / 100 }
                });
            } else {
                // If old answer not found, just delete the vote
                await prisma.qAAnswerVote.delete({ where: { id: existingVote.id } });
            }
        }

        // Create new vote
        await prisma.qAAnswerVote.create({
            data: { userId, contentId, answerId, voteType }
        });

        // Update new answer score
        const answer = await prisma.qAAnswer.findUnique({
            where: { id: answerId },
            include: { votes: true }
        });

        if (answer) {
            const upvotes = answer.votes.filter((v: any) => v.voteType === 'upvote').length;
            const downvotes = answer.votes.filter((v: any) => v.voteType === 'downvote').length;
            const newScore = upvotes - (downvotes * 0.33);

            // Round to 2 decimal places to avoid floating point errors
            const roundedScore = Math.round(newScore * 100) / 100;

            await prisma.qAAnswer.update({
                where: { id: answerId },
                data: { score: roundedScore }
            });

            res.json({ success: true, score: roundedScore });
        } else {
            res.status(404).json({ error: 'Answer not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to vote' });
    }
});

// Update content
router.put('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const { title, description, mainHashtag } = req.body;
        const existing = await prisma.content.findUnique({ where: { id } });

        if (!existing) return res.status(404).json({ error: 'Content not found' });
        if (existing.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

        const updated = await prisma.content.update({
            where: { id },
            data: {
                title,
                description,
                mainHashtag,
                editedAt: new Date()
            }
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update content' });
    }
});

// Delete content
router.delete('/:id', authenticateToken, async (req: any, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.content.findUnique({ where: { id } });

        if (!existing) return res.status(404).json({ error: 'Content not found' });
        if (existing.userId !== req.userId) return res.status(403).json({ error: 'Not authorized' });

        // Delete associated images
        const mediaUrls = existing.mediaUrls ? JSON.parse(existing.mediaUrls) : [];
        if (existing.mediaUrl) mediaUrls.push(existing.mediaUrl);

        mediaUrls.forEach((url: string) => {
            const filename = url.split('/').pop();
            if (filename) {
                const filePath = path.join(__dirname, '../../uploads', filename);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e) {
                        console.error('Failed to delete file:', filePath);
                    }
                }
            }
        });

        await prisma.content.delete({ where: { id } });
        res.json({ message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete content' });
    }
});

// Hide content
router.post('/:id/hide', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const content = await prisma.content.findUnique({ where: { id } });
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const hiddenBy = JSON.parse(content.hiddenBy || '[]');
        if (!hiddenBy.includes(userId)) {
            hiddenBy.push(userId);
        }

        await prisma.content.update({
            where: { id },
            data: { hiddenBy: JSON.stringify(hiddenBy) },
        });

        res.json({ message: 'Content hidden' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to hide content' });
    }
});

// Unhide content
router.post('/:id/unhide', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const content = await prisma.content.findUnique({ where: { id } });
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const hiddenBy = JSON.parse(content.hiddenBy || '[]');
        const filtered = hiddenBy.filter((id: string) => id !== userId);

        await prisma.content.update({
            where: { id },
            data: { hiddenBy: JSON.stringify(filtered) },
        });

        res.json({ message: 'Content unhidden' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unhide content' });
    }
});

// Save/bookmark content
router.post('/:id/save', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        const content = await prisma.content.findUnique({ where: { id } });
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const savedBy = JSON.parse(content.savedBy || '[]');

        if (savedBy.includes(userId)) {
            const filtered = savedBy.filter((id: string) => id !== userId);
            await prisma.content.update({
                where: { id },
                data: { savedBy: JSON.stringify(filtered) },
            });
            res.json({ message: 'Content unsaved', saved: false });
        } else {
            savedBy.push(userId);
            await prisma.content.update({
                where: { id },
                data: { savedBy: JSON.stringify(savedBy) },
            });
            res.json({ message: 'Content saved', saved: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to save content' });
    }
});

// Report content
router.post('/:id/report', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body; // value reason if provided, but persist simple "reportedBy" flag
        const userId = req.userId!;

        const content = await prisma.content.findUnique({ where: { id } });
        if (!content) {
            return res.status(404).json({ error: 'Content not found' });
        }

        const reportedBy = JSON.parse(content.reportedBy || '[]');

        if (!reportedBy.includes(userId)) {
            reportedBy.push(userId);

            await prisma.content.update({
                where: { id },
                data: {
                    reportedBy: JSON.stringify(reportedBy)
                }
            });
        }

        console.log(`Content ${id} reported by user ${userId}. Reason: ${reason || 'No reason'}`);

        res.json({ message: 'Content reported successfully' });
    } catch (error) {
        console.error('Report error:', error);
        res.status(500).json({ error: 'Failed to report content' });
    }
});

export default router;
