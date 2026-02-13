
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Check, X, RefreshCw, AlertTriangle, ChevronDown, ChevronRight, GitBranch } from 'lucide-react';
import { clsx } from 'clsx';
import { evaluateRawExpression } from '../utils/logic';
import { STTTBranch, STTTReport, ASTNode, AppSettings, STTTProofType } from '../types';
import { generateSTTTReport } from '../utils/sttt';

const MotionDiv = motion.div as any;

interface STTTInteractiveProps {
    expression: string;
    variables: string[];
    report?: STTTReport;
    ast?: ASTNode;
    settings?: AppSettings;
}

const STTTInteractive: React.FC<STTTInteractiveProps> = ({ expression, variables, report: initialReport, ast, settings }) => {
    const [mode, setMode] = useState<'Manual' | 'Auto'>('Auto');
    const [proofTarget, setProofTarget] = useState<STTTProofType>('Tautology');
    const [report, setReport] = useState<STTTReport | undefined>(initialReport);

    useEffect(() => {
        if (ast && mode === 'Auto') {
            const newReport = generateSTTTReport(ast, variables, proofTarget);
            setReport(newReport);
        }
    }, [ast, proofTarget, mode, variables]);

    return (
        <div className="flex flex-col h-full bg-surface-50 dark:bg-dark-surface p-4">
             {/* Header */}
             <div className="text-center mb-4">
                 <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    Beta Feature
                 </div>
             </div>

             {/* Mode Toggle */}
             <div className="flex justify-center mb-6 gap-2">
                 <div className="bg-surface-200 dark:bg-dark-containerHigh p-1 rounded-full flex">
                     <button
                        onClick={() => setMode('Auto')}
                        className={clsx(
                            "px-6 py-2 rounded-full text-sm font-bold transition-all",
                            mode === 'Auto' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-300" : "text-surface-500"
                        )}
                     >
                        Proof Engine
                     </button>
                     <button
                        onClick={() => setMode('Manual')}
                        className={clsx(
                            "px-6 py-2 rounded-full text-sm font-bold transition-all",
                            mode === 'Manual' ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-300" : "text-surface-500"
                        )}
                     >
                        Interactive
                     </button>
                 </div>
             </div>

             {/* Proof Target Selector */}
             {mode === 'Auto' && (
                 <div className="flex justify-center mb-6">
                     <div className="flex items-center gap-2 text-sm font-medium bg-white dark:bg-dark-container px-4 py-2 rounded-xl shadow-sm border border-surface-200 dark:border-white/5">
                         <span className="text-surface-500 uppercase tracking-wider text-xs font-bold">Target:</span>
                         <select 
                            value={proofTarget}
                            onChange={(e) => setProofTarget(e.target.value as STTTProofType)}
                            className="bg-transparent font-bold text-surface-900 dark:text-white outline-none cursor-pointer max-w-[200px]"
                         >
                             <option value="Tautology">Tautology</option>
                             <option value="Contradiction">Absurdity (Contradiction)</option>
                             <option value="Contingency">Contingency</option>
                             {ast?.type === 'IMPLIES' && <option value="Implication">Validity (P⇒Q)</option>}
                             {ast?.type === 'IFF' && <option value="Equivalence">Equivalence (L⇔R)</option>}
                         </select>
                     </div>
                 </div>
             )}

             {mode === 'Auto' && report && (
                 <div className="flex-1 overflow-y-auto pb-20">
                     <AutoProof report={report} expression={expression} settings={settings} />
                 </div>
             )}

             {mode === 'Manual' && (
                 <div className="flex-1 overflow-y-auto pb-20">
                     <ManualProof expression={expression} variables={variables} settings={settings} />
                 </div>
             )}
        </div>
    );
};

