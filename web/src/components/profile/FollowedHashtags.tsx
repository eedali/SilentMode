import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hashtagAPI, contentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const FollowedHashtags = () => {
    const [follows, setFollows] = useState<{ hashtag: string, followedAt: string, postCount: number }[]>([]);
    const { showToast } = useToast();

    // Autocomplete state
    const [searchInput, setSearchInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<{ tag: string; count: number }[]>([]);
    const [allHashtags, setAllHashtags] = useState<{ tag: string; count: number }[]>([]);

    useEffect(() => {
        loadData();
        loadAllHashtags();
    }, []);

    useEffect(() => {
        if (searchInput.trim()) {
            const query = searchInput.replace('#', '').toLowerCase();
            const filtered = allHashtags.filter(item =>
                item.tag.toLowerCase().includes(query)
            ).slice(0, 10);
            setSuggestions(filtered);
        } else {
            setSuggestions(allHashtags.slice(0, 10));
        }
    }, [searchInput, allHashtags]);

    const loadData = async () => {
        try {
            const data = await hashtagAPI.getFollowingMetadata();
            setFollows(data);
        } catch (error) {
            console.error('Failed to load followed hashtags');
        }
    };

    const loadAllHashtags = async () => {
        try {
            const data = await contentAPI.getTrendingHashtags();
            setAllHashtags(data);
        } catch (error) {
            console.error('Failed to load hashtags');
        }
    };

    const handleUnfollow = async (tag: string) => {
        try {
            await hashtagAPI.unfollow(tag);
            setFollows(prev => prev.filter(f => f.hashtag !== tag));
            showToast(`Unfollowed #${tag}`, 'info');
        } catch (error) {
            console.error('Failed to unfollow');
        }
    };

    const handleFollow = async (tag: string) => {
        try {
            await hashtagAPI.follow(tag);
            showToast(`Following #${tag}`, 'success');
            setSearchInput('');
            setShowSuggestions(false);
            // Reload followed hashtags
            await loadData();
        } catch (error) {
            showToast('Failed to follow hashtag', 'error');
        }
    };

    const selectSuggestion = (tag: string) => {
        const cleanTag = tag.replace('#', '');
        // Check if already following
        if (follows.find(f => f.hashtag === cleanTag)) {
            showToast('Already following this hashtag', 'info');
        } else {
            handleFollow(cleanTag);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-6 text-slate-200">Followed Hashtags</h2>

            {/* Search/Autocomplete Bar */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Search and follow hashtags (e.g., #technology)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                {/* Autocomplete Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-2">
                            {suggestions.map((item) => {
                                const isFollowed = follows.find(f => f.hashtag === item.tag);
                                return (
                                    <button
                                        key={item.tag}
                                        onClick={() => selectSuggestion(item.tag)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-slate-300 rounded transition-colors hover:bg-slate-700 ${isFollowed ? 'opacity-50' : ''
                                            }`}
                                        disabled={!!isFollowed}
                                    >
                                        <span className="text-primary-400">#{item.tag}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500">{item.count} posts</span>
                                            {isFollowed && <span className="text-xs text-green-400">✓ Following</span>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Followed Hashtags Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {follows.map(item => (
                    <div key={item.hashtag} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center group">
                        <div>
                            <Link to={`/?hashtag=${item.hashtag}`} className="text-lg font-bold text-primary-400 hover:text-primary-300">
                                #{item.hashtag}
                            </Link>
                            <div className="text-xs text-slate-400 mt-1">
                                {item.postCount} posts
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Since {new Date(item.followedAt).toLocaleDateString()}
                            </div>
                        </div>
                        <button
                            onClick={() => handleUnfollow(item.hashtag)}
                            className="bg-red-900/20 hover:bg-red-900/40 text-red-400 px-3 py-1 rounded text-sm transition-colors"
                        >
                            Unfollow
                        </button>
                    </div>
                ))}
                {follows.length === 0 && (
                    <div className="col-span-full text-center text-slate-500 py-12">
                        You are not following any hashtags yet. Use the search above to find and follow hashtags!
                    </div>
                )}
            </div>
        </div>
    );
};
