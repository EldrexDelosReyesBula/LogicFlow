
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
import Onboarding from './components/Onboarding';
import HistorySheet from './components/HistorySheet';
import Workspace from './components/Workspace';
import STTTInteractive from './components/STTTInteractive';
import { analyzeLogic, extractVariablesFromExpression, reanalyzeFromRows, recalculateRow } from './utils/logic';
import { db } from './utils/db';
import { AnalysisResult, AppSettings, DEFAULT_SETTINGS, TruthTableRow, TableColumn, HistoryItem } from './types';
import { Table2, Sparkles, BrainCircuit, Settings2, AlertCircle, Grid2X2, RotateCcw, Sun, Moon, Trash2, ListEnd, History, BookOpen, GraduationCap, Eye, EyeOff, MoreVertical, X } from 'lucide-react';
import { Analytics } from "@vercel/analytics/react";

// Fix for strict type checking on motion components
const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;

const App: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [selectedVars, setSelectedVars] = useState<string[]>([]);
  const [detectedVars, setDetectedVars] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusMode, setFocusMode] = useState(true); // V6: Focus mode enabled by default
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // View State
  const [currentView, setCurrentView] = useState<'calculator' | 'workspace'>('calculator');
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('lf_theme');
        if (saved === 'dark' || saved === 'light') return saved;
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });
  
  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
      const saved = localStorage.getItem('lf_settings_v3');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetContent, setSheetContent] = useState<'result' | 'settings' | 'history' | 'sttt'>('result');
  const [viewMode, setViewMode] = useState<'table' | 'analysis' | 'kmap' | 'step'>('table');
  const [selectedRow, setSelectedRow] = useState<TruthTableRow | null>(null);

  // Check Onboarding
  useEffect(() => {
      const onboarded = localStorage.getItem('lf_has_onboarded');
      if (!onboarded) {
          setShowOnboarding(true);
      }
  }, []);

  const completeOnboarding = () => {
      localStorage.setItem('lf_has_onboarded', 'true');
      setShowOnboarding(false);
  };

  // Persistence & Theme
  useEffect(() => {
      localStorage.setItem('lf_settings_v3', JSON.stringify(settings));
      if (analysis && isSheetOpen && sheetContent === 'result') {
          handleGenerate();
      }
  }, [settings]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    localStorage.setItem('lf_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Auto-Variable Detection
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

  // Real-time Validation
  useEffect(() => {
    const trimmed = expression.trim();
    if (trimmed.length === 0) {
        setIsValid(false);
        setErrorMessage(null);
        return;
    }

    const used = extractVariablesFromExpression(trimmed);
    const undeclared = used.filter(v => !selectedVars.includes(v));
    const openBrackets = (trimmed.match(/[(\[{]/g) || []).length;
    const closeBrackets = (trimmed.match(/[)\]}]/g) || []).length;

    if (undeclared.length > 0) {
        setIsValid(false);
        setErrorMessage(`Undeclared: ${undeclared.join(', ')}`);
    } else if (selectedVars.length === 0) {
        setIsValid(false);
        setErrorMessage("Declare variables above");
    } else if (openBrackets !== closeBrackets) {
        setIsValid(false);
        setErrorMessage("Mismatched brackets");
    } else {
        setIsValid(true);
        setErrorMessage(null);
    }
  }, [expression, selectedVars]);

  const handleGenerate = async () => {
    setErrorMessage(null);
    try {
      const result = analyzeLogic(expression, selectedVars, settings);
      setAnalysis(result);
      
      await db.addHistory({
          id: crypto.randomUUID(),
          expression,
          variables: selectedVars,
          timestamp: Date.now(),
          classification: result.classification
      });
      
      if (result.classification !== 'Contingency') {
          setViewMode('analysis');
      } else {
          setViewMode('table');
      }

      setSheetContent('result');
      setIsSheetOpen(true);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Invalid expression");
      if (navigator.vibrate) navigator.vibrate([50, 50]);
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
      setExpression(item.expression);
      setSelectedVars(item.variables);
      setIsSheetOpen(false);
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
      setShowMobileMenu(false);
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

  const MenuAction = ({ icon: Icon, label, onClick }: any) => (
      <button 
        onClick={onClick}
        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200"
      >
          <Icon className="w-5 h-5" />
          <span className="font-medium">{label}</span>
      </button>
  );

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-[#121212] text-surface-800 dark:text-surface-100 font-sans selection:bg-primary-200 selection:text-primary-900 overflow-hidden transition-colors duration-500">
      <Analytics />
      
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}

      {/* Background Ambience - Expressive Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary-100/40 dark:bg-primary-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 h-screen flex flex-col items-center justify-center pb-0 md:pb-32">
        
        {/* Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-20 px-6 flex items-center justify-between z-30">
            {/* Left Spacer / Logo Placeholder if needed */}
            <div className="w-20 hidden md:block"></div>

            {/* Center Toggle */}
            <div className="bg-surface-200/50 dark:bg-white/5 backdrop-blur-md rounded-full p-1 flex shadow-inner border border-white/20 dark:border-white/5 mx-auto">
                <button
                    onClick={() => setCurrentView('calculator')}
                    className={clsx(
                        "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                        currentView === 'calculator' 
                            ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" 
                            : "text-surface-600 dark:text-surface-400 hover:text-surface-800"
                    )}
                >
                    Calculator
                </button>
                <button
                    onClick={() => setCurrentView('workspace')}
                    className={clsx(
                        "px-6 py-2 rounded-full text-sm font-bold transition-all duration-300",
                        currentView === 'workspace' 
                            ? "bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm" 
                            : "text-surface-600 dark:text-surface-400 hover:text-surface-800"
                    )}
                >
                    Workspace
                </button>
            </div>

            {/* Right Actions - Desktop */}
            <div className="hidden md:flex items-center gap-2 w-20 justify-end">
                <button 
                    onClick={() => { setSheetContent('history'); setIsSheetOpen(true); }}
                    className="p-3 hover:bg-surface-200 dark:hover:bg-white/10 rounded-full text-surface-600 dark:text-surface-300 transition-colors"
                >
                    <History className="w-5 h-5" />
                </button>
                <button 
                    onClick={toggleTheme}
                    className="p-3 hover:bg-surface-200 dark:hover:bg-white/10 rounded-full text-surface-600 dark:text-surface-300 transition-colors"
                >
                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </button>
                <button 
                    onClick={() => setFocusMode(!focusMode)}
                    className={clsx(
                        "p-3 rounded-full transition-colors",
                        focusMode ? "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20" : "text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-white/10"
                    )}
                >
                    {focusMode ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
                 <button 
                    onClick={openSettings}
                    className="p-3 hover:bg-surface-200 dark:hover:bg-white/10 rounded-full text-surface-600 dark:text-surface-300 transition-colors"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
            </div>

             {/* Right Actions - Mobile Menu Trigger */}
             <div className="md:hidden">
                <button 
                    onClick={() => setShowMobileMenu(true)}
                    className="p-3 bg-surface-200/50 dark:bg-white/5 backdrop-blur-md rounded-full text-surface-600 dark:text-surface-300 border border-white/20 dark:border-white/5"
                >
                    <MoreVertical className="w-5 h-5" />
                </button>
             </div>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
            {showMobileMenu && (
                <>
                    <MotionDiv
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setShowMobileMenu(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    />
                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20, x: 20 }}
                        className="fixed top-20 right-6 z-50 w-64 bg-white dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-white/10 p-2 md:hidden origin-top-right"
                    >
                         <MenuAction icon={History} label="History" onClick={() => { setSheetContent('history'); setIsSheetOpen(true); setShowMobileMenu(false); }} />
                         <MenuAction icon={theme === 'light' ? Moon : Sun} label={theme === 'light' ? "Dark Mode" : "Light Mode"} onClick={() => { toggleTheme(); setShowMobileMenu(false); }} />
                         <MenuAction icon={focusMode ? EyeOff : Eye} label={focusMode ? "Disable Focus" : "Enable Focus"} onClick={() => { setFocusMode(!focusMode); setShowMobileMenu(false); }} />
                         <div className="h-px bg-surface-100 dark:bg-white/5 my-1" />
                         <MenuAction icon={Settings2} label="Settings" onClick={openSettings} />
                    </MotionDiv>
                </>
            )}
        </AnimatePresence>

        {/* Calculator View */}
        {currentView === 'calculator' && (
            <MotionDiv 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center justify-center min-h-[80vh]"
            >
                <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="text-center mb-10"
                >
                {!focusMode && (
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white dark:bg-surface-800 shadow-xl rounded-[24px] mb-6 rotate-3 border border-surface-100 dark:border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Sparkles className="w-8 h-8 text-primary-500" />
                    </div>
                )}
                <h1 className={clsx(
                    "font-display font-extrabold text-surface-900 dark:text-white mb-2 tracking-tight transition-all",
                    focusMode ? "text-4xl opacity-80" : "text-6xl"
                )}>
                    LogicFlow
                </h1>
                {!focusMode && (
                    <p className="text-lg text-surface-500 dark:text-surface-400 font-medium">
                        Expressive Logic Engine
                    </p>
                )}
                </MotionDiv>

                {/* Core Inputs */}
                <div className="w-full max-w-2xl flex flex-col gap-8 px-6">
                    
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
                    
                    <div className="h-8 flex justify-center">
                        <AnimatePresence>
                            {errorMessage && (
                                <MotionDiv
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2 text-sm font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-4 py-1.5 rounded-full"
                                >
                                    <AlertCircle className="w-4 h-4" /> {errorMessage}
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </MotionDiv>
        )}

        {/* Workspace View */}
        {currentView === 'workspace' && (
            <MotionDiv 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="w-full h-full pt-24"
            >
                <Workspace />
            </MotionDiv>
        )}

        {/* Floating Extended FAB */}
        <AnimatePresence>
            {!isSheetOpen && analysis && currentView === 'calculator' && (
                <MotionButton
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={() => { setSheetContent('result'); setIsSheetOpen(true); }}
                    className="absolute bottom-12 bg-primary-600 dark:bg-primary-600 text-white shadow-xl shadow-primary-900/20 px-8 py-5 rounded-[24px] font-bold text-lg flex items-center gap-3"
                >
                    <Table2 className="w-6 h-6" /> View Analysis
                </MotionButton>
            )}
        </AnimatePresence>

      </main>

      {/* Bottom Sheet */}
      <BottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        title={
            sheetContent === 'settings' ? 'Settings' : 
            sheetContent === 'history' ? 'History' :
            sheetContent === 'sttt' ? 'STTT (Beta)' :
            (viewMode === 'table' ? 'Truth Table' : viewMode === 'kmap' ? 'Karnaugh Map' : viewMode === 'step' ? 'Evaluation Steps' : 'Analysis')
        }
      >
        <div className="flex flex-col h-full bg-surface-50 dark:bg-[#121212]">
            {sheetContent === 'result' && (
                <>
                    <div className="px-6 mb-6 flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {[
                          { id: 'table', icon: Table2, label: 'Table' },
                          { id: 'kmap', icon: Grid2X2, label: 'K-Map' },
                          { id: 'step', icon: ListEnd, label: 'Steps', show: viewMode === 'step' },
                          { id: 'analysis', icon: BrainCircuit, label: 'Analysis' }
                        ].filter(x => x.show !== false).map((tab) => (
                           <button 
                            key={tab.id}
                            onClick={() => setViewMode(tab.id as any)}
                            className={clsx(
                                "flex-1 py-3 px-5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 border border-transparent",
                                viewMode === tab.id 
                                    ? "bg-surface-900 text-white dark:bg-white dark:text-surface-900" 
                                    : "bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 border-surface-200/50 dark:border-white/5"
                            )}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button> 
                        ))}

                         <button 
                            onClick={() => setSheetContent('sttt')}
                            className={clsx(
                                "flex-1 py-3 px-5 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 active:scale-95 border border-surface-200/50 dark:border-white/5"
                            )}
                        >
                            <GraduationCap className="w-4 h-4" /> STTT (Beta)
                        </button>
                    </div>

                    <div className="flex-1 relative overflow-hidden bg-surface-100 dark:bg-surface-900 rounded-t-[2.5rem] shadow-inner border-t border-surface-200/50 dark:border-white/5">
                        <AnimatePresence mode="wait">
                            {viewMode === 'table' && analysis && (
                                <MotionDiv 
                                    key="table"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ type: "spring", bounce: 0.2 }}
                                    className="h-full w-full"
                                >
                                    <TruthTable 
                                        rows={analysis.rows} 
                                        columns={analysis.columns}
                                        settings={settings}
                                        onRowSelect={handleRowSelect}
                                        onRowChange={handleRowChange}
                                    />
                                </MotionDiv>
                            )}
                            {viewMode === 'kmap' && (
                                <MotionDiv 
                                    key="kmap"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <KarnaughMap data={analysis?.kMapData} expression={expression} />
                                </MotionDiv>
                            )}
                            {viewMode === 'step' && analysis && selectedRow && (
                                <MotionDiv 
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
                                </MotionDiv>
                            )}
                            {viewMode === 'analysis' && analysis && (
                                <MotionDiv 
                                    key="analysis"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="h-full w-full overflow-y-auto"
                                >
                                    <LogicAnalysis analysis={analysis} settings={settings} />
                                </MotionDiv>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {sheetContent === 'settings' && (
                <div className="h-full overflow-y-auto bg-surface-100 dark:bg-surface-900 rounded-t-[2.5rem] mt-2">
                    <SettingsSheet settings={settings} onUpdate={setSettings} installPrompt={installPrompt} />
                </div>
            )}

            {sheetContent === 'history' && (
                <HistorySheet onSelect={loadFromHistory} />
            )}

            {sheetContent === 'sttt' && analysis && (
                <STTTInteractive 
                    expression={expression} 
                    variables={analysis.variables} 
                    report={analysis.sttt}
                    ast={analysis.ast}
                    settings={settings}
                />
            )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default App;
