import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Heart, Copy, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GalleryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
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
      const response = await api.get('/extensions/gallery');
      setExtensions(response.data.extensions || []);
    } catch (err) {
      setError('Failed to fetch community extensions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id) => {
    try {
      const response = await api.post(`/extensions/${id}/upvote`);
      setExtensions(extensions.map(ext => 
        ext.id === id ? { ...ext, upvotes: response.data.upvotes } : ext
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClone = async (id) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const response = await api.post(`/extensions/${id}/clone`);
      navigate('/dashboard'); // Go to dashboard to see the cloned extension
    } catch (err) {
      setError('Failed to clone extension');
    }
  };

  const filteredExtensions = extensions.filter((ext) =>
    ext.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (ext.prompt && ext.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 py-8 flex items-center justify-center">
        <LoadingSpinner message="Loading community gallery..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 py-8 relative overflow-hidden">
      <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            Community Gallery
          </h1>
          <p className="text-gray-400">Discover, upvote, and clone extensions built by the community!</p>
        </motion.div>

        {error && (
          <div className="mb-4 bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-xl backdrop-blur-sm">
            {error}
          </div>
        )}

        <div className="mb-10 relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search ideas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full glass-panel border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12 pr-4 py-3 transition-all"
          />
        </div>

        {filteredExtensions.length === 0 ? (
          <div className="glass-card rounded-3xl p-16 text-center border-dashed border-2 border-gray-700/50">
            <p className="text-gray-400 text-lg">No public extensions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredExtensions.map((ext) => (
                <motion.div
                  key={ext.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all flex flex-col group"
                >
                  <div className="h-40 w-full bg-gray-900 relative overflow-hidden border-b border-gray-800 flex items-center justify-center">
                    {ext.storeAssets?.bannerUrl ? (
                      <img src={ext.storeAssets.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <ImageIcon className="w-12 h-12 text-gray-700" />
                    )}
                    {ext.storeAssets?.logoUrl && (
                      <div className="absolute -bottom-6 left-4 bg-gray-950 p-1 rounded-xl shadow-xl border border-gray-800">
                        <img src={ext.storeAssets.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 pt-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{ext.title}</h3>
                    <p className="text-gray-400 text-sm flex-grow line-clamp-3 mb-4">
                      {ext.storeAssets?.description || ext.prompt}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                      <button 
                        onClick={() => handleUpvote(ext.id)}
                        className="flex items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
                      >
                        <Heart className="w-5 h-5" />
                        <span className="font-medium text-sm">{ext.upvotes}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleClone(ext.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors font-medium text-sm"
                      >
                        <Copy className="w-4 h-4" /> Clone ({ext.cloneCount})
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default GalleryPage;
