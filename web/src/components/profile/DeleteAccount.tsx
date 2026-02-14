import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DeleteAccount = () => {
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [error, setError] = useState('');
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (confirmText !== 'DELETE MY ACCOUNT') {
            setError('Please type the confirmation text exactly.');
            return;
        }

        try {
            await authAPI.deleteAccount({ password, confirmText });
            logout();
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to delete account');
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                ⚠️ Danger Zone
            </h2>

            <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-6">
                <h3 className="text-lg font-bold text-red-400 mb-2">Delete Account</h3>
                <p className="text-slate-400 mb-4">
                    Deleting your account is permanent. All your posts, votes, collections, and saved items will be wiped immediately.
                    This action cannot be undone.
                </p>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors"
                    >
                        Delete My Account
                    </button>
                    {(password || confirmText) && (
                        <span className="text-xs text-slate-500">Drafting deletion...</span>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-red-900/50 rounded-lg max-w-md w-full p-6 relative shadow-2xl">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
                        >
                            ✕
                        </button>

                        <h3 className="text-xl font-bold text-red-500 mb-4">Final Confirmation</h3>
                        <p className="text-slate-300 mb-6 text-sm">
                            To permanently delete your account, please verify your password and type
                            <span className="font-mono bg-slate-800 px-1 mx-1 text-red-300">DELETE MY ACCOUNT</span>
                            below.
                        </p>

                        <form onSubmit={handleDelete} className="space-y-4">
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Confirmation</label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="DELETE MY ACCOUNT"
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-200 outline-none focus:border-red-500"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
                                    {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded text-slate-400 hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!password || confirmText !== 'DELETE MY ACCOUNT'}
                                >
                                    Permanently Delete
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
