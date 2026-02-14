import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import contentRoutes from './routes/contents';
import voteRoutes from './routes/votes';
import hashtagRoutes from './routes/hashtags';
import uploadRoutes from './routes/upload';
import collectionsRouter from './routes/collections';
import savedContentsRouter from './routes/savedContents';
// import questionsRouter from './routes/questions';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.use(express.json());

// Serve uploaded files
app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images')));
app.use('/uploads/videos', express.static(path.join(__dirname, '../uploads/videos')));

app.use('/api/auth', authRoutes);
app.use('/api/contents', contentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/hashtags', hashtagRoutes);
// app.use('/api/questions', questionsRouter); // Deprecated
app.use('/api/upload', uploadRoutes);
app.use('/api/collections', collectionsRouter);
app.use('/api/saved-contents', savedContentsRouter);
import notificationRoutes from './routes/notifications';
app.use('/api/notifications', notificationRoutes);


app.get('/', (req, res) => {
    res.json({ message: 'SilentMode Backend is running' });
});

import settingsRoutes from './routes/settings';
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {

    console.log(`Server is running on http://localhost:${PORT}`);
});
