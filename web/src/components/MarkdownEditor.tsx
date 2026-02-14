import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
}

export const MarkdownEditor = ({ value, onChange, placeholder, rows = 8 }: MarkdownEditorProps) => {
    const [showPreview, setShowPreview] = useState(false);

    const insertFormatting = (before: string, after: string = '') => {
        const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    const toolbarButtons = [
        { label: 'B', action: () => insertFormatting('**', '**'), title: 'Bold' },
        { label: 'I', action: () => insertFormatting('*', '*'), title: 'Italic' },
        { label: 'Link', action: () => insertFormatting('[', '](url)'), title: 'Link' },
        { label: 'H1', action: () => insertFormatting('# '), title: 'Heading 1' },
        { label: 'H2', action: () => insertFormatting('## '), title: 'Heading 2' },
        { label: '-  List', action: () => insertFormatting('- '), title: 'Bullet List' },
        { label: '1. List', action: () => insertFormatting('1. '), title: 'Numbered List' },
        { label: '> Quote', action: () => insertFormatting('> '), title: 'Quote' },
    ];

    return (
        <div className="space-y-2">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-slate-800 border border-slate-700 rounded-t-lg flex-wrap">
                {toolbarButtons.map((btn, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={btn.action}
                        title={btn.title}
                        className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    >
                        {btn.label}
                    </button>
                ))}

                <div className="flex-1"></div>

                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${showPreview
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                >
                    {showPreview ? 'Edit' : 'Preview'}
                </button>
            </div>

            {/* Editor or Preview */}
            {showPreview ? (
                <div className="bg-slate-700 border border-slate-600 rounded-b-lg p-4 min-h-[200px]">
                    <div className="prose prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {value || '*Nothing to preview*'}
                        </ReactMarkdown>
                    </div>
                </div>
            ) : (
                <textarea
                    id="markdown-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    className="w-full bg-slate-700 border border-slate-600 rounded-b-lg px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none font-mono text-sm"
                />
            )}
        </div>
    );
};
