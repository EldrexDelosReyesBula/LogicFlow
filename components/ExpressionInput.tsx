
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { clsx } from 'clsx';
import { Sparkles, Delete, Keyboard, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for strict type checking on motion components
const MotionDiv = motion.div as any;

interface ExpressionInputProps {
  value: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  isValid: boolean;
}

const KEYBOARD_ROWS = [
    { name: 'LOGIC', symbols: ['¬', '∧', '∨', '→', '↔', '⊕'] },
    { name: 'TEMPLATES', symbols: ['¬()', '()→()', '()↔()'] },
    { name: 'GROUPS', symbols: ['(', ')', '[', ']', '{', '}'] },
    { name: 'VALUES', symbols: ['1', '0'] },
    { name: 'VARS', symbols: ['P', 'Q', 'R', 'S'] }
];

const ExpressionInput: React.FC<ExpressionInputProps> = ({ value, onChange, onGenerate, isValid }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
      if (inputRef.current && cursorRef.current !== null) {
          inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
          cursorRef.current = null;
      }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && isValid) {
      onGenerate();
      setShowKeyboard(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      const pos = e.target.selectionStart || 0;
      
      // Auto-Pairing Logic for typed keys
      if (val.length > value.length) {
          const char = val.slice(pos - 1, pos);
          if (['(', '[', '{'].includes(char)) {
             const pair = char === '(' ? ')' : char === '[' ? ']' : '}';
             const nextChar = val.slice(pos, pos + 1);
             if (nextChar !== pair) {
                 const newValue = val.slice(0, pos) + pair + val.slice(pos);
                 cursorRef.current = pos; 
                 onChange(newValue);
                 return;
             }
          }
      }
      cursorRef.current = pos;
      onChange(val);
  };

  const insertSymbol = (char: string) => {
    const input = inputRef.current;
    if (input) {
      const start = input.selectionStart || value.length;
      const end = input.selectionEnd || value.length;
      let insertion = char;
      let moveCursor = char.length;

      if (char === '¬()') { insertion = '¬()'; moveCursor = 2; } 
      else if (char === '()→()') { insertion = '() → ()'; moveCursor = 1; }
      else if (char === '()↔()') { insertion = '() ↔ ()'; moveCursor = 1; }
      else if (char === '(') { insertion = '()'; moveCursor = 1; }
      else if (char === '[') { insertion = '[]'; moveCursor = 1; }
      else if (char === '{') { insertion = '{}'; moveCursor = 1; }
      
      const newValue = value.substring(0, start) + insertion + value.substring(end);
      cursorRef.current = start + moveCursor;
      onChange(newValue);
      input.focus();
    } else {
        onChange(value + char);
    }
  };

  return (
    <>
      <div className={clsx("w-full max-w-2xl mx-auto relative z-30 transition-all duration-500 ease-spring", showKeyboard ? "mb-[45vh]" : "mb-0")}>
        
        {/* Input Container - Pill Shape Dark */}
        <MotionDiv 
            layout
            className={clsx(
            "relative bg-[#1A1A1A] dark:bg-surface-800 rounded-full transition-all duration-300 overflow-hidden flex items-center pr-2",
            isFocused || showKeyboard ? "ring-2 ring-primary-500/50 shadow-2xl shadow-black/40 scale-[1.02]" : "shadow-xl shadow-black/20"
            )}
        >
            <div className="flex-1 relative h-16">
                <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                onFocus={() => { setIsFocused(true); }}
                onBlur={() => { setIsFocused(false); }}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-transparent px-8 text-xl font-mono text-white dark:text-white placeholder-white/30 outline-none tracking-widest"
                placeholder="{P ∧ [Q ∨ R]}"
                autoComplete="off"
                spellCheck={false}
                />
            </div>

            {/* Inner Action Buttons */}
            <div className="flex items-center gap-2 pr-1">
                <button
                    onClick={() => setShowKeyboard(!showKeyboard)}
                    className={clsx(
                        "p-3 rounded-full transition-colors",
                        showKeyboard ? "bg-white/20 text-white" : "text-white/40 hover:text-white hover:bg-white/10"
                    )}
                >
                    {showKeyboard ? <ChevronDown className="w-5 h-5" /> : <Keyboard className="w-5 h-5" />}
                </button>

                <button
                    onClick={() => { onGenerate(); setShowKeyboard(false); }}
                    disabled={!isValid || value.length === 0}
                    className={clsx(
                        "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                        isValid && value.length > 0
                            ? "bg-primary-500 text-white hover:bg-primary-400 shadow-lg shadow-primary-500/30"
                            : "bg-white/10 text-white/20 cursor-not-allowed"
                    )}
                >
                    <Sparkles className="w-5 h-5" />
                </button>
            </div>
        </MotionDiv>
      </div>

      {/* Bottom Sheet Keyboard - Fixed Position */}
      <AnimatePresence>
          {showKeyboard && (
              <MotionDiv
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                  className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/10 pb-8 pt-4 px-4 shadow-2xl h-[45vh]"
              >
                  <div className="max-w-3xl mx-auto flex flex-col gap-4 relative h-full overflow-y-auto pb-safe">
                      {KEYBOARD_ROWS.map((row) => (
                          <div key={row.name} className="flex flex-col gap-2 flex-shrink-0">
                              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">
                                  {row.name}
                              </span>
                              <div className="flex flex-wrap gap-2">
                                  {row.symbols.map((char) => (
                                      <button
                                          key={char}
                                          onClick={() => insertSymbol(char)}
                                          className="h-12 min-w-[3rem] px-4 rounded-xl bg-[#1E1E1E] text-white font-mono text-lg font-medium hover:bg-[#2A2A2A] active:scale-95 transition-all shadow-sm border border-white/5"
                                      >
                                          {char}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                      
                      {/* Backspace Floating */}
                      <button
                         onClick={() => {
                             const val = value;
                             const pos = inputRef.current?.selectionStart || val.length;
                             const newVal = val.slice(0, pos - 1) + val.slice(pos);
                             cursorRef.current = pos - 1;
                             onChange(newVal);
                             inputRef.current?.focus();
                         }}
                         className="fixed bottom-6 right-6 h-12 px-6 bg-[#2A2A2A] rounded-full text-white/80 hover:bg-red-900/40 hover:text-red-200 border border-white/10 shadow-lg flex items-center gap-2 font-medium active:scale-95 transition-all z-50"
                      >
                          <Delete className="w-5 h-5" />
                          <span>Backspace</span>
                      </button>
                  </div>
              </MotionDiv>
          )}
      </AnimatePresence>
    </>
  );
};

export default ExpressionInput;
