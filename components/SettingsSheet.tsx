import React from 'react';
import { clsx } from 'clsx';
import { AppSettings } from '../types';
import { Check, Download, ShieldAlert, Cpu } from 'lucide-react';
import { getHistory } from '../utils/db';

interface SettingsSheetProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({ settings, onUpdate }) => {
  
  const updateLogic = (key: keyof AppSettings['logic'], val: any) => {
    onUpdate({ ...settings, logic: { ...settings.logic, [key]: val } });
  };
  
  const updateTable = (key: keyof AppSettings['table'], val: any) => {
    onUpdate({ ...settings, table: { ...settings.table, [key]: val } });
  };

  const updateSystem = (key: keyof AppSettings['system'], val: any) => {
    onUpdate({ ...settings, system: { ...settings.system, [key]: val } });
  };

  const handleDownload = async () => {
    try {
        const history = await getHistory();
        const data = {
            settings,
            history,
            timestamp: new Date().toISOString(),
            version: "5.0.0"
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logicflow-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Download failed", e);
        alert("Failed to download workspace data.");
    }
  };

  return (
    <div className="p-6 pb-20 space-y-8">
      
      {/* System Settings */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">System & Security</h3>
        <div className="space-y-3">
            <button 
                onClick={() => updateSystem('preventRefresh', !settings.system.preventRefresh)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Prevent Accidental Refresh</span>
                </div>
                <div className={clsx(
                    "w-10 h-6 rounded-full relative transition-colors",
                    settings.system.preventRefresh ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"
                )}>
                    <div className={clsx(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                        settings.system.preventRefresh ? "left-5" : "left-1"
                    )} />
                </div>
            </button>

            <button 
                onClick={handleDownload}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
                <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Download Workspace Data</span>
                </div>
                <span className="text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">JSON</span>
            </button>
        </div>
      </section>

      {/* AI Settings */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Gemini AI Integration</h3>
        <div className="space-y-3">
            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                    <Cpu className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Gemini API Key</span>
                </div>
                <input 
                    type="password"
                    value={settings.system.geminiApiKey || ''}
                    onChange={(e) => updateSystem('geminiApiKey', e.target.value)}
                    placeholder="Enter your API Key..."
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:border-primary-500"
                />
                <p className="text-xs text-slate-400 mt-2">Required for AI explanations. Stored locally.</p>
            </div>
            
            <button 
                onClick={() => updateSystem('enableAI', !settings.system.enableAI)}
                disabled={!settings.system.geminiApiKey}
                className={clsx(
                    "w-full flex items-center justify-between p-4 border rounded-xl transition-colors",
                    settings.system.geminiApiKey 
                        ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50" 
                        : "bg-slate-100 dark:bg-slate-800/50 border-transparent opacity-50 cursor-not-allowed"
                )}
            >
                <span className="text-sm font-medium text-slate-900 dark:text-white">Enable AI Features</span>
                <div className={clsx(
                    "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                    settings.system.enableAI ? "bg-primary-600 border-primary-600" : "border-slate-300"
                )}>
                    {settings.system.enableAI && <Check className="w-4 h-4 text-white" />}
                </div>
            </button>
        </div>
      </section>

      {/* Table Options */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Table View</h3>
        <div className="space-y-2">
            {[
                { id: 'showSubExpressions', label: 'Show intermediate steps' },
                { id: 'stickyHeaders', label: 'Sticky headers' },
                { id: 'highlightDependencies', label: 'Highlight dependencies on click' },
                { id: 'dense', label: 'Compact view' },
            ].map((opt) => (
                <button 
                    key={opt.id}
                    onClick={() => updateTable(opt.id as any, !settings.table[opt.id as keyof AppSettings['table']])}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{opt.label}</span>
                    <div className={clsx(
                        "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                        settings.table[opt.id as keyof AppSettings['table']] ? "bg-primary-600 border-primary-600" : "border-slate-300"
                    )}>
                        {settings.table[opt.id as keyof AppSettings['table']] && <Check className="w-4 h-4 text-white" />}
                    </div>
                </button>
            ))}
        </div>
      </section>
      
      {/* Row Order & Truth Values */}
      <section className="grid grid-cols-2 gap-4">
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Row Order</h3>
            <div className="bg-surface-50 dark:bg-slate-800 rounded-xl p-1 grid grid-cols-2 gap-1">
                {['0→1', '1→0'].map(opt => (
                     <button
                        key={opt}
                        onClick={() => updateLogic('rowOrder', opt)}
                        className={clsx(
                            "py-2 rounded-lg text-sm font-medium transition-all",
                            settings.logic.rowOrder === opt 
                                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                : "text-slate-500"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Truth Values</h3>
            <div className="bg-surface-50 dark:bg-slate-800 rounded-xl p-1 grid grid-cols-2 gap-1">
                {['0/1', 'F/T'].map(opt => (
                     <button
                        key={opt}
                        onClick={() => updateLogic('truthValues', opt)}
                        className={clsx(
                            "py-2 rounded-lg text-sm font-medium transition-all",
                            settings.logic.truthValues === opt 
                                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" 
                                : "text-slate-500"
                        )}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
      </section>

    </div>
  );
};

export default SettingsSheet;
