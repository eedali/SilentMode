import { useState } from 'react';
import { contentAPI } from '../services/api';

interface AnswerInputProps {
    contentId: string;
    onAnswered: () => void;
}

export const AnswerInput = ({ contentId, onAnswered }: AnswerInputProps) => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!text.trim()) return;

        setLoading(true);
        try {
            await contentAPI.addAnswer(contentId, text);
            setText('');
            onAnswered();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit answer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 rounded-lg p-6 mb-8 border border-slate-700">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Your Answer</h3>
            {error && <div className="text-red-400 mb-2">{error}</div>}
            <form onSubmit={handleSubmit}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                            e.preventDefault();
                            if (!text.trim()) return;
                            handleSubmit(e);
                        }
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                    rows={4}
                    placeholder="Write your answer here... (Ctrl+Enter to submit)"
                    maxLength={500}
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{text.length}/500</span>
                    <button
                        type="submit"
                        disabled={loading || !text.trim()}
                        className="bg-primary-600 hover:bg-primary-700 disabled:bg-slate-700 text-white px-6 py-2 rounded-lg transition-colors font-medium"
                    >
                        {loading ? 'Submitting...' : 'Post Answer'}
                    </button>
                </div>
            </form>
        </div>
    );
};
