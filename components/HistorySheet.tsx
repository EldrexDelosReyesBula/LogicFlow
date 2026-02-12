import React, { useEffect, useState } from 'react';
import { HistoryItem } from '../types';
import { getHistory, clearHistory } from '../utils/db';
import { Clock, ArrowRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface HistorySheetProps {
    onSelect: (expr: string) => void;
}

const HistorySheet: React.FC<HistorySheetProps> = ({ onSelect }) => {
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const load = async () => {
        const h = await getHistory();
        setHistory(h);
    };

    useEffect(() => {
        load();
    }, []);

    const handleClear = async () => {
        await clearHistory();
        setHistory([]);
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Recent Work
                </h3>
                {history.length > 0 && (
                    <button onClick={handleClear} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No history yet.</div>
                ) : (
                    history.map(item => (
                        <motion.button
                            key={item.id}
                            onClick={() => onSelect(item.expression)}
                            className="w-full text-left p-4 bg-surface-50 dark:bg-slate-800 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-700 transition-colors group"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.expression}</span>
                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors" />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                                {item.classification && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.classification}</span>
                                )}
                            </div>
                        </motion.button>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistorySheet;
