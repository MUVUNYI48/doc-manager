'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Folder,
  File,
  FileText,
  Image as ImageIcon,
  Music,
  Video,
  Download,
  Trash2,
  Upload,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  Home,
  MoreVertical,
  FileCode,
  FileArchive
} from 'lucide-react';
import { toast } from 'sonner';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ContextMenu from './ContextMenu';
import FilePreview from './FilePreview';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FileItem {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  is_folder: boolean;
  created_at: string;
}

interface FileExplorerProps {
  token: string;
}

export default function FileExplorer({ token }: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null, name: string }[]>([{ id: null, name: 'My Drive' }]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);

  // New State for Drive Features
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const fetchFiles = useCallback(async (parentId: string | null = null, search: string = '') => {
    try {
      setLoading(true);
      let url = '';
      if (search) {
        url = `/api/files/search?q=${encodeURIComponent(search)}`;
      } else {
        url = `/api/files/list${parentId ? `?parentId=${parentId}` : ''}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch files');

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        setIsSearching(true);
        fetchFiles(null, searchQuery);
      } else {
        setIsSearching(false);
        fetchFiles(currentFolder);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, currentFolder, fetchFiles]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    const uploadPromise = async () => {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder) formData.append('parentId', currentFolder);

        const res = await fetch('/api/files/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
      }
      fetchFiles(currentFolder);
    };

    toast.promise(uploadPromise(), {
      loading: 'Uploading files...',
      success: 'Files uploaded successfully',
      error: 'Error uploading files'
    });

    try {
      await uploadPromise();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpload(e.target.files);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const createPromise = async () => {
      const res = await fetch('/api/files/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder
        })
      });

      if (!res.ok) throw new Error('Failed to create folder');

      setNewFolderName('');
      setShowNewFolderModal(false);
      fetchFiles(currentFolder);
    };

    toast.promise(createPromise(), {
      loading: 'Creating folder...',
      success: 'Folder created',
      error: 'Failed to create folder'
    });
  };

  const handleDelete = async (file: FileItem) => {
    const deletePromise = async () => {
      const res = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: file.id })
      });

      if (!res.ok) throw new Error('Failed to delete item');
      fetchFiles(currentFolder);
    };

    toast.promise(deletePromise(), {
      loading: 'Deleting...',
      success: 'Item deleted',
      error: 'Failed to delete item'
    });
  };

  const handleRename = async (file: FileItem) => {
    const newName = prompt('Enter new name:', file.name);
    if (!newName || newName === file.name) return;

    const renamePromise = async () => {
      const res = await fetch('/api/files/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: file.id, name: newName })
      });

      if (!res.ok) throw new Error('Failed to rename item');
      fetchFiles(currentFolder);
    };

    toast.promise(renamePromise(), {
      loading: 'Renaming...',
      success: 'Item renamed',
      error: 'Failed to rename item'
    });
  };

  const handleDownload = (file: FileItem) => {
    const link = document.createElement('a');
    link.href = `/api/files/download/${file.id}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
    setSearchQuery(''); // Clear search when navigating
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[newBreadcrumbs.length - 1].id);
    setSearchQuery('');
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: FileItem, className?: string) => {
    const props = { className: cn("text-gray-500", className) };

    if (file.is_folder) return <Folder {...props} className={cn("text-blue-500 fill-blue-500/20", className)} />;

    const type = file.mime_type.split('/')[0];
    if (file.mime_type.includes('pdf')) return <FileText {...props} className={cn("text-red-500", className)} />;
    if (file.mime_type.includes('zip') || file.mime_type.includes('compressed')) return <FileArchive {...props} className={cn("text-yellow-600", className)} />;
    if (file.mime_type.includes('json') || file.mime_type.includes('javascript') || file.mime_type.includes('html')) return <FileCode {...props} className={cn("text-green-600", className)} />;

    switch (type) {
      case 'image': return <ImageIcon {...props} className={cn("text-purple-500", className)} />;
      case 'video': return <Video {...props} className={cn("text-pink-500", className)} />;
      case 'audio': return <Music {...props} className={cn("text-cyan-500", className)} />;
      case 'text': return <FileText {...props} />;
      default: return <File {...props} />;
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-background text-foreground relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-center p-8 bg-background/80 rounded-xl shadow-xl">
            <Upload className="w-16 h-16 text-primary mx-auto mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-primary">Drop files to upload</h3>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b px-6 py-4 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-fit">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Folder className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 hidden sm:block">
              CloudStorage
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/50 border-transparent focus:bg-background focus:border-primary rounded-lg outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 min-w-fit">
            <div className="flex bg-secondary rounded-lg p-1 mr-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded-md transition-all",
                  viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                title="List View"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowNewFolderModal(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              disabled={uploading}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        {!isSearching && (
          <div className="flex items-center space-x-2 mt-6 text-sm overflow-x-auto pb-2 scrollbar-hide">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center whitespace-nowrap">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />}
                <button
                  onClick={() => navigateToBreadcrumb(index)}
                  className={cn(
                    "flex items-center px-2 py-1 rounded-md transition-colors",
                    index === breadcrumbs.length - 1
                      ? "font-semibold text-foreground bg-secondary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {index === 0 && <Home className="w-4 h-4 mr-1" />}
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
        )}
        {isSearching && (
          <div className="mt-6 text-sm text-muted-foreground">
            Search results for "{searchQuery}"
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-secondary aspect-square rounded-xl mb-2"></div>
                <div className="h-4 bg-secondary rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <div className="bg-secondary/50 p-6 rounded-full mb-4">
              <Folder className="w-12 h-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">
              {isSearching ? 'No results found' : 'This folder is empty'}
            </h3>
            <p className="text-sm">
              {isSearching ? 'Try a different search term' : 'Upload files or create folders to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {files.map(file => (
              <div
                key={file.id}
                className="group relative p-4 rounded-xl hover:bg-accent/50 cursor-pointer border border-transparent hover:border-border transition-all"
                onDoubleClick={() => file.is_folder ? navigateToFolder(file.id, file.name) : setPreviewFile(file)}
                onContextMenu={(e) => handleContextMenu(e, file)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-3 flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                    {getFileIcon(file, "w-12 h-12")}
                  </div>
                  <div className="w-full">
                    <div className="text-sm font-medium text-foreground truncate mb-1" title={file.name}>
                      {file.name}
                    </div>
                    {!file.is_folder && (
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Menu Overlay (Mobile/Quick Access) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, file);
                    }}
                    className="p-1.5 bg-background/80 backdrop-blur-sm rounded-md shadow-sm hover:bg-background text-foreground border border-border"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary text-muted-foreground font-medium">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 w-32">Size</th>
                  <th className="px-4 py-3 w-48">Date Modified</th>
                  <th className="px-4 py-3 w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {files.map(file => (
                  <tr
                    key={file.id}
                    className="hover:bg-accent/50 transition-colors cursor-pointer group"
                    onDoubleClick={() => file.is_folder ? navigateToFolder(file.id, file.name) : setPreviewFile(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file, "w-5 h-5")}
                        <span className="font-medium text-foreground">{file.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {!file.is_folder ? formatFileSize(file.size) : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(file.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, file);
                        }}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileInputChange}
        className="hidden"
      />

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card text-card-foreground rounded-xl p-6 w-96 shadow-2xl border border-border animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="w-full p-3 bg-secondary border-transparent focus:border-primary rounded-lg mb-4 outline-none transition-all"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={() => setContextMenu(null)}
          onRename={handleRename}
          onDelete={handleDelete}
          onDownload={handleDownload}
          onPreview={setPreviewFile}
        />
      )}

      {/* File Preview */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          token={token}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}