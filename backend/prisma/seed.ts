import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Delete all existing data
    await prisma.savedContent.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.hashtagFollow.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.qAAnswerVote.deleteMany();
    await prisma.qAAnswer.deleteMany();
    await prisma.content.deleteMany();
    await prisma.user.deleteMany();

    console.log('Deleted all existing data');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1 = await prisma.user.create({
        data: {
            username: 'john',
            email: 'john@test.com',
            passwordHash: hashedPassword // Schema uses passwordHash, not password
        }
    });

    const user2 = await prisma.user.create({
        data: {
            username: 'jane',
            email: 'jane@test.com',
            passwordHash: hashedPassword
        }
    });

    const user3 = await prisma.user.create({
        data: {
            username: 'alex',
            email: 'alex@test.com',
            passwordHash: hashedPassword
        }
    });

    console.log('Created 3 users');

    // TEXT POSTS (3 examples)
    await prisma.content.create({
        data: {
            userId: user1.id,
            contentType: 'text',
            title: 'Welcome to SilentMode',
            description: `# What is SilentMode?

SilentMode is an **anonymous social platform** where content speaks louder than identity.

## Key Features:
- No usernames visible
- No follower counts
- Pure content-based discovery
- Hashtag communities

> "Be judged by what you say, not who you are."`,
            hashtags: JSON.stringify(['silentmode', 'intro', 'welcome']),
            mainHashtag: '#silentmode',
            mediaUrls: '[]',
            score: 15.2,
            viewCount: 120
        }
    });

    await prisma.content.create({
        data: {
            userId: user2.id,
            contentType: 'text',
            title: 'The Future of AI',
            description: `Artificial Intelligence is evolving faster than ever.

**Recent developments:**
- Multimodal models (text + image + audio)
- Real-time reasoning capabilities
- Better alignment with human values

What excites you most about AI in 2026?`,
            hashtags: JSON.stringify(['ai', 'technology', 'future']),
            mainHashtag: '#ai',
            mediaUrls: '[]',
            score: 8.5,
            viewCount: 85
        }
    });

    await prisma.content.create({
        data: {
            userId: user3.id,
            contentType: 'text',
            title: 'Best Productivity Tips',
            description: `*Share your favorite productivity hacks!*

Mine:
1. Time blocking (dedicated focus hours)
2. Pomodoro technique (25 min work, 5 min break)
3. Digital minimalism (fewer apps, more focus)

What works for you?`,
            hashtags: JSON.stringify(['productivity', 'lifehacks', 'focus']),
            mainHashtag: '#productivity',
            mediaUrls: '[]',
            score: 12.0,
            viewCount: 95
        }
    });

    console.log('Created 3 text posts');

    // IMAGE POSTS (3 examples)
    await prisma.content.create({
        data: {
            userId: user1.id,
            contentType: 'image',
            title: 'Stunning Sunset',
            description: 'Captured this beautiful moment yesterday. Nature never disappoints.',
            hashtags: JSON.stringify(['photography', 'sunset', 'nature']),
            mainHashtag: '#photography',
            mediaUrls: JSON.stringify(['/uploads/sample1.png', '/uploads/sample2.png']),
            score: 22.5,
            viewCount: 180,
            mediaUrl: '/uploads/sample1.png'
        }
    });

    await prisma.content.create({
        data: {
            userId: user2.id,
            contentType: 'image',
            title: 'My Workspace Setup',
            description: `Finally organized my home office! 

**Setup:**
- Standing desk
- Dual monitors
- Ergonomic chair
- Lots of plants 🌱`,
            hashtags: JSON.stringify(['workspace', 'productivity', 'homeoffice']),
            mainHashtag: '#workspace',
            mediaUrls: JSON.stringify(['/uploads/sample3.png']),
            score: 18.0,
            viewCount: 140,
            mediaUrl: '/uploads/sample3.png'
        }
    });

    await prisma.content.create({
        data: {
            userId: user3.id,
            contentType: 'image',
            title: 'Street Art Discovery',
            description: 'Found this amazing mural in downtown. The colors are incredible!',
            hashtags: JSON.stringify(['art', 'streetart', 'urban']),
            mainHashtag: '#art',
            mediaUrls: JSON.stringify(['/uploads/sample4.png', '/uploads/sample5.png', '/uploads/sample6.png']),
            score: 14.8,
            viewCount: 110,
            mediaUrl: '/uploads/sample4.png'
        }
    });

    console.log('Created 3 image posts');

    // Q&A POSTS (3 examples)
    const qa1 = await prisma.content.create({
        data: {
            userId: user1.id,
            contentType: 'qa',
            title: 'Best programming language for beginners?',
            description: 'I want to start learning programming but not sure where to begin. Which language would you recommend for a complete beginner and why?',
            hashtags: JSON.stringify(['programming', 'learning', 'beginners']),
            mainHashtag: '#programming',
            mediaUrls: '[]',
            score: 10.0,
            viewCount: 95
        }
    });

    const qa2 = await prisma.content.create({
        data: {
            userId: user2.id,
            contentType: 'qa',
            title: 'How to stay motivated when learning something new?',
            description: 'I always start with enthusiasm but lose motivation after a few weeks. What strategies help you stay consistent when learning a new skill?',
            hashtags: JSON.stringify(['motivation', 'learning', 'selfimprovement']),
            mainHashtag: '#motivation',
            mediaUrls: '[]',
            score: 7.5,
            viewCount: 72
        }
    });

    const qa3 = await prisma.content.create({
        data: {
            userId: user3.id,
            contentType: 'qa',
            title: 'What book changed your perspective on life?',
            description: 'Looking for book recommendations that had a significant impact on how you think about life, success, or relationships.',
            hashtags: JSON.stringify(['books', 'reading', 'recommendations']),
            mainHashtag: '#books',
            mediaUrls: '[]',
            score: 16.2,
            viewCount: 130
        }
    });

    console.log('Created 3 Q&A posts');

    // Add sample answers to Q&A posts
    await prisma.qAAnswer.create({
        data: {
            contentId: qa1.id,
            userId: user2.id,
            text: 'Python is perfect for beginners! Easy syntax, huge community, tons of resources. You can build websites, automate tasks, or even do AI/ML. Start with free courses on freeCodeCamp or Python.org.',
            score: 5.0
        }
    });

    await prisma.qAAnswer.create({
        data: {
            contentId: qa1.id,
            userId: user3.id,
            text: 'JavaScript! You can see results immediately in the browser, which is super motivating. Plus, it opens doors to web development (frontend + backend with Node.js). Check out JavaScript30 by Wes Bos.',
            score: 3.2
        }
    });

    await prisma.qAAnswer.create({
        data: {
            contentId: qa2.id,
            userId: user1.id,
            text: 'Break it into tiny milestones. Instead of "learn Spanish", try "learn 5 new words today". Track progress visually (streaks, charts). Join a community or find an accountability partner. Makes a huge difference!',
            score: 4.5
        }
    });

    await prisma.qAAnswer.create({
        data: {
            contentId: qa3.id,
            userId: user1.id,
            text: '"Atomic Habits" by James Clear. Changed how I think about daily routines and long-term success. Small consistent actions compound over time. Super practical and backed by science.',
            score: 8.0
        }
    });

    console.log('Created sample answers');

    console.log('✅ Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
