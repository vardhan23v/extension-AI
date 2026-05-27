import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PromptInput from '../components/PromptInput';
import FilePreview from '../components/FilePreview';
import LoadingSpinner from '../components/LoadingSpinner';
import { AlertCircle, CheckCircle } from 'lucide-react';

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
    setStatusMessage('Sending prompt to Gemini AI...');

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
      link.parentChild.removeChild(link);
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
    <div className="min-h-screen bg-gray-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input */}
          <div>
            <div className="sticky top-20 space-y-4">
              <h2 className="text-2xl font-bold text-white">
                {isModifying ? 'Modify Extension' : 'Generate Extension'}
              </h2>

              <PromptInput
                onSubmit={handlePromptSubmit}
                isLoading={isLoading}
                isModifying={isModifying}
              />

              {generatedExtension && !isModifying && (
                <button
                  onClick={() => setIsModifying(true)}
                  className="w-full py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-purple-main hover:text-purple-main transition-colors"
                >
                  Iterate / Modify
                </button>
              )}

              {isModifying && (
                <button
                  onClick={() => setIsModifying(false)}
                  className="w-full py-2 border border-gray-700 text-gray-300 rounded-lg hover:border-red-500 hover:text-red-400 transition-colors"
                >
                  Cancel Modification
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Output */}
          <div>
            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-900 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-900/20 border border-green-900 rounded-lg p-4 flex gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {statusMessage && (
              <div className="mb-4 bg-blue-900/20 border border-blue-900 rounded-lg p-4">
                <p className="text-blue-400 text-sm">{statusMessage}</p>
              </div>
            )}

            {generatedExtension && !isLoading ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {generatedExtension.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {generatedExtension.files?.length || 0} files generated
                  </p>
                </div>

                <FilePreview files={generatedExtension.files || []} />

                <button
                  onClick={downloadExtension}
                  className="w-full mt-6 py-3 bg-gradient-main text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  Download .zip
                </button>
              </div>
            ) : isLoading ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <LoadingSpinner message={statusMessage || 'Creating your extension...'} />
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
                <p className="text-gray-400">
                  Describe your extension in plain English and click "Generate Extension" to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorPage;
