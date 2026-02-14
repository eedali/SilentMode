import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

interface Notification {
    id: string;
    type: 'remix' | 'qa_answer';
    contentId: string;
    isRead: boolean;
    createdAt: string;
    content: {
        id: string;
        title: string;
        contentType: string;
    };
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count');
        }
    };

    // Fetch notifications when dropdown opens
    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
        } catch (error) {
            showToast('Failed to load notifications', 'error');
        }
    };

    // Poll for new notifications every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            fetchNotifications();
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        try {
            await api.put(`/notifications/${notification.id}/read`);
            setUnreadCount(prev => Math.max(0, prev - 1));
            // Update local state to mark as read
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Failed to mark as read');
        }

        // Navigate to content
        navigate(`/post/${notification.contentId}`);
        setIsOpen(false);
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            setUnreadCount(0);
            setNotifications(prev =>
                prev.map(n => ({ ...n, isRead: true }))
            );
            showToast('All notifications marked as read', 'success');
        } catch (error) {
            showToast('Failed to mark all as read', 'error');
        }
    };

    const getNotificationText = (notification: Notification) => {
        if (notification.type === 'remix') {
            return `Someone remixed your post: "${notification.content.title}"`;
        } else if (notification.type === 'qa_answer') {
            return `New answer on your Q&A: "${notification.content.title}"`;
        }
        return 'New notification';
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <button
                onClick={handleBellClick}
                className="relative p-2 hover:bg-slate-700 rounded-lg transition"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-20 max-h-96 overflow-y-auto">
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 sticky top-0">
                            <h3 className="font-bold text-slate-100">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-sm text-blue-400 hover:text-blue-300"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notification List */}
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                No notifications yet
                            </div>
                        ) : (
                            <div>
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 border-b border-slate-700 cursor-pointer hover:bg-slate-700 transition ${!notification.isRead ? 'bg-slate-750/50 border-l-4 border-l-blue-500' : ''
                                            }`}
                                    >
                                        <p className="text-sm text-slate-200">
                                            {getNotificationText(notification)}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
