import { useState } from 'react';
import { uploadAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

interface ImageUploadProps {
    onImagesChange: (urls: string[], filenames: string[]) => void;
    maxImages?: number;
}

export const ImageUpload = ({ onImagesChange, maxImages = 5 }: ImageUploadProps) => {
    const [images, setImages] = useState<Array<{ url: string; filename: string; preview: string }>>([]);
    const [uploading, setUploading] = useState(false);
    const { showToast } = useToast();

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);

        if (images.length + files.length > maxImages) {
            showToast(`Maximum ${maxImages} images allowed`, 'error');
            return;
        }

        for (const file of files) {
            // Validate each file
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showToast(`${file.name}: Only image files are allowed`, 'error');
                continue;
            }

            if (file.size > 30 * 1024 * 1024) {
                showToast(`${file.name}: Image size must be less than 30MB`, 'error');
                continue;
            }

            // Upload
            setUploading(true);
            try {
                const response = await uploadAPI.uploadImage(file);

                // Create preview
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newImage = {
                        url: response.url,
                        filename: response.filename,
                        preview: reader.result as string,
                    };

                    setImages(prev => {
                        const updated = [...prev, newImage];
                        onImagesChange(
                            updated.map(img => img.url),
                            updated.map(img => img.filename)
                        );
                        return updated;
                    });
                };
                reader.readAsDataURL(file);
            } catch (error: any) {
                showToast(`Failed to upload ${file.name}`, 'error');
            } finally {
                setUploading(false);
            }
        }
    };

    const removeImage = async (index: number) => {
        const image = images[index];
        try {
            await uploadAPI.deleteImage(image.filename);
        } catch (error) {
            console.error('Failed to delete temp file');
        }

        setImages(prev => {
            const updated = prev.filter((_, i) => i !== index);
            onImagesChange(
                updated.map(img => img.url),
                updated.map(img => img.filename)
            );
            return updated;
        });
        showToast('Image removed', 'info');
    };

    return (
        <div className="space-y-3">
            {/* Upload button */}
            {images.length < maxImages && (
                <label className="block">
                    <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        multiple
                        className="hidden"
                    />
                    <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 transition-colors">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400">Uploading...</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className="text-4xl">📷</div>
                                <p className="text-slate-300 font-medium">
                                    Click to upload images ({images.length}/{maxImages})
                                </p>
                                <p className="text-xs text-slate-500">PNG, JPG, JPEG, GIF, WEBP up to 30MB</p>
                            </div>
                        )}
                    </div>
                </label>
            )}

            {/* Image previews */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    {images.map((image, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden border border-slate-700">
                            <img
                                src={image.preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-48 object-cover bg-slate-900"
                            />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
