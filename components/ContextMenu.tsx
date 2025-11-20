'use client';

import { useEffect, useRef } from 'react';
import { Download, Edit2, Trash2, Share2, Eye } from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    file: any;
    onClose: () => void;
    onRename: (file: any) => void;
    onDelete: (file: any) => void;
    onDownload: (file: any) => void;
    onPreview: (file: any) => void;
}

export default function ContextMenu({
    x,
    y,
    file,
    onClose,
    onRename,
    onDelete,
    onDownload,
    onPreview
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position if it goes off screen
    const style = {
        top: y,
        left: x,
    };

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg py-1 w-48 animate-in fade-in zoom-in-95 duration-100"
            style={style}
        >
            <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-sm font-medium truncate">{file.name}</p>
            </div>

            <button
                onClick={() => { onPreview(file); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center space-x-2"
            >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
            </button>

            {!file.is_folder && (
                <button
                    onClick={() => { onDownload(file); onClose(); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center space-x-2"
                >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                </button>
            )}

            <button
                onClick={() => { onRename(file); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center space-x-2"
            >
                <Edit2 className="w-4 h-4" />
                <span>Rename</span>
            </button>

            <div className="border-t border-border my-1"></div>

            <button
                onClick={() => { onDelete(file); onClose(); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-destructive hover:text-destructive-foreground text-destructive flex items-center space-x-2"
            >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
            </button>
        </div>
    );
}
