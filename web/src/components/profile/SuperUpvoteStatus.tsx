import { useState, useEffect } from 'react';
import { voteAPI } from '../../services/api';

export const SuperUpvoteStatus = () => {
    const [status, setStatus] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!status || !status.used || !status.resetAt) return;

            const target = new Date(status.resetAt).getTime();
            const now = new Date().getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft('00:00:00');
                // Could trigger refresh
                return;
            }

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);

    const loadData = async () => {
        try {
            const data = await voteAPI.getSuperUpvoteStatus();
            setStatus(data);
        } catch (error) {
            console.error('Failed to load status');
        }
    };

    if (!status) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-200">Super Upvote Status</h2>

            <div className={`p-6 rounded-lg border text-center relative overflow-hidden ${status.used
                    ? 'bg-slate-700/50 border-slate-600'
                    : 'bg-green-900/20 border-green-700/50'
                }`}>
                {!status.used ? (
                    <div>
                        <div className="text-4xl mb-4">✨</div>
                        <h3 className="text-2xl font-bold text-green-400 mb-2">Available Now!</h3>
                        <p className="text-green-200/80">You have 1 Super Upvote available to use today.</p>
                        <p className="text-sm mt-4 text-slate-400 max-w-md mx-auto">
                            Using a Super Upvote gives 5 points instantly and boosts content visibility significantly.
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="text-4xl mb-4 text-slate-500">⏳</div>
                        <h3 className="text-xl font-semibold text-slate-300 mb-2">Used Today</h3>

                        {status.contentTitle && (
                            <div className="bg-slate-800/50 rounded p-3 mb-4 inline-block text-left max-w-sm w-full border border-slate-700">
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Used on:</span>
                                <div className="text-primary-400 truncate font-medium">
                                    {status.contentTitle}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                    {new Date(status.usedAt).toLocaleTimeString()}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <p className="text-sm text-slate-400 mb-2 uppercase tracking-widest font-bold">Resets in</p>
                            <div className="text-4xl font-mono text-slate-200 tracking-wider">
                                {timeLeft}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
