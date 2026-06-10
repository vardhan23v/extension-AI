import React, { useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Download, ChevronRight, MessageSquare, Code2, Package, ArrowRight, Star, Users, Layers } from 'lucide-react';

const SpotlightCard = ({ children, className = '' }) => {
  const cardRef = useRef(null);
  const overlayRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current || !overlayRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    overlayRef.current.style.background = `radial-gradient(350px circle at ${x}px ${y}px, rgba(124, 58, 237, 0.12), transparent 60%)`;
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`spotlight-card ${className}`}
    >
      <div ref={overlayRef} className="spotlight-overlay rounded-2xl" />
      {children}
    </div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
  };

  const stats = [
    { value: '10K+', label: 'Extensions Generated', icon: Layers },
    { value: '5K+', label: 'Happy Developers', icon: Users },
    { value: '4.9', label: 'Average Rating', icon: Star },
  ];

  const howItWorks = [
    {
      step: '01',
      icon: MessageSquare,
      title: 'Describe Your Idea',
      desc: 'Tell the AI what you want in plain English — or pick a starter Blueprint template.',
    },
    {
      step: '02',
      icon: Code2,
      title: 'AI Generates Code',
      desc: 'Advanced AI writes Manifest V3 code, popup UI, content scripts, and all required files.',
    },
    {
      step: '03',
      icon: Package,
      title: 'Download & Install',
      desc: 'Get a ready-to-load .zip package. Open Chrome, drop it in, and your extension works.',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-[#05010D] relative overflow-hidden"
    >
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-main/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-main/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] bg-purple-main/5 blur-[150px] rounded-full pointer-events-none translate-x-[-50%]" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <motion.div variants={itemVariants} className="text-center mb-16 pt-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-purple-main/30 bg-purple-main/10 text-purple-400 mb-8"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Powered by Gemini & Qwen 2.5</span>
          </motion.div>
          <h1 className="text-5xl sm:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Build Chrome Extensions
            <span className="block bg-gradient-main bg-clip-text text-transparent mt-2">
              with Words
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Describe your Chrome extension in plain English. Extensio.ai uses Advanced AI to
            generate all the code, package it, and let you download it instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 btn-shimmer"
            >
              Start Building Free <ChevronRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/gallery')}
              className="px-8 py-4 text-gray-300 border border-gray-700 rounded-xl font-bold hover:border-purple-main/50 hover:text-white transition-all flex items-center gap-2"
            >
              Browse Gallery
            </motion.button>
          </div>
        </motion.div>

        {/* Stats Counter Bar */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-24"
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="text-center py-4 px-2 glass-card rounded-xl"
            >
              <stat.icon className="w-5 h-5 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div variants={itemVariants} className="mb-24">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            How It Works
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-lg mx-auto">
            From idea to installed extension in under 60 seconds
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connecting lines (desktop only) */}
            <div className="hidden md:block absolute top-12 left-[calc(33.33%+0.5rem)] right-[calc(33.33%+0.5rem)] h-0.5">
              <div className="w-full h-full bg-gradient-to-r from-purple-main/30 via-purple-main/50 to-blue-main/30" />
            </div>

            {howItWorks.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + idx * 0.15 }}
                className="relative text-center"
              >
                <div className="w-24 h-24 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-center justify-center mx-auto mb-5 relative z-10">
                  <item.icon className="w-10 h-10 text-purple-400" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-gradient-main flex items-center justify-center text-xs font-bold text-white shadow-lg">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px] mx-auto">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features with Spotlight Effect */}
        <motion.div
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
        >
          {[
            {
              icon: Sparkles,
              title: 'AI Powered Generation',
              desc: 'Advanced AI writes perfectly formatted Manifest V3 code tailored to your exact prompt.',
            },
            {
              icon: Download,
              title: 'Instant Download',
              desc: 'Get your complete extension as a packaged .zip file ready to load straight into Chrome.',
            },
            {
              icon: Zap,
              title: 'Chat & Iterate',
              desc: 'Modify your generated code with a conversational AI copilot. Just describe the changes you want.',
            },
          ].map((feature, idx) => (
            <motion.div variants={itemVariants} key={idx}>
              <SpotlightCard className="glass-card-premium rounded-2xl p-8 transition-colors group cursor-default h-full">
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-purple-main/10 flex items-center justify-center mb-6 group-hover:bg-purple-main/20 transition-colors">
                    <feature.icon className="w-7 h-7 text-purple-main" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div
          variants={itemVariants}
          className="text-center glass-card-premium rounded-3xl p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-main/5 to-blue-main/5 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to create your first extension?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join developers generating custom Chrome Extensions in seconds, not hours.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/register')}
                className="px-8 py-3 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 flex items-center gap-2 btn-shimmer"
              >
                Create an Account <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/gallery')}
                className="px-8 py-3 border-2 border-gray-700 text-gray-300 rounded-xl font-bold hover:border-purple-main hover:text-white transition-all"
              >
                Explore Gallery
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
