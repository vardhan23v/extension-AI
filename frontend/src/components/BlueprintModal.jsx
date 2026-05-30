import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layout, Shield, Wrench, Share2, Gamepad2, Eye, Zap, Star, ChevronRight } from 'lucide-react';

const BLUEPRINTS = [
  {
    category: 'Productivity',
    icon: Layout,
    color: 'purple',
    title: 'Tab Manager Pro',
    description: 'Group, search, and manage browser tabs with keyboard shortcuts and a sleek popup UI.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Tab Manager Pro" with:
- A popup that lists all open tabs grouped by window
- A search bar to filter tabs by title or URL
- Click a tab to switch to it, with a close button on each tab
- Keyboard shortcut Ctrl+Shift+F to open the popup
- Clean, modern dark UI with icons for each tab (favicon)
- A "Close Duplicates" button that removes duplicate tabs
- Group tabs by domain with collapsible sections`,
  },
  {
    category: 'UI Enhancement',
    icon: Eye,
    color: 'blue',
    title: 'Reading Mode',
    description: 'Strip clutter from articles for distraction-free reading with customizable fonts.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Reading Mode" that:
- Adds a toolbar button to toggle reading mode on any webpage
- When activated, strips ads, sidebars, navigation, and clutter
- Shows only the main article content in a clean centered layout
- Provides font size controls (small, medium, large)
- Has a dark mode / light mode / sepia toggle
- Saves user preferences using chrome.storage
- Has a popup with the controls and a toggle switch`,
  },
  {
    category: 'Developer Tools',
    icon: Wrench,
    color: 'emerald',
    title: 'Screenshot & Annotate',
    description: 'Capture the visible page area and annotate with shapes, arrows, and text overlays.',
    complexity: 'Advanced',
    prompt: `Create a Chrome extension called "Screenshot & Annotate" that:
- Has a popup with a "Capture Page" button
- Captures the visible area of the current tab
- Opens the screenshot in a new tab with an annotation overlay
- The annotation overlay lets users draw rectangles, circles, and arrows
- Users can add text labels anywhere on the screenshot
- Has color picker for annotation tools (red, blue, green, yellow)
- Has undo/redo buttons
- Has a "Download" button that saves the annotated image as PNG
- Clean toolbar UI for the annotation tools`,
  },
  {
    category: 'Privacy & Security',
    icon: Shield,
    color: 'rose',
    title: 'Social Media Timer',
    description: 'Set daily time limits on social media sites with notifications and usage stats.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Social Media Timer" that:
- Tracks time spent on social media sites (Twitter/X, Instagram, Facebook, Reddit, TikTok, YouTube)
- Has a popup showing today's usage per site with progress bars
- Lets users set daily time limits per site (e.g., 30 min for Twitter)
- Shows a warning overlay when 80% of the limit is reached
- Blocks the site with a custom page when the limit is exceeded
- The block page has a motivational quote and a "5 more minutes" button (usable once per day)
- Stores data using chrome.storage and resets daily
- Has a clean dashboard-style popup UI`,
  },
  {
    category: 'Fun & Games',
    icon: Gamepad2,
    color: 'amber',
    title: 'Password Strength Checker',
    description: 'Overlay real-time password strength meters directly on any signup form.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Password Strength Checker" that:
- Detects password input fields on any webpage
- Overlays a strength meter bar below each password field
- Checks password against: length (8+ chars), uppercase, lowercase, numbers, special characters
- Shows strength as: Weak (red), Fair (orange), Good (yellow), Strong (green)
- Displays tips like "Add a number" or "Add a special character"
- Works as a content script that injects into all pages
- Has a popup that explains how the scoring works
- Does NOT send any password data anywhere (fully local)`,
  },
  {
    category: 'Productivity',
    icon: Star,
    color: 'cyan',
    title: 'Custom New Tab',
    description: 'Replace the new tab page with a personal dashboard — clock, bookmarks, and greeting.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Custom New Tab" that:
- Overrides the new tab page with a custom dashboard
- Shows a large centered clock (HH:MM format) with the current date
- Has a personalized greeting based on time of day ("Good morning", "Good afternoon", etc.)
- Asks for the user's name on first use and saves it
- Shows a grid of top bookmarks (8 most visited sites) with favicons
- Has a quick search bar that searches Google
- Has a daily focus input ("What is your main focus today?")
- Beautiful gradient background that changes based on time of day
- Clean, minimal, and aesthetic design`,
  },
];

const colorMap = {
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    hover: 'hover:border-purple-500/50',
    icon: 'text-purple-400',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    hover: 'hover:border-blue-500/50',
    icon: 'text-blue-400',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    hover: 'hover:border-emerald-500/50',
    icon: 'text-emerald-400',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    hover: 'hover:border-rose-500/50',
    icon: 'text-rose-400',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    hover: 'hover:border-amber-500/50',
    icon: 'text-amber-400',
  },
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    hover: 'hover:border-cyan-500/50',
    icon: 'text-cyan-400',
  },
};

const complexityBadge = {
  Beginner: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Intermediate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Advanced: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const BlueprintModal = ({ isOpen, onClose, onSelectBlueprint }) => {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl glass-card-premium border border-gray-700/50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-400" />
                  Starter Blueprints
                </h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  Pick a template to start with — the AI will build on it
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-gray-800/50 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {BLUEPRINTS.map((bp, idx) => {
                  const colors = colorMap[bp.color];
                  const BpIcon = bp.icon;

                  return (
                    <motion.button
                      key={idx}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        onSelectBlueprint(bp.prompt);
                        onClose();
                      }}
                      className={`text-left p-5 rounded-xl border ${colors.border} ${colors.hover} bg-gray-900/40 transition-all group`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                          <BpIcon className={`w-5 h-5 ${colors.icon}`} />
                        </div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${complexityBadge[bp.complexity]}`}>
                          {bp.complexity}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-white mb-1.5 group-hover:text-purple-300 transition-colors">
                        {bp.title}
                      </h3>
                      <p className="text-sm text-gray-400 leading-relaxed mb-3">
                        {bp.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${colors.text} font-medium`}>
                          {bp.category}
                        </span>
                        <span className="text-xs text-gray-500 group-hover:text-purple-400 flex items-center gap-1 transition-colors">
                          Use template <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BlueprintModal;
