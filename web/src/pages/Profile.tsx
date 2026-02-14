import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { MyPosts } from '../components/profile/MyPosts';
import { SavedCollections } from '../components/profile/SavedCollections';
import { FollowedHashtags } from '../components/profile/FollowedHashtags';
import { SuperUpvoteStatus } from '../components/profile/SuperUpvoteStatus';
import { HiddenContents } from '../components/profile/HiddenContents';
import { DeleteAccount } from '../components/profile/DeleteAccount';

type Tab = 'posts' | 'saved' | 'hashtags' | 'super-upvote' | 'hidden' | 'delete';

export const Profile = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('posts');

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'posts', label: 'My Posts', icon: '📝' },
        { id: 'saved', label: 'Saved Collections', icon: '💾' },
        { id: 'hashtags', label: 'Followed Hashtags', icon: '#️⃣' },
        { id: 'super-upvote', label: 'Super Upvote', icon: '🚀' },
        { id: 'hidden', label: 'Hidden Contents', icon: '👁️' },
        { id: 'delete', label: 'Delete Account', icon: '⚠️' },
    ];

    if (!user) {
        return <div className="p-8 text-center text-slate-400">Please info login to view profile.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900">
            <Header />
            <Sidebar />
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <h1 className="text-3xl font-bold text-slate-100 mb-8 flex items-center gap-3">
                    <span className="text-4xl">👤</span>
                    <div>
                        <div>{user.username}</div>
                        <div className="text-sm font-normal text-slate-400 text-base">{user.email}</div>
                    </div>
                </h1>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 sticky top-24">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full text-left px-6 py-4 flex items-center gap-3 transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-900/50 text-primary-400 border-l-4 border-primary-500'
                                        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200 border-l-4 border-transparent'
                                        } ${tab.id === 'delete' ? 'hover:text-red-400 hover:bg-red-900/20' : ''}`}
                                >
                                    <span className="text-xl">{tab.icon}</span>
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 min-h-[500px]">
                            {activeTab === 'posts' && <MyPosts />}
                            {activeTab === 'saved' && <SavedCollections />}
                            {activeTab === 'hashtags' && <FollowedHashtags />}
                            {activeTab === 'super-upvote' && <SuperUpvoteStatus />}
                            {activeTab === 'hidden' && <HiddenContents />}
                            {activeTab === 'delete' && <DeleteAccount />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
