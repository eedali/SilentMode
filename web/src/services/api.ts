import axios from 'axios';
import type {
    AuthResponse,
    LoginData,
    RegisterData,
    User,
    Content,
    CreateContentData,
    VoteData,
    Vote,
} from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data: RegisterData): Promise<AuthResponse> =>
        api.post('/auth/register', data).then((res) => res.data),

    login: (data: LoginData): Promise<AuthResponse> =>
        api.post('/auth/login', data).then((res) => res.data),

    getProfile: (): Promise<User> =>
        api.get('/auth/profile').then((res) => res.data),

    deleteAccount: (data: { password: string, confirmText: string }): Promise<void> =>
        api.post('/auth/delete-account', data).then(res => res.data),
};

// Content API
export const contentAPI = {
    getAll: (hashtag?: string, sort?: string, contentType?: string): Promise<Content[]> =>
        api.get('/contents', { params: { hashtag, sort, contentType } }).then((res) => res.data),

    getTrendingHashtags: (): Promise<{ tag: string; count: number }[]> =>
        api.get('/contents/trending/hashtags').then((res) => res.data),

    getById: (id: string): Promise<Content> =>
        api.get(`/contents/${id}`).then((res) => res.data),

    create: (data: CreateContentData): Promise<Content> =>
        api.post('/contents', data).then((res) => res.data),

    // Alias for RemixModal compatibility
    createContent: (data: CreateContentData): Promise<Content> =>
        api.post('/contents', data).then((res) => res.data),

    update: (id: string, data: Partial<CreateContentData>): Promise<Content> =>
        api.put(`/contents/${id}`, data).then((res) => res.data),

    delete: (id: string): Promise<void> =>
        api.delete(`/contents/${id}`).then((res) => res.data),

    hideContent: (id: string): Promise<void> =>
        api.post(`/contents/${id}/hide`).then((res) => res.data),

    saveContent: (id: string): Promise<{ saved: boolean }> =>
        api.post(`/contents/${id}/save`).then((res) => res.data),

    reportContent: (id: string, reason: string): Promise<void> =>
        api.post(`/contents/${id}/report`, { reason }).then((res) => res.data),

    getMyPosts: (): Promise<Content[]> =>
        api.get('/contents/my-posts').then(res => res.data),

    getHidden: (): Promise<Content[]> =>
        api.get('/contents/hidden').then(res => res.data),

    unhide: (id: string): Promise<void> =>
        api.post(`/contents/${id}/unhide`).then(res => res.data),

    addAnswer: (id: string, text: string): Promise<any> =>
        api.post(`/contents/${id}/answer`, { text }).then(res => res.data),

    voteAnswer: (contentId: string, answerId: string, voteType: 'upvote' | 'downvote'): Promise<any> =>
        api.post(`/contents/${contentId}/answers/${answerId}/vote`, { voteType }).then(res => res.data),
};

// Vote API
export const voteAPI = {
    vote: (data: VoteData): Promise<Vote> =>
        api.post('/votes', data).then((res) => res.data),

    getSuperUpvoteStatus: (): Promise<{ used: boolean, contentId: string | null, contentTitle: string | null, usedAt: string | null, resetAt: string }> =>
        api.get('/votes/super-upvote-status').then(res => res.data),
};

// Hashtag API
export const hashtagAPI = {
    follow: (hashtag: string): Promise<void> =>
        api.post('/hashtags/follow', { hashtag }).then((res) => res.data),

    unfollow: (hashtag: string): Promise<void> =>
        api.delete(`/hashtags/unfollow/${hashtag}`).then((res) => res.data),

    getTrending: (): Promise<string[]> =>
        api.get('/hashtags/trending').then((res) => res.data),

    getFollowing: (): Promise<string[]> =>
        api.get('/hashtags/following').then((res) => res.data),

    isFollowing: (hashtag: string): Promise<{ following: boolean }> =>
        api.get(`/hashtags/following/${hashtag}`).then((res) => res.data),

    getFollowingMetadata: (): Promise<{ hashtag: string, followedAt: string, postCount: number }[]> =>
        api.get('/hashtags/following').then(res => res.data),
};

// Upload API
export const uploadAPI = {
    uploadImage: (file: File): Promise<{ url: string; filename: string }> => {
        const formData = new FormData();
        formData.append('image', file);
        return api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then((res) => res.data);
    },

    deleteImage: (filename: string): Promise<void> =>
        api.delete(`/upload/${filename}`).then((res) => res.data),
};

// Collection API
export const collectionAPI = {
    getAll: (): Promise<any[]> => api.get('/collections').then(res => res.data),
    create: (name: string): Promise<any> => api.post('/collections', { name }).then(res => res.data),
    update: (id: string, name: string): Promise<any> => api.put(`/collections/${id}`, { name }).then(res => res.data),
    delete: (id: string): Promise<void> => api.delete(`/collections/${id}`).then(res => res.data),
};

// Saved Content API
export const savedContentAPI = {
    getAll: (): Promise<any[]> => api.get('/saved-contents').then(res => res.data),
    save: (contentId: string, collectionId?: string, note?: string): Promise<any> =>
        api.post('/saved-contents', { contentId, collectionId, note }).then(res => res.data),
    update: (id: string, collectionId?: string, note?: string): Promise<any> =>
        api.put(`/saved-contents/${id}`, { collectionId, note }).then(res => res.data),
    unsave: (id: string): Promise<void> => api.delete(`/saved-contents/${id}`).then(res => res.data),
};



export default api;
