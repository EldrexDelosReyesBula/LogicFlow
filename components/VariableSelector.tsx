
import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for strict type checking on motion components
const MotionButton = motion.button as any;
const MotionForm = motion.form as any;

interface VariableSelectorProps {
  selected: string[];
  suggested?: string[];
  onChange: (vars: string[]) => void;
}

const PRESETS = ['A', 'B', 'C', 'D', 'E'];

const VariableSelector: React.FC<VariableSelectorProps> = ({ selected, suggested = [], onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newVar, setNewVar] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isAdding]);

  const toggleVar = (v: string) => {
    if (selected.includes(v)) {
      onChange(selected.filter(s => s !== v).sort());
    } else {
      onChange([...selected, v].sort());
    }
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = newVar.trim().toUpperCase();
    if (v && /^[A-Z][0-9]*$/.test(v)) {
        if (!selected.includes(v)) {
            onChange([...selected, v].sort());
        }
        setNewVar('');
        setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleAddSubmit();
      if (e.key === 'Escape') {
          setIsAdding(false);
          setNewVar('');
      }
  };

  // Combine presets and any selected variables that aren't in presets (to persist custom ones)
  const displayVars = Array.from(new Set([...PRESETS, ...selected])).sort();

  return (
    <div className="w-full max-w-2xl mx-auto px-1 mb-2">
      <div className="flex flex-col items-center gap-4">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400">
          Propositions
        </label>
        
        <div className="flex flex-wrap justify-center gap-3">
          <AnimatePresence>
            {displayVars.map((v) => {
                const isActive = selected.includes(v);

                return (
                <MotionButton
                    layout
                    key={v}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleVar(v)}
                    className={clsx(
                    "w-14 h-14 rounded-2xl text-xl font-bold transition-all flex items-center justify-center relative border shadow-sm",
                    isActive 
                        ? "bg-[#1e1e1e] dark:bg-surface-800 text-white border-white/10 shadow-lg shadow-black/20" 
                        : "bg-surface-100 dark:bg-white/5 text-surface-600 dark:text-surface-400 border-surface-200 dark:border-white/5 hover:bg-surface-200 dark:hover:bg-white/10"
                    )}
                >
                    {v}
                    {isActive && (
                        <motion.div
                            layoutId="active-indicator"
                            className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white dark:border-[#1e1e1e]"
                        />
                    )}
                </MotionButton>
                );
            })}
          </AnimatePresence>
          
          <div className="relative">
             {!isAdding ? (
                 <MotionButton
                    layout
                    onClick={() => setIsAdding(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center bg-surface-100 dark:bg-white/5 border border-surface-200 dark:border-white/5 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-white/10 transition-colors"
                 >
                    <Plus className="w-6 h-6" />
                 </MotionButton>
             ) : (
                 <MotionForm
                    layout
                    initial={{ width: '3.5rem', opacity: 0 }}
                    animate={{ width: '4.5rem', opacity: 1 }}
                    onSubmit={handleAddSubmit}
                    className="h-14 bg-[#1e1e1e] dark:bg-surface-800 rounded-2xl border border-white/20 flex items-center overflow-hidden shadow-sm"
                 >
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={newVar}
                        onChange={e => setNewVar(e.target.value.toUpperCase().slice(0, 1))} 
                        onBlur={() => !newVar && setIsAdding(false)}
                        onKeyDown={handleKeyDown}
                        className="w-full h-full text-center font-bold text-xl bg-transparent outline-none uppercase text-white"
                        placeholder="?"
                    />
                 </MotionForm>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariableSelector;
