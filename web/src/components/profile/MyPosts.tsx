import { useState, useEffect } from 'react';
import { ContentCard } from '../ContentCard';
import { contentAPI, hashtagAPI } from '../../services/api';
import type { Content } from '../../types';
import { useToast } from '../../context/ToastContext';

export const MyPosts = () => {
    const [contents, setContents] = useState<Content[]>([]);
    const [filter, setFilter] = useState<'all' | 'text' | 'image' | 'video' | 'qa'>('all');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest-score' | 'lowest-score'>('newest');
    const { showToast } = useToast();
    const [followedHashtags, setFollowedHashtags] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadPosts();
        loadFollowedHashtags();
    }, []);

    const loadFollowedHashtags = async () => {
        try {
            const tags = await hashtagAPI.getFollowingMetadata();
            setFollowedHashtags(new Set(tags.map(t => t.hashtag)));
        } catch (error) {
            console.error('Failed to load followed hashtags');
        }
    };

    const loadPosts = async () => {
        try {
            const data = await contentAPI.getMyPosts();
            setContents(data);
        } catch (error) {
            console.error('Failed to load posts');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await contentAPI.delete(id);
            setContents(prev => prev.filter(c => c.id !== id));
            showToast('Post deleted', 'success');
        } catch (error) {
            showToast('Failed to delete post', 'error');
        }
    };

    const sortedContents = [...contents]
        .filter(c => filter === 'all' || c.contentType === filter)
        .sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'oldest') {
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            } else if (sortBy === 'highest-score') {
                return (b.score || 0) - (a.score || 0);
            } else if (sortBy === 'lowest-score') {
                return (a.score || 0) - (b.score || 0);
            }
            return 0;
        });

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                    {/* Filter buttons */}
                    {(['all', 'text', 'image', 'qa'] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${filter === type
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {type === 'qa' ? 'Q&A' : type}
                        </button>
                    ))}
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-700 text-slate-200 text-sm rounded-md px-3 py-1 border-none focus:ring-1 focus:ring-primary-500"
                >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="highest-score">Highest Score</option>
                    <option value="lowest-score">Lowest Score</option>
                </select>
            </div>

            <div className="space-y-6">
                {sortedContents.length === 0 ? (
                    <div className="text-center text-slate-500 py-12">
                        You haven't posted any content yet.
                    </div>
                ) : (
                    sortedContents.map(content => (
                        <div key={content.id} className="relative">
                            {content.isArchived && (
                                <div className="absolute top-2 right-2 bg-red-900/80 text-red-200 text-xs font-bold px-2 py-1 rounded z-20 pointer-events-none border border-red-700">
                                    ARCHIVED
                                </div>
                            )}
                            <ContentCard
                                content={content}
                                onVoteSuccess={() => { }}
                                onHide={() => { }}
                                onDelete={handleDelete}
                                followedHashtags={followedHashtags}
                                onFollowChange={loadFollowedHashtags}
                            />
                            {/* Metadata Footer */}
                            <div className="bg-slate-900/50 p-3 rounded-b-lg border-x border-b border-slate-700 -mt-1 text-xs text-slate-400 flex justify-between">
                                <div>
                                    <span>Created: {new Date(content.createdAt).toLocaleDateString()}</span>
                                    {content.updatedAt !== content.createdAt && (
                                        <span className="ml-3">Edited: {new Date(content.updatedAt).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
