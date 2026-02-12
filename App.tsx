import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import ExpressionInput from './components/ExpressionInput';
import TruthTable from './components/TruthTable';
import BottomSheet from './components/BottomSheet';
import LogicAnalysis from './components/LogicAnalysis';
import VariableSelector from './components/VariableSelector';
import SettingsSheet from './components/SettingsSheet';
import KarnaughMap from './components/KarnaughMap';
import StepByStep from './components/StepByStep';
import ProofWorkspace from './components/ProofWorkspace';
import HistorySheet from './components/HistorySheet';
import RightAwayBadge from './components/RightAwayBadge';
import { analyzeLogic, extractVariablesFromExpression, reanalyzeFromRows, recalculateRow } from './utils/logic';
import { saveHistory } from './utils/db';
import { SafeStorage } from './utils/storage';
import { AnalysisResult, AppSettings, DEFAULT_SETTINGS, TruthTableRow, TableColumn } from './types';
import { Table2, Sparkles, BrainCircuit, Settings2, AlertCircle, Grid2X2, RotateCcw, Sun, Moon, ListEnd, PenTool, History, Terminal } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

const App: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = SafeStorage.get<string>('lf_theme', 'light');
        if (saved === 'dark' || saved === 'light') return saved as 'light' | 'dark';
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });
  
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = SafeStorage.get('lf_settings_v5', DEFAULT_SETTINGS);
      return { ...DEFAULT_SETTINGS, ...saved };
  });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<'result' | 'settings' | 'history' | 'proof'>('result');
  const [viewMode, setViewMode] = useState<'table' | 'analysis' | 'kmap' | 'step'>('table');
  const [selectedRow, setSelectedRow] = useState<TruthTableRow | null>(null);

  // Initialize safe storage versioning
  useEffect(() => {
    SafeStorage.checkVersion();
  }, []);

  useEffect(() => {
      SafeStorage.set('lf_settings_v5', settings);
      if (analysis && isSheetOpen && sheetContent === 'result') {
          handleGenerate();
      }
  }, [settings]);

  // Prevent Refresh Logic
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (settings.system.preventRefresh && (expression || analysis)) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [settings.system.preventRefresh, expression, analysis]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    SafeStorage.set('lf_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        if (!expression.trim()) {
            setDetectedVars([]);
            return;
        }
        const detected = extractVariablesFromExpression(expression);
        setDetectedVars(detected);
    }, 300);
    return () => clearTimeout(timer);
  }, [expression]);

  useEffect(() => {
    setIsValid(expression.trim().length > 0 && selectedVars.length > 0);
    setErrorMessage(null);
  }, [expression, selectedVars]);

  const handleGenerate = () => {
    setErrorMessage(null);
    try {
      const result = analyzeLogic(expression, selectedVars, settings);
      setAnalysis(result);
      
      if (result.classification !== 'Contingency') {
          setViewMode('analysis');
      } else {
          setViewMode('table');
      }

      setSheetContent('result');
      setIsSheetOpen(true);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

      // Save to History
      saveHistory({
          id: Date.now().toString(),
          expression: expression,
          timestamp: Date.now(),
          classification: result.classification
      });

    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Invalid expression");
      if (navigator.vibrate) navigator.vibrate([50, 50]);
    }
  };

  const handleReset = () => {
      setExpression('');
      setSelectedVars([]);
      setDetectedVars([]);
      setAnalysis(null);
      setIsSheetOpen(false);
      if (navigator.vibrate) navigator.vibrate(20);
  };

  const openSettings = () => {
      setSheetContent('settings');
      setIsSheetOpen(true);
  };

  const openHistory = () => {
      setSheetContent('history');
      setIsSheetOpen(true);
  };

  const openProof = () => {
      setSheetContent('proof');
      setIsSheetOpen(true);
  };
  
  const handleRowSelect = (row: TruthTableRow) => {
      setSelectedRow(row);
      setViewMode('step');
  };

  const handleRowChange = (updatedRow: TruthTableRow, changedCol: TableColumn) => {
      if (!analysis) return;
      let finalRow = updatedRow;
      if (changedCol.isInput) {
          finalRow = recalculateRow(updatedRow, analysis.columns, analysis.ast);
      }
      const newRows = analysis.rows.map(r => r.id === finalRow.id ? finalRow : r);
      const newAnalysis = reanalyzeFromRows(analysis, newRows, settings);
      setAnalysis(newAnalysis);
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary-200 selection:text-primary-900 overflow-hidden transition-colors duration-500">
      <Analytics />
      
      {/* Clean Background - Removed blobs for "Clean, Stable" philosophy */}
      
      <main className="relative z-10 h-screen flex flex-col items-center justify-center pb-32">
        
        <div className="absolute top-6 right-6 z-20 flex gap-3">
            <button 
                onClick={openProof}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                title="Proof Workspace"
            >
                <PenTool className="w-5 h-5" />
            </button>
            <button 
                onClick={openHistory}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                title="History"
            >
                <History className="w-5 h-5" />
            </button>
            <button 
                onClick={toggleTheme}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
                {theme === 'light' ? <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Sun className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
            </button>
            <button 
                onClick={openSettings}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
                <Settings2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
        </div>

        <AnimatePresence>
            {(expression || selectedVars.length > 0) && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-6 left-6 z-20"
                >
                    <button 
                        onClick={handleReset}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                        title="Clear Table"
                    >
                        <RotateCcw className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl mb-4 shadow-sm">
            <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
            LogicFlow
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Stability Edition
          </p>
        </motion.div>

        <div className="w-full max-w-3xl flex flex-col gap-4">
            
            <VariableSelector 
                selected={selectedVars} 
                suggested={detectedVars}
                onChange={setSelectedVars} 
            />

            <ExpressionInput 
                value={expression} 
                onChange={setExpression} 
                onGenerate={handleGenerate} 
                isValid={isValid} 
            />
            
            <div className="h-6 px-6">
                <AnimatePresence mode="wait">
                    {analysis?.rwResult?.active ? (
                        <RightAwayBadge key="rw" result={analysis.rwResult} />
                    ) : errorMessage ? (
                        <motion.div
                            key="err"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 text-xs font-medium text-red-500 mt-2 justify-center"
                        >
                            <AlertCircle className="w-3 h-3" /> {errorMessage}
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>

        {/* Mathematical Engine Display */}
        {analysis && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 flex gap-4 text-[10px] font-mono font-medium text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-900 py-2 px-4 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm"
            >
                <span className="flex items-center gap-1"><Terminal className="w-3 h-3"/> ENGINE: V6</span>
                <span>VARS: {analysis.variables.length}</span>
                <span>ROWS: {analysis.rows.length}</span>
                <span>DEPTH: {analysis.complexity?.depth}</span>
                <span>TIME: {analysis.processingTime}ms</span>
            </motion.div>
        )}

        <AnimatePresence>
            {!isSheetOpen && analysis && (
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={() => { setSheetContent('result'); setIsSheetOpen(true); }}
                    className="absolute bottom-20 bg-primary-600 text-white shadow-lg shadow-primary-500/30 px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-primary-700 transition-colors"
                >
                    <Table2 className="w-4 h-4" /> View Analysis
                </motion.button>
            )}
        </AnimatePresence>

      </main>

      <BottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        title={
            sheetContent === 'settings' ? 'Settings' : 
            sheetContent === 'history' ? 'History' :
            sheetContent === 'proof' ? 'Proof Workspace' :
            (viewMode === 'table' ? 'Truth Table' : viewMode === 'kmap' ? 'Karnaugh Map' : viewMode === 'step' ? 'Evaluation Steps' : 'Analysis')
        }
      >
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {sheetContent === 'result' && (
                <>
                    <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button 
                            onClick={() => setViewMode('table')}
                            className={clsx(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                viewMode === 'table' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <Table2 className="w-4 h-4" /> Table
                        </button>
                        
                        {analysis?.kMapData && (
                            <button 
                                onClick={() => setViewMode('kmap')}
                                className={clsx(
                                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                    viewMode === 'kmap' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <Grid2X2 className="w-4 h-4" /> K-Map
                            </button>
                        )}
                        
                        {viewMode === 'step' && (
                             <button 
                                onClick={() => setViewMode('step')}
                                className={clsx(
                                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                    viewMode === 'step' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <ListEnd className="w-4 h-4" /> Steps
                            </button>
                        )}

                        <button 
                            onClick={() => setViewMode('analysis')}
                            className={clsx(
                                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 whitespace-nowrap",
                                viewMode === 'analysis' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            )}
                        >
                            <BrainCircuit className="w-4 h-4" /> Analysis
                        </button>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {viewMode === 'table' && analysis && (
                                <motion.div 
                                    key="table"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="h-full w-full"
                                >
                                    <TruthTable 
                                        rows={analysis.rows} 
                                        columns={analysis.columns}
                                        settings={settings}
                                        expression={expression}
                                        classification={analysis.classification}
                                        onRowSelect={handleRowSelect}
                                        onRowChange={handleRowChange}
                                    />
                                </motion.div>
                            )}
                            {viewMode === 'kmap' && analysis?.kMapData && (
                                <motion.div 
                                    key="kmap"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <KarnaughMap data={analysis.kMapData} expression={expression} />
                                </motion.div>
                            )}
                            {viewMode === 'step' && analysis && selectedRow && (
                                <motion.div 
                                    key="step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <StepByStep 
                                        ast={analysis.ast} 
                                        row={selectedRow} 
                                    />
                                </motion.div>
                            )}
                            {viewMode === 'analysis' && analysis && (
                                <motion.div 
                                    key="analysis"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <LogicAnalysis 
                                        analysis={analysis} 
                                        apiKey={settings.system.geminiApiKey}
                                        enableAI={settings.system.enableAI}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {sheetContent === 'settings' && (
                <div className="h-full overflow-y-auto">
                    <SettingsSheet settings={settings} onUpdate={setSettings} />
                </div>
            )}
            
            {sheetContent === 'history' && (
                <HistorySheet onSelect={(expr) => {
                    setExpression(expr);
                    setIsSheetOpen(false);
                }} />
            )}

            {sheetContent === 'proof' && (
                <ProofWorkspace />
            )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default App;
