import { useState } from 'react';
import api from '../services/api';

interface ReportModalProps {
    contentId: string;
    onClose: () => void;
    onReported: () => void;
}

export const ReportModal = ({ contentId, onClose, onReported }: ReportModalProps) => {
    const [loading, setLoading] = useState(false);

    const [reason, setReason] = useState('');
    const handleReport = async () => {
        setLoading(true);
        try {
            await api.post(`/contents/${contentId}/report`, { reason });
            onReported();
        } catch (error) {
            console.error('Failed to report content', error);
            // Optionally show error toast if needed, but usually silent failure for report is okay or handled by parent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-lg max-w-sm w-full p-6 border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-2">Report Content</h3>
                <p className="text-slate-300 mb-6">
                    Are you sure you want to report this content? This action cannot be undone.
                </p>

                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Optional: Explain why you're reporting this... (max 500 characters)"
                    maxLength={500}
                    rows={4}
                    onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                            e.preventDefault();
                            handleReport();
                        }
                    }}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded p-3 text-slate-200 text-sm mb-6 outline-none focus:ring-1 focus:ring-red-500 resize-none"
                />

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleReport}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
                        Report
                    </button>
                </div>
            </div>
        </div>
    );
};
