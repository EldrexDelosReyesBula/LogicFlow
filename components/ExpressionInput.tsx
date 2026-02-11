import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Sparkles, Play, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpressionInputProps {
  value: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  isValid: boolean;
}

const SYMBOLS = [
  { char: '¬', label: 'NOT' },
  { char: '∧', label: 'AND' },
  { char: '∨', label: 'OR' },
  { char: '→', label: 'IMPLIES' },
  { char: '↔', label: 'IFF' },
  { char: '⊕', label: 'XOR' },
  { char: '(', label: '(' },
  { char: ')', label: ')' },
  { char: '[', label: '[' },
  { char: ']', label: ']' },
  { char: '{', label: '{' },
  { char: '}', label: '}' },
];

const ExpressionInput: React.FC<ExpressionInputProps> = ({ value, onChange, onGenerate, isValid }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      onGenerate();
    }
  };

  const insertSymbol = (char: string) => {
    // Simple append for now, could enhance to insert at cursor
    const input = document.getElementById('expr-input') as HTMLInputElement;
    if (input) {
      const start = input.selectionStart || value.length;
      const end = input.selectionEnd || value.length;
      const newValue = value.substring(0, start) + char + value.substring(end);
      onChange(newValue);
      // Restore focus and position (rough approx)
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + char.length, start + char.length);
      }, 10);
    } else {
        onChange(value + char);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative z-10 flex flex-col gap-4">
      <motion.div 
        layout
        className={clsx(
          "relative bg-white dark:bg-slate-800 rounded-3xl shadow-xl transition-all duration-300 overflow-hidden",
          isFocused ? "shadow-primary-200/50 ring-4 ring-primary-100 dark:ring-primary-900" : "shadow-md"
        )}
      >
        <div className="flex items-center p-3">
          <div className="flex-1 relative">
            <input
              id="expr-input"
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              className="w-full h-14 pl-6 pr-4 bg-transparent text-xl md:text-2xl font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
              placeholder="(P → Q) ∧ ¬P"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="characters"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGenerate}
            disabled={!isValid || value.length === 0}
            className={clsx(
              "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 ml-2",
              isValid && value.length > 0
                ? "bg-primary-600 text-white shadow-md shadow-primary-500/30"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {value.length > 0 && isValid ? (
              <Play className="w-5 h-5 fill-current" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Symbol Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2 justify-center"
      >
        {SYMBOLS.map((s) => (
          <button
            key={s.label}
            onClick={() => insertSymbol(s.char)}
            className="h-10 px-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center"
          >
            <span className="font-mono text-lg font-medium text-slate-700 dark:text-slate-200">{s.char}</span>
          </button>
        ))}
        <button
          onClick={() => onChange(value.slice(0, -1))}
          className="h-10 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all text-slate-500 hover:text-red-500"
        >
          <Delete className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
};

export default ExpressionInput;