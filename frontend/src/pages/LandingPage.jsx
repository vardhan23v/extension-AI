import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Download, BarChart3, ChevronRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-gray-950 relative overflow-hidden"
    >
      {/* Dynamic Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-main/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-main/20 blur-[120px] rounded-full pointer-events-none" />

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
            Describe your Chrome extension in plain English. Extensio.ai uses Advanced AI to generate all the code, package it, and let you download it instantly.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 mx-auto"
          >
            Start Building Free <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Features */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
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
              title: 'Save & Iterate',
              desc: 'Modify your generated code instantly by asking the AI to add new features or fix bugs.',
            },
          ].map((feature, idx) => (
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -5 }}
              key={idx}
              className="glass-card rounded-2xl p-8 transition-colors group cursor-default"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-main/10 flex items-center justify-center mb-6 group-hover:bg-purple-main/20 transition-colors">
                <feature.icon className="w-7 h-7 text-purple-main" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div variants={itemVariants} className="mt-24 text-center glass-card rounded-3xl p-16">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to create your first extension?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join developers generating custom Chrome Extensions in seconds, not hours.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
            className="px-8 py-3 border-2 border-purple-main text-purple-400 rounded-xl font-bold hover:bg-purple-main hover:text-white transition-all"
          >
            Create an Account
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LandingPage;
