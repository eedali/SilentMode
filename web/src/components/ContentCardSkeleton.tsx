export const ContentCardSkeleton = () => {
    return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-5/6 mb-2"></div>
                    <div className="h-4 bg-slate-700 rounded w-4/6"></div>
                    <div className="flex items-center gap-3 mt-4">
                        <div className="h-6 w-20 bg-slate-700 rounded-full"></div>
                        <div className="h-4 w-16 bg-slate-700 rounded"></div>
                        <div className="h-4 w-24 bg-slate-700 rounded"></div>
                    </div>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-700 flex gap-2">
                <div className="h-10 w-16 bg-slate-700 rounded-lg"></div>
                <div className="h-10 w-20 bg-slate-700 rounded-lg"></div>
                <div className="h-10 w-16 bg-slate-700 rounded-lg"></div>
                <div className="h-10 w-16 bg-slate-700 rounded-lg"></div>
            </div>
        </div>
    );
};
