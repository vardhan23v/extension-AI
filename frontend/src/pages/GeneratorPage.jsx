import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import PromptInput from '../components/PromptInput';
import FilePreview from '../components/FilePreview';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

const QUICK_PROMPTS = [
  "Ad Blocker that removes elements with class 'ad-banner'",
  "Dark Mode enforcer for any website",
  "Word Counter that shows stats in the popup"
];

const GeneratorPage = () => {
  const navigate = useNavigate();
  const [generatedExtension, setGeneratedExtension] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  const generateExtension = async (prompt) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setStatusMessage('Sending prompt to AI...');

    try {
      setTimeout(() => {
        if (isLoading) setStatusMessage('Validating generated files...');
      }, 2000);

      setTimeout(() => {
        if (isLoading) setStatusMessage('Packaging your extension...');
      }, 4000);

      const response = await api.post('/extensions/generate', { prompt });
      setGeneratedExtension(response.data.extension);
      setSuccess('✓ Extension generated successfully!');
      setStatusMessage('');
      setIsModifying(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate extension';
      setError(errorMsg);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const iterateExtension = async (newPrompt) => {
    if (!generatedExtension) return;

    setIsLoading(true);
    setError('');
    setSuccess('');
    setStatusMessage('Applying modifications...');

    try {
      const response = await api.post(`/extensions/iterate/${generatedExtension.id}`, {
        prompt: newPrompt,
      });
      setGeneratedExtension(response.data.extension);
      setSuccess('✓ Extension modified successfully!');
      setStatusMessage('');
      setIsModifying(false);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to iterate extension';
      setError(errorMsg);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadExtension = async () => {
    if (!generatedExtension) return;

    try {
      const response = await api.get(`/extensions/download/${generatedExtension.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedExtension.title}-extension.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      setError('Failed to download extension');
    }
  };

  const handlePromptSubmit = (prompt) => {
    if (isModifying) {
      iterateExtension(prompt);
    } else {
      generateExtension(prompt);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-950 py-8 relative overflow-hidden"
    >
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-main/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-main/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Panel - Input */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="sticky top-20 space-y-6">
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-main">
                {isModifying ? 'Modify Extension' : 'Generate Extension'}
              </h2>

              {!isModifying && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-main" /> Quick Prompts
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((qp, idx) => (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        key={idx}
                        onClick={() => handlePromptSubmit(qp)}
                        className="text-xs px-3 py-1.5 rounded-full border border-gray-800 bg-gray-900/50 text-gray-300 hover:border-purple-main/50 hover:text-white transition-colors"
                      >
                        {qp}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              <PromptInput
                onSubmit={handlePromptSubmit}
                isLoading={isLoading}
                isModifying={isModifying}
              />

              <AnimatePresence>
                {generatedExtension && !isModifying && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => setIsModifying(true)}
                    className="w-full py-3 glass-panel text-gray-300 rounded-xl hover:border-purple-main hover:text-purple-main transition-colors shadow-lg font-medium"
                  >
                    Iterate / Modify
                  </motion.button>
                )}

                {isModifying && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onClick={() => setIsModifying(false)}
                    className="w-full py-3 glass-panel text-gray-300 rounded-xl hover:border-red-500 hover:text-red-400 transition-colors shadow-lg font-medium"
                  >
                    Cancel Modification
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Panel - Output */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 bg-red-900/20 border border-red-900/50 rounded-xl p-4 flex gap-3 backdrop-blur-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 bg-green-900/20 border border-green-900/50 rounded-xl p-4 flex gap-3 backdrop-blur-sm"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-400 text-sm">{success}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {statusMessage && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 glass-panel rounded-xl p-4 border-blue-900/50"
              >
                <p className="text-blue-400 text-sm flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  {statusMessage}
                </p>
              </motion.div>
            )}

            {generatedExtension && !isLoading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-main" />
                <div className="mb-6 mt-2">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {generatedExtension.title}
                  </h3>
                  <p className="text-gray-400 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {generatedExtension.files?.length || 0} files generated
                  </p>
                </div>

                <FilePreview files={generatedExtension.files || []} />

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadExtension}
                  className="w-full mt-6 py-4 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all"
                >
                  Download .zip Package
                </motion.button>
              </motion.div>
            ) : isLoading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-6 min-h-[400px] flex items-center justify-center"
              >
                <LoadingSpinner message={statusMessage || 'Creating your extension...'} />
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center border-dashed border-2 border-gray-700/50"
              >
                <Zap className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400 font-medium">
                  Describe your extension in plain English and click "Generate Extension" to get started.
                </p>
              </motion.div>
            )}
          </motion.div>

        </div>
      </div>
    </motion.div>
  );
};

export default GeneratorPage;
