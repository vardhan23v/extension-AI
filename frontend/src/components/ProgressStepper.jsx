import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Circle, Sparkles, FileCode, Palette, Package, Brain } from 'lucide-react';

const STEPS = [
  { label: 'Analyzing Intent', icon: Brain, keywords: ['sending', 'analyzing'] },
  { label: 'Writing Manifest V3', icon: FileCode, keywords: ['validating', 'writing'] },
  { label: 'Generating Scripts', icon: Sparkles, keywords: ['generating', 'creating'] },
  { label: 'Creating Assets', icon: Palette, keywords: ['assets', 'packaging'] },
  { label: 'Packaging ZIP', icon: Package, keywords: ['packaging', 'zip', 'finalizing'] },
];

const ProgressStepper = ({ statusMessage = '' }) => {
  const msgLower = statusMessage.toLowerCase();

  // Determine active step from status message keywords
  let activeStep = 0;
  for (let i = STEPS.length - 1; i >= 0; i--) {
    if (STEPS[i].keywords.some((kw) => msgLower.includes(kw))) {
      activeStep = i;
      break;
    }
  }

  return (
    <div className="w-full py-8 px-4">
      {/* Desktop horizontal stepper */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-xl mx-auto">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isComplete = idx < activeStep;
          const isActive = idx === activeStep;
          const isPending = idx > activeStep;

          return (
            <React.Fragment key={idx}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center gap-2 min-w-0"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isComplete
                      ? 'bg-emerald-accent/20 border-2 border-emerald-accent'
                      : isActive
                      ? 'bg-purple-main/20 border-2 border-purple-main timeline-node-active'
                      : 'bg-gray-800/50 border-2 border-gray-700'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-emerald-accent" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-5 h-5 text-purple-main" />
                    </motion.div>
                  ) : (
                    <StepIcon className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center whitespace-nowrap ${
                    isComplete
                      ? 'text-emerald-accent'
                      : isActive
                      ? 'text-purple-400'
                      : 'text-gray-500'
                  }`}
                >
                  {step.label}
                </span>
              </motion.div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-1.5rem]">
                  <div className={`stepper-connector ${isComplete ? 'active' : ''}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile vertical stepper */}
      <div className="sm:hidden space-y-4">
        {STEPS.map((step, idx) => {
          const StepIcon = step.icon;
          const isComplete = idx < activeStep;
          const isActive = idx === activeStep;

          return (
            <motion.div
              key={idx}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-center gap-3"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isComplete
                    ? 'bg-emerald-accent/20 border-2 border-emerald-accent'
                    : isActive
                    ? 'bg-purple-main/20 border-2 border-purple-main'
                    : 'bg-gray-800/50 border-2 border-gray-700'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="w-4 h-4 text-emerald-accent" />
                ) : isActive ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-4 h-4 text-purple-main" />
                  </motion.div>
                ) : (
                  <StepIcon className="w-3.5 h-3.5 text-gray-500" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  isComplete ? 'text-emerald-accent' : isActive ? 'text-white' : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Status message */}
      <motion.p
        key={statusMessage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-gray-400 text-sm mt-6"
      >
        {statusMessage || 'Preparing your extension...'}
      </motion.p>
    </div>
  );
};

export default ProgressStepper;
