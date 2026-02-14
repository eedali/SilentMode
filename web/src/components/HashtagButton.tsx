import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hashtagAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface HashtagButtonProps {
    hashtag: string;
    isFollowed: boolean;
    onFollowChange: () => void;
    className?: string; // Optional custom className
}

export const HashtagButton = ({ hashtag, isFollowed, onFollowChange, className = '' }: HashtagButtonProps) => {
    const [localFollowed, setLocalFollowed] = useState(isFollowed);
    const pressTimer = useRef<number | null>(null); // Use number for browser timer
    const { showToast } = useToast();
    const isLongPress = useRef(false);

    // Sync local state with parent props
    useEffect(() => {
        setLocalFollowed(isFollowed);
    }, [isFollowed]);

    const handleMouseDown = () => {
        isLongPress.current = false;
        pressTimer.current = window.setTimeout(async () => {
            isLongPress.current = true;
            // Long press detected (500ms)
            try {
                if (localFollowed) {
                    await hashtagAPI.unfollow(hashtag);
                    showToast(`Unfollowed #${hashtag}`, 'success');
                } else {
                    await hashtagAPI.follow(hashtag);
                    showToast(`Following #${hashtag}`, 'success');
                }
                setLocalFollowed(!localFollowed);
                onFollowChange(); // Refresh parent state
            } catch (error) {
                showToast('Failed to update follow status', 'error');
            }
        }, 500);
    };

    const handleMouseUp = () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
            pressTimer.current = null;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isLongPress.current) {
            e.preventDefault(); // Prevent navigation on long press
        }
    };

    return (
        <Link
            to={`/?hashtag=${hashtag}`}
            className={`inline-block px-3 py-1 rounded-full text-sm transition-opacity select-none ${localFollowed ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-blue-400'
                } hover:opacity-80 ${className}`}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onClick={handleClick}
        >
            #{hashtag}
        </Link>
    );
};
