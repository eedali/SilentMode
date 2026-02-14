import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AnswerCardProps {
    answer: any;
    onVote: (answerId: string, voteType: 'upvote' | 'downvote') => void;
}

export const AnswerCard = ({ answer, onVote }: AnswerCardProps) => {
    const { user } = useAuth();
    const isOwner = user?.id === answer.userId;

    // Nuclear content processing to force line breaks
    const processedText = (answer.text || '').replace(/\n/g, '  \n');

    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-4 flex gap-4">
            {/* Vote Column */}
            <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                <button
                    onClick={() => onVote(answer.id, 'upvote')}
                    disabled={isOwner}
                    title={isOwner ? 'Cannot vote on your own answer' : 'Upvote'}
                    className={`p-1 rounded-full transition-colors ${answer.userVote === 'upvote'
                        ? 'text-orange-500 bg-orange-500/10'
                        : isOwner ? 'text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-orange-400 hover:bg-slate-700'
                        }`}
                >
                    ▲
                </button>
                <span className={`font-bold text-sm ${answer.score > 0 ? 'text-orange-400' :
                    answer.score < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                    {answer.score || 0}
                </span>
                <button
                    onClick={() => onVote(answer.id, 'downvote')}
                    disabled={isOwner}
                    title={isOwner ? 'Cannot vote on your own answer' : 'Downvote'}
                    className={`p-1 rounded-full transition-colors ${answer.userVote === 'downvote'
                        ? 'text-red-500 bg-red-500/10'
                        : isOwner ? 'text-slate-600 cursor-not-allowed' : 'text-slate-500 hover:text-red-400 hover:bg-slate-700'
                        }`}
                >
                    ▼
                </button>
            </div>

            {/* Answer Content */}
            <div className="flex-1 w-full min-w-0">
                <div className="prose prose-invert max-w-none text-sm md:text-base">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                            code: ({ node, inline, className, children, ...props }: any) => {
                                if (inline) {
                                    return (
                                        <code
                                            className="bg-slate-700 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono"
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                }

                                // Block code - Nuclear fix for line breaks
                                const text = String(children).replace(/\n$/, '');
                                return (
                                    <pre className="bg-slate-900 rounded-lg p-3 my-2 overflow-x-auto border border-slate-700">
                                        <code
                                            className="text-green-400 font-mono text-sm block"
                                            style={{ whiteSpace: 'pre' }}
                                            {...props}
                                        >
                                            {text}
                                        </code>
                                    </pre>
                                );
                            },
                            blockquote: ({ node, ...props }) => (
                                <blockquote {...props} className="border-l-4 border-slate-600 pl-4 italic text-slate-400 my-2" />
                            ),
                            ul: ({ node, ...props }) => <ul {...props} className="list-disc list-inside my-2" />,
                            ol: ({ node, ...props }) => <ol {...props} className="list-decimal list-inside my-2" />,
                            a: ({ node, ...props }) => (
                                <a {...props} className="text-primary-400 hover:text-primary-300 underline underline-offset-2" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} />
                            ),
                        }}
                    >
                        {processedText}
                    </ReactMarkdown>
                </div>

                <div className="mt-4 text-xs text-slate-500 flex justify-between items-center border-t border-slate-700 pt-3">
                    <span>
                        Answered {new Date(answer.createdAt).toLocaleDateString()}
                    </span>
                    {/* Anonymity Notice removed - just timestamp is enough */}
                </div>
            </div>
        </div>
    );
};
