import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ExtensionCard from '../components/ExtensionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Trash2 } from 'lucide-react';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/extensions/my');
      setExtensions(response.data.extensions || []);
    } catch (err) {
      setError('Failed to fetch extensions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (extensionId) => {
    try {
      const response = await api.get(`/extensions/download/${extensionId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `extension-${extensionId}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (err) {
      setError('Failed to download extension');
    }
  };

  const handleIterate = (extensionId) => {
    // Store the extension ID to load in generator
    localStorage.setItem('iterateExtensionId', extensionId);
    navigate('/generate');
  };

  const handleDelete = async (extensionId) => {
    if (!window.confirm('Are you sure you want to delete this extension?')) return;

    try {
      await api.delete(`/extensions/${extensionId}`);
      setExtensions(extensions.filter((ext) => ext.id !== extensionId));
    } catch (err) {
      setError('Failed to delete extension');
    }
  };

  const filteredExtensions = extensions.filter((ext) =>
    ext.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <LoadingSpinner message="Loading your extensions..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">My Extensions</h1>

          {error && (
            <div className="mb-4 bg-red-900/20 border border-red-900 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main pl-10 pr-4 py-2"
            />
          </div>
        </div>

        {filteredExtensions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
            <p className="text-gray-400 mb-6">
              {searchQuery
                ? 'No extensions found matching your search.'
                : 'No extensions yet — go build one!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/generate')}
                className="px-6 py-2 bg-gradient-main text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Create Your First Extension
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExtensions.map((extension) => (
              <ExtensionCard
                key={extension.id}
                extension={extension}
                onDownload={handleDownload}
                onIterate={handleIterate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
