'use client';

import { X, Download, File, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface FilePreviewProps {
    file: any;
    token: string;
    onClose: () => void;
}

export default function FilePreview({ file, token, onClose }: FilePreviewProps) {
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        console.log('FilePreview mounted', { fileId: file.id, token: token ? 'Present' : 'Missing' });
        let active = true;
        const fetchFile = async () => {
            try {
                setLoading(true);
                setError(false);
                console.log('Fetching file...', `/api/files/download/${file.id}`);
                const response = await fetch(`/api/files/download/${file.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log('Fetch response status:', response.status);
                if (!response.ok) {
                    const text = await response.text();
                    console.error('Fetch failed:', text);
                    throw new Error('Download failed');
                }

                const blob = await response.blob();
                if (active) {
                    const url = URL.createObjectURL(blob);
                    setObjectUrl(url);
                }
            } catch (err) {
                console.error(err);
                if (active) {
                    setError(true);
                    toast.error('Failed to load preview');
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchFile();

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [file.id, token]);

    const isImage = file.mime_type.startsWith('image/');
    const isVideo = file.mime_type.startsWith('video/');
    const isAudio = file.mime_type.startsWith('audio/');
    const isPDF = file.mime_type === 'application/pdf';

    // For the download button, we still need to fetch and download manually to send headers
    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/files/download/${file.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Download started');
        } catch (err) {
            toast.error('Download failed');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 text-white bg-black/50 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-medium truncate max-w-xl">{file.name}</h2>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </div>
                )}

                {!loading && !error && objectUrl && (
                    <>
                        {isImage && (
                            <img
                                src={objectUrl}
                                alt={file.name}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            />
                        )}

                        {isVideo && (
                            <video
                                src={objectUrl}
                                controls
                                autoPlay
                                className="max-w-full max-h-full rounded-lg shadow-2xl"
                            />
                        )}

                        {isAudio && (
                            <div className="bg-white/10 p-12 rounded-2xl backdrop-blur-md text-center">
                                <div className="text-6xl mb-6">🎵</div>
                                <audio src={objectUrl} controls className="w-96" />
                            </div>
                        )}

                        {isPDF && (
                            <iframe
                                src={objectUrl}
                                className="w-full h-full bg-white rounded-lg shadow-2xl"
                            />
                        )}
                    </>
                )}

                {(!loading && (error || (!isImage && !isVideo && !isAudio && !isPDF))) && (
                    <div className="text-center text-white">
                        <div className="bg-white/10 p-8 rounded-full inline-block mb-6">
                            <File className="w-16 h-16" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">
                            {error ? 'Preview failed to load' : 'Preview not available'}
                        </h3>
                        <p className="text-gray-400 mb-6">
                            {error ? 'There was an error loading this file.' : 'This file type cannot be previewed directly.'}
                        </p>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                            <span>Download File</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
