import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function seedVideos() {
    console.log('🎬 Starting video seeding...');

    // Source videos directory
    const sourceDir = path.join(__dirname, '../../Assets/Sample_Videos');

    // Destination directory
    const destDir = path.join(__dirname, '../uploads/videos');

    // Create destination if doesn't exist
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        console.log('✅ Created uploads/videos directory');
    }

    // Get test user (john)
    const user = await prisma.user.findUnique({
        where: { email: 'john@test.com' }
    });

    if (!user) {
        console.error('❌ User john@test.com not found');
        console.log('Please create a test user first or update the email in the script.');
        return;
    }

    console.log(`✅ Found user: ${user.username}`);

    // Video titles and descriptions
    const videoData = [
        {
            title: 'Amazing Nature Scenery 🌲',
            description: 'Beautiful forest landscape with peaceful atmosphere. Perfect for relaxation and meditation.',
            hashtags: ['nature', 'forest', 'relaxing', 'scenery']
        },
        {
            title: 'City Timelapse at Night 🌃',
            description: 'Fast-paced city life captured in a stunning timelapse. Watch the city come alive!',
            hashtags: ['city', 'timelapse', 'urban', 'night']
        },
        {
            title: 'Ocean Waves ASMR 🌊',
            description: 'Calming ocean waves for stress relief. Close your eyes and listen.',
            hashtags: ['ocean', 'asmr', 'relaxing', 'water']
        },
        {
            title: 'Cooking Tutorial: Pasta 🍝',
            description: 'Learn how to make authentic Italian pasta from scratch. Easy and delicious!',
            hashtags: ['cooking', 'food', 'tutorial', 'italian']
        },
        {
            title: 'Workout Motivation 💪',
            description: 'High-energy workout routine to get you pumped! No equipment needed.',
            hashtags: ['fitness', 'workout', 'motivation', 'health']
        },
        {
            title: 'Pet Compilation - Funny Moments 🐶',
            description: 'Hilarious pet fails and cute moments. Guaranteed to make you smile!',
            hashtags: ['pets', 'funny', 'animals', 'cute']
        },
        {
            title: 'Productivity Tips for Developers 💻',
            description: 'Boost your coding productivity with these simple tricks and tools.',
            hashtags: ['coding', 'productivity', 'tech', 'programming']
        }
    ];

    // Copy videos and create posts
    for (let i = 1; i <= 7; i++) {
        const sourceFile = path.join(sourceDir, `Video_${i}.mp4`);

        if (!fs.existsSync(sourceFile)) {
            console.log(`⚠️  Warning: ${sourceFile} not found, skipping...`);
            continue;
        }

        // Copy file to uploads
        const destFileName = `sample_${i}_${Date.now()}.mp4`;
        const destFile = path.join(destDir, destFileName);

        try {
            fs.copyFileSync(sourceFile, destFile);
            console.log(`📁 Copied Video_${i}.mp4 to ${destFileName}`);

            // Create database entry
            const data = videoData[i - 1];

            await prisma.content.create({
                data: {
                    userId: user.id,
                    contentType: 'video',
                    title: data.title,
                    description: data.description,
                    hashtags: JSON.stringify(data.hashtags),
                    mediaUrls: JSON.stringify([`/uploads/videos/${destFileName}`]),
                    isNSFW: false,
                    score: Math.floor(Math.random() * 50) // Random score 0-50
                }
            });

            console.log(`✅ Created post: ${data.title}`);
        } catch (error) {
            console.error(`❌ Error processing Video_${i}:`, error);
        }
    }

    console.log('🎉 Video seeding complete!');
}

seedVideos()
    .catch((error) => {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
