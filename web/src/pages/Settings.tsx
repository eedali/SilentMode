import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

type SettingsTab = 'account' | 'notifications' | 'privacy';

interface UserSettings {
    username: string;
    email: string;
    notifyOnRemix: boolean;
    notifyOnQAAnswer: boolean;
    hideArchivedPosts: boolean;
    autoLoadImages: boolean;
    showNSFW: boolean;
    blurNSFW: boolean;
}

export default function Settings() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('account');
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { user, updateUser } = useAuth();

    // Account form
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                setSettings(response.data);
                setUsername(response.data.username);
                setEmail(response.data.email);
            } catch (error) {
                showToast('Failed to load settings', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleUpdateUsername = async () => {
        try {
            await api.put('/settings/username', { username });
            showToast('Username updated', 'success');
            if (user) {
                updateUser({ ...user, username });
            }
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update username', 'error');
        }
    };

    const handleUpdateEmail = async () => {
        try {
            await api.put('/settings/email', { email });
            showToast('Email updated (verification sent)', 'success');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update email', 'error');
        }
    };

    const handleUpdatePassword = async () => {
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        try {
            await api.put('/settings/password', { currentPassword, newPassword });
            showToast('Password updated', 'success');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to update password', 'error');
        }
    };

    const handleToggleNotification = async (key: 'notifyOnRemix' | 'notifyOnQAAnswer') => {
        const newValue = !settings![key];
        try {
            await api.put('/settings/notifications', {
                [key]: newValue
            });
            setSettings({ ...settings!, [key]: newValue });
            showToast('Notification settings updated', 'success');
        } catch (error) {
            showToast('Failed to update settings', 'error');
        }
    };

    const handleTogglePrivacy = async (key: keyof UserSettings) => {
        const newValue = !settings![key];
        try {
            await api.put('/settings/privacy', {
                [key]: newValue
            });
            setSettings({ ...settings!, [key]: newValue });
            showToast('Privacy settings updated', 'success');
        } catch (error) {
            showToast('Failed to update settings', 'error');
        }
    };

    const handleDownloadData = async () => {
        try {
            const response = await api.get('/settings/download-data', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `silentmode-data-${user?.id}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            showToast('Data downloaded', 'success');
        } catch (error) {
            showToast('Failed to download data', 'error');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100">
            <Header />
            <div className="flex">
                <Sidebar />
                <div className="flex-1 p-6">
                    <div className="max-w-5xl mx-auto">
                        <h1 className="text-3xl font-bold mb-6">⚙️ Settings</h1>

                        <div className="flex gap-6">


                            {/* Right Panel - Content */}
                            <div className="flex-1 bg-slate-800 rounded-lg p-6">
                                {activeTab === 'account' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

                                        {/* Username */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium mb-2">Username</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={username}
                                                    onChange={e => setUsername(e.target.value)}
                                                    className="flex-1 bg-slate-700 rounded-lg px-4 py-2"
                                                />
                                                <button
                                                    onClick={handleUpdateUsername}
                                                    className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700"
                                                >
                                                    Update
                                                </button>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium mb-2">Email</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    className="flex-1 bg-slate-700 rounded-lg px-4 py-2"
                                                />
                                                <button
                                                    onClick={handleUpdateEmail}
                                                    className="px-4 py-2 bg-primary-600 rounded-lg hover:bg-primary-700"
                                                >
                                                    Update
                                                </button>
                                            </div>
                                        </div>

                                        {/* Password */}
                                        <div className="border-t border-slate-700 pt-6">
                                            <h3 className="text-xl font-bold mb-4">Change Password</h3>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">Current Password</label>
                                                <input
                                                    type="password"
                                                    value={currentPassword}
                                                    onChange={e => setCurrentPassword(e.target.value)}
                                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">New Password</label>
                                                <input
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={e => setNewPassword(e.target.value)}
                                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                                />
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                                                <input
                                                    type="password"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    className="w-full bg-slate-700 rounded-lg px-4 py-2"
                                                />
                                            </div>

                                            <button
                                                onClick={handleUpdatePassword}
                                                className="px-6 py-2 bg-primary-600 rounded-lg hover:bg-primary-700"
                                            >
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-6">Notification Settings</h2>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium">Remix Notifications</h3>
                                                    <p className="text-sm text-slate-400">Get notified when someone remixes your content</p>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleNotification('notifyOnRemix')}
                                                    className={`w-12 h-6 rounded-full transition ${settings?.notifyOnRemix ? 'bg-green-600' : 'bg-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings?.notifyOnRemix ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium">Q&A Answer Notifications</h3>
                                                    <p className="text-sm text-slate-400">Get notified when someone answers your Q&A</p>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleNotification('notifyOnQAAnswer')}
                                                    className={`w-12 h-6 rounded-full transition ${settings?.notifyOnQAAnswer ? 'bg-green-600' : 'bg-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings?.notifyOnQAAnswer ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'privacy' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-6">Privacy Settings</h2>

                                        <div className="space-y-4 mb-6">
                                            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium">Hide Archived Posts</h3>
                                                    <p className="text-sm text-slate-400">Others can't see your posts with negative score</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTogglePrivacy('hideArchivedPosts')}
                                                    className={`w-12 h-6 rounded-full transition ${settings?.hideArchivedPosts ? 'bg-green-600' : 'bg-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings?.hideArchivedPosts ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium">Auto-load Images</h3>
                                                    <p className="text-sm text-slate-400">Automatically load images in feed</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTogglePrivacy('autoLoadImages')}
                                                    className={`w-12 h-6 rounded-full transition ${settings?.autoLoadImages ? 'bg-green-600' : 'bg-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings?.autoLoadImages ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium">Show NSFW Content</h3>
                                                    <p className="text-sm text-slate-400">Display sensitive/adult content in feed</p>
                                                </div>
                                                <button
                                                    onClick={() => handleTogglePrivacy('showNSFW')}
                                                    className={`w-12 h-6 rounded-full transition ${settings?.showNSFW ? 'bg-green-600' : 'bg-slate-600'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings?.showNSFW ? 'translate-x-7' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            </div>

                                            {settings?.showNSFW && (
                                                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg ml-8">
                                                    <div>
                                                        <h3 className="font-medium">Blur NSFW Content</h3>
                                                        <p className="text-sm text-slate-400">Show NSFW content with blur effect</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTogglePrivacy('blurNSFW')}
                                                        className={`w-12 h-6 rounded-full transition ${settings?.blurNSFW ? 'bg-green-600' : 'bg-slate-600'
                                                            }`}
                                                    >
                                                        <div className={`w-4 h-4 bg-white rounded-full transition transform ${settings?.blurNSFW ? 'translate-x-7' : 'translate-x-1'
                                                            }`} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-700 pt-6">
                                            <h3 className="text-xl font-bold mb-4">Data & Privacy</h3>

                                            <button
                                                onClick={handleDownloadData}
                                                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 mb-4"
                                            >
                                                📥 Download My Data
                                            </button>
                                            <p className="text-sm text-slate-400 mb-6">
                                                Download all your data in JSON format (GDPR compliance)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Sidebar - Categories */}
                            <div className="w-64 bg-slate-800 rounded-lg p-4 h-fit">
                                <button
                                    onClick={() => setActiveTab('account')}
                                    className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition ${activeTab === 'account' ? 'bg-primary-600 text-white' : 'hover:bg-slate-700'
                                        }`}
                                >
                                    📱 Account
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition ${activeTab === 'notifications' ? 'bg-primary-600 text-white' : 'hover:bg-slate-700'
                                        }`}
                                >
                                    🔔 Notifications
                                </button>
                                <button
                                    onClick={() => setActiveTab('privacy')}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition ${activeTab === 'privacy' ? 'bg-primary-600 text-white' : 'hover:bg-slate-700'
                                        }`}
                                >
                                    🔒 Privacy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
