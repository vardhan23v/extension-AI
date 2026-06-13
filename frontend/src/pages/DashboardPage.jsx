import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import ExtensionCard from '../components/ExtensionCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Plus, Star, Sparkles, Code2 } from 'lucide-react';

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
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Failed to download extension');
    }
  };

  const handleIterate = (extensionId) => {
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-950 py-8 flex items-center justify-center"
      >
        <LoadingSpinner message="Loading your extensions..." />
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-950 py-8 relative overflow-hidden"
    >
      <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-purple-main/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-main">
            My Extensions
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/generate')}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-main/20 border border-purple-main/50 text-purple-300 rounded-xl hover:bg-purple-main hover:text-white transition-all font-medium"
          >
            <Plus className="w-5 h-5" /> New Extension
          </motion.button>
        </motion.div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* Bento Box Stats */}
        {!loading && extensions.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
          >
            <div className="glass-card-premium rounded-2xl p-6 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-xl bg-purple-main/20 flex items-center justify-center mb-4">
                <Code2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Total Extensions</p>
                <h3 className="text-3xl font-bold text-white">{extensions.length}</h3>
              </div>
            </div>
            <div className="glass-card-premium rounded-2xl p-6 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-xl bg-blue-main/20 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Files Generated</p>
                <h3 className="text-3xl font-bold text-white">
                  {extensions.reduce((acc, ext) => acc + (ext.fileCount || 0), 0)}
                </h3>
              </div>
            </div>
            <div className="glass-card-premium rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-main opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10 w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-green-400" />
              </div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm font-medium">Developer Status</p>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-main">Pro Builder</h3>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-10 relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search your generated extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-panel border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main pl-12 pr-4 py-3 transition-all"
          />
        </div>

        {filteredExtensions.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-gray-700/50"
          >
            <p className="text-gray-400 mb-6 text-lg">
              {searchQuery
                ? 'No extensions found matching your search.'
                : 'No extensions yet — go build your first one!'}
            </p>
            {!searchQuery && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/generate')}
                className="px-8 py-3 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/40"
              >
                Create Your First Extension
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredExtensions.map((extension) => (
                <motion.div
                  key={extension.id}
                  variants={{
                    hidden: { y: 20, opacity: 0 },
                    visible: { y: 0, opacity: 1 }
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <ExtensionCard
                    extension={extension}
                    onDownload={handleDownload}
                    onIterate={handleIterate}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardPage;
