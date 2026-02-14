import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contentAPI, hashtagAPI } from '../services/api';
import { ContentCard } from '../components/ContentCard';
import { ContentCardSkeleton } from '../components/ContentCardSkeleton';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import type { Content } from '../types';

export const Feed = () => {
    const [contents, setContents] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [hashtag, setHashtag] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [sortBy, setSortBy] = useState<'trending' | 'newest' | 'oldest' | 'unseen'>(() => {
        return (localStorage.getItem('feed_filter') as any) || 'trending';
    });
    const [contentType, setContentType] = useState<'all' | 'text' | 'image' | 'qa'>('all');
    const [followedHashtags, setFollowedHashtags] = useState<Set<string>>(new Set());
    const [refreshKey, setRefreshKey] = useState(0); // Force re-render on follow change
    const isFollowing = hashtag ? followedHashtags.has(hashtag) : false;
    const [searchParams, setSearchParams] = useSearchParams();

    // Autocomplete state
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<{ tag: string; count: number }[]>([]);
    const [allHashtags, setAllHashtags] = useState<{ tag: string; count: number }[]>([]);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    const loadContents = async () => {
        setLoading(true);
        try {
            const data = await contentAPI.getAll(hashtag || undefined, sortBy, contentType);
            setContents(data);
        } catch (error) {
            console.error('Failed to load contents:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshFollowedHashtags = async () => {
        try {
            const tags = await hashtagAPI.getFollowingMetadata();
            setFollowedHashtags(new Set(tags.map(t => t.hashtag)));
            setRefreshKey(prev => prev + 1); // Force re-render
        } catch (error) {
            console.error('Failed to load followed hashtags');
        }
    };

    // Load followed hashtags on mount
    useEffect(() => {
        refreshFollowedHashtags();
    }, []);

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Persist filter
    useEffect(() => {
        localStorage.setItem('feed_filter', sortBy);
    }, [sortBy]);

    const toggleFollow = async () => {
        if (!hashtag) return;
        try {
            if (isFollowing) {
                await hashtagAPI.unfollow(hashtag);
            } else {
                await hashtagAPI.follow(hashtag);
            }
            refreshFollowedHashtags();
        } catch (error) {
            console.error('Failed to toggle follow');
        }
    };

    // Load trending hashtags for autocomplete
    useEffect(() => {
        const loadAllHashtags = async () => {
            try {
                const data = await contentAPI.getTrendingHashtags();
                setAllHashtags(data);
            } catch (error) {
                console.error('Failed to load hashtags');
            }
        };
        loadAllHashtags();
    }, []);

    // Filter suggestions
    useEffect(() => {
        if (searchInput.trim()) {
            const query = searchInput.toLowerCase().replace('#', '');
            const filtered = allHashtags
                .filter(h => h.tag.toLowerCase().includes(query))
                .slice(0, 5);
            setSuggestions(filtered);
        } else {
            setSuggestions(allHashtags.slice(0, 5));
        }
        setSelectedSuggestionIndex(-1); // Reset selection when suggestions change
    }, [searchInput, allHashtags]);

    // Read params from URL
    useEffect(() => {
        const tag = searchParams.get('hashtag');
        const type = searchParams.get('contentType');

        if (tag) {
            setHashtag(tag);
            setSearchInput(tag);
        } else {
            setHashtag('');
            setSearchInput('');
        }

        if (type && ['all', 'text', 'image', 'qa'].includes(type)) {
            setContentType(type as any);
        } else {
            setContentType('all');
        }
    }, [searchParams]);

    // Reload when hashtag or sort changing
    useEffect(() => {
        loadContents();
    }, [hashtag, sortBy, contentType]);

    const handleVoteSuccess = async (contentId: string) => {
        try {
            const updatedContent = await contentAPI.getById(contentId);
            setContents(prevContents =>
                prevContents.map(c => c.id === contentId ? updatedContent : c)
            );
        } catch (error) {
            console.error('Failed to update content:', error);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanHashtag = searchInput.replace('#', '').trim();
        selectSuggestion(cleanHashtag); // Reuse selection logic
    };

    const selectSuggestion = (tag: string) => {
        if (!tag) {
            setHashtag('');
            setSearchParams({});
            setShowSuggestions(false);
            return;
        }
        setSearchInput(tag);
        setHashtag(tag);
        setSearchParams({ hashtag: tag });
        setShowSuggestions(false);
    };

    const clearFilter = () => {
        setHashtag('');
        setSearchInput('');
        setSearchParams({});
    };

    const handleHideContent = (contentId: string) => {
        // Immediately remove from UI
        setContents((prev) => prev.filter((c) => c.id !== contentId));
    };

    const handleDeleteContent = (contentId: string) => {
        setContents((prev) => prev.filter((c) => c.id !== contentId));
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedSuggestionIndex((prev) =>
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[selectedSuggestionIndex].tag);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900">
            <Header />
            <Sidebar />

            <div className="flex justify-center min-h-screen">
                <div className="w-full max-w-3xl px-4 py-8">
                    <div className="mb-8 relative">
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                placeholder="Search hashtags (e.g., #technology)"
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                                type="submit"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                            >
                                Search
                            </button>
                        </form>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-[60px] left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden w-full max-w-[calc(100%-100px)]">
                                <div className="p-2">
                                    <p className="text-xs text-slate-400 px-3 py-2">
                                        {searchInput ? 'Matching hashtags' : 'Popular hashtags'}
                                    </p>
                                    {suggestions.map((item, index) => (
                                        <button
                                            key={item.tag}
                                            onClick={() => selectSuggestion(item.tag)}
                                            className={`w-full flex items-center justify-between px-3 py-2 text-slate-300 rounded transition-colors ${index === selectedSuggestionIndex
                                                ? 'bg-slate-700'
                                                : 'hover:bg-slate-700'
                                                }`}
                                        >
                                            <span className="text-primary-400">#{item.tag}</span>
                                            <span className="text-xs text-slate-500">{item.count} posts</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
                            {hashtag ? (
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-300">
                                        Filter: <span className="text-primary-400 font-medium">#{hashtag}</span>
                                    </span>
                                    <button
                                        onClick={toggleFollow}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors text-white ${isFollowing ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                    >
                                        {isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button
                                        onClick={clearFilter}
                                        className="text-slate-400 hover:text-slate-300 text-sm ml-2"
                                    >
                                        ✕ Clear
                                    </button>
                                </div>
                            ) : <div></div>}

                            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                                {['all', 'text', 'image', 'qa'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            const newParams = new URLSearchParams(searchParams);
                                            if (type === 'all') {
                                                newParams.delete('contentType');
                                            } else {
                                                newParams.set('contentType', type);
                                            }
                                            setSearchParams(newParams);
                                        }}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalized ${contentType === type
                                            ? 'bg-slate-600 text-white'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {type === 'qa' ? 'Q&A' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                ))}
                            </div>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="trending">Trending</option>
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="unseen">Unseen</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            <ContentCardSkeleton />
                            <ContentCardSkeleton />
                            <ContentCardSkeleton />
                        </div>
                    ) : contents.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
                            <p className="text-slate-400 text-lg">
                                {hashtag ? 'No posts found with this hashtag' : 'No posts yet'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {contents.map((content) => (
                                <ContentCard
                                    key={content.id}
                                    content={content}
                                    onVoteSuccess={() => handleVoteSuccess(content.id)}
                                    onHide={handleHideContent}
                                    onDelete={handleDeleteContent}
                                    followedHashtags={followedHashtags}
                                    onFollowChange={refreshFollowedHashtags}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
