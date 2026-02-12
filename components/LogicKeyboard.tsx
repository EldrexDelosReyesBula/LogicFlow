import React from 'react';
import { clsx } from 'clsx';
import { AnalysisResult } from '../types';
import { motion } from 'framer-motion';
import { Info, ArrowRightLeft, ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LogicAnalysisProps {
  analysis: AnalysisResult;
}

const LogicAnalysis: React.FC<LogicAnalysisProps> = ({ analysis }) => {
  const { classification, implicationForms, mainConnective, variables } = analysis;

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

  return (
    <div className="p-6 pb-20 max-w-2xl mx-auto w-full flex flex-col gap-6">
      
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
            <h3 className="font-display font-bold text-lg mb-1">{classification}</h3>
            <p className="text-sm opacity-90 leading-relaxed">
                {classification === 'Tautology' && "This proposition is always true, regardless of the truth values of its variables."}
                {classification === 'Contradiction' && "This proposition is always false (an absurdity)."}
                {classification === 'Contingency' && `This proposition is true in some cases and false in others.`}
            </p>
        </div>
      </motion.div>

      {/* Implication Forms (if applicable) */}
      {mainConnective === 'IMPLIES' && implicationForms && (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            <h4 className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-4 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4" /> Conditional Forms
            </h4>
            
            <div className="grid gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">CONVERSE (Q → P)</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200">{implicationForms.converse}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 block mb-1">INVERSE (¬P → ¬Q)</span>
                    <div className="font-mono text-slate-800 dark:text-slate-200">{implicationForms.inverse}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <span className="text-xs font-bold text-primary-500 block mb-1">CONTRAPOSITIVE (¬Q → ¬P)</span>
                    <div className="font-mono font-medium text-slate-900 dark:text-white">{implicationForms.contrapositive}</div>
                    <div className="mt-2 text-xs text-slate-400">Logically equivalent to original.</div>
                </div>
            </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-50 dark:bg-slate-800 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">{variables.length}</div>
            <div className="text-xs text-slate-400 uppercase font-bold">Variables</div>
        </div>
        <div className="bg-surface-50 dark:bg-slate-800 p-4 rounded-xl text-center">
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-1">{Math.pow(2, variables.length)}</div>
            <div className="text-xs text-slate-400 uppercase font-bold">Rows</div>
        </div>
      </div>

    </div>
  );
};

export default LogicAnalysis;
