import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { contentAPI } from '../services/api';

interface TrendingHashtag {
    tag: string;
    count: number;
}

export const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [trending, setTrending] = useState<TrendingHashtag[]>([]);

    useEffect(() => {
        loadTrending();
    }, []);

    const loadTrending = async () => {
        try {
            const data = await contentAPI.getTrendingHashtags();
            setTrending(data);
        } catch (error) {
            console.error('Failed to load trending hashtags');
        }
    };

    const formatCount = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed top-20 z-50 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg transition-all duration-300 ${isOpen ? 'left-[260px]' : 'left-4'
                    }`}
            >
                {isOpen ? '◀' : '▶'}
            </button>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 transition-transform duration-300 z-40 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                style={{ width: '280px', paddingTop: '80px' }}
            >
                <div className="p-6 space-y-8 overflow-y-auto h-full">
                    {/* Navigation Menu */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Menu
                        </h3>
                        <nav className="space-y-2">
                            <Link
                                to="/"
                                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors block"
                                title="Home Feed"
                            >
                                🏠 Home Feed
                            </Link>

                            <Link
                                to="/create"
                                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors block"
                                title="New Post"
                            >
                                ➕ New Post
                            </Link>
                            <Link
                                to="/profile"
                                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors block"
                                title="My Profile"
                            >
                                👤 My Profile
                            </Link>
                            <Link
                                to="/settings"
                                className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors block"
                                title="Settings"
                            >
                                ⚙️ Settings
                            </Link>
                        </nav>
                    </div>

                    {/* Trending Hashtags */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Trending Hashtags
                        </h3>
                        <div className="space-y-2">
                            {trending.length === 0 ? (
                                <p className="text-slate-500 text-sm">No trending hashtags yet</p>
                            ) : (
                                trending.map((item, idx) => (
                                    <Link
                                        key={item.tag}
                                        to={`/?hashtag=${item.tag}`}
                                        className="w-full flex items-center justify-between px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors group"
                                        title={`#${item.tag}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500 text-sm font-medium">
                                                {idx + 1}
                                            </span>
                                            <span className="text-primary-400 group-hover:text-primary-300 truncate max-w-[120px]">
                                                #{item.tag}
                                            </span>
                                        </div>
                                        <span className="text-xs text-slate-500 flex-shrink-0">
                                            {formatCount(item.count)}
                                        </span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};
