import { useState, useEffect } from 'react';

interface ImageLightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export const ImageLightbox = ({ images, initialIndex, onClose }: ImageLightboxProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') handlePrevious();
            if (e.key === 'ArrowRight') handleNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 transition-colors z-10 p-2"
                aria-label="Close lightbox"
            >
                ×
            </button>

            {/* Navigation buttons */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handlePrevious();
                        }}
                        className="absolute left-4 text-white text-6xl hover:text-gray-300 transition-colors z-10 p-4 select-none"
                        aria-label="Previous image"
                    >
                        ‹
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleNext();
                        }}
                        className="absolute right-4 text-white text-6xl hover:text-gray-300 transition-colors z-10 p-4 select-none"
                        aria-label="Next image"
                    >
                        ›
                    </button>
                </>
            )}

            {/* Image */}
            <img
                src={`http://localhost:3000${images[currentIndex]}`}
                alt={`Full size ${currentIndex + 1}`}
                className="max-w-full max-h-full w-auto h-auto object-contain"
                onClick={(e) => e.stopPropagation()}
            />

            {/* Image counter */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-lg bg-black/50 px-4 py-2 rounded-lg select-none">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
};
