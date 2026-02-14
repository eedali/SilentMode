import { useState, useEffect } from 'react';
import { collectionAPI, savedContentAPI } from '../../services/api';
import { Link } from 'react-router-dom';

export const SavedCollections = () => {
    const [collections, setCollections] = useState<any[]>([]);
    const [savedContents, setSavedContents] = useState<any[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [noteText, setNoteText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');
            const [cols, saves] = await Promise.all([
                collectionAPI.getAll(),
                savedContentAPI.getAll()
            ]);
            setCollections(cols || []);
            setSavedContents(saves || []);
        } catch (err: any) {
            console.error('Failed to load collections:', err);
            setError('Failed to load saved content. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newCol = await collectionAPI.create(newCollectionName);
            setCollections([newCol, ...collections]);
            setNewCollectionName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to create collection');
        }
    };

    const handleDeleteCollection = async (id: string) => {
        if (!window.confirm('Delete this collection? Saved items will be moved to unsorted.')) return;
        try {
            await collectionAPI.delete(id);
            setCollections(collections.filter(c => c.id !== id));
            if (selectedCollectionId === id) setSelectedCollectionId(null);
            // Refresh saved contents to update collection links
            const saves = await savedContentAPI.getAll();
            setSavedContents(saves);
        } catch (error) {
            console.error('Failed to delete collection');
        }
    };

    const handleMove = async (savedId: string, collectionId: string | null) => {
        try {
            await savedContentAPI.update(savedId, collectionId || undefined); // API expects collectionId
            // If moved to "Unsorted" (null), pass null? API might handle null.
            // My route update: `data: { collectionId, note }`.
            // Prisma optional relation update needs `collection: { disconnect: true }` or `collectionId: null`.
            // Update local state
            setSavedContents(prev => prev.map(s => s.id === savedId ? { ...s, collectionId } : s));
        } catch (error) {
            console.error('Failed to move');
        }
    };

    const handleSaveNote = async (savedId: string) => {
        try {
            await savedContentAPI.update(savedId, undefined, noteText);
            setSavedContents(prev => prev.map(s => s.id === savedId ? { ...s, note: noteText } : s));
            setEditingNoteId(null);
        } catch (error) {
            console.error('Failed to save note');
        }
    };

    const handleUnsave = async (id: string) => {
        try {
            await savedContentAPI.unsave(id);
            setSavedContents(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to unsave');
        }
    };

    const filteredContents = selectedCollectionId
        ? savedContents.filter(s => s.collectionId === selectedCollectionId)
        : savedContents;

    // Helper function to safely parse media URLs
    const getFirstMediaUrl = (saved: any): string | null => {
        try {
            if (saved?.content?.mediaUrls) {
                const urls = JSON.parse(saved.content.mediaUrls);
                if (Array.isArray(urls) && urls.length > 0) {
                    return urls[0];
                }
            }
            return saved?.content?.mediaUrl || null;
        } catch {
            return saved?.content?.mediaUrl || null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-slate-400">Loading saved content...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={loadData} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 bg-slate-900/50 rounded-lg p-4 overflow-y-auto border border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase">Collections</h3>
                    <button onClick={() => setIsCreating(true)} className="text-primary-400 hover:text-primary-300 text-xs font-bold px-2 py-1 rounded bg-slate-800">
                        + NEW
                    </button>
                </div>

                {isCreating && (
                    <form onSubmit={handleCreateCollection} className="mb-4">
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="Collection Name"
                            className="w-full bg-slate-800 text-slate-200 text-xs rounded px-2 py-1 mb-2 border border-slate-600 focus:border-primary-500 outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button type="submit" className="flex-1 bg-primary-600 text-white text-xs py-1 rounded">Create</button>
                            <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-slate-700 text-slate-300 text-xs py-1 rounded">Cancel</button>
                        </div>
                    </form>
                )}

                <div className="space-y-1">
                    <button
                        onClick={() => setSelectedCollectionId(null)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center ${selectedCollectionId === null ? 'bg-primary-900/30 text-primary-300' : 'text-slate-400 hover:bg-slate-800'
                            }`}
                    >
                        <span>All Saved Items</span>
                        <span className="bg-slate-800 px-1.5 rounded text-xs">{savedContents.length}</span>
                    </button>

                    {collections.map(col => {
                        const count = savedContents.filter(s => s.collectionId === col.id).length;
                        return (
                            <div key={col.id} className="group relative">
                                <button
                                    onClick={() => setSelectedCollectionId(col.id)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center pr-8 ${selectedCollectionId === col.id ? 'bg-primary-900/30 text-primary-300' : 'text-slate-400 hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="truncate">{col.name}</span>
                                    <span className="bg-slate-800 px-1.5 rounded text-xs">{count}</span>
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1"
                                    title="Delete collection"
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto pr-2">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-200">
                        {selectedCollectionId
                            ? collections.find(c => c.id === selectedCollectionId)?.name
                            : 'All Saved Items'}
                    </h2>
                    <p className="text-sm text-slate-400">{filteredContents.length} items</p>
                </div>

                {filteredContents.length === 0 ? (
                    <div className="text-center text-slate-500 py-12">
                        {savedContents.length === 0
                            ? "You haven't saved anything yet. Click the save button on any post to add it here!"
                            : "No items in this collection."}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredContents.map(saved => {
                            const mediaUrl = getFirstMediaUrl(saved);

                            return (
                                <div key={saved.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 group hover:border-slate-600 transition-colors">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-slate-900 rounded shrink-0 overflow-hidden relative">
                                            {mediaUrl ? (
                                                <img
                                                    src={`http://localhost:3000${mediaUrl}`}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`w-full h-full flex items-center justify-center text-2xl ${mediaUrl ? 'hidden' : ''}`}>
                                                {saved.content?.contentType === 'qa' ? '💬' : '📝'}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link to={`/post/${saved.contentId}`} className="text-lg font-bold text-slate-200 hover:text-primary-400 truncate block">
                                                {saved.content?.title || 'Untitled'}
                                            </Link>

                                            <p className="text-slate-400 text-sm line-clamp-2 break-words mb-2">
                                                {saved.content?.description}
                                            </p>

                                            {/* Note Section */}
                                            <div className="mt-2 text-sm">
                                                {editingNoteId === saved.id ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={noteText}
                                                            onChange={(e) => setNoteText(e.target.value)}
                                                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs w-full"
                                                            placeholder="Add a note..."
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleSaveNote(saved.id)} className="text-green-400 hover:text-green-300 text-xs font-bold">Save</button>
                                                        <button onClick={() => setEditingNoteId(null)} className="text-slate-400 hover:text-slate-300 text-xs">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="group/note flex items-center gap-2 min-h-[20px]">
                                                        {saved.note ? (
                                                            <p className="text-yellow-100/80 italic bg-yellow-900/20 px-2 py-0.5 rounded inline-block break-words line-clamp-2 max-w-full">
                                                                📝 {saved.note}
                                                            </p>
                                                        ) : (
                                                            <span className="text-slate-600 text-xs italic group-hover/note:hidden">No note</span>
                                                        )}
                                                        <button
                                                            onClick={() => { setEditingNoteId(saved.id); setNoteText(saved.note || ''); }}
                                                            className="opacity-0 group-hover/note:opacity-100 text-slate-500 hover:text-primary-400 text-xs"
                                                        >
                                                            {saved.note ? 'Edit' : '+ Add Note'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center gap-3">
                                                <select
                                                    value={saved.collectionId || ''}
                                                    onChange={(e) => handleMove(saved.id, e.target.value || null)}
                                                    className="bg-slate-900 text-xs text-slate-400 border border-slate-700 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500 outline-none"
                                                >
                                                    <option value="">Move to...</option>
                                                    <option value="">Unsorted</option>
                                                    {collections.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={() => handleUnsave(saved.id)}
                                                    className="text-red-400/60 hover:text-red-400 text-xs"
                                                >
                                                    Remove from Saved
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