const AutoProof: React.FC<{ report: STTTReport; expression: string; settings?: AppSettings }> = ({ report, expression, settings }) => {
    
    const displayValue = (val: boolean) => {
        if (settings?.logic.truthValues === 'F/T') return val ? 'True' : 'False';
        return val ? '1' : '0';
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <MotionDiv 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2 bg-white dark:bg-dark-container p-6 rounded-[2rem] border border-surface-200 dark:border-white/5"
            >
                <div className="text-sm font-bold uppercase tracking-wider text-surface-400">{report.proofTitle}</div>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-2">
                     <div className="flex flex-col items-center">
                         <div className="text-xs text-surface-400 mb-1">Expression</div>
                         <span className="font-mono text-lg font-medium">{expression}</span>
                     </div>
                     {report.initialAssumptions.length > 0 && (
                         <>
                             <ArrowDown className="w-5 h-5 text-surface-300 rotate-90 md:rotate-0" />
                             <div className="flex flex-col items-center">
                                <div className="text-xs text-surface-400 mb-1">Assumptions</div>
                                <div className="flex gap-2">
                                    {report.initialAssumptions.map((assump, i) => (
                                        <span key={i} className={clsx(
                                            "font-bold px-3 py-1 rounded-lg border text-sm font-mono",
                                            assump.val 
                                                ? "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30"
                                                : "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30"
                                        )}>
                                            {assump.expr} = {displayValue(assump.val)}
                                        </span>
                                    ))}
                                </div>
                             </div>
                         </>
                     )}
                </div>
            </MotionDiv>

            <div className="relative pl-4 border-l-2 border-surface-200 dark:border-surface-800 space-y-8">
                 <BranchView branch={report.rootBranch} depth={0} settings={settings} />
            </div>

            <MotionDiv 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={clsx(
                    "p-6 rounded-[2rem] text-center shadow-sm border-2",
                    report.result === 'Proven' 
                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30" 
                        : "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30"
                )}
            >
                <div className="flex justify-center mb-3">
                    <div className={clsx(
                        "p-3 rounded-full",
                        report.result === 'Proven' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                        {report.result === 'Proven' ? <Check className="w-8 h-8" /> : <X className="w-8 h-8" />}
                    </div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-surface-900 dark:text-white">
                    {report.result === 'Proven' ? "Successfully Proven" : "Disproven"}
                </h3>
                <p className="text-surface-600 dark:text-surface-300 leading-relaxed font-medium">
                    {report.textSummary}
                </p>
            </MotionDiv>
        </div>
    );
};

const BranchView: React.FC<{ branch: STTTBranch; depth: number; settings?: AppSettings }> = ({ branch, depth, settings }) => {
    const [isOpen, setIsOpen] = useState(true);

    const displayVal = (val: boolean) => {
        if (settings?.logic.truthValues === 'F/T') return val ? 'T' : 'F';
        return val ? '1' : '0';
    };

    return (
        <div className="relative">
            {/* Steps in this branch */}
            <div className="space-y-3 mb-4">
                {branch.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3 group">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-surface-300 dark:bg-surface-600 group-hover:bg-primary-500 transition-colors" />
                        <div className="bg-white dark:bg-dark-containerHigh p-3 rounded-xl border border-surface-200 dark:border-white/5 flex-1 shadow-sm">
                            <div className="flex justify-between items-start">
                                <span className="font-mono font-bold text-surface-900 dark:text-white">
                                    {step.targetNodeExpression}
                                </span>
                                <span className={clsx(
                                    "text-xs font-bold px-2 py-0.5 rounded",
                                    step.value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                )}>
                                    {displayVal(step.value)}
                                </span>
                            </div>
                            <div className="text-xs text-surface-500 mt-1 font-medium">{step.description}</div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Branch Status Indicator */}
            {branch.status === 'Closed' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded-lg w-fit mb-4 border border-green-100 dark:border-green-900/30">
                    <Check className="w-4 h-4" /> Contradiction Found
                </div>
            )}
            
            {/* Children (Subcases) */}
            {branch.children && branch.children.length > 0 && (
                <div className="mt-6">
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-4 hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-1 rounded-full w-fit transition-colors"
                    >
                        <GitBranch className="w-4 h-4" />
                        {isOpen ? 'Hide Subcases' : 'Show Subcases'}
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    
                    <AnimatePresence>
                        {isOpen && (
                            <MotionDiv 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-6 border-l-2 border-dashed border-primary-200 dark:border-primary-900/40 space-y-8"
                            >
                                {branch.children.map(child => (
                                    <BranchView key={child.id} branch={child} depth={depth + 1} settings={settings} />
                                ))}
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};


// --- Manual Mode ---

const ManualProof: React.FC<{ expression: string; variables: string[]; settings?: AppSettings }> = ({ expression, variables, settings }) => {
    const [mode, setMode] = useState<'Tautology' | 'Contradiction' | null>(null);
    const [assumptions, setAssumptions] = useState<Record<string, boolean | null>>({});
    const [result, setResult] = useState<{ status: 'Success' | 'Failure', message: string } | null>(null);

    const displayVal = (val: boolean) => {
        if (settings?.logic.truthValues === 'F/T') return val ? 'T' : 'F';
        return val ? '1' : '0';
    };

    const startTest = (m: 'Tautology' | 'Contradiction') => {
        setMode(m);
        setAssumptions(Object.fromEntries(variables.map(v => [v, null])));
        setResult(null);
    };

    const toggleAssumption = (v: string) => {
        setAssumptions(prev => {
            const current = prev[v];
            const next = current === null ? true : current === true ? false : null;
            return { ...prev, [v]: next };
        });
        setResult(null); 
    };

    const checkLogic = () => {
        const allSet = Object.values(assumptions).every(val => val !== null);
        if (!allSet) {
             setResult({ status: 'Failure', message: 'Assign all variables.' });
             return;
        }
        const context = assumptions as Record<string, boolean>;
        const exprValue = evaluateRawExpression(expression, context);
        if (mode === 'Tautology') {
            if (exprValue === false) setResult({ status: 'Success', message: `Counter-example found! ${displayVal(false)} output disproves Tautology.` });
            else setResult({ status: 'Failure', message: `Output is ${displayVal(true)}. Tautology not disproven yet.` });
        } else {
            if (exprValue === true) setResult({ status: 'Success', message: `Counter-example found! ${displayVal(true)} output disproves Contradiction.` });
            else setResult({ status: 'Failure', message: `Output is ${displayVal(false)}. Contradiction not disproven yet.` });
        }
    };

    if (!mode) {
        return (
            <div className="p-6 text-center space-y-8 mt-4">
                <div>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-white">Interactive Proof</h3>
                    <p className="text-surface-500 font-medium mt-2 max-w-xs mx-auto">Manually assign values to find counter-examples.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
                    <button onClick={() => startTest('Tautology')} className="p-6 bg-blue-100 dark:bg-blue-900/30 rounded-3xl hover:scale-105 transition-transform text-left group border border-blue-200 dark:border-blue-900/30">
                        <div className="text-blue-700 dark:text-blue-300 font-bold text-lg mb-1 group-hover:underline decoration-2">Disprove Tautology</div>
                        <div className="text-sm text-blue-600/70 dark:text-blue-300/70 font-medium">Assume {displayVal(false)} → Find 1 case</div>
                    </button>
                    <button onClick={() => startTest('Contradiction')} className="p-6 bg-red-100 dark:bg-red-900/30 rounded-3xl hover:scale-105 transition-transform text-left group border border-red-200 dark:border-red-900/30">
                        <div className="text-red-700 dark:text-red-300 font-bold text-lg mb-1 group-hover:underline decoration-2">Disprove Contradiction</div>
                        <div className="text-sm text-red-600/70 dark:text-red-300/70 font-medium">Assume {displayVal(true)} → Find 1 case</div>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-md mx-auto mt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-surface-900 dark:text-white text-lg">Test for {mode}</h3>
                    <div className="text-sm text-surface-500 font-medium">Assume <span className="font-mono font-bold">{mode === 'Tautology' ? displayVal(false) : displayVal(true)}</span></div>
                </div>
                <button onClick={() => setMode(null)} className="p-3 bg-surface-200 dark:bg-dark-containerHigh rounded-full"><RefreshCw className="w-5 h-5 text-surface-600" /></button>
            </div>
            <div className="w-full text-center py-8 px-4 bg-surface-100 dark:bg-dark-container rounded-[2rem]">
                <span className="text-3xl font-mono text-surface-900 dark:text-white">{expression}</span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
                {variables.map(v => (
                    <button key={v} onClick={() => toggleAssumption(v)} className={clsx("w-20 h-20 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm", assumptions[v] === true ? "bg-green-200 text-green-900" : assumptions[v] === false ? "bg-red-200 text-red-900" : "bg-white dark:bg-dark-container border-2 border-surface-200 dark:border-surface-700 text-surface-400")}>
                        <span className="font-bold text-2xl mb-1">{v}</span>
                        <span className="text-xs font-mono font-bold">{assumptions[v] === null ? '?' : displayVal(assumptions[v]!)}</span>
                    </button>
                ))}
            </div>
            {result && (
                <MotionDiv initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={clsx("p-5 rounded-3xl flex items-start gap-4 w-full", result.status === 'Success' ? "bg-green-100 text-green-900" : "bg-orange-100 text-orange-900")}>
                    <div className="mt-1 bg-white/50 p-1 rounded-full">{result.status === 'Success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}</div>
                    <span className="text-base font-bold leading-tight">{result.message}</span>
                </MotionDiv>
            )}
            <button onClick={checkLogic} className="w-full py-4 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-full font-bold text-lg shadow-xl active:scale-95 transition-transform">Verify Assumption</button>
        </div>
    );
};

export default STTTInteractive;
