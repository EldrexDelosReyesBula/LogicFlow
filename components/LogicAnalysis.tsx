import React, { useState } from 'react';
import { clsx } from 'clsx';
import { AnalysisResult } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ArrowRightLeft, ShieldCheck, AlertTriangle, CheckCircle2, Microscope, Cpu, BarChart3, Layers, Hash } from 'lucide-react';
import { generateAIExplanation } from '../utils/ai';

interface LogicAnalysisProps {
  analysis: AnalysisResult;
  apiKey?: string;
  enableAI?: boolean;
}

const LogicAnalysis: React.FC<LogicAnalysisProps> = ({ analysis, apiKey, enableAI }) => {
  const [tab, setTab] = useState<'overview' | 'sttt'>('overview');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  const { classification, implicationForms, mainConnective, stttTrace, complexity } = analysis;

  const handleAIExplain = async () => {
      if (!apiKey || isLoadingAI) return;
      setIsLoadingAI(true);
      const text = await generateAIExplanation(analysis, apiKey);
      setExplanation(text);
      setIsLoadingAI(false);
  };

  const getBadgeColor = (c: string) => {
    if (c === 'Tautology') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
    if (c === 'Contradiction') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800';
    return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
  };

  const getIcon = (c: string) => {
    if (c === 'Tautology') return <ShieldCheck className="w-5 h-5" />;
    if (c === 'Contradiction') return <AlertTriangle className="w-5 h-5" />;
    return <Info className="w-5 h-5" />;
  };

  const getFriendlySubtitle = (c: string) => {
      if (c === 'Tautology') return 'Always True';
      if (c === 'Contradiction') return 'Always False';
      return 'Sometimes True, Sometimes False';
  };

  return (
    <div className="flex flex-col h-full">
        {stttTrace && (
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button 
                    onClick={() => setTab('overview')}
                    className={clsx("flex-1 py-3 text-sm font-bold border-b-2 transition-colors", tab === 'overview' ? "border-primary-500 text-primary-600" : "border-transparent text-slate-500")}
                >
                    Overview
                </button>
                <button 
                    onClick={() => setTab('sttt')}
                    className={clsx("flex-1 py-3 text-sm font-bold border-b-2 transition-colors", tab === 'sttt' ? "border-primary-500 text-primary-600" : "border-transparent text-slate-500")}
                >
                    Proof
                </button>
            </div>
        )}

        <div className="p-6 pb-20 max-w-2xl mx-auto w-full flex flex-col gap-6 overflow-y-auto">
        
        {tab === 'overview' ? (
            <>
                {/* Classification Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                        "p-5 rounded-2xl border flex items-start gap-4 shadow-sm",
                        getBadgeColor(classification)
                    )}
                >
                    <div className="mt-1">{getIcon(classification)}</div>
                    <div>
                        <h3 className="font-display font-bold text-lg mb-0.5">{classification}</h3>
                        <p className="text-xs uppercase font-bold opacity-70 mb-2">{getFriendlySubtitle(classification)}</p>
                        <p className="text-sm opacity-90 leading-relaxed">
                            {classification === 'Tautology' && "No matter what values the variables take, the result is always True."}
                            {classification === 'Contradiction' && "This expression represents a logical absurdity; it is never True."}
                            {classification === 'Contingency' && `The truth of this expression depends on the specific values of its variables.`}
                        </p>
                    </div>
                </motion.div>

                {/* AI Explanation Section - Explicit Trigger Only */}
                {enableAI && apiKey && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-2xl p-5"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
                                <Cpu className="w-4 h-4" /> AI Explanation
                            </h4>
                            {!explanation && !isLoadingAI && (
                                <button 
                                    onClick={handleAIExplain}
                                    className="text-xs font-bold px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 transition-colors"
                                >
                                    Generate Explanation
                                </button>
                            )}
                        </div>
                        
                        {isLoadingAI && (
                            <div className="flex items-center gap-2 text-sm text-purple-600/70 py-2">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-75" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce delay-150" />
                                </div>
                                <span className="text-xs font-medium">Analyzing logical structure...</span>
                            </div>
                        )}

                        <AnimatePresence>
                            {explanation && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mt-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                        {explanation}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Complexity Metrics */}
                {complexity && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-surface-50 dark:bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700">
                            <Hash className="w-4 h-4 text-slate-400 mb-1" />
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{complexity.operatorCount}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Operators</div>
                        </div>
                        <div className="bg-surface-50 dark:bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700">
                            <Layers className="w-4 h-4 text-slate-400 mb-1" />
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{complexity.depth}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Depth</div>
                        </div>
                        <div className="bg-surface-50 dark:bg-slate-800 p-3 rounded-xl flex flex-col items-center justify-center text-center border border-slate-100 dark:border-slate-700">
                            <BarChart3 className="w-4 h-4 text-slate-400 mb-1" />
                            <div className="text-xl font-bold text-slate-700 dark:text-slate-200">{complexity.complexityScore}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Complexity</div>
                        </div>
                    </div>
                )}

                {/* Implication Forms (if applicable) */}
                {mainConnective === 'IMPLIES' && implicationForms && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2">
                            <ArrowRightLeft className="w-3 h-3" /> Related Conditional Forms
                        </h4>
                        
                        <div className="grid gap-3">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 block mb-1">CONVERSE (Switch)</span>
                                <div className="font-mono text-slate-800 dark:text-slate-200">{implicationForms.converse}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 block mb-1">INVERSE (Negate)</span>
                                <div className="font-mono text-slate-800 dark:text-slate-200">{implicationForms.inverse}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-l-4 border-l-primary-500 border-y border-r border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 block mb-1">CONTRAPOSITIVE (Switch & Negate)</span>
                                <div className="font-mono font-medium text-slate-900 dark:text-white">{implicationForms.contrapositive}</div>
                                <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Logically Equivalent to Original
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </>
        ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-sm text-indigo-800 dark:text-indigo-200 mb-4 flex gap-3">
                    <Microscope className="w-5 h-5 flex-shrink-0" />
                    <div>
                        <p className="font-bold mb-1">Shortened Truth Table Technique (STTT)</p>
                        <p className="opacity-90">To prove this is a {classification}, we assume the opposite ({stttTrace?.method}) and look for a contradiction.</p>
                    </div>
                </div>

                {stttTrace?.steps.map((step, idx) => (
                    <div key={step.id} className="relative pl-6 pb-6 border-l-2 border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-900" />
                        <div className={clsx(
                            "p-3 rounded-lg text-sm border",
                            step.conflict ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50" : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                        )}>
                            <div className="font-bold text-slate-700 dark:text-slate-200 mb-1">Step {idx + 1}</div>
                            <p className="text-slate-600 dark:text-slate-400 mb-2">{step.description}</p>
                            {step.assignment && (
                                <div className="font-mono text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded w-fit text-slate-800 dark:text-slate-300">
                                    {step.assignment}
                                </div>
                            )}
                            {step.conflict && (
                                <div className="mt-2 text-red-600 dark:text-red-400 font-bold text-xs flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Contradiction Found!
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </motion.div>
        )}
        </div>
    </div>
  );
};

export default LogicAnalysis;
