'use client';

import { useState, useEffect } from 'react';
import LoginForm from '@/components/LoginForm';
import FileExplorer from '@/components/FileExplorer';

export default function Home() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="h-screen flex flex-col">
        <header className="bg-white shadow-sm border-b p-4 flex-shrink-0">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">💾</div>
              <h1 className="text-xl font-semibold text-gray-800">Drive</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span>👤</span>
              <span>Logout</span>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden">
          <FileExplorer token={token} />
        </div>
      </div>
    </div>
  );
}