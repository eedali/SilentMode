import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { contentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MarkdownEditor } from '../components/MarkdownEditor';

import type { Content } from '../types';

export default function RemixPost() {
    const { id } = useParams(); // Original content ID
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [originalContent, setOriginalContent] = useState<Content | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [hashtagInput, setHashtagInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch original content
    useEffect(() => {
        const fetchOriginal = async () => {
            try {
                if (!id) return;
                const data = await contentAPI.getById(id);
                setOriginalContent(data);
            } catch (error) {
                showToast('Failed to load original content', 'error');
                navigate('/');
            }
        };
        fetchOriginal();
    }, [id]);

    const handleSubmit = async () => {
        if (!originalContent) return;

        if (!title.trim()) {
            showToast('Title is required', 'error');
            return;
        }

        if (hashtags.length > 5) {
            showToast('Maximum 5 hashtags allowed', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await contentAPI.createContent({
                title,
                description,
                hashtags,
                contentType: originalContent.contentType,
                mediaUrls: originalContent.mediaUrls,
                remixedFromId: originalContent.id
            });

            showToast('Remix published!', 'success');
            navigate('/');
        } catch (error) {
            showToast('Failed to publish remix', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const addHashtag = (tag: string) => {
        const cleaned = tag.trim().toLowerCase().replace(/^#/, '');
        if (!cleaned) return;
        if (hashtags.length >= 5) {
            showToast('Maximum 5 hashtags allowed', 'warning');
            return;
        }
        if (hashtags.includes(cleaned)) {
            showToast('Hashtag already added', 'warning');
            return;
        }
        setHashtags([...hashtags, cleaned]);
        setHashtagInput('');
    };

    if (!originalContent) return <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Header />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">🔄 Remix Content</h1>

                    {/* Your Title */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Your Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Give your remix a unique title..."
                            maxLength={200}
                            className="w-full bg-slate-800 rounded-lg px-4 py-3 text-slate-100"
                        />
                        <p className="text-slate-400 text-xs mt-1">{title.length}/200</p>
                    </div>

                    {/* Your Description */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Your Take (Optional)
                        </label>
                        <MarkdownEditor
                            value={description}
                            onChange={setDescription}
                            placeholder="Add your perspective, commentary, or context..."
                        />
                    </div>

                    {/* Hashtags */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                            Hashtags (Max 5)
                        </label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={hashtagInput}
                                onChange={e => setHashtagInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        addHashtag(hashtagInput);
                                    }
                                }}
                                placeholder="Add hashtag..."
                                className="flex-1 bg-slate-800 rounded-lg px-4 py-2 text-slate-100"
                            />
                            <button
                                onClick={() => addHashtag(hashtagInput)}
                                className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {hashtags.map(tag => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 bg-slate-700 rounded-full text-sm flex items-center gap-2"
                                >
                                    #{tag}
                                    <button
                                        onClick={() => setHashtags(hashtags.filter(h => h !== tag))}
                                        className="text-red-400 hover:text-red-300"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Original Content Preview */}
                    <div className="mb-6 p-4 bg-slate-800 rounded-lg border-l-4 border-blue-500">
                        <p className="text-slate-400 text-sm mb-3">🔄 Remixing from:</p>
                        <h3 className="font-bold text-lg mb-2">{originalContent.title}</h3>
                        <p className="text-slate-300 mb-3">{originalContent.description}</p>

                        {originalContent.hashtags && originalContent.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {originalContent.hashtags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-slate-700 rounded text-xs">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {originalContent.mediaUrls && originalContent.mediaUrls.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {originalContent.mediaUrls.map((url, i) => (
                                    <img
                                        key={i}
                                        src={`http://localhost:3000${url}`}
                                        alt="Preview"
                                        className="w-32 h-32 object-cover rounded"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-slate-700 rounded-lg hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !title.trim()}
                            className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Publishing...' : '🔄 Publish Remix'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
