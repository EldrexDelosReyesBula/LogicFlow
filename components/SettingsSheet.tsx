import React from 'react';
import { clsx } from 'clsx';
import { AppSettings } from '../types';
import { Check } from 'lucide-react';

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

  return (
    <div className="p-6 pb-20 space-y-8">
      
      {/* Negation Handling */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Negation Display</h3>
        <div className="bg-surface-50 dark:bg-slate-800 rounded-xl p-1 grid grid-cols-3 gap-1">
            {[
                { id: 'preserve', label: 'Preserve', sub: '--A' },
                { id: 'normalize', label: 'Normalize', sub: '¬¬A' },
                { id: 'simplify', label: 'Simplify', sub: 'A' },
            ].map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => updateLogic('negationHandling', opt.id)}
                    className={clsx(
                        "py-3 rounded-lg text-sm font-medium transition-all flex flex-col items-center",
                        settings.logic.negationHandling === opt.id 
                            ? "bg-white dark:bg-slate-700 shadow-sm text-primary-600 dark:text-primary-400" 
                            : "text-slate-500 hover:bg-white/50"
                    )}
                >
                    <span>{opt.label}</span>
                    <span className="text-[10px] font-mono opacity-60 mt-0.5">{opt.sub}</span>
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

    </div>
  );
};

export default SettingsSheet;