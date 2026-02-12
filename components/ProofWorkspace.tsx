import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowRight } from 'lucide-react';
import { ProofStep } from '../types';

const ProofWorkspace: React.FC = () => {
  const [steps, setSteps] = useState<ProofStep[]>([
      { id: '1', content: '', justification: 'Premise', isAssumption: true }
  ]);

  const addStep = () => {
    setSteps([...steps, { 
        id: Math.random().toString(36).substr(2, 9), 
        content: '', 
        justification: '', 
        isAssumption: false 
    }]);
  };

  const updateStep = (id: string, field: keyof ProofStep, value: string) => {
      setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStep = (id: string) => {
      setSteps(steps.filter(s => s.id !== id));
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-3xl mx-auto">
        <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white mb-2">Logical Workspace</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Build your proof step by step. Use assumptions to derive conclusions.</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-20">
            <AnimatePresence initial={false}>
                {steps.map((step, index) => (
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex gap-3 items-start group"
                    >
                        <div className="w-8 pt-4 text-right font-mono text-sm text-slate-400 font-bold">
                            {index + 1}.
                        </div>
                        <div className="flex-1 bg-surface-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex gap-4 transition-colors focus-within:border-primary-400 dark:focus-within:border-primary-600">
                             <div className="flex-1">
                                 <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Statement</label>
                                 <input 
                                    value={step.content}
                                    onChange={(e) => updateStep(step.id, 'content', e.target.value)}
                                    className="w-full bg-transparent font-mono text-slate-900 dark:text-white outline-none placeholder-slate-300 dark:placeholder-slate-600"
                                    placeholder="P → Q"
                                 />
                             </div>
                             <div className="w-[1px] bg-slate-200 dark:bg-slate-700" />
                             <div className="flex-1">
                                 <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Justification</label>
                                 <input 
                                    value={step.justification}
                                    onChange={(e) => updateStep(step.id, 'justification', e.target.value)}
                                    className="w-full bg-transparent text-sm text-slate-700 dark:text-slate-300 outline-none placeholder-slate-300 dark:placeholder-slate-600 italic"
                                    placeholder="Modus Ponens 1, 2"
                                 />
                             </div>
                        </div>
                        <button 
                            onClick={() => removeStep(step.id)}
                            className="p-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            <motion.button
                layout
                onClick={addStep}
                className="ml-11 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Step
            </motion.button>
        </div>
    </div>
  );
};

export default ProofWorkspace;
