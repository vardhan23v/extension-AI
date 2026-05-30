import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Download, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6">
            Build Chrome Extensions
            <span className="block bg-gradient-main bg-clip-text text-transparent">
              with Words
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Describe your Chrome extension in plain English. Extensio.ai uses Google Gemini AI to generate all the code, package it, and let you download instantly.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-gradient-main text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-lg"
          >
            Start Building Free
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              icon: Sparkles,
              title: 'AI Powered',
              desc: 'Powered by Google Gemini 1.5 Flash for intelligent code generation',
            },
            {
              icon: Download,
              title: 'Instant Download',
              desc: 'Get your complete extension as a .zip file ready to load into Chrome',
            },
            {
              icon: Zap,
              title: 'Save & Iterate',
              desc: 'Save extensions, iterate on them, and refine until perfect',
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-purple-main transition-colors"
            >
              <feature.icon className="w-8 h-8 text-purple-main mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center bg-gray-900 border border-gray-800 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to create your first extension?</h2>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-gradient-main text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Get Started Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
