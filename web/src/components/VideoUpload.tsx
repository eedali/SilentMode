import { useState } from 'react';
import api from '../services/api'; // Using api service for auth headers
import { useToast } from '../context/ToastContext';

interface VideoUploadProps {
    onVideosUploaded: (urls: string[]) => void;
    maxVideos?: number;
}

export default function VideoUpload({ onVideosUploaded, maxVideos = 3 }: VideoUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [videos, setVideos] = useState<string[]>([]);
    const { showToast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (files.length === 0) return;

        if (videos.length + files.length > maxVideos) {
            showToast(`Maximum ${maxVideos} videos allowed`, 'error');
            return;
        }

        // Check file sizes
        for (const file of files) {
            if (file.size > 500 * 1024 * 1024) {
                showToast(`${file.name} is too large. Max 500MB per video.`, 'error');
                return;
            }
        }

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => formData.append('videos', file));

        try {
            const response = await api.post('/upload/videos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const newVideos = [...videos, ...response.data.urls];
            setVideos(newVideos);
            onVideosUploaded(newVideos);
            showToast('Videos uploaded successfully', 'success');
        } catch (error: any) {
            console.error('Video upload error:', error);
            showToast(error.response?.data?.error || 'Failed to upload videos', 'error');
        } finally {
            setUploading(false);
        }
    };

    const removeVideo = (index: number) => {
        const newVideos = videos.filter((_, i) => i !== index);
        setVideos(newVideos);
        onVideosUploaded(newVideos);
    };

    return (
        <div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                    Videos (Max {maxVideos}, 500MB each)
                </label>
                <p className="text-xs text-slate-400 mb-3">
                    Supported formats: MP4, WebM, MOV, AVI
                </p>

                <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
                    multiple
                    onChange={handleFileChange}
                    disabled={uploading || videos.length >= maxVideos}
                    className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer"
                />
            </div>

            {uploading && (
                <div className="mb-4 text-center">
                    <p className="text-primary-400">Uploading videos...</p>
                </div>
            )}

            {videos.length > 0 && (
                <div className="grid grid-cols-1 gap-4 mb-4">
                    {videos.map((url, index) => (
                        <div key={index} className="relative bg-black rounded-lg overflow-hidden flex justify-center">
                            <video
                                src={`http://localhost:3000${url}`}
                                controls
                                className="rounded-lg"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '400px',
                                    width: 'auto',
                                    height: 'auto'
                                }}
                            />
                            <button
                                onClick={() => removeVideo(index)}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
