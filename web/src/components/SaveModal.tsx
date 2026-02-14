import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { collectionAPI, savedContentAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface SaveModalProps {
    contentId: string;
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export const SaveModal = ({ contentId, isOpen, onClose, onSaved }: SaveModalProps) => {
    const [collections, setCollections] = useState<any[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
    const [note, setNote] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadCollections();
        }
    }, [isOpen]);

    const loadCollections = async () => {
        try {
            const data = await collectionAPI.getAll();
            setCollections(data);
            // Auto-select first collection if exists
            if (data.length > 0 && !selectedCollectionId) {
                setSelectedCollectionId(data[0].id);
            }
        } catch (error) {
            console.error('Failed to load collections');
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            let collectionId = selectedCollectionId;

            // Create new collection if needed
            if (isCreatingNew && newCollectionName.trim()) {
                const newCollection = await collectionAPI.create(newCollectionName.trim());
                collectionId = newCollection.id;
            }

            // Save content
            await savedContentAPI.save(
                contentId,
                collectionId || undefined,
                note.trim() || undefined
            );

            showToast('Content saved successfully!', 'success');
            onSaved();
            onClose();
            resetForm();
        } catch (error: any) {
            showToast(error.response?.data?.error || 'Failed to save content', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedCollectionId('');
        setNote('');
        setIsCreatingNew(false);
        setNewCollectionName('');
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-md w-full p-6 relative shadow-2xl z-[101]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 text-xl"
                >
                    ✕
                </button>

                <h3 className="text-xl font-bold text-slate-200 mb-4">💾 Save to Collection</h3>

                {/* Collection Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Select Collection
                    </label>

                    {!isCreatingNew ? (
                        <div className="space-y-2">
                            <select
                                value={selectedCollectionId}
                                onChange={(e) => {
                                    if (e.target.value === 'new') {
                                        setIsCreatingNew(true);
                                    } else {
                                        setSelectedCollectionId(e.target.value);
                                    }
                                }}
                                className="w-full bg-slate-800 text-slate-200 rounded px-3 py-2 border border-slate-600 focus:border-primary-500 outline-none"
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSave();
                                    }
                                }}
                            >
                                <option value="" disabled>Select a collection...</option>
                                {collections.map(col => (
                                    <option key={col.id} value={col.id}>{col.name}</option>
                                ))}
                                <option value="new">+ Create New Collection</option>
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="Collection Name"
                                className="w-full bg-slate-800 text-slate-200 rounded px-3 py-2 border border-slate-600 focus:border-primary-500 outline-none"
                                onKeyDown={(e) => {
                                    if (e.ctrlKey && e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSave();
                                    }
                                }}
                                autoFocus
                            />
                            <button
                                onClick={() => setIsCreatingNew(false)}
                                className="text-xs text-slate-400 hover:text-slate-300 underline"
                            >
                                Cancel creating new collection
                            </button>
                        </div>
                    )}
                </div>

                {/* Note */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        Note (Optional)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add a note about this content..."
                        className="w-full bg-slate-800 text-slate-200 rounded px-3 py-2 border border-slate-600 focus:border-primary-500 outline-none h-24 resize-none"
                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === 'Enter') {
                                e.preventDefault();
                                handleSave();
                            }
                        }}
                        maxLength={500}
                    />
                    <p className="text-right text-xs text-slate-500 mt-1">{note.length}/500</p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => {
                            onClose();
                            resetForm();
                        }}
                        className="px-4 py-2 rounded text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || (!selectedCollectionId && !isCreatingNew) || (isCreatingNew && !newCollectionName.trim())}
                        className="px-4 py-2 rounded bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
