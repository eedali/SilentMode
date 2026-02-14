import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI, savedContentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SaveModal } from './SaveModal';
import { ReportModal } from './ReportModal';

interface ContentMenuProps {
    contentId: string;
    isOwner: boolean;
    isSaved?: boolean;
    onDelete?: () => void;
    onHide?: () => void;
}

export const ContentMenu = ({ contentId, isOwner, isSaved: initialSaved = false, onDelete, onHide }: ContentMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Check if content is saved on mount
    useEffect(() => {
        checkSavedStatus();
    }, [contentId]);

    const checkSavedStatus = async () => {
        try {
            const savedItems = await savedContentAPI.getAll();
            const saved = savedItems.some((item: any) => item.contentId === contentId);
            setIsSaved(saved);
        } catch (error) {
            // Silently fail
        }
    };

    const handleEdit = () => {
        navigate(`/post/${contentId}`);
        // Edit modal will be handled in PostDetail page
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        try {
            await contentAPI.delete(contentId);
            showToast('Post deleted successfully', 'success');
            onDelete?.();
        } catch (error) {
            showToast('Failed to delete post', 'error');
        }
        setIsOpen(false);
    };

    const handleHide = async () => {
        try {
            await contentAPI.hideContent(contentId);
            showToast('Post hidden from your feed', 'success');
            onHide?.();
        } catch (error) {
            showToast('Failed to hide post', 'error');
        }
        setIsOpen(false);
    };

    const handleSave = async () => {
        if (isSaved) {
            // Unsave functionality
            try {
                const savedItems = await savedContentAPI.getAll();
                const savedItem = savedItems.find((item: any) => item.contentId === contentId);
                if (savedItem) {
                    await savedContentAPI.unsave(savedItem.id);
                    setIsSaved(false);
                    showToast('Removed from saved', 'info');
                }
            } catch (error) {
                showToast('Failed to unsave', 'error');
            }
        } else {
            // Open save modal
            setShowSaveModal(true);
        }
        setIsOpen(false);
    };



    return (
        <div className="relative">
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className="text-slate-400 hover:text-slate-200 p-2"
            >
                ⋯
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    />

                    <div className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 min-w-[160px]">
                        {/* Use buttons with stopPropagation to prevent card click */}
                        {isOwner && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300 first:rounded-t-lg"
                                >
                                    ✏️ Edit
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-700 text-red-400"
                                >
                                    🗑️ Delete
                                </button>
                            </>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); handleSave(); }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300"
                        >
                            {isSaved ? '⬤' : '○'} {isSaved ? 'Saved' : 'Save'}
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); handleHide(); }}
                            className="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-300"
                        >
                            👁️ Hide
                        </button>

                        {!isOwner && (
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowReportModal(true); }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-700 text-yellow-400 last:rounded-b-lg"
                            >
                                🚩 Report
                            </button>
                        )}
                    </div>
                </>
            )}

            {showReportModal && (
                <ReportModal
                    contentId={contentId}
                    onClose={() => setShowReportModal(false)}
                    onReported={() => {
                        showToast('Content reported', 'success');
                        setShowReportModal(false);
                        setIsOpen(false);
                    }}
                />
            )}

            {/* Save Modal */}
            <SaveModal
                contentId={contentId}
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSaved={() => {
                    setIsSaved(true);
                    checkSavedStatus();
                }}
            />
        </div>
    );
};
