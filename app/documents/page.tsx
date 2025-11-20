'use client';

import { useState, useEffect } from 'react';

interface Document {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('documents');
    if (saved) {
      setDocuments(JSON.parse(saved));
    }
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newDocs: Document[] = [];

    for (const file of Array.from(files)) {
      const doc: Document = {
        id: Date.now() + Math.random().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      };
      newDocs.push(doc);
    }

    const updated = [...documents, ...newDocs];
    setDocuments(updated);
    localStorage.setItem('documents', JSON.stringify(updated));
    setUploading(false);
  };

  const deleteDoc = (id: string) => {
    const updated = documents.filter(doc => doc.id !== id);
    setDocuments(updated);
    localStorage.setItem('documents', JSON.stringify(updated));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Management</h1>
      
      <div className="mb-6">
        <input
          type="file"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {uploading && <p className="text-blue-600 mb-4">Uploading...</p>}

      <div className="space-y-2">
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <h3 className="font-medium">{doc.name}</h3>
              <p className="text-sm text-gray-500">
                {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadDate).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => deleteDoc(doc.id)}
              className="text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
      )}
    </div>
  );
}