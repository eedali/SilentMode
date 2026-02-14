import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';


export const Header = () => {
    const { user, logout } = useAuth();

    return (
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center">
                        <img
                            src="/SM_logo_500px.png"
                            srcSet="
                                /SM_logo_200px.png 200w,
                                /SM_logo_500px.png 500w,
                                /SM_logo_750px.png 750w
                            "
                            sizes="(max-width: 640px) 200px, (max-width: 1024px) 500px, 750px"
                            alt="SilentMode"
                            className="h-10 w-auto"
                        />
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <>


                            <Link
                                to="/create"
                                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors font-medium flex items-center"
                            >
                                ➕ New Post
                            </Link>

                            <NotificationBell />

                            <div className="flex items-center gap-3">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                    title="My Profile"
                                >
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-slate-200">@{user.username}</p>
                                        <p className="text-xs text-slate-400">{user.contentCount || 0} posts</p>
                                    </div>
                                    <div className="text-slate-400 hover:text-primary-400 text-xl">
                                        👤
                                    </div>
                                </Link>

                                <button
                                    onClick={logout}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                    title="Sign Out"
                                >
                                    🚪
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
