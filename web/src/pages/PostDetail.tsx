import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { contentAPI } from '../services/api';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { VoteButtons } from '../components/VoteButtons';
import { formatDate } from '../utils/formatDate';
import { useAuth } from '../context/AuthContext';
import { ImageLightbox } from '../components/ImageLightbox';
import { AnswerCard } from '../components/AnswerCard';
import { AnswerInput } from '../components/AnswerInput';
import { HashtagButton } from '../components/HashtagButton';
import { hashtagAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Content } from '../types';

export const PostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [content, setContent] = useState<Content | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editDescription, setEditDescription] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const { showToast } = useToast();
    const [followedHashtags, setFollowedHashtags] = useState<Set<string>>(new Set());
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render on follow change

    const loadFollowedHashtags = async () => {
        try {
            const tags = await hashtagAPI.getFollowingMetadata();
            setFollowedHashtags(new Set(tags.map(t => t.hashtag)));
            setRefreshKey(prev => prev + 1); // Force re-render
        } catch (error) {
            console.error('Failed to load followed hashtags');
        }
    };

    const loadContent = async () => {
        if (!id) return;

        setLoading(true);
        setError('');

        try {
            const data = await contentAPI.getById(id);
            setContent(data);
            setEditDescription(data.description);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
        loadFollowedHashtags();
    }, [id]);

    const handleEdit = async () => {
        if (!content || !id) return;

        try {
            await contentAPI.update(id, {
                description: editDescription,
                title: content.title, // Required by type, though backend handles partial updates
                hashtags: content.hashtags,
                contentType: content.contentType
            });
            setIsEditing(false);
            // Reload content to get updated timestamp
            const updated = await contentAPI.getById(id);
            setContent(updated);
        } catch (err: any) {
            console.error('Edit failed', err);
            setError(err.response?.data?.error || 'Failed to update post');
        }
    };

    const handleAnswerVote = async (answerId: string, voteType: 'upvote' | 'downvote') => {
        if (!content) return;
        try {
            await contentAPI.voteAnswer(content.id, answerId, voteType);

            // Optimistic update or reload? Reload is safer for complex voting logic.
            // But let's try to be smart or just reload for consistency.
            // Given the complexity of "remove other vote", reloading is safest.
            const updated = await contentAPI.getById(content.id);
            setContent(updated);
        } catch (err: any) {
            console.error('Vote failed', err);
            showToast('Failed to vote', 'error');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-primary-500"></div>
                        <p className="text-slate-400 mt-4">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="min-h-screen bg-slate-900">
                <Header />
                <div className="container mx-auto px-4 py-8 max-w-3xl">
                    <div className="bg-red-900/30 border border-red-500 rounded-lg p-6 text-center">
                        <p className="text-red-400 text-lg mb-4">{error || 'Post  not found'}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <Header />
            <Sidebar />

            <div className="flex justify-center min-h-screen">
                <div className="w-full max-w-3xl px-4 py-8">
                    <button
                        onClick={() => navigate('/')}
                        className="text-primary-400 hover:text-primary-300 mb-6 flex items-center gap-2"
                    >
                        ← Back
                    </button>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                        {content.isArchived && (
                            <div className="bg-yellow-900/30 border border-yellow-500 text-yellow-400 p-3 rounded-lg mb-6">
                                ⚠️ This post has been archived (due to low score)
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4">
                            <h1 className="text-3xl font-bold text-slate-100">
                                {content.title}
                            </h1>

                            {user?.id === content.userId && !isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                                >
                                    Edit
                                </button>
                            )}
                        </div>

                        {/* Remixed Content Display */}
                        {content.remixedFrom && (
                            <div
                                className="mb-6 p-4 bg-slate-700/50 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-slate-700 transition"
                                onClick={() => navigate(`/post/${content.remixedFrom!.id}`)}
                            >
                                <p className="text-slate-400 text-sm mb-2 font-semibold flex items-center gap-1">
                                    🔄 Remixed from:
                                </p>
                                <h3 className="font-bold text-xl mb-2 text-slate-200">{content.remixedFrom.title}</h3>
                                <div className="text-slate-300 text-sm mb-3 line-clamp-3">
                                    {content.remixedFrom.description}
                                </div>

                                {content.remixedFrom.mediaUrls && content.remixedFrom.mediaUrls.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {content.remixedFrom.mediaUrls.map((url, i) => (
                                            <img
                                                key={i}
                                                src={`http://localhost:3000${url}`}
                                                className="h-24 w-auto rounded object-cover border border-slate-600"
                                                alt="Remix media"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                            {content.mainHashtag && (
                                <span
                                    className="bg-primary-900/30 text-primary-400 px-3 py-1 rounded-full hover:text-primary-300 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/?hashtag=${content.mainHashtag.replace('#', '')}`)}
                                >
                                    {content.mainHashtag}
                                </span>
                            )}
                            <span>{formatDate(content.createdAt)}</span>
                            {content.editedAt && (
                                <span className="text-slate-500 italic">
                                    (Edited {formatDate(content.editedAt)})
                                </span>
                            )}
                        </div>

                        {content.contentType === 'video' && content.mediaUrls && content.mediaUrls.length > 0 && (
                            <div className="mb-6 space-y-4">
                                {content.mediaUrls.map((url, index) => (
                                    <div key={index} className="relative w-full flex justify-center bg-black rounded-lg overflow-hidden">
                                        <video
                                            src={`http://localhost:3000${url}`}
                                            controls
                                            className="rounded-lg"
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '700px',
                                                width: 'auto',
                                                height: 'auto'
                                            }}
                                            preload="metadata"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                ))}
                            </div>
                        )}

                        {content.contentType === 'image' && content.mediaUrls && content.mediaUrls.length > 0 && (
                            <div className="mb-6 grid grid-cols-2 gap-2">
                                {content.mediaUrls.map((url, index) => (
                                    <img
                                        key={index}
                                        src={`http://localhost:3000${url}`}
                                        alt={`${content.title} ${index + 1}`}
                                        className="w-full h-auto object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-slate-900 border border-slate-700"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxIndex(index);
                                            setLightboxOpen(true);
                                        }}
                                        onError={(e) => {
                                            console.error('Image load error:', url);
                                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23334155" width="800" height="600"/%3E%3Ctext fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="32" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {isEditing ? (
                            <div className="space-y-4 mb-6">
                                <MarkdownEditor
                                    value={editDescription}
                                    onChange={setEditDescription}
                                    placeholder="Edit your content..."
                                    rows={12}
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleEdit}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditDescription(content.description);
                                        }}
                                        className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-2 rounded-lg"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-invert max-w-none mb-8">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        a: ({ node, ...props }) => (
                                            <a {...props} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer" />
                                        ),
                                        code: ({ node, inline, className, children, ...props }: any) => {
                                            if (inline) {
                                                return (
                                                    <code
                                                        className="bg-slate-700 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono"
                                                        {...props}
                                                    >
                                                        {children}
                                                    </code>
                                                );
                                            }

                                            // Block code - Nuclear fix for line breaks
                                            const text = String(children).replace(/\n$/, '');
                                            return (
                                                <pre className="bg-slate-800 rounded-lg p-3 my-2 overflow-x-auto">
                                                    <code
                                                        className="text-green-400 font-mono text-sm block"
                                                        style={{ whiteSpace: 'pre' }}
                                                        {...props}
                                                    >
                                                        {text}
                                                    </code>
                                                </pre>
                                            );
                                        },
                                        h1: ({ node, ...props }) => <h1 {...props} className="text-3xl font-bold mt-4 mb-2" />,
                                        h2: ({ node, ...props }) => <h2 {...props} className="text-2xl font-bold mt-3 mb-2" />,
                                        h3: ({ node, ...props }) => <h3 {...props} className="text-3xl font-bold mt-3 mb-2" />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote {...props} className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-2" />
                                        ),
                                        ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside my-2" />,
                                        ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside my-2" />,
                                    }}
                                >
                                    {content.description.replace(/\n/g, '  \n')}
                                </ReactMarkdown>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-6">
                            {content.hashtags && content.hashtags.map((tag) => (
                                <HashtagButton
                                    key={`${tag}-${refreshKey}`}
                                    hashtag={tag.replace('#', '')}
                                    isFollowed={followedHashtags.has(tag.replace('#', ''))}
                                    onFollowChange={loadFollowedHashtags}
                                />
                            ))}
                        </div>

                        <div className="border-t border-slate-700">
                            <VoteButtons
                                contentId={content.id}
                                contentUserId={content.userId}
                                userVote={content.userVote}
                                onVoteSuccess={async () => {
                                    // Reload to get updated score/vote if needed
                                    const updated = await contentAPI.getById(content.id);
                                    setContent(updated);
                                }}
                            />
                        </div>

                        {/* Remix Button Action Area */}
                        <div className="flex justify-end mt-4">
                            {user?.id !== content.userId && content.contentType !== 'qa' && (
                                <button
                                    onClick={() => navigate(`/remix/${content.id}`)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200 font-medium"
                                >
                                    🔄 Create a Remix from this
                                </button>
                            )}
                        </div>

                        {content.contentType === 'qa' && (
                            <div className="mt-8 border-t border-slate-700 pt-8">
                                <h2 className="text-xl font-bold text-slate-100 mb-6">
                                    Answers ({content.answers?.length || 0})
                                </h2>

                                <AnswerInput
                                    contentId={content.id}
                                    onAnswered={loadContent}
                                />

                                <div className="space-y-4">
                                    {content.answers?.map(answer => (
                                        <AnswerCard
                                            key={answer.id}
                                            answer={answer}
                                            onVote={handleAnswerVote}
                                        />
                                    ))}

                                    {(!content.answers || content.answers.length === 0) && (
                                        <p className="text-slate-500 text-center py-8 italic">
                                            No answers yet. Be the first to answer!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {lightboxOpen && content.mediaUrls && (
                <ImageLightbox
                    images={content.mediaUrls}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </div>
    );
};
