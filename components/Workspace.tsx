
import React, { useState, useEffect } from 'react';
import { WorkspaceState, ProofStep } from '../types';
import { db } from '../utils/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckCircle2, Save, Trash2 } from 'lucide-react';

// Fix for strict type checking on motion components
const MotionDiv = motion.div as any;

const Workspace: React.FC = () => {
    const [premises, setPremises] = useState('');
    const [conclusion, setConclusion] = useState('');
    const [steps, setSteps] = useState<ProofStep[]>([]);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadWorkspace();
    }, []);

    const loadWorkspace = async () => {
        const data = await db.getWorkspace();
        if (data) {
            setPremises(data.premises);
            setConclusion(data.conclusion);
            setSteps(data.steps);
        }
    };

    const handleSave = async () => {
        await db.saveWorkspace({ premises, conclusion, steps });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const addStep = () => {
        setSteps([...steps, { 
            id: crypto.randomUUID(), 
            content: '', 
            justification: '' 
        }]);
    };

    const updateStep = (id: string, field: keyof ProofStep, value: string) => {
        setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const deleteStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    return (
        <div className="h-full flex flex-col w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="flex items-center justify-between py-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Logical Workspace</h2>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:scale-105 transition-transform"
                >
                    {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saved ? 'Saved' : 'Save Work'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Premises Card */}
                <div className="bg-[#1e2330] rounded-2xl p-6 border border-white/5 flex flex-col shadow-lg ring-1 ring-white/10">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Assume (Premises)</label>
                    <textarea
                        value={premises}
                        onChange={(e) => setPremises(e.target.value)}
                        className="w-full bg-transparent text-white font-mono text-lg resize-none outline-none placeholder-slate-600 flex-1 min-h-[120px]"
                        placeholder="P → Q&#10;Q → R"
                        spellCheck={false}
                    />
                </div>
                {/* Conclusion Card */}
                <div className="bg-[#1e2330] rounded-2xl p-6 border border-white/5 flex flex-col shadow-lg ring-1 ring-white/10">
                    <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4">Show (Conclusion)</label>
                    <textarea
                        value={conclusion}
                        onChange={(e) => setConclusion(e.target.value)}
                        className="w-full bg-transparent text-white font-mono text-lg resize-none outline-none placeholder-slate-600 flex-1 min-h-[120px]"
                        placeholder="P → R"
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Proof</span>
                <div className="h-px bg-slate-200 dark:bg-white/10 flex-1" />
            </div>

            <div className="space-y-4">
                 {/* Steps list */}
                 <AnimatePresence>
                     {steps.map((step, index) => (
                         <MotionDiv 
                            layout
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex gap-4 items-start group"
                         >
                             <div className="w-8 pt-4 text-center font-mono text-slate-400 text-sm font-bold opacity-50">{index + 1}.</div>
                             <div className="flex-1 bg-white dark:bg-[#0f111a] rounded-xl border border-slate-200 dark:border-white/5 p-1 flex shadow-sm focus-within:ring-2 ring-indigo-500/50 transition-all">
                                 <input 
                                     type="text" 
                                     value={step.content}
                                     onChange={e => updateStep(step.id, 'content', e.target.value)}
                                     placeholder="Statement"
                                     className="flex-1 bg-transparent px-4 py-3 font-mono text-slate-900 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-700"
                                 />
                                 <div className="w-px bg-slate-100 dark:bg-white/5 my-2" />
                                 <input 
                                     type="text" 
                                     value={step.justification}
                                     onChange={e => updateStep(step.id, 'justification', e.target.value)}
                                     placeholder="Justification"
                                     className="flex-1 bg-transparent px-4 py-3 font-sans text-slate-600 dark:text-slate-400 outline-none placeholder-slate-400 dark:placeholder-slate-700"
                                 />
                                 
                                 <button 
                                     onClick={() => deleteStep(step.id)}
                                     className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                 >
                                     <Trash2 className="w-4 h-4" />
                                 </button>
                             </div>
                         </MotionDiv>
                     ))}
                 </AnimatePresence>
                 
                 {/* Add Step Button */}
                 <button
                    onClick={addStep}
                    className="w-full py-4 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 hover:border-indigo-400 hover:text-indigo-400"
                 >
                    <Plus className="w-5 h-5" /> Add Step
                 </button>
            </div>
        </div>
    );
};

export default Workspace;
