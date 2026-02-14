import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');

console.log('📁 Checking uploads directory structure...\n');

[uploadsDir, imagesDir, videosDir].forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        console.log(`✅ ${dir}`);
        console.log(`   Files: ${files.length}`);
        if (files.length > 0) {
            console.log(`   Sample: ${files.slice(0, 3).join(', ')}`);
        }
    } else {
        console.log(`❌ ${dir} - DOES NOT EXIST`);
    }
    console.log('');
});

console.log('🔍 Checking static file serving paths...\n');
console.log('Expected static routes in index.ts:');
console.log('  /uploads/images -> backend/uploads/images');
console.log('  /uploads/videos -> backend/uploads/videos\n');

// Check current working directory
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
