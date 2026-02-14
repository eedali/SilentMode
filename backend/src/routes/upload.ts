import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Create directories if they don't exist
// Adjusted path to be relative to project root or dist
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });

// Image storage configuration
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Video storage configuration
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, videosDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filters
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, JPG, PNG, GIF, WebP)'));
    }
};

const videoFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /mp4|webm|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /video/.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed (MP4, WebM, MOV, AVI)'));
    }
};

// Image upload (max 10 images, 30MB each)
const uploadImages = multer({
    storage: imageStorage,
    limits: { fileSize: 30 * 1024 * 1024 }, // 30MB
    fileFilter: imageFilter
}).array('images', 10);

// Video upload (max 3 videos, 500MB each)
const uploadVideos = multer({
    storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
    fileFilter: videoFilter
}).array('videos', 3);

// Upload images endpoint
router.post('/images', authenticateToken, (req, res) => {
    uploadImages(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error (images):', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Max 30MB per image.' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: 'Too many files. Max 10 images.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            console.error('Upload error (images):', err);
            return res.status(400).json({ error: err.message });
        }

        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`✅ Uploaded ${files.length} images:`, files.map(f => f.filename));
        const urls = files.map(file => `/uploads/images/${file.filename}`);

        res.json({ urls });
    });
});

// Upload videos endpoint
router.post('/videos', authenticateToken, (req, res) => {
    uploadVideos(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('Multer error (videos):', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'File too large. Max 500MB per video.' });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).json({ error: 'Too many files. Max 3 videos.' });
            }
            return res.status(400).json({ error: err.message });
        } else if (err) {
            console.error('Upload error (videos):', err);
            return res.status(400).json({ error: err.message });
        }

        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        console.log(`✅ Uploaded ${files.length} videos:`, files.map(f => f.filename));
        const urls = files.map(file => `/uploads/videos/${file.filename}`);

        res.json({ urls });
    });
});

export default router;
