import { useState } from 'react';
import { HashtagButton } from './HashtagButton';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatDate } from '../utils/formatDate';
import { VoteButtons } from './VoteButtons';
import { ContentMenu } from './ContentMenu';
import { useAuth } from '../context/AuthContext';
import { hashtagAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ImageLightbox } from './ImageLightbox';
import type { Content } from '../types';

interface ContentCardProps {
    content: Content;
    onVoteSuccess: () => void;
    onHide: (contentId: string) => void;
    onDelete: (contentId: string) => void;
    followedHashtags: Set<string>;
    onFollowChange: () => void;
}

export const ContentCard = ({
    content,
    onVoteSuccess,
    onHide,
    onDelete,
    followedHashtags,
    onFollowChange
}: ContentCardProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showAllHashtags, setShowAllHashtags] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const { showToast } = useToast();

    const description = content.description || '';
    // Nuclear content processing to force line breaks
    const processedDescription = description.replace(/\n/g, '  \n');
    const isLongDescription = description.length > 150;



    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-primary-500 transition-colors relative group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-100 mb-2 hover:text-primary-400 transition-colors">
                        {/* Overlay Link handles the card click */}
                        <Link to={`/post/${content.id}`} className="after:absolute after:inset-0 focus:outline-none">
                            {content.title}
                            {content.contentType === 'qa' && (
                                <span className="ml-2 inline-block bg-primary-900/50 text-primary-300 text-xs px-2 py-1 rounded align-middle border border-primary-700/50">
                                    Q&A
                                </span>
                            )}
                        </Link>
                    </h2>

                    {content.remixedFrom && (
                        <div
                            className="mb-4 p-4 bg-slate-700 rounded-lg border-l-4 border-blue-500 cursor-pointer hover:bg-slate-600 transition"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/post/${content.remixedFrom!.id}`);
                            }}
                        >
                            {(() => {
                                const remixHashtags = typeof content.remixedFrom!.hashtags === 'string'
                                    ? JSON.parse(content.remixedFrom!.hashtags || '[]')
                                    : (content.remixedFrom!.hashtags || []);

                                const remixMedia = typeof content.remixedFrom!.mediaUrls === 'string'
                                    ? JSON.parse(content.remixedFrom!.mediaUrls || '[]')
                                    : (content.remixedFrom!.mediaUrls || []);

                                return (
                                    <>
                                        <p className="text-slate-400 text-sm mb-2 font-semibold flex items-center gap-1">
                                            🔄 Remixed from:
                                        </p>
                                        <h3 className="font-bold text-lg mb-2 text-slate-200">{content.remixedFrom!.title}</h3>
                                        <p className="text-slate-300 text-sm line-clamp-2 mb-2">
                                            {content.remixedFrom!.description}
                                        </p>

                                        {remixHashtags && remixHashtags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-2">
                                                {remixHashtags.slice(0, 3).map((tag: any, i: number) => (
                                                    <span key={i} className="px-2 py-0.5 bg-slate-600 rounded text-xs text-slate-300">
                                                        #{typeof tag === 'string' ? tag.replace('#', '') : tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {remixMedia && remixMedia.length > 0 && (
                                            <div className="mt-2">
                                                <span className="text-xs text-slate-400">Contains media</span>
                                            </div>
                                        )}

                                        <p className="text-blue-400 text-sm mt-2 font-medium">→ View original post</p>
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {content.contentType === 'video' && content.mediaUrls && content.mediaUrls.length > 0 && (
                        <div className="mb-4 space-y-4 relative z-10">
                            {content.mediaUrls.map((url, index) => (
                                <div key={index} className="relative w-full flex justify-center bg-black rounded-lg overflow-hidden">
                                    <video
                                        src={`http://localhost:3000${url}`}
                                        controls
                                        className="rounded-lg"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '600px',
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
                        <div className="mb-4 grid grid-cols-2 gap-2 relative z-10">
                            {content.mediaUrls.map((url, index) => (
                                <img
                                    key={index}
                                    src={`http://localhost:3000${url}`}
                                    alt={`${content.title} ${index + 1}`}
                                    className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-slate-900 border border-slate-700"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setLightboxIndex(index);
                                        setLightboxOpen(true);
                                    }}
                                    onError={(e) => {
                                        console.error('Image load error:', url);
                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23334155" width="400" height="300"/%3E%3Ctext fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    <div
                        className="text-slate-300 mb-3 relative z-10 line-clamp-3"
                    >
                        <div className="prose prose-invert max-w-none pointer-events-none">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
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
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote {...props} className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-2" />
                                    ),
                                    ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside my-2" />,
                                    ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside my-2" />,
                                }}
                            >
                                {processedDescription}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {isLongDescription && (
                        <Link
                            to={`/post/${content.id}`}
                            className="text-primary-400 hover:text-primary-300 italic font-light cursor-pointer text-sm mb-3 relative z-10 inline-block"
                            onClick={(e) => e.stopPropagation()}
                        >
                            Read more...
                        </Link>
                    )}

                    <div className="flex items-center flex-wrap gap-2 text-sm text-slate-400 mt-2 relative z-10">
                        {content.hashtags && content.hashtags.length > 0 && (
                            <>
                                {(!showAllHashtags ? content.hashtags.slice(0, 3) : content.hashtags).map((tag, idx) => (
                                    <HashtagButton
                                        key={idx}
                                        hashtag={tag.replace('#', '')}
                                        isFollowed={followedHashtags.has(tag.replace('#', ''))}
                                        onFollowChange={onFollowChange}
                                        className="relative z-10"
                                    />
                                ))}

                                {content.hashtags.length > 3 && !showAllHashtags && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowAllHashtags(true); }}
                                        className="text-primary-400 hover:text-primary-300 text-sm"
                                    >
                                        +{content.hashtags.length - 3}
                                    </button>
                                )}
                                {showAllHashtags && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowAllHashtags(false); }}
                                        className="text-slate-400 hover:text-slate-300 text-sm"
                                    >
                                        Show less
                                    </button>
                                )}
                            </>
                        )}

                        <span className="ml-auto text-xs">{formatDate(content.createdAt)}</span>
                    </div>

                    {content.contentType === 'qa' && (
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                            <span className="flex items-center gap-1">
                                💬 {content.answerCount || 0} Answers
                            </span>
                        </div>
                    )}
                </div>

                <div className="relative z-50">
                    <ContentMenu
                        contentId={content.id}
                        isOwner={user?.id === content.userId}
                        isSaved={content.isSaved}
                        onDelete={() => onDelete(content.id)}
                        onHide={() => onHide(content.id)}
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-700 relative z-10 flex justify-between items-center">
                {user?.id === content.userId ? (
                    <div className={`text-sm font-medium ${content.score >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                        Score: {content.score?.toFixed(1) || '0.0'}
                    </div>
                ) : (
                    <VoteButtons
                        contentId={content.id}
                        contentUserId={content.userId}
                        userVote={content.userVote}
                        onVoteSuccess={onVoteSuccess}
                    />
                )}

                {/* Remix Button */}
                {user?.id !== content.userId && content.contentType !== 'qa' && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/remix/${content.id}`);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-300 hover:text-white text-sm font-medium border border-slate-600 hover:border-slate-500"
                        title="Remix this content"
                    >
                        🔄 Remix
                        {content.remixCount !== undefined && content.remixCount > 0 && (
                            <span className="bg-slate-800 px-1.5 rounded text-xs text-slate-400">
                                {content.remixCount}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {
                lightboxOpen && content.mediaUrls && (
                    <ImageLightbox
                        images={content.mediaUrls}
                        initialIndex={lightboxIndex}
                        onClose={() => setLightboxOpen(false)}
                    />
                )
            }


        </div >
    );
};
