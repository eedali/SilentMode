import { useState, useEffect } from 'react';
import { contentAPI } from '../../services/api';
import type { Content } from '../../types';
import { Link } from 'react-router-dom';

export const HiddenContents = () => {
    const [contents, setContents] = useState<Content[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await contentAPI.getHidden();
            setContents(data);
        } catch (error) {
            console.error('Failed to load hidden contents');
        }
    };

    const handleUnhide = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        try {
            await contentAPI.unhide(id);
            setContents(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            console.error('Failed to unhide');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-200 mb-6">Hidden Contents</h2>

            {contents.length === 0 ? (
                <div className="text-center text-slate-500 py-12">
                    You haven't hidden any content.
                </div>
            ) : (
                <div className="grid gap-4">
                    {contents.map(content => (
                        <div key={content.id} className="bg-slate-700/30 border border-slate-700 rounded-lg p-4 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                            <Link to={`/post/${content.id}`} className="flex items-center gap-4 flex-1 min-w-0 group hover:underline decoration-slate-500">
                                {content.mediaUrls && content.mediaUrls.length > 0 ? (
                                    <div className="w-16 h-16 bg-slate-800 rounded bg-cover bg-center shrink-0" style={{ backgroundImage: `url(http://localhost:3000${content.mediaUrls[0]})` }} />
                                ) : (
                                    <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center shrink-0 text-2xl">📝</div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="font-medium text-slate-300 truncate group-hover:text-slate-100">{content.title}</h3>
                                    <p className="text-sm text-slate-500 truncate max-w-[200px] sm:max-w-md">{content.description || 'No description'}</p>
                                </div>
                            </Link>

                            <button
                                onClick={(e) => handleUnhide(content.id, e)}
                                className="bg-green-900/20 hover:bg-green-900/40 text-green-400 px-3 py-1 rounded text-sm transition-colors ml-4 shrink-0 font-medium"
                            >
                                Unhide
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
