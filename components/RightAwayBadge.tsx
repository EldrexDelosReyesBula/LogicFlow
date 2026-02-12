import React from 'react';
import { motion } from 'framer-motion';
import { RWResult } from '../types';
import { Zap } from 'lucide-react';

interface RightAwayBadgeProps {
  result: RWResult;
}

const RightAwayBadge: React.FC<RightAwayBadgeProps> = ({ result }) => {
  if (!result.active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="max-w-md mx-auto mt-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-3 flex items-start gap-3 shadow-sm"
    >
      <div className="bg-amber-100 dark:bg-amber-800/50 p-1.5 rounded-full">
        <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-current" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">RightAway Logic</span>
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Simplifies to <span className="font-mono font-bold">{result.value === true ? 'TRUE' : result.value === false ? 'FALSE' : result.value}</span>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {result.explanation}
        </p>
      </div>
    </motion.div>
  );
};

export default RightAwayBadge;
