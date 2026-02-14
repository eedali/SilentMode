import { useState } from 'react';
import { voteAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface VoteButtonsProps {
    contentId: string;
    contentUserId: string;
    userVote?: 'upvote' | 'downvote' | 'super_upvote' | null;
    onVoteSuccess: () => void;
}

export const VoteButtons = ({ contentId, contentUserId, userVote, onVoteSuccess }: VoteButtonsProps) => {
    const { user, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Hide voting for own content
    if (user?.id === contentUserId) {
        return (
            <div className="text-slate-400 italic text-sm">
                Your content
            </div>
        );
    }

    // Check if user has given super upvote
    const hasSuperUpvoted = userVote === 'super_upvote';

    const handleVote = async (voteType: 'upvote' | 'downvote' | 'super_upvote') => {
        if (!user) return;

        // Prevent any votes if super upvote was already given
        if (hasSuperUpvoted) {
            showToast('Super upvote is permanent and cannot be changed', 'info');
            return;
        }

        setLoading(true);

        try {
            await voteAPI.vote({ contentId, voteType });
            await refreshProfile(); // Refresh super upvote status
            onVoteSuccess();
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Vote failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSuperUpvoteClick = () => {
        if (hasSuperUpvoted) {
            showToast('You already gave a Super Upvote to this content', 'info');
            return;
        }
        if (user?.superUpvoteUsedToday) {
            showToast("You've already used your super upvote today!", 'info');
            return;
        }
        handleVote('super_upvote');
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleVote('upvote')}
                disabled={loading || hasSuperUpvoted}
                className={`p-2 rounded-lg transition-colors ${hasSuperUpvoted
                        ? 'opacity-30 cursor-not-allowed bg-slate-800'
                        : userVote === 'upvote'
                            ? 'bg-green-600 ring-2 ring-green-400 text-white'
                            : 'bg-transparent border-2 border-slate-600 hover:border-green-500 text-slate-300 hover:text-green-400'
                    } ${loading ? 'opacity-50' : ''}`}
                title={hasSuperUpvoted ? 'You gave a Super Upvote to this content' : 'Upvote (+1)'}
            >
                👍
            </button>

            <button
                onClick={() => handleVote('downvote')}
                disabled={loading || hasSuperUpvoted}
                className={`p-2 rounded-lg transition-colors ${hasSuperUpvoted
                        ? 'opacity-30 cursor-not-allowed bg-slate-800'
                        : userVote === 'downvote'
                            ? 'bg-red-600 ring-2 ring-red-400 text-white'
                            : 'bg-transparent border-2 border-slate-600 hover:border-red-500 text-slate-300 hover:text-red-400'
                    } ${loading ? 'opacity-50' : ''}`}
                title={hasSuperUpvoted ? 'You gave a Super Upvote to this content' : 'Downvote (-0.33)'}
            >
                👎
            </button>

            <button
                onClick={handleSuperUpvoteClick}
                disabled={loading || user?.superUpvoteUsedToday || hasSuperUpvoted}
                className={`p-2 rounded-lg transition-colors ml-2 ${hasSuperUpvoted
                        ? 'bg-yellow-600 ring-2 ring-yellow-400 cursor-not-allowed'
                        : user?.superUpvoteUsedToday
                            ? 'bg-slate-700 opacity-50 cursor-not-allowed'
                            : 'bg-transparent border-2 border-slate-600 hover:border-yellow-500'
                    } ${loading ? 'opacity-50' : ''}`}
                title={
                    hasSuperUpvoted
                        ? 'You gave a Super Upvote to this content (permanent)'
                        : user?.superUpvoteUsedToday
                            ? 'Super upvote used today'
                            : 'Super Upvote (+10)'
                }
            >
                ⭐
            </button>


        </div>
    );
};
