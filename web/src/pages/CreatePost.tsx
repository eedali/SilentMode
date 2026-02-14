import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI, hashtagAPI } from '../services/api';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MarkdownEditor } from '../components/MarkdownEditor';
import { ImageUpload } from '../components/ImageUpload';
import VideoUpload from '../components/VideoUpload';
import { useToast } from '../context/ToastContext';

export const CreatePost = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [currentHashtag, setCurrentHashtag] = useState('');
    const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<string[]>([]);
    const [mediaFilenames, setMediaFilenames] = useState<string[]>([]);
    const [contentType, setContentType] = useState<'text' | 'image' | 'video' | 'qa'>('text');
    const [isNSFW, setIsNSFW] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Fetch suggestions as user types
    useEffect(() => {
        if (currentHashtag.trim().length > 0 && !currentHashtag.includes(' ')) {
            const query = currentHashtag.trim().replace(/^#/, '').toLowerCase();
            if (query) {
                hashtagAPI.getTrending().then(data => {
                    const filtered = data
                        .filter(h => h.toLowerCase().includes(query))
                        .slice(0, 5);
                    setHashtagSuggestions(filtered);
                });
            } else {
                setHashtagSuggestions([]);
            }
        } else {
            setHashtagSuggestions([]);
        }
    }, [currentHashtag]);

    const addHashtag = (tag: string) => {
        if (tag && !hashtags.includes(tag)) {
            if (hashtags.length >= 5) {
                showToast('Maximum 5 hashtags allowed', 'warning');
                return;
            }
            setHashtags([...hashtags, tag]);
            setCurrentHashtag('');
            setHashtagSuggestions([]);
            setError('');
        } else if (hashtags.includes(tag)) {
            showToast('Hashtag already added', 'warning');
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                // Trigger form submit
                const form = document.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === ' ' || e.key === 'Enter') && currentHashtag.trim()) {
            e.preventDefault();
            const tag = currentHashtag.trim().replace('#', '');
            if (tag && !hashtags.includes(tag)) {
                if (hashtags.length >= 5) {
                    showToast('Maximum 5 hashtags allowed', 'warning');
                    return;
                }
                setHashtags([...hashtags, tag]);
                setCurrentHashtag('');
                setError('');
            } else if (hashtags.includes(tag)) {
                showToast('Hashtag already added', 'warning');
            }
        }
    };

    const removeHashtag = (tagToRemove: string) => {
        setHashtags(hashtags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!title.trim()) {
            showToast('Title is required', 'error');
            return;
        }

        if (title.length > 100) {
            showToast('Title too long (max 100 chars)', 'error');
            return;
        }

        if (!description.trim()) {
            showToast('Description is required', 'error');
            return;
        }

        if (description.length > 2000) {
            showToast('Description too long (max 2000 chars)', 'error');
            return;
        }

        // Clear and add current hashtag input if exists
        let finalHashtags = [...hashtags];
        if (currentHashtag.trim()) {
            const tag = currentHashtag.trim().replace('#', '');
            if (tag && !finalHashtags.includes(tag) && finalHashtags.length < 5) {
                finalHashtags.push(tag);
            }
            setCurrentHashtag(''); // Clear input
        }

        if (finalHashtags.length === 0) {
            showToast('At least one hashtag is required', 'error');
            return;
        }

        if (finalHashtags.length > 5) {
            showToast('Maximum 5 hashtags allowed', 'warning');
            return;
        }

        setLoading(true);

        try {
            await contentAPI.create({
                title: title.trim(),
                description: description.trim(),
                hashtags: finalHashtags,
                contentType,
                mediaUrls,
                isNSFW,
            });
            // Force feed to show newest content so user sees their post
            localStorage.setItem('feed_filter', 'newest');
            showToast('Post created successfully!', 'success');
            navigate('/');
        } catch (err: any) {
            console.error('Create error:', err);
            showToast(err.response?.data?.error || 'Failed to create post', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Header />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6 max-w-4xl mx-auto">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                        <h1 className="text-2xl font-bold text-slate-100 mb-6">Create New Post</h1>



                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {contentType === 'qa' ? 'Question Title' : 'Title'}
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    maxLength={100}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="Post title"
                                />
                                <p className="text-xs text-slate-400 mt-1">{title.length}/100 characters</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Content Type
                                </label>
                                <div className="flex gap-4 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setContentType('text')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'text'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        📝 Text
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContentType('image')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'image'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        📷 Image
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContentType('video')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'video'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        🎥 Video
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setContentType('qa')}
                                        className={`px-4 py-2 rounded-lg transition-colors ${contentType === 'qa'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                            }`}
                                    >
                                        ❓ Q&A
                                    </button>
                                </div>

                                {contentType === 'image' && (
                                    <div className="mb-4">
                                        <ImageUpload
                                            onImagesChange={(urls, filenames) => {
                                                setMediaUrls(urls);
                                                setMediaFilenames(filenames);
                                            }}
                                            maxImages={5}
                                        />
                                    </div>
                                )}

                                {contentType === 'video' && (
                                    <div className="mb-4">
                                        <VideoUpload
                                            onVideosUploaded={setMediaUrls}
                                            maxVideos={3}
                                        />
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    {contentType === 'image' ? 'Caption' : (contentType === 'qa' ? 'Question Details' : 'Content')}
                                </label>
                                <MarkdownEditor
                                    value={description}
                                    onChange={setDescription}
                                    placeholder="Write your content here... (Markdown supported)"
                                    rows={12}
                                />
                                <p className="text-xs text-slate-400 mt-1">{description.length}/2000 characters</p>
                            </div>


                            <div>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Hashtags
                                    </label>
                                    <input
                                        type="text"
                                        value={currentHashtag}
                                        onChange={(e) => setCurrentHashtag(e.target.value)}
                                        onKeyDown={handleHashtagKeyDown}
                                        maxLength={30}
                                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Type hashtag and press Space"
                                    />

                                    {hashtagSuggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl mt-1 z-20 max-h-48 overflow-y-auto">
                                            {hashtagSuggestions.map((tag) => (
                                                <div
                                                    key={tag}
                                                    onClick={() => addHashtag(tag)}
                                                    className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-slate-300 hover:text-white transition-colors"
                                                >
                                                    #{tag}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                    {hashtags.map((tag, idx) => (
                                        <span key={idx} className="bg-primary-900/30 text-primary-400 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
                                            #{tag}
                                            <button
                                                type="button"
                                                onClick={() => removeHashtag(tag)}
                                                className="text-red-400 hover:text-red-300 font-bold px-1"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <p className="text-xs text-slate-400 mt-2">
                                    First tag will be the main category. Press Space to add.
                                </p>
                            </div>


                            <div className="mb-6 flex items-center gap-3 p-4 bg-slate-800 rounded-lg border border-slate-700">
                                <div className="flex-1">
                                    <h3 className="font-medium text-lg mb-1">🔞 NSFW Content</h3>
                                    <p className="text-sm text-slate-400">
                                        Mark this post as Not Safe For Work (18+ / sensitive content)
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsNSFW(!isNSFW)}
                                    className={`w-14 h-7 rounded-full transition-colors relative ${isNSFW ? 'bg-red-600' : 'bg-slate-600'
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${isNSFW ? 'translate-x-7' : 'translate-x-0.5'
                                            }`}
                                    />
                                </button>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading && (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        )}
                                        {loading ? 'Posting...' : 'Post'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="px-6 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 text-center">
                                    Tip: Press Ctrl+Enter to post
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
